import React, { useState, useRef } from 'react';
import { Search, SlidersHorizontal, RefreshCw, Radio, Menu } from 'lucide-react';
import FilterPopover from './FilterPopover';
import { useOutsideClick } from '../hooks/useOutsideClick';

const Header = ({
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    dateRange,
    setDateRange,
    filterOptions,
    isConnected,
    isOfficeHours,
    lastRefreshTime,
    onRefresh,
    onToggleSidebar
}) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const headerRef = useRef(null);

    useOutsideClick(headerRef, () => {
        if (isFilterOpen) setIsFilterOpen(false);
        if (isStatusOpen) setIsStatusOpen(false);
    });

    let statusText = 'Disconnected';
    let statusColorClass = 'bg-red-500';
    let statusTextColorClass = 'text-red-600';
    let canOpenStatus = false;

    if (isConnected) {
        if (isOfficeHours) {
            statusText = 'Connected';
            statusColorClass = 'bg-green-500';
            statusTextColorClass = 'text-green-600';
            canOpenStatus = true;
        } else {
            statusText = 'Offline';
            statusColorClass = 'bg-gray-400';
            statusTextColorClass = 'text-gray-500';
            canOpenStatus = false;
        }
    }

    return (
        <header className="flex-shrink-0 bg-white border-b border-gray-200 p-4" ref={headerRef}>
            <div className="flex items-center justify-between">
                {/* Search Bar & Filter Section */}
                <div className="relative flex-1 max-w-xl">
                    <div className="relative flex items-center border border-gray-300 rounded-lg shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by ID or title..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-12 py-2 border-none rounded-lg bg-transparent focus:outline-none focus:ring-0 sm:text-sm"
                        />
                        <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                             <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none"
                                title="Show search options"
                            >
                                <SlidersHorizontal className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                     {isFilterOpen && (
                        <FilterPopover
                            filterOptions={filterOptions}
                            filters={filters}
                            setFilters={setFilters}
                            dateRange={dateRange}
                            setDateRange={setDateRange}
                            onClose={() => setIsFilterOpen(false)}
                        />
                    )}
                </div>

                {/* Connection Status & Refresh Section */}
                <div className="relative ml-4">
                     <div 
                        className={`flex items-center gap-2 text-sm ${canOpenStatus ? 'cursor-pointer' : 'cursor-default'} ${statusTextColorClass}`}
                        onClick={() => canOpenStatus && setIsStatusOpen(!isStatusOpen)}
                    >
                        <span className={`w-2.5 h-2.5 rounded-full ${statusColorClass}`}></span>
                        {statusText}
                        
                        {isConnected && isOfficeHours && (
                            <span className="ml-1 inline-flex items-center text-xs font-bold text-white bg-green-500 rounded-full px-2 py-0.5">
                                <Radio size={12} className="mr-1 animate-pulse" />
                                LIVE
                            </span>
                        )}
                    </div>
                    
                    {canOpenStatus && isStatusOpen && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-40">
                            <div className="p-3 border-b">
                                <p className="text-xs text-gray-500">Last refresh:</p>
                                <p className="text-sm font-medium">{lastRefreshTime ? lastRefreshTime.toLocaleTimeString() : 'N/A'}</p>
                            </div>
                            <div className="p-2">
                                <button 
                                    onClick={() => { onRefresh(); setIsStatusOpen(false); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
                                >
                                    <RefreshCw size={14} />
                                    Refresh now
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;