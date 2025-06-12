// src/components/Sidebar.js
import React from 'react';
import { PlusCircle, Inbox, GanttChartSquare, BarChart3, Settings } from 'lucide-react';

const Sidebar = ({ view, setView, activeTaskCount, onCreateClick, onConfigClick }) => {
    const navItems = [
        { key: 'inbox', label: 'Inbox', icon: Inbox, count: activeTaskCount },
        { key: 'gantt', label: 'Gantt', icon: GanttChartSquare },
        { key: 'workload', label: 'Workload', icon: BarChart3 },
    ];

    return (
        <aside className="w-60 bg-gray-50 border-r border-gray-200 flex flex-col p-4">
            <div className="flex items-center gap-2 mb-6">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-indigo-600">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
                    <path d="M12 17.77L16.24 19.3L15.22 14.5L18.8 11.33L13.92 10.9L12 6.5L10.08 10.9L5.2 11.33L8.78 14.5L7.76 19.3L12 17.77Z" fill="currentColor"/>
                </svg>
                <h1 className="text-xl font-bold text-gray-800">My Jira</h1>
            </div>

            <button
                onClick={onCreateClick}
                className="w-full bg-indigo-600 text-white px-4 py-2 mb-6 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 text-sm font-semibold"
            >
                <PlusCircle className="w-4 h-4" />
                <span>Create Task</span>
            </button>

            <nav className="flex flex-col space-y-1">
                {navItems.map(item => (
                    <button 
                        key={item.key}
                        onClick={() => setView(item.key)} 
                        className={`flex items-center p-3 rounded-md transition-colors text-sm font-medium ${view === item.key ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <item.icon className="w-5 h-5 mr-3" />
                        <span>{item.label}</span>
                        {item.count !== undefined && (
                            <span className="ml-auto text-xs bg-gray-300 rounded-full px-2 py-0.5">{item.count}</span>
                        )}
                    </button>
                ))}
            </nav>
            
            <div className="mt-auto">
                 <button onClick={onConfigClick} className="flex items-center p-3 rounded-md text-gray-600 hover:bg-gray-100 w-full text-sm font-medium">
                    <Settings className="w-5 h-5 mr-3" />
                    <span>Config</span>
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;