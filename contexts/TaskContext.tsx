"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';

const POLLING_INTERVAL = 5000; // 5 seconds

// This interface should match the structure of the task objects
// used in TaskNotificationBell.jsx
export interface Task {
    id: string; // Changed from task_id to match usage
    status: 'PENDING' | 'SUCCESS' | 'FAILURE';
    result?: any;
    error_message?: string; // Changed from error to match usage
    action_url?: string;
    notification_title?: string;
    task_type?: 'resume_generation' | 'website_generation';
}

interface TaskContextType {
    tasks: Task[];
    addTask: (taskId: string, title: string, type: Task['task_type']) => void;
    removeTask: (taskId: string) => void;
    clearCompleted: () => void;
    handleSaveAndRedirect: (task: Task) => Promise<void>;

}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTasks = () => {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('useTasks must be used within a TaskProvider');
    }
    return context;
};

export const TaskProvider = ({ children }: { children: React.ReactNode }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const { data: session, status } = useSession();
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const [isSaving, setIsSaving] = useState<string | null>(null);

    // Ref to store previous tasks for comparison
    const prevTasksRef = useRef<Task[]>();
    useEffect(() => {
        prevTasksRef.current = tasks;
    });
    const prevTasks = prevTasksRef.current;


    // Load tasks from localStorage on initial load
    useEffect(() => {
        try {
            const storedTasks = localStorage.getItem('tasks');
            if (storedTasks) {
                setTasks(JSON.parse(storedTasks));
            }
        } catch (error) {
            console.error("Failed to parse tasks from localStorage", error);
            localStorage.removeItem('tasks');
        }
    }, []);

    // Persist tasks to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }, [tasks]);


    const pollTasks = useCallback(async (tasksToPoll: Task[]) => {
        if (tasksToPoll.length === 0 || status !== 'authenticated') return;

        let tasksChanged = false;
        const updatedTasks = [...tasks]; // Create a mutable copy

        for (const task of tasksToPoll) {
            try {
                const response = await api.get(`/api/task-status/${task.id}/`);
                const fetchedTaskData = response.data;

                // Find the index of the task to update it in the array
                const taskIndex = updatedTasks.findIndex(t => t.id === task.id);
                if (taskIndex === -1) continue;

                // Merge new data into the existing task object
                const updatedTask = { ...updatedTasks[taskIndex], ...fetchedTaskData };
                updatedTasks[taskIndex] = updatedTask;
                tasksChanged = true;

            } catch (error) {
                console.error(`Failed to poll task ${task.id}:`, error);
            }
        }

        if (tasksChanged) {
            setTasks(updatedTasks);
        }
    }, [status, tasks]); // Depend on the full tasks array

    const saveGeneratedWebsite = async (taskId: string) => {
        try {
            const response = await api.post('api/resumes/save_generated_website/', { generation_task_id: taskId });
            if (response.data && response.data.website_uuid) {
                toast.current?.show({ severity: 'success', summary: 'Website Ready!', detail: 'Redirecting to the editor...', life: 3000 });
                router.push(`/site-editor/${response.data.website_uuid}/`);
                
            } else {
                throw new Error("Could not retrieve website ID after saving.");
            }

        } catch (err) {
            console.error("Save generated website error:", err);
            toast.current?.show({ severity: 'error', summary: 'Save Failed', detail: 'An error occurred while saving the website.' });
        }

    };

    const handleSaveAndRedirect = async (task: Task) => {
        if (!task.result || !task.task_type) {
            toast.current?.show({ severity: 'error', summary: 'Save Failed', detail: 'Missing data to save.' });
            return;
        }

        setIsSaving(task.id);

        if (task.task_type === 'website_generation') {
            await saveGeneratedWebsite(task.id);
        }
        // Future task types like 'resume_generation' can be handled here
        // else if (task.task_type === 'resume_generation') { ... }

        setIsSaving(null);
    };

    const handleTaskSuccess = useCallback((task: Task) => {
        const toastContent = (
            <div className="flex flex-column" style={{ flex: '1' }}>
                <div className="flex align-items-center">
                    <i className="pi pi-check-circle text-green-500 text-2xl mr-2"></i>
                    <div className="font-bold">{task.notification_title || 'Task Complete!'}</div>
                </div>
                <div className="font-medium text-sm mt-2">Your new item is generated and ready.</div>
                <div className="grid mt-3">
                    <div className="col-6">
                        <Button
                            label="Dismiss"
                            className="p-button-text p-button-sm w-full"
                            onClick={() => toast.current?.clear()}
                        />
                    </div>
                    <div className="col-6">
                        <Button
                            label={isSaving === task.id ? 'Saving...' : 'Save & View'}
                            disabled={isSaving === task.id}
                            className="p-button-sm w-full"
                            onClick={() => handleSaveAndRedirect(task)}
                        />
                    </div>
                </div>
            </div>
        );

        toast.current?.show({
            severity: 'success',
            summary: 'Success',
            content: toastContent,
            sticky: true,
        });
    }, [isSaving]);

    const handleTaskFailure = useCallback((task: Task) => {
        toast.current?.show({
            severity: 'error',
            summary: 'Task Failed',
            detail: task.error_message || 'An unexpected error occurred.',
            life: 8000,
        });
    }, []);

    // Effect to detect completed tasks and show notifications
    useEffect(() => {
        if (!prevTasks || !tasks) return;

        tasks.forEach(currentTask => {
            const previousVersion = prevTasks.find(t => t.id === currentTask.id);
            if (previousVersion && previousVersion.status === 'PENDING') {
                if (currentTask.status === 'SUCCESS') {
                    handleTaskSuccess(currentTask);
                } else if (currentTask.status === 'FAILURE') {
                    handleTaskFailure(currentTask);
                }
            }
        });
    }, [tasks, prevTasks, handleTaskSuccess, handleTaskFailure]);


    useEffect(() => {
        const pendingTasks = tasks.filter(t => t.status === 'PENDING');
        if (pendingTasks.length > 0) {
            const intervalId = setInterval(() => {
                pollTasks(pendingTasks);
            }, POLLING_INTERVAL);

            return () => clearInterval(intervalId);
        }
    }, [tasks, pollTasks]);

    const addTask = (taskId: string, title: string, type: Task['task_type']) => {
        const newTask: Task = {
            id: taskId,
            status: 'PENDING',
            notification_title: title,
            task_type: type,
        };
        setTasks(prevTasks => [newTask, ...prevTasks]);
    };

    const removeTask = (taskId: string) => {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    };

    const clearCompleted = () => {
        setTasks(prevTasks => prevTasks.filter(task => task.status === 'PENDING'));
    };

    // The value provided to the context now includes tasks and management functions
    const contextValue: TaskContextType = {
        tasks,
        addTask,
        removeTask,
        clearCompleted,
        handleSaveAndRedirect
    };

    return (
        <TaskContext.Provider value={contextValue}>
            <Toast ref={toast} />
            {children}
        </TaskContext.Provider>
    );
};