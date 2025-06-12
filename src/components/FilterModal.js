// src/components/FilterModal.js
import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';

const MultiSelectDropdown = ({ options, selected, onChange, placeholder = "Select..." }) => {
    const [isOpen, setIsOpen] = useState(false);

    const isOptionChecked = (option) => selected.length === 0 || selected.includes(option);

    const handleSelect = (option) => {
        let newSelected;
        const isCurrentlyAllSelected = selected.length === 0;
        
        if (isCurrentlyAllSelected) {
            newSelected = options.filter(item => item !== option);
        } else {
            if (selected.includes(option)) {
                newSelected = selected.filter(item => item !== option);
            } else {
                newSelected = [...selected, option];
            }
        }
        onChange(newSelected.length === options.length ? [] : newSelected);
    };
    
    const getButtonLabel = () => {
        if (!selected || selected.length === 0 || selected.length === options.length) {
            return `All ${placeholder}`;
        }
        if (selected.length === 1) return selected[0];
        return `${selected.length} selected`;
    };

    return (
        <div className="relative">
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full p-2 border border-gray-300 rounded-lg bg-white text-left">
                {getButtonLabel()}
            </button>
            {isOpen && (
                <div className="absolute z-10 w-full bg-white border rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                    {options.map(option => (
                        <label key={option} className="flex items-center p-2 hover:bg-gray-100 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={isOptionChecked(option)}
                                onChange={() => handleSelect(option)}
                                className="mr-3 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500" 
                            />
                            {option}
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

const FilterModal = ({ isOpen, onClose, tasks, filters, setFilters }) => {
    const [localFilters, setLocalFilters] = useState(filters);

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters, isOpen]);

    const { allStatuses, allPriorities } = useMemo(() => {
        const statuses = new Set();
        const priorities = new Set();
        tasks.forEach(task => {
            if(task.status) statuses.add(task.status);
            if(task.priority) priorities.add(task.priority);
        });
        return { 
            allStatuses: [...statuses].sort(),
            allPriorities: [...priorities].sort((a,b) => {
                const order = { 'Highest': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
                return (order[a] ?? 99) - (order[b] ?? 99);
            }),
        };
    }, [tasks]);

    const handleApply = () => {
        setFilters(localFilters);
        onClose();
    };
    
    const handleClear = () => {
        const clearedFilters = { status: [], priority: [] };
        setLocalFilters(clearedFilters);
        setFilters(clearedFilters);
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold">Filter Tasks</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <MultiSelectDropdown
                            options={allStatuses}
                            selected={localFilters.status || []}
                            onChange={(selected) => setLocalFilters(f => ({ ...f, status: selected }))}
                            placeholder="Statuses"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                         <MultiSelectDropdown
                            options={allPriorities}
                            selected={localFilters.priority || []}
                            onChange={(selected) => setLocalFilters(f => ({ ...f, priority: selected }))}
                            placeholder="Priorities"
                        />
                    </div>
                </div>
                <div className="flex justify-between p-4 border-t bg-gray-50">
                     <button onClick={handleClear} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Clear Filters</button>
                    <button onClick={handleApply} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Apply Filters</button>
                </div>
            </div>
        </div>
    );
};

export default FilterModal;