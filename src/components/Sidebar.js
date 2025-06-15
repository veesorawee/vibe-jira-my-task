import React, { useState } from 'react';
import { PlusCircle, Inbox, GanttChartSquare, BarChart3, Settings, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar = ({ view, setView, activeTaskCount, onCreateClick, onConfigClick, isCollapsed, setIsCollapsed }) => {
    // Function to get mood emoji based on active task count
    const getMoodEmoji = (count) => {
        if (count === 0) return { emoji: '😎', label: 'Chill!' };
        if (count <= 3) return { emoji: '😊', label: 'Good' };
        if (count <= 6) return { emoji: '😐', label: 'Busy' };
        if (count <= 10) return { emoji: '😰', label: 'Stressed' };
        return { emoji: '🤯', label: 'Overloaded!' };
    };
    
    const mood = getMoodEmoji(activeTaskCount);
    
    const navItems = [
        { key: 'inbox', label: 'Inbox', icon: Inbox, count: activeTaskCount },
        { key: 'kanban', label: 'Kanban', icon: LayoutGrid },
        { key: 'gantt', label: 'Gantt', icon: GanttChartSquare },
        { key: 'workload', label: 'Workload', icon: BarChart3 },
    ];

    return (
        <aside className={`bg-gray-50 border-r border-gray-200 flex flex-col p-4 transition-all duration-300 ease-in-out ${
            isCollapsed ? 'w-20' : 'w-60'
        }`}>
            {/* Header with Logo and Collapse Button */}
            <div className={`flex items-center mb-6 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                <div className={`flex items-center gap-2 ${isCollapsed ? 'flex-col' : ''}`}>
                    <span className="text-2xl" title={`${mood.label} (${activeTaskCount} active tasks)`}>
                        {mood.emoji}
                    </span>
                    {!isCollapsed && (
                        <h1 className="text-xl font-bold text-gray-800">My Jira</h1>
                    )}
                </div>
                
                {!isCollapsed && (
                    <button
                        onClick={() => setIsCollapsed(true)}
                        className="p-1 rounded hover:bg-gray-200 text-gray-600"
                        title="Collapse sidebar"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}
            </div>
            
            {isCollapsed && (
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="mb-4 p-2 rounded hover:bg-gray-200 text-gray-600 self-center"
                    title="Expand sidebar"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            )}

            {/* Create Task Button */}
            <button
                onClick={onCreateClick}
                className={`bg-indigo-600 text-white mb-6 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 font-semibold transition-all ${
                    isCollapsed ? 'w-12 h-12 p-0' : 'w-full px-4 py-2 text-sm'
                }`}
                title={isCollapsed ? 'Create Task' : ''}
            >
                <PlusCircle className={isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} />
                {!isCollapsed && <span>Create Task</span>}
            </button>

            {/* Navigation Items */}
            <nav className="flex flex-col space-y-1">
                {navItems.map(item => (
                    <button 
                        key={item.key}
                        onClick={() => setView(item.key)} 
                        className={`flex items-center rounded-md transition-colors text-sm font-medium relative ${
                            view === item.key ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                        } ${isCollapsed ? 'p-3 justify-center' : 'p-3'}`}
                        title={isCollapsed ? item.label : ''}
                    >
                        <item.icon className={isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'} />
                        {!isCollapsed && (
                            <>
                                <span>{item.label}</span>
                                {item.count !== undefined && (
                                    <span className="ml-auto text-xs bg-gray-300 rounded-full px-2 py-0.5">
                                        {item.count}
                                    </span>
                                )}
                            </>
                        )}
                        {isCollapsed && item.count !== undefined && (
                            <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                                {item.count}
                            </span>
                        )}
                    </button>
                ))}
            </nav>
            
            {/* Settings Button */}
            <div className="mt-auto">
                <button 
                    onClick={onConfigClick} 
                    className={`flex items-center rounded-md text-gray-600 hover:bg-gray-100 w-full text-sm font-medium ${
                        isCollapsed ? 'p-3 justify-center' : 'p-3'
                    }`}
                    title={isCollapsed ? 'Config' : ''}
                >
                    <Settings className={isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'} />
                    {!isCollapsed && <span>Config</span>}
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;