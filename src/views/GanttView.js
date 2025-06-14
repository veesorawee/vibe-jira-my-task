import React, { useMemo, useState } from 'react';
import GanttChart from '../components/GanttChart';
import TaskDetailView from '../components/TaskDetailView';
import { parseDate } from '../utils/helpers';
import { X } from 'lucide-react';

const GanttView = ({ tasks }) => {
    const [selectedTask, setSelectedTask] = useState(null);
    const [isCompactMode, setIsCompactMode] = useState(false); // State for compact mode

    // Generate colors for BI Categories to be passed to the chart
    const biCategoryColors = useMemo(() => {
        const categories = [...new Set(tasks.map(t => t.biCategory).filter(Boolean))].sort();
        const colors = [
            '#667eea', '#764ba2', '#43e97b', '#ff9a9e', 
            '#fbc2eb', '#fdbb2d', '#ff6b6b', '#3f5efb'
        ];
        const colorMap = {};
        categories.forEach((cat, index) => {
            colorMap[cat] = colors[index % colors.length];
        });
        colorMap['N/A'] = '#9ca3af'; // Default color
        return colorMap;
    }, [tasks]);

    // Sort tasks based on priority for the Gantt view
    const sortedTasks = useMemo(() => {
        const openTasks = tasks.filter(t => !t.status.toLowerCase().includes('done') && !t.status.toLowerCase().includes('cancelled'));
        const closedTasks = tasks.filter(t => t.status.toLowerCase().includes('done') || t.status.toLowerCase().includes('cancelled'));

        const priorityOrder = { 'Highest': 1, 'High': 2, 'Medium': 3, 'Low': 4 };
        
        openTasks.sort((a, b) => {
            const priorityA = priorityOrder[a.priority] || 5;
            const priorityB = priorityOrder[b.priority] || 5;
            if (priorityA !== priorityB) return priorityA - priorityB;

            const dueDateA = a.dueDate ? parseDate(a.dueDate) : null;
            const dueDateB = b.dueDate ? parseDate(b.dueDate) : null;
            if (dueDateA && !dueDateB) return -1;
            if (!dueDateA && dueDateB) return 1;
            if (dueDateA && dueDateB) return dueDateA.getTime() - dueDateB.getTime();
            
            return 0;
        });

        closedTasks.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));

        return [...openTasks, ...closedTasks];
    }, [tasks]);

    const { minDateForGantt, maxDateForGantt } = useMemo(() => {
        const today = new Date();
        const minDate = new Date();
        const maxDate = new Date();

        minDate.setMonth(today.getMonth() - 3);
        maxDate.setMonth(today.getMonth() + 3);
        
        return { minDateForGantt: minDate, maxDateForGantt: maxDate };
    }, []);

    const handleTaskClick = (task) => {
        setSelectedTask(task);
    };

    return (
        <div className="h-full flex flex-col">
            {/* The GanttChart component now controls its own header and compact mode button */}
            <div className="flex-1 min-h-0">
                <GanttChart 
                    tasks={sortedTasks} 
                    biCategoryColors={biCategoryColors}
                    isCompactMode={isCompactMode}
                    setIsCompactMode={setIsCompactMode} // Pass setter to GanttChart
                    minDate={minDateForGantt} 
                    maxDate={maxDateForGantt}
                    onTaskClick={handleTaskClick} 
                    currentDate={new Date()}
                />
            </div>

             {/* Task Detail Drawer */}
             <div className={`fixed inset-0 z-50 transition-opacity ${!!selectedTask ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                <div 
                    className={`absolute inset-0 bg-black transition-opacity ease-in-out duration-300 ${!!selectedTask ? 'bg-opacity-50' : 'bg-opacity-0'}`} 
                    onClick={() => setSelectedTask(null)}>
                </div>
                <div className={`fixed top-0 right-0 h-full bg-white w-full max-w-2xl shadow-xl transition-transform transform ease-in-out duration-300 flex flex-col ${!!selectedTask ? 'translate-x-0' : 'translate-x-full'}`}>
                    {selectedTask && (
                        <>
                            <div className="flex items-center justify-end p-2 border-b">
                                <button onClick={() => setSelectedTask(null)} className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <TaskDetailView task={selectedTask} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GanttView;
