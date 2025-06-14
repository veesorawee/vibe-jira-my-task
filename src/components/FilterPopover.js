import React, { useMemo, useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useOutsideClick } from '../hooks/useOutsideClick';

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
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                className="w-full bg-white border border-gray-300 rounded-lg p-2 flex justify-between items-center text-left"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate">{displayLabel}</span>
                <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {(options || []).map(option => (
                        <label key={option} className="flex items-center p-2 hover:bg-gray-100 cursor-pointer">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                checked={(selected || []).includes(option)}
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
    return date instanceof Date ? date.toISOString().split('T')[0] : '';
};

const FilterPopover = ({ 
    onClose, 
    filterOptions,
    filters = { status: [], priority: [], department: [], biCategory: [] }, 
    setFilters = () => {},
    dateRange = { start: null, end: null }, 
    setDateRange = () => {}
}) => {
    
    const { allStatuses, allPriorities, allDepartments, allBiCategories } = filterOptions || {};
    
    const handleClearFilters = () => {
        setFilters({
            status: [], priority: [], department: [], biCategory: [],
        });
        setDateRange({ start: null, end: null });
    };

    return (
        <div className="absolute top-full right-0 mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 z-30">
            <div className="p-4 space-y-4">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700 w-24">Created After</label>
                    <input 
                        type="date" 
                        className="w-full p-2 border rounded-lg border-gray-300"
                        value={formatDateForInput(dateRange.start)}
                        onChange={e => setDateRange(prev => ({...prev, start: e.target.value ? new Date(e.target.value) : null}))}
                    />
                </div>
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700 w-24">Created Before</label>
                    <input 
                        type="date" 
                        className="w-full p-2 border rounded-lg border-gray-300"
                        value={formatDateForInput(dateRange.end)}
                        onChange={e => setDateRange(prev => ({...prev, end: e.target.value ? new Date(e.target.value) : null}))}
                    />
                </div>
                <div className="flex items-center gap-4">
                     <label className="text-sm font-medium text-gray-700 w-24">Status</label>
                     <MultiSelectDropdown
                        options={allStatuses}
                        selected={filters.status}
                        onChange={(selected) => setFilters(prev => ({ ...prev, status: selected }))}
                        placeholder="Any Status"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700 w-24">Priority</label>
                     <MultiSelectDropdown
                        options={allPriorities}
                        selected={filters.priority}
                        onChange={(selected) => setFilters(prev => ({ ...prev, priority: selected }))}
                        placeholder="Any Priority"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700 w-24">Department</label>
                    <MultiSelectDropdown
                        options={allDepartments}
                        selected={filters.department}
                        onChange={(selected) => setFilters(prev => ({ ...prev, department: selected }))}
                        placeholder="Any Department"
                    />
                </div>
                <div className="flex items-center gap-4">
                     <label className="text-sm font-medium text-gray-700 w-24">BI Category</label>
                    <MultiSelectDropdown
                        options={allBiCategories}
                        selected={filters.biCategory}
                        onChange={(selected) => setFilters(prev => ({ ...prev, biCategory: selected }))}
                        placeholder="Any Category"
                    />
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
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                >
                    Apply
                </button>
            </div>
        </div>
    );
};

export default FilterPopover;
