import React, { useState, useMemo, useEffect } from 'react';
import TaskDetailView from '../components/TaskDetailView';
import IconBadge from '../components/IconBadge';
import { formatRelativeTime } from '../utils/helpers';
import { Play, CheckCircle, XCircle, ChevronRight, Loader2 } from 'lucide-react';

const TaskListItem = ({ task, onSelect, isSelected, onQuickTransition, updatingTaskId }) => {
    const departmentAndLabel = ` ${task.department || ''}${task.biCategory ?  ` - ${task.biCategory}`  : ''} `;
    const isUpdating = task.id === updatingTaskId;
    const isClosed = task.status.toLowerCase().includes('done') || task.status.toLowerCase().includes('cancelled');

    // Try multiple possible date fields
    const createdDate = task.created || task.createdDate || task.createdAt || task.lastUpdated || new Date().toISOString();
    const timeDisplay = formatRelativeTime(createdDate);

    return (
        <div
            onClick={() => !isUpdating && onSelect(task)}
            className={`group relative flex justify-between items-center p-4 border-b border-gray-200 transition-opacity ${isSelected ? 'bg-indigo-100' : 'hover:bg-gray-50'} ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            {/* Left side content */}
            <div className="flex flex-col gap-1.5 min-w-0 pr-4">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 flex-shrink-0">{task.id}</span>
                    <p className="font-semibold text-gray-800 break-words truncate">{task.title}</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-600">{departmentAndLabel.trim()}</span>
                    {timeDisplay && (
                        <>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-500 font-medium">{timeDisplay}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Right Side Content Wrapper */}
            <div className="relative flex items-center flex-shrink-0 ml-4 h-full">
                {isUpdating ? (
                    <div className="flex items-center justify-center w-full h-full px-4">
                        <Loader2 className="animate-spin text-gray-500" />
                    </div>
                ) : (
                    <>
                        {/* Default content (badges) */}
                        <div className={`flex items-center gap-2 transition-opacity duration-200 ${isClosed ? 'opacity-0' : 'group-hover:opacity-0'}`}>
                            <div className="flex items-center gap-1">
                                <IconBadge type="priority" task={task} />
                                <IconBadge type="timeliness" task={task} />
                            </div>
                            <ChevronRight size={16} className="text-gray-400" />
                        </div>
                        
                        {/* Quick Actions Overlay */}
                        <div className="absolute inset-0 z-10 flex justify-end items-center transition-opacity duration-200 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
                            <div className="flex items-center space-x-1 p-1 bg-white border border-gray-200 rounded-full shadow-sm">
                                <button title="In Progress" onClick={(e) => { e.stopPropagation(); onQuickTransition(task.id, 'in progress'); }} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full">
                                    <Play size={16} />
                                </button>
                                <button title="Done" onClick={(e) => { e.stopPropagation(); onQuickTransition(task.id, 'done'); }} className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-100 rounded-full">
                                    <CheckCircle size={16} />
                                </button>
                                <button title="Cancel" onClick={(e) => { e.stopPropagation(); onQuickTransition(task.id, 'cancelled'); }} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full">
                                    <XCircle size={16} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
            
            {/* "Close" Text Overlay */}
            {isClosed && (
                <div className={`absolute inset-0 flex items-center justify-end p-4 pointer-events-none select-none transition-opacity duration-200 group-hover:opacity-0`}>
                    <h2 className="text-6xl font-black text-gray-900/[.07] break-words leading-none">
                        Close
                    </h2>
                </div>
            )}
        </div>
    );
};

const InboxView = ({ tasks, activeTaskCount, onUpdateTask, onQuickTransition, updatingTaskId, jiraAPI, isConnected }) => {
    const [selectedTask, setSelectedTask] = useState(null);

    useEffect(() => {
        const currentSelectedId = selectedTask?.id;
        if (currentSelectedId) {
            const updatedTaskInList = tasks.find(t => t.id === currentSelectedId);
            setSelectedTask(updatedTaskInList || (tasks.length > 0 ? tasks[0] : null));
        } else if (tasks.length > 0) {
            setSelectedTask(tasks[0]);
        } else {
            setSelectedTask(null);
        }
    }, [tasks]);

    const sortedTasks = useMemo(() => {
        const getStatusOrder = (status) => {
            const s = (status || '').toLowerCase();
            if (s.includes('progress')) return 1;
            if (s.includes('review') || s.includes('pending')) return 2;
            if (s.includes('open') || s.includes('to do')) return 3;
            if (s.includes('done') || s.includes('cancel')) return 4;
            return 5;
        };
        return [...tasks].sort((a, b) => getStatusOrder(a.status) - getStatusOrder(b.status) || new Date(b.lastUpdated) - new Date(a.lastUpdated));
    }, [tasks]);

    return (
        <div className="h-full bg-white rounded-lg shadow-md overflow-hidden grid grid-cols-5">
            <div className="col-span-2 border-r border-gray-200 flex flex-col overflow-hidden">
                <div className="p-4 border-b flex-shrink-0">
                    <h3 className="text-lg font-bold">Inbox ({activeTaskCount})</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {sortedTasks.map(task => (
                        <TaskListItem
                            key={task.id}
                            task={task}
                            onSelect={setSelectedTask}
                            isSelected={selectedTask?.id === task.id}
                            onQuickTransition={onQuickTransition}
                            updatingTaskId={updatingTaskId}
                        />
                    ))}
                </div>
            </div>
            <div className="col-span-3 overflow-y-auto">
                {selectedTask ? (
                    <TaskDetailView
                        task={selectedTask}
                        onUpdateTask={onUpdateTask}
                        jiraAPI={jiraAPI}
                        isConnected={isConnected}
                        updatingTaskId={updatingTaskId}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p>Select a task to view its details</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InboxView;