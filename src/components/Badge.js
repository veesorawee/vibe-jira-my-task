import React from 'react';
import { ChevronsUp, ChevronUp, Minus, ChevronDown, Flame, CheckCircle2, AlertTriangle } from 'lucide-react';
import { departmentImageConfig } from '../config/departmentConfig';
import { parseDate, getStatusColor } from '../utils/helpers';

// A simple hash function to generate a consistent color from a string
const stringToColor = (str) => {
    let hash = 0;
    if (str.length === 0) return '#cccccc';
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convert to 32bit integer
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
};

const Badge = ({ type, task }) => {
    const baseClasses = "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border";

    if (type === 'department') {
        const departmentName = task.department || 'N/A';
        const imageUrl = departmentImageConfig[departmentName];

        if (imageUrl) {
            return (
                <img 
                    src={imageUrl} 
                    alt={departmentName} 
                    className="w-5 h-5 rounded-full object-cover" 
                    title={departmentName} 
                />
            );
        }
        
        // Fallback to a colored dot if no image is configured
        return (
            <span 
                className="w-5 h-5 rounded-full inline-block" // Removed border
                /*style={{ backgroundColor: stringToColor(departmentName) }}
                title={departmentName}*/
            ></span>
        );
    }

    if (type === 'priority') {
        const priority = task.priority || 'Low';
        let icon, color, text;
        switch (priority) {
            case 'Highest':
                icon = <ChevronsUp size={14} className="text-red-900" />;
                color = 'bg-red-200 text-red-900 border-red-300';
                text = 'H+';
                break;
            case 'High':
                icon = <ChevronUp size={14} className="text-orange-900" />;
                color = 'bg-orange-200 text-orange-900 border-orange-300';
                text = 'Hi';
                break;
            case 'Medium':
                icon = <Minus size={14} className="text-yellow-900" />;
                color = 'bg-yellow-200 text-yellow-900 border-yellow-300';
                text = 'Med';
                break;
            default: // Low
                icon = <ChevronDown size={14} className="text-green-900" />;
                color = 'bg-green-200 text-green-900 border-green-300';
                text = 'Low';
                break;
        }
        return <span title={priority} className={`${baseClasses} ${color}`}>{icon}{text}</span>;
    }

    if (type === 'timeliness') {
        const dueDate = parseDate(task.dueDate);

        if (!dueDate) {
            return <span title="No Due Date" className={`${baseClasses} bg-gray-200 text-gray-800 border-gray-300`}><AlertTriangle size={14} /> No Due</span>;
        }

        const resolutionDate = parseDate(task.resolutiondate);
        let isOverdue;

        if (resolutionDate) {
            isOverdue = resolutionDate > dueDate;
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0); 
            isOverdue = today > dueDate;
        }
        
        if (isOverdue) {
            return <span title="Overdue" className={`${baseClasses} bg-red-500 text-white border-red-600`}><Flame size={14} /> Overdue</span>;
        } else {
            return <span title="On Time" className={`${baseClasses} bg-green-200 text-green-900 border-green-300`}><CheckCircle2 size={14} /> On Time</span>;
        }
    }

    if (type === 'status') {
        return <span className={`${baseClasses} ${getStatusColor(task.status)}`}>{task.status}</span>;
    }

    return null;
};

export default Badge;
