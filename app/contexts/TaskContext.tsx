"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import api from '@/lib/axios';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { useRouter } from 'next/navigation';

const POLLING_INTERVAL = 5000; // 5 seconds

interface Task {
    task_id: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILURE';
    result: any;
    error: string;
    action_url?: string;
    notification_title?: string;
}

interface TaskContextType {
    addActiveTask: (taskId: string) => void;
    activeTasks: string[];
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
    const [activeTasks, setActiveTasks] = useState<string[]>([]);
    const toast = useRef<Toast>(null);
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
        const storedTasks = localStorage.getItem('activeTasks');
        if (storedTasks) {
            setActiveTasks(JSON.parse(storedTasks));
        }
    }, []);

    const handleTaskSuccess = useCallback((task: Task) => {
        const toastContent = (
            <div className="flex flex-column" style={{ flex: '1' }}>
                <div className="flex align-items-center">
                    <i className="pi pi-check-circle text-green-500 text-2xl mr-2"></i>
                    <div className="font-bold">{task.notification_title || 'Task Complete!'}</div>
                </div>
                {task.action_url && (
                    <div className="font-medium text-sm mt-2">Your new item is ready to view.</div>
                )}
                <div className="grid mt-3">
                    <div className="col-6">
                        <Button
                            label="Dismiss"
                            className="p-button-text p-button-sm w-full"
                            onClick={() => toast.current?.clear()}
                        />
                    </div>
                    {task.action_url && (
                         <div className="col-6">
                            <Button
                                label="View"
                                className="p-button-sm w-full"
                                onClick={() => {
                                    router.push(task.action_url as string);
                                    toast.current?.clear();
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        );

        toast.current?.show({
            severity: 'success',
            summary: 'Success',
            content: toastContent,
            sticky: true,
        });
    }, [router]);

    const handleTaskFailure = useCallback((task: Task) => {
        toast.current?.show({
            severity: 'error',
            summary: 'Task Failed',
            detail: task.error || 'An unexpected error occurred.',
            life: 8000,
        });
    }, []);

    const pollTasks = useCallback(async (tasksToPoll: string[]) => {
        if (tasksToPoll.length === 0 || status !== 'authenticated') return;

        const completedTaskIds: string[] = [];

        for (const taskId of tasksToPoll) {
            try {
                const response = await api.get<Task>(`/api/task-status/${taskId}/`);
                const task = response.data;

                if (task.status === 'SUCCESS') {
                    handleTaskSuccess(task);
                    completedTaskIds.push(taskId);
                } else if (task.status === 'FAILURE') {
                    handleTaskFailure(task);
                    completedTaskIds.push(taskId);
                }
            } catch (error) {
                console.error(`Failed to poll task ${taskId}:`, error);
                // Optionally remove task if it 404s, etc.
            }
        }

        if (completedTaskIds.length > 0) {
            setActiveTasks(prev => {
                const newTasks = prev.filter(id => !completedTaskIds.includes(id));
                localStorage.setItem('activeTasks', JSON.stringify(newTasks));
                return newTasks;
            });
        }
    }, [status, handleTaskSuccess, handleTaskFailure]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            pollTasks(activeTasks);
        }, POLLING_INTERVAL);

        return () => clearInterval(intervalId);
    }, [activeTasks, pollTasks]);

    const addActiveTask = (taskId: string) => {
        setActiveTasks(prev => {
            if (prev.includes(taskId)) return prev;
            const newTasks = [...prev, taskId];
            localStorage.setItem('activeTasks', JSON.stringify(newTasks));
            return newTasks;
        });
        toast.current?.show({
            severity: 'info',
            summary: 'Processing Started',
            detail: 'Your request is being processed in the background.',
            life: 3000,
        });
    };

    return (
        <TaskContext.Provider value={{ addActiveTask, activeTasks }}>
            <Toast ref={toast} position="top-right" />
            {children}
        </TaskContext.Provider>
    );
};