import React, { useMemo, useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Calendar } from 'lucide-react';

// Custom hook to detect clicks outside a component
const useOutsideClick = (ref, callback) => {
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                callback();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [ref, callback]);
};

// Reusable MultiSelect Dropdown Component
const MultiSelectDropdown = ({ options, selected, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    useOutsideClick(dropdownRef, () => setIsOpen(false));

    const handleSelect = (option) => {
        const newSelected = selected.includes(option)
            ? selected.filter(item => item !== option)
            : [...selected, option];
        onChange(newSelected);
    };

    const displayLabel = selected.length > 0 ? `${selected.length} selected` : placeholder;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                className="w-full bg-white border border-gray-300 rounded-lg p-2 flex justify-between items-center text-left"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate">{displayLabel}</span>
                <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {options.map(option => (
                        <label key={option} className="flex items-center p-2 hover:bg-gray-100 cursor-pointer">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                checked={selected.includes(option)}
                                onChange={() => handleSelect(option)}
                            />
                            <span className="ml-3 text-sm text-gray-700">{option}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

// Helper to format date for input[type=date]
const formatDateForInput = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
};

const FilterModal = ({ isOpen, onClose, tasks, filters, setFilters, dateRange, setDateRange }) => {
    
    const { allStatuses, allPriorities, allDepartments, allBiCategories } = useMemo(() => {
        const statuses = new Set();
        const priorities = new Set();
        const departments = new Set();
        const biCategories = new Set();
        tasks.forEach(task => {
            if (task.status) statuses.add(task.status);
            if (task.priority) priorities.add(task.priority);
            if (task.department) departments.add(task.department);
            if (task.biCategory) biCategories.add(task.biCategory);
        });
        return {
            allStatuses: [...statuses].sort(),
            allPriorities: ['Highest', 'High', 'Medium', 'Low'],
            allDepartments: [...departments].sort(),
            allBiCategories: [...biCategories].sort(),
        };
    }, [tasks]);
    
    const handleClearFilters = () => {
        setFilters({
            status: [],
            priority: [],
            department: [],
            biCategory: [],
        });
        setDateRange({ start: null, end: null });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-semibold">Filters</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Date Range Filters */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Created After</label>
                            <input 
                                type="date" 
                                className="w-full p-2 border rounded-lg border-gray-300"
                                value={formatDateForInput(dateRange.start)}
                                onChange={e => setDateRange(prev => ({...prev, start: e.target.value ? new Date(e.target.value) : null}))}
                            />
                        </div>
                         <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Created Before</label>
                            <input 
                                type="date" 
                                className="w-full p-2 border rounded-lg border-gray-300"
                                value={formatDateForInput(dateRange.end)}
                                onChange={e => setDateRange(prev => ({...prev, end: e.target.value ? new Date(e.target.value) : null}))}
                            />
                        </div>
                        {/* Multi-select Filters */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                            <MultiSelectDropdown
                                options={allStatuses}
                                selected={filters.status}
                                onChange={(selected) => setFilters(prev => ({ ...prev, status: selected }))}
                                placeholder="Select status"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Priority</label>
                            <MultiSelectDropdown
                                options={allPriorities}
                                selected={filters.priority}
                                onChange={(selected) => setFilters(prev => ({ ...prev, priority: selected }))}
                                placeholder="Select priority"
                            />
                        </div>
                         <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Department</label>
                            <MultiSelectDropdown
                                options={allDepartments}
                                selected={filters.department}
                                onChange={(selected) => setFilters(prev => ({ ...prev, department: selected }))}
                                placeholder="Select department"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">BI Category</label>
                            <MultiSelectDropdown
                                options={allBiCategories}
                                selected={filters.biCategory}
                                onChange={(selected) => setFilters(prev => ({ ...prev, biCategory: selected }))}
                                placeholder="Select BI category"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center p-4 border-t bg-gray-50">
                    <button 
                        onClick={handleClearFilters}
                        className="text-sm text-gray-600 hover:text-gray-900"
                    >
                        Clear All
                    </button>
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterModal;
