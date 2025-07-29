import { JobService } from './useJobService';
import { aiApi } from '@/lib/axios';
import api from '@/lib/axios';

// --- MOCKS ---
// Mock axios modules
jest.mock('@/lib/axios', () => ({
  aiApi: {
    post: jest.fn(),
  },
  // Mock the default export for the 'api' instance
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch for location
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ country_name: 'Testland', city: 'Testville' }),
  })
);

// --- TEST SUITE ---
describe('JobService', () => {
  let jobService;

  // Use fake timers to control setTimeout/setInterval
  beforeAll(() => {
    jest.useFakeTimers();
  });

  // Clear all mocks and reset localStorage before each test
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  // --- SCENARIOS ---

  it('Scenario 1: First-time user starts a new cycle immediately', async () => {
    // Setup: No cache, but resume with keywords is available
    api.get.mockResolvedValue({ data: [{ is_default: true, job_search_keywords: 'React,Node' }] });
    aiApi.post.mockResolvedValue({ data: { jobs: [{ id: 1, title: 'React Dev' }] } });

    jobService = new JobService();
    await jobService.start();

    // Assertions
    expect(api.get).toHaveBeenCalledWith('/api/resumes/');
    expect(aiApi.post).toHaveBeenCalledWith('/scraper/scrape-jobs/', expect.any(Object));
    expect(jobService.jobs.length).toBe(1);
    expect(jobService.hasActiveCycle).toBe(true);
  });

  it('Scenario 2: User with a completed cycle waits 24 hours', async () => {
    // Setup: Cache shows a cycle completed 1 hour ago
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    localStorageMock.setItem('globalJobService', JSON.stringify({
      lastFullCycleTime: oneHourAgo,
      jobs: [{ id: 1, title: 'Old Job' }],
      keywords: ['React'],
      currentKeywordIndex: 1, // Index is at the end
      hasStartedCycle: false,
    }));

    jobService = new JobService();
    await jobService.start();

    // Assertions
    expect(aiApi.post).not.toHaveBeenCalled(); // Should not fetch new jobs
    expect(jobService.isRunning).toBe(false);
    expect(jobService.hasActiveCycle).toBe(false);

    // Fast-forward time by 23 hours + 1 minute
    jest.advanceTimersByTime(23 * 60 * 60 * 1000 + 60 * 1000);
    
    // It should have started the new cycle by now
    expect(aiApi.post).toHaveBeenCalledTimes(1);
  });

  it('Scenario 3: User resumes an in-progress cycle from cache', async () => {
    // Setup: Cache shows a cycle started, at keyword 1 of 2
    localStorageMock.setItem('globalJobService', JSON.stringify({
      lastFullCycleTime: 0,
      jobs: [{ id: 1, title: 'Job from Keyword 1' }],
      keywords: ['React', 'Node'],
      currentKeywordIndex: 1,
      hasStartedCycle: true,
    }));
    aiApi.post.mockResolvedValue({ data: { jobs: [{ id: 2, title: 'Job from Keyword 2' }] } });

    jobService = new JobService();
    await jobService.start();

    // Assertions
    expect(aiApi.post).toHaveBeenCalledTimes(1);
    // It should have requested the *second* keyword
    expect(aiApi.post).toHaveBeenCalledWith('/scraper/scrape-jobs/', expect.objectContaining({ search_term: 'Node' }));
    expect(jobService.jobs.length).toBe(2);
  });

  it('Scenario 4: Enters "waiting state" if no keywords, then starts when they are added', async () => {
    // Setup: Resume API returns no keywords initially
    api.get.mockResolvedValue({ data: [{ is_default: true, job_search_keywords: '' }] });

    jobService = new JobService();
    await jobService.start();

    // Assertions for waiting state
    expect(jobService.isWaitingForKeywords).toBe(true);
    expect(jobService.isRunning).toBe(false);
    expect(aiApi.post).not.toHaveBeenCalled();

    // Now, simulate user adding keywords
    api.get.mockResolvedValue({ data: [{ is_default: true, job_search_keywords: 'Magic Keyword' }] });
    aiApi.post.mockResolvedValue({ data: { jobs: [{ id: 1, title: 'Magic Job' }] } });

    // Fast-forward time to trigger the interval check
    jest.advanceTimersByTime(60 * 1000);
    await Promise.resolve(); // Allow promises to resolve

    // Assertions for recovery
    expect(jobService.isWaitingForKeywords).toBe(false);
    expect(aiApi.post).toHaveBeenCalledWith('/scraper/scrape-jobs/', expect.objectContaining({ search_term: 'Magic Keyword' }));
    expect(jobService.jobs.length).toBe(1);
  });

  it('Scenario 5: Handles API error gracefully and moves to the next keyword', async () => {
    // Setup: Keywords are available, but the first API call will fail
    api.get.mockResolvedValue({ data: [{ is_default: true, job_search_keywords: 'Failed,Success' }] });
    // First call fails, second succeeds
    aiApi.post
      .mockRejectedValueOnce(new Error('API Failure'))
      .mockResolvedValueOnce({ data: { jobs: [{ id: 1, title: 'Success Job' }] } });

    jobService = new JobService();
    await jobService.start();
    
    // Let the first (failed) call finish
    await Promise.resolve();
    // Let the second (successful) call finish
    await Promise.resolve();

    // Assertions
    expect(aiApi.post).toHaveBeenCalledTimes(2);
    expect(jobService.jobs.length).toBe(1);
    expect(jobService.jobs[0].title).toBe('Success Job');
    expect(jobService.currentKeywordIndex).toBe(2); // Should have processed both
  });