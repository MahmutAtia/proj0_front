"use client";

import React, { useRef, useState } from 'react';
import { useTasks } from '@/contexts/TaskContext';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { OverlayPanel } from 'primereact/overlaypanel';
import { ProgressBar } from 'primereact/progressbar';
import { useRouter } from 'next/navigation';
import { Divider } from 'primereact/divider'; // Import Divider

const TaskNotificationBell = () => {
    const { tasks, clearCompleted, removeTask, handleSaveAndRedirect } = useTasks();
    const router = useRouter();
    const op = useRef(null);
    const [isSaving, setIsSaving] = useState(null);

    const pendingTasks = tasks.filter(t => t.status === 'PENDING');
    // Sort completed tasks to show the newest first, assuming tasks are added to the start of the array
    const completedTasks = tasks.filter(t => t.status !== 'PENDING');

    const onSaveClick = async (task) => {
        setIsSaving(task.id);
        await handleSaveAndRedirect(task);
        // The save function handles redirection, so we just hide the panel and remove the task
        op.current?.hide();
        removeTask(task.id);
        setIsSaving(null);
    };

    const getIconForTask = (taskType) => {
        switch (taskType) {
            case 'resume_generation':
                return 'pi pi-file';
            case 'website_generation':
                return 'pi pi-globe';
            default:
                return 'pi pi-cog';
        }
    };

    return (
        <>
            <Button
                type="button"
                icon="pi pi-bell"
                rounded
                text
                className="p-overlay-badge" 
                onClick={(e) => op.current?.toggle(e)}
                aria-controls="task_overlay_panel"
                aria-haspopup
            >
                {tasks && tasks.length > 0 && <Badge value={tasks.length} severity="danger" />}
            </Button>

            <OverlayPanel ref={op} id="task_overlay_panel" className="w-full md:w-25rem">
                <div className="flex justify-content-between align-items-center mb-3">
                    <h5 className="m-0 font-semibold">Task Status</h5>
                    {completedTasks.length > 0 && (
                        <Button label="Clear Completed" className="p-button-text p-button-sm" onClick={clearCompleted} />
                    )}
                </div>

                {tasks.length === 0 && <p className="text-sm text-center text-color-secondary">No active tasks.</p>}

                {pendingTasks.map(task => (
                    <div key={task.id} className="p-3 border-bottom-1 surface-border">
                        <div className="flex align-items-center mb-2">
                            <i className={`${getIconForTask(task.task_type)} mr-2`}></i>
                            <span className="font-medium text-sm">{task.notification_title}</span>
                        </div>
                        <ProgressBar mode="indeterminate" style={{ height: '6px' }} />
                    </div>
                ))}

                {pendingTasks.length > 0 && completedTasks.length > 0 && <Divider className="my-2" />}

                {completedTasks.map(task => (
                    <div key={task.id} className="p-3 border-bottom-1 surface-border">
                        <div className="flex justify-content-between align-items-center">
                            <div className="flex align-items-center overflow-hidden">
                                <i className={`${getIconForTask(task.task_type)} mr-2 ${task.status === 'SUCCESS' ? 'text-green-500' : 'text-red-500'}`}></i>
                                <span className="font-medium text-sm white-space-nowrap overflow-hidden text-overflow-ellipsis">{task.notification_title}</span>
                            </div>
                            <div className="flex flex-shrink-0 ml-2">
                                {task.status === 'SUCCESS' && (
                                    <Button 
                                        label={isSaving === task.id ? 'Saving...' : 'Save & View'}
                                        icon={isSaving === task.id ? 'pi pi-spin pi-spinner' : 'pi pi-save'}
                                        className="p-button-text p-button-sm" 
                                        onClick={() => onSaveClick(task)}
                                        disabled={isSaving === task.id}
                                    />
                                )}
                                <Button icon="pi pi-times" rounded text className="p-button-sm" aria-label="Remove" onClick={() => removeTask(task.id)} />
                            </div>
                        </div>
                        {task.status === 'FAILURE' && (
                            <p className="text-xs text-red-500 mt-1 ml-4">{task.error_message}</p>
                        )}
                    </div>
                ))}
            </OverlayPanel>
        </>
    );
};

export default TaskNotificationBell;