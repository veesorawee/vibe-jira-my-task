// src/components/GanttChart.js
import React, { useRef, useEffect, useMemo } from 'react';
import IconBadge from './IconBadge';
import { parseDate, formatDateFull, isWeekend } from '../utils/helpers';

const GanttChart = ({ tasks, minDate, maxDate, onTaskClick, currentDate }) => {
    const dayWidth = 30;
    const taskColumnWidth = 300;
    const ganttRef = useRef(null);

    // --- LOGIC: Auto-scroll to current date ---
    // Effect นี้จะทำงานเมื่อ component โหลดเสร็จและมี minDate
    // เพื่อเลื่อน scrollbar ไปยังตำแหน่งของวันปัจจุบัน
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

    const getTaskBarStyle = (task) => {
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
        const startDay = Math.floor((startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
        const endDay = Math.floor((finalEndDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
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
                        <div className="sticky left-0 p-3 border-b border-r font-medium bg-gray-50 z-30" style={{ width: taskColumnWidth, flexShrink: 0 }}>Task</div>
                        {dates.map((date, index) => (<div key={index} className={`text-center text-xs py-2 border-b border-r ${date.toDateString() === currentDate.toDateString() ? 'bg-blue-200 text-blue-900 font-bold' : isWeekend(date) ? 'bg-red-50' : ''}`} style={{ minWidth: dayWidth, width: dayWidth }} title={formatDateFull(date)}>{date.getDate()}</div>))}
                    </div>
                </div>
                {/* Body */}
                {tasks.map((task) => {
                    const dueDate = parseDate(task.dueDate);
                    const dueDay = (dueDate && minDate) ? Math.floor((dueDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) : -1;
                    return (
                        <div key={task.id} className="flex border-b">
                            <div className="sticky left-0 bg-white hover:bg-gray-50 border-r py-3 px-3 cursor-pointer z-10" style={{ width: taskColumnWidth, flexShrink: 0 }} onClick={() => onTaskClick(task)}>
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center space-x-2 truncate">
                                        <IconBadge type="status" task={task} />
                                        <p className="font-medium text-sm truncate" title={task.title}>{task.title}</p>
                                    </div>
                                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                                        <IconBadge type="priority" task={task} />
                                        <IconBadge type="timeliness" task={task} />
                                    </div>
                                </div>
                            </div>
                            <div className="relative" style={{ width: timelineWidth, flexShrink: 0 }}>
                                <div 
                                    className="absolute top-1/2 -translate-y-1/2 h-5 rounded-sm cursor-pointer hover:opacity-80 transition-opacity flex items-center bg-indigo-500" 
                                    style={getTaskBarStyle(task)} 
                                    onClick={() => onTaskClick(task)} 
                                    title={task.title}>
                                </div>
                                {dueDay >= 0 && dueDay < dates.length && (
                                    <div
                                        className="absolute top-0 bottom-0 w-0.5 bg-red-500"
                                        style={{ left: `${(dueDay) * dayWidth + (dayWidth / 2)}px` }} 
                                        title={`Due: ${task.dueDate}`}
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