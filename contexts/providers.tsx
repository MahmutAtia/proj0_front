"use client";

import React from 'react';
import { TaskProvider } from '@/contexts/TaskContext';
import { JobServiceProvider } from '@/contexts/JobServiceContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
      <JobServiceProvider>
            <TaskProvider>
                {children}
            </TaskProvider>
      </JobServiceProvider>
  );
}