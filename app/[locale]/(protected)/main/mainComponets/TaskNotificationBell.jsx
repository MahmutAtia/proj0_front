"use client";

import React, { useRef } from 'react';
import { useTasks } from '@/contexts/TaskContext';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { OverlayPanel } from 'primereact/overlaypanel';
import { ProgressBar } from 'primereact/progressbar';
import { useRouter } from 'next/navigation';
import { Divider } from 'primereact/divider';
import { Card } from 'primereact/card';

const TaskNotificationBell = () => {
    const { tasks, clearCompleted, removeTask, handleSaveAndRedirect, isSaving } = useTasks();
    const router = useRouter();
    const op = useRef(null);

    const pendingTasks = tasks.filter(t => t.status === 'PENDING');
    const completedTasks = tasks.filter(t => t.status !== 'PENDING');

    const onSaveClick = async (task) => {
        await handleSaveAndRedirect(task);
        op.current?.hide();
    };

    const getTaskConfig = (taskType, status) => {
        const configs = {
            resume_generation: {
                icon: 'pi pi-file-edit',
                color: '#6366f1',
                bgColor: '#eef2ff'
            },
            website_generation: {
                icon: 'pi pi-globe',
                color: '#059669',
                bgColor: '#ecfdf5'
            },
            default: {
                icon: 'pi pi-cog',
                color: '#6b7280',
                bgColor: '#f9fafb'
            }
        };

        const config = configs[taskType] || configs.default;
        
        if (status === 'SUCCESS') {
            return { ...config, color: '#059669', bgColor: '#ecfdf5' };
        } else if (status === 'FAILURE') {
            return { ...config, color: '#dc2626', bgColor: '#fef2f2' };
        }
        
        return config;
    };

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const taskTime = new Date(timestamp);
        const diffMs = now - taskTime;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    const totalTasks = tasks.length;
    const hasCompletedTasks = completedTasks.length > 0;

    return (
        <>
            <div className="relative">
                <Button
                    type="button"
                    icon="pi pi-bell"
                    rounded
                    text
                    severity="secondary"
                    onClick={(e) => op.current?.toggle(e)}
                    aria-controls="task_overlay_panel"
                    aria-haspopup
                    className="p-2 hover:bg-gray-100 transition-colors"
                    tooltip="View notifications"
                    tooltipOptions={{ position: 'bottom' }}
                />
                {totalTasks > 0 && (
                    <Badge 
                        value={totalTasks} 
                        severity={pendingTasks.length > 0 ? "danger" : "success"}
                        className="absolute -top-1 -right-1"
                    />
                )}
            </div>

            <OverlayPanel 
                ref={op} 
                id="task_overlay_panel" 
                className="w-full md:w-28rem shadow-lg border-round"
                style={{ maxHeight: '32rem', overflow: 'hidden' }}
            >
                {/* Header */}
                <div className="flex justify-content-between align-items-center mb-3 pb-3 border-bottom-1 surface-border">
                    <div>
                        <h5 className="m-0 font-semibold text-lg text-900">Notifications</h5>
                        <p className="text-sm text-600 mt-1 mb-0">
                            {totalTasks === 0 ? 'All caught up!' : 
                             `${pendingTasks.length} active, ${completedTasks.length} completed`}
                        </p>
                    </div>
                    {hasCompletedTasks && (
                        <Button 
                            label="Clear All" 
                            icon="pi pi-check-circle"
                            size="small"
                            text
                            severity="secondary"
                            onClick={clearCompleted}
                            className="p-1"
                        />
                    )}
                </div>

                {/* Content Area */}
                <div style={{ maxHeight: '24rem', overflowY: 'auto' }} className="pr-2">
                    {totalTasks === 0 && (
                        <div className="text-center py-4">
                            <i className="pi pi-bell-slash text-4xl text-400 mb-3"></i>
                            <p className="text-600 m-0">No notifications at the moment</p>
                        </div>
                    )}

                    {/* Pending Tasks */}
                    {pendingTasks.map((task, index) => {
                        const config = getTaskConfig(task.task_type, task.status);
                        return (
                            <Card 
                                key={task.id} 
                                className={`mb-3 border-left-4 ${index === 0 ? 'animate-pulse' : ''}`}
                                style={{ borderLeftColor: config.color }}
                            >
                                <div className="flex align-items-start">
                                    <div 
                                        className="flex align-items-center justify-content-center border-circle mr-3 flex-shrink-0"
                                        style={{ 
                                            width: '2.5rem', 
                                            height: '2.5rem',
                                            backgroundColor: config.bgColor,
                                            color: config.color
                                        }}
                                    >
                                        <i className={config.icon}></i>
                                    </div>
                                    <div className="flex-1">
                                        <h6 className="m-0 mb-2 font-semibold text-900 text-sm">
                                            {task.notification_title}
                                        </h6>
                                        <div className="mb-2">
                                            <ProgressBar 
                                                mode="indeterminate" 
                                                style={{ height: '4px' }}
                                                className="border-round"
                                            />
                                        </div>
                                        <div className="flex align-items-center justify-content-between">
                                            <span className="text-xs text-500">Processing...</span>
                                            <i className="pi pi-spin pi-spinner text-xs text-500"></i>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}

                    {/* Divider between pending and completed */}
                    {pendingTasks.length > 0 && completedTasks.length > 0 && (
                        <Divider className="my-4">
                            <span className="text-xs text-500 bg-white px-2">Recent</span>
                        </Divider>
                    )}

                    {/* Completed Tasks */}
                    {completedTasks.map(task => {
                        const config = getTaskConfig(task.task_type, task.status);
                        const isSuccess = task.status === 'SUCCESS';
                        
                        return (
                            <Card key={task.id} className="mb-3 border-left-4" style={{ borderLeftColor: config.color }}>
                                <div className="flex align-items-start">
                                    <div 
                                        className="flex align-items-center justify-content-center border-circle mr-3 flex-shrink-0"
                                        style={{ 
                                            width: '2.5rem', 
                                            height: '2.5rem',
                                            backgroundColor: config.bgColor,
                                            color: config.color
                                        }}
                                    >
                                        <i className={isSuccess ? 'pi pi-check-circle' : 'pi pi-times-circle'}></i>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-content-between align-items-start mb-2">
                                            <h6 className="m-0 font-semibold text-900 text-sm flex-1">
                                                {task.notification_title}
                                            </h6>
                                            <Button 
                                                icon="pi pi-times" 
                                                rounded 
                                                text 
                                                size="small"
                                                severity="secondary"
                                                onClick={() => removeTask(task.id)}
                                                className="ml-2 p-1"
                                                tooltip="Dismiss"
                                            />
                                        </div>
                                        
                                        {task.status === 'FAILURE' && task.error_message && (
                                            <p className="text-xs text-red-600 mb-2 bg-red-50 p-2 border-round">
                                                {task.error_message}
                                            </p>
                                        )}
                                        
                                        <div className="flex justify-content-between align-items-center">
                                            <span className="text-xs text-500">
                                                {formatTimeAgo(task.updated_at || task.created_at)}
                                            </span>
                                            {isSuccess && (
                                                <Button
                                                    label={isSaving === task.id ? 'Opening...' : 'View Result'}
                                                    icon={isSaving === task.id ? 'pi pi-spin pi-spinner' : 'pi pi-external-link'}
                                                    size="small"
                                                    severity="success"
                                                    onClick={() => onSaveClick(task)}
                                                    disabled={isSaving === task.id}
                                                    className="p-1"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </OverlayPanel>
        </>
    );
};

export default TaskNotificationBell;