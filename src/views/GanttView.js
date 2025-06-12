// src/views/GanttView.js
import React, { useMemo, useState } from 'react';
import GanttChart from '../components/GanttChart';
import TaskDetailView from '../components/TaskDetailView';
import { X } from 'lucide-react';

const GanttView = ({ tasks }) => {
    const [selectedTask, setSelectedTask] = useState(null);

    // --- LOGIC แก้ไขใหม่ ---
    // คำนวณช่วงเวลา +/- 3 เดือนจากวันปัจจุบันสำหรับ Gantt Chart
    const { minDateForGantt, maxDateForGantt } = useMemo(() => {
        const today = new Date();
        const minDate = new Date();
        const maxDate = new Date();

        minDate.setMonth(today.getMonth() - 3);
        maxDate.setMonth(today.getMonth() + 3);
        
        return { minDateForGantt: minDate, maxDateForGantt: maxDate };
    }, []); // คำนวณครั้งเดียวเมื่อ component โหลด

    const handleTaskClick = (task) => {
        setSelectedTask(task);
    };

    return (
        <div className="h-full">
            <GanttChart 
                tasks={tasks} 
                minDate={minDateForGantt} 
                maxDate={maxDateForGantt}
                onTaskClick={handleTaskClick} 
                currentDate={new Date()}
            />

             {/* Task Detail Drawer - เปิดเมื่อคลิก Task ใน Gantt */}
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