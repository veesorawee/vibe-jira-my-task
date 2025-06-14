import React, { useRef, useEffect, useMemo } from 'react';
import IconBadge from './IconBadge';
import Badge from './Badge';
import { parseDate, formatDateFull, isWeekend, hexToRgba } from '../utils/helpers';
import { Maximize2, Minimize2 } from 'lucide-react';

const GanttChart = ({ tasks, minDate, maxDate, onTaskClick, currentDate, biCategoryColors, isCompactMode, setIsCompactMode }) => {
    // Increased column width for better layout and alignment
    const taskColumnWidth = 350;
    const dayWidth = 30;
    const ganttRef = useRef(null);

    useEffect(() => {
        const ganttContainer = ganttRef.current;
        if (!ganttContainer || !minDate) return;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayIndex = Math.floor((today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

        if (todayIndex > -1) {
            const scrollTarget = (todayIndex * dayWidth) - (ganttContainer.clientWidth / 2) + (dayWidth / 2);
            ganttContainer.scrollLeft = scrollTarget;
        }
    }, [minDate]);

    const { dates, monthHeaders } = useMemo(() => {
        if (!minDate || !maxDate) return { dates: [], monthHeaders: [] };
        const dateArr = [];
        const monthArr = [];
        let currentMonth = null;
        
        for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
            const date = new Date(d);
            dateArr.push(date);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            if (monthKey !== currentMonth) {
                currentMonth = monthKey;
                monthArr.push({ month: monthKey, label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), days: 0 });
            }
            if(monthArr.length > 0) monthArr[monthArr.length - 1].days++;
        }
        return { dates: dateArr, monthHeaders: monthArr };
    }, [minDate, maxDate]);

    const timelineWidth = dates.length * dayWidth;

    const getProgressBarStyle = (task) => {
        const startDate = parseDate(task.startDate);
        if (!startDate || !minDate) return { display: 'none' };
        
        let endDate;
        const status = (task.status || '').toLowerCase();
        const isCompleted = status.includes('done') || status.includes('cancelled');
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        if (isCompleted) {
            endDate = parseDate(task.resolutiondate) || new Date(task.lastUpdated);
        } else {
            endDate = new Date(today);
        }

        const finalEndDate = (!endDate || endDate < startDate) ? startDate : endDate;
        const startDay = Math.max(0, Math.floor((startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
        const endDay = Math.floor((finalEndDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
        const duration = Math.max(1, endDay - startDay + 1);

        return { 
            left: `${startDay * dayWidth}px`, 
            width: `${duration * dayWidth}px`
        };
    };

    const getPlannedBarStyle = (task) => {
        const startDate = parseDate(task.startDate);
        const dueDate = parseDate(task.dueDate);

        if (!startDate || !dueDate || !minDate || dueDate < startDate) {
            return { display: 'none' };
        }

        const startDay = Math.max(0, Math.floor((startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
        const endDay = Math.floor((dueDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
        const duration = Math.max(1, endDay - startDay + 1);
        
        return {
            left: `${startDay * dayWidth}px`,
            width: `${duration * dayWidth}px`
        };
    };

    if (tasks.length === 0) {
        return <div className="bg-white rounded-lg shadow text-center p-8 text-gray-500">No tasks to display in Gantt view.</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto h-full" ref={ganttRef}>
            <div style={{ width: `${taskColumnWidth + timelineWidth}px` }} className="relative">
                {/* Header */}
                <div className="sticky top-0 z-20 bg-gray-50">
                    <div className="flex">
                        <div className="sticky left-0 border-b border-r bg-gray-100 z-30" style={{ width: taskColumnWidth, flexShrink: 0 }}></div>
                        {monthHeaders.map((month) => (<div key={month.month} className="text-center text-sm p-2 border-b border-r font-semibold" style={{ width: `${month.days * dayWidth}px` }}>{month.label}</div>))}
                    </div>
                    <div className="flex">
                        <div className="sticky left-0 p-2 border-b border-r font-medium bg-gray-50 z-30 flex justify-between items-center" style={{ width: taskColumnWidth, flexShrink: 0 }}>
                             <span className="pl-1">Task</span>
                             <button 
                                onClick={() => setIsCompactMode(!isCompactMode)} 
                                className="p-1 rounded-md hover:bg-gray-200 text-gray-500"
                                title={isCompactMode ? "Switch to Full View" : "Switch to Compact View"}
                            >
                                {isCompactMode ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                            </button>
                        </div>
                        {dates.map((date, index) => (<div key={index} className={`text-center text-xs py-2 border-b border-r ${date.toDateString() === currentDate.toDateString() ? 'bg-blue-200 text-blue-900 font-bold' : isWeekend(date) ? 'bg-red-50' : ''}`} style={{ minWidth: dayWidth, width: dayWidth }} title={formatDateFull(date)}>{date.getDate()}</div>))}
                    </div>
                </div>
                {/* Body */}
                {tasks.map((task) => {
                    const dueDate = parseDate(task.dueDate);
                    const isClosed = task.status.toLowerCase().includes('done') || task.status.toLowerCase().includes('cancelled');
                    const categoryColor = biCategoryColors[task.biCategory] || '#9ca3af';
                    
                    const isOverdue = dueDate && (currentDate > dueDate);
                    const dueDay = (dueDate && minDate) ? Math.floor((dueDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) : -1;

                    let barVisualStyle;
                    if (isClosed) {
                        barVisualStyle = { backgroundColor: '#a1a1aa' };
                    } else {
                        barVisualStyle = { 
                            background: `linear-gradient(to right, ${hexToRgba(categoryColor, 0.9)}, ${hexToRgba(categoryColor, 0.4)})` 
                        };
                    }

                    return (
                        <div key={task.id} className="flex border-b">
                            <div className="sticky left-0 bg-white hover:bg-gray-50 border-r py-2 px-3 cursor-pointer z-10 flex items-center" style={{ width: taskColumnWidth, flexShrink: 0 }} onClick={() => onTaskClick(task)}>
                                {isCompactMode ? (
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center space-x-2 truncate">
                                            
                                            <p className="font-medium text-sm truncate" title={task.title}>{task.title}</p>
                                        </div>
                                        {!isClosed && (
                                            <div className="flex items-center space-x-1.5 flex-shrink-0">
                                                <IconBadge type="priority" task={task} />
                                                <IconBadge type="timeliness" task={task} />
                                                <IconBadge type="status" task={task} />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-full">
                                        <div className="flex items-center space-x-2">
                                            <div className="flex-shrink-0">
                                                <Badge type="department" task={task} />
                                            </div>
                                            <p className="font-medium text-sm" title={task.title}>{task.title}</p>
                                        </div>
                                         {!isClosed && (
                                           <div className="pl-8 mt-1 flex items-center flex-wrap gap-2">
                                               <Badge type="priority" task={task} />
                                               <Badge type="timeliness" task={task} />
                                               <Badge type="status" task={task} />
                                           </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="relative" style={{ width: timelineWidth, flexShrink: 0 }}>
                                {!isClosed && (
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 h-5 rounded-sm bg-transparent border border-dashed border-gray-400"
                                        style={getPlannedBarStyle(task)}
                                        title={`Planned: ${task.startDate} to ${task.dueDate}`}
                                    />
                                )}
                                <div 
                                    className="absolute top-1/2 -translate-y-1/2 h-5 rounded-sm cursor-pointer hover:opacity-80 transition-opacity flex items-center" 
                                    style={{ ...getProgressBarStyle(task), ...barVisualStyle }} 
                                    onClick={() => onTaskClick(task)} 
                                    title={task.title}>
                                </div>
                                {isOverdue && dueDay >= 0 && dueDay < dates.length && (
                                    <div
                                        className="absolute top-0 bottom-0 w-0.5 bg-red-500"
                                        style={{ left: `${(dueDay + 1) * dayWidth - 1}px` }} 
                                        title={`Overdue: ${task.dueDate}`}
                                    />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GanttChart;
