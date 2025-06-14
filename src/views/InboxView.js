import React, { useState, useMemo, useEffect } from 'react';
import TaskDetailView from '../components/TaskDetailView';
import Badge from '../components/Badge';
import { formatRelativeTime } from '../utils/helpers';
import { Play, CheckCircle, XCircle, Loader2, ListOrdered, History, CalendarPlus } from 'lucide-react';

const TaskListItemSkeleton = () => (
    <div className="flex flex-col gap-2 p-4 border-b border-gray-200 bg-white animate-pulse">
        <div className="flex justify-between items-center">
            <div className="h-3 bg-gray-200 rounded w-20"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="h-5 bg-gray-300 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-7 mt-1 flex items-center gap-2">
            <div className="h-5 bg-gray-200 rounded-full w-16"></div>
            <div className="h-5 bg-gray-200 rounded-full w-20"></div>
            <div className="h-5 bg-gray-200 rounded-full w-24"></div>
        </div>
    </div>
);


const TaskListItem = ({ task, onSelect, isSelected, onQuickTransition, updatingTaskId }) => {
    const departmentAndLabel = ` ${task.department || ''}${task.biCategory ? ` - ${task.biCategory}` : ''} `;
    const isUpdating = task.id === updatingTaskId;
    const isClosed = task.status.toLowerCase().includes('done') || task.status.toLowerCase().includes('cancelled');

    const createdDate = task.created || task.createdDate || task.createdAt || task.lastUpdated || new Date().toISOString();
    const timeDisplay = formatRelativeTime(createdDate);

    return (
        <div
            onClick={() => !isUpdating && onSelect(task)}
            className={`group relative flex flex-col gap-2 p-4 border-b border-gray-200 transition-colors duration-150 ${isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'} ${isClosed ? 'bg-slate-100' : ''} ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            {isUpdating && (
                 <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-20">
                    <Loader2 className="animate-spin text-gray-500" />
                </div>
            )}
            
            <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{task.id}</span>
                <span>{timeDisplay}</span>
            </div>

            <div className="flex justify-between items-start">
                 <p className={`font-bold break-words pr-2 ${isClosed ? 'text-gray-600' : 'text-gray-900'}`}>{task.title}</p>
                {isClosed && <span className="text-sm text-gray-500 flex-shrink-0 transition-opacity duration-150 group-hover:opacity-0">Close</span>}
            </div>

            <p className={`text-sm ${isClosed ? 'text-gray-500' : 'text-gray-600'}`}>{departmentAndLabel.trim()}</p>

            {!isClosed && (
                <div className="h-7 mt-1 flex items-center gap-2">
                    <Badge type="priority" task={task} />
                    <Badge type="timeliness" task={task} />
                    <Badge type="status" task={task} />
                </div>
            )}

            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex justify-end items-center transition-opacity duration-200 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
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
        </div>
    );
};

const InboxView = ({ tasks, activeTaskCount, onUpdateTask, onQuickTransition, updatingTaskId, jiraAPI, isConnected, isCreatingTask }) => {
    const [selectedTask, setSelectedTask] = useState(null);
    const [sortMode, setSortMode] = useState('createTime'); // Default sort mode

    useEffect(() => {
        const currentSelectedId = selectedTask?.id;
        if (currentSelectedId) {
            const updatedTaskInList = tasks.find(t => t.id === currentSelectedId);
            setSelectedTask(updatedTaskInList || (tasks.length > 0 ? tasks[0] : null));
        } else if (tasks.length > 0 && !isCreatingTask) {
             // Avoid auto-selecting a task while a new one is being created
            setSelectedTask(tasks.find(t => !t.isSkeleton) || tasks[0]);
        } else if (tasks.length === 0) {
            setSelectedTask(null);
        }
    }, [tasks, selectedTask?.id, isCreatingTask]);

    const sortedTasks = useMemo(() => {
        const tasksCopy = [...tasks];

        switch (sortMode) {
            case 'priority':
                const priorityOrder = { 'Highest': 1, 'High': 2, 'Medium': 3, 'Low': 4 };
                tasksCopy.sort((a, b) => {
                    const aIsClosed = a.status.toLowerCase().includes('done') || a.status.toLowerCase().includes('cancelled');
                    const bIsClosed = b.status.toLowerCase().includes('done') || b.status.toLowerCase().includes('cancelled');

                    if (aIsClosed && !bIsClosed) return 1;
                    if (!aIsClosed && bIsClosed) return -1;

                    if (aIsClosed && bIsClosed) {
                        return new Date(b.lastUpdated) - new Date(a.lastUpdated);
                    }

                    const priorityA = priorityOrder[a.priority] || 5;
                    const priorityB = priorityOrder[b.priority] || 5;
                    if (priorityA !== priorityB) return priorityA - priorityB;

                    const dueDateA = a.dueDate ? new Date(a.dueDate) : null;
                    const dueDateB = b.dueDate ? new Date(b.dueDate) : null;
                    if (dueDateA && !dueDateB) return -1;
                    if (!dueDateA && dueDateB) return 1;
                    if (dueDateA && dueDateB) return dueDateA.getTime() - dueDateB.getTime();
                    
                    return new Date(b.lastUpdated) - new Date(a.lastUpdated);
                });
                break;
            
            case 'lastUpdateTime':
                tasksCopy.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
                break;

            case 'createTime':
            default:
                tasksCopy.sort((a, b) => new Date(b.startTimestamp) - new Date(a.startTimestamp));
                break;
        }
        return tasksCopy;
    }, [tasks, sortMode]);

    return (
        <div className="h-full bg-white rounded-lg shadow-md overflow-hidden grid grid-cols-5">
            <div className="col-span-2 border-r border-gray-200 flex flex-col overflow-hidden">
                <div className="p-4 border-b flex-shrink-0 flex justify-between items-center">
                    <h3 className="text-lg font-bold">Inbox ({activeTaskCount})</h3>
                    <div className="flex items-center space-x-1">
                        <button onClick={() => setSortMode('createTime')} className={`p-1.5 rounded ${sortMode === 'createTime' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'}`} title="Sort by Create Time">
                            <CalendarPlus size={16} />
                        </button>
                        <button onClick={() => setSortMode('lastUpdateTime')} className={`p-1.5 rounded ${sortMode === 'lastUpdateTime' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'}`} title="Sort by Last Update">
                            <History size={16} />
                        </button>
                        <button onClick={() => setSortMode('priority')} className={`p-1.5 rounded ${sortMode === 'priority' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'}`} title="Sort by Priority">
                            <ListOrdered size={16} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {isCreatingTask && <TaskListItemSkeleton />}
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