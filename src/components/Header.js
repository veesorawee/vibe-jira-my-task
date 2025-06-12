// src/components/Header.js
import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

const Header = ({ searchTerm, setSearchTerm, onFilterClick, isConnected, lastRefreshTime }) => {
    return (
        <header className="flex justify-between items-center p-4 bg-white border-b">
            <div className="flex-1 max-w-lg">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by ID or title..."
                        className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                     <button onClick={onFilterClick} className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md">
                        <SlidersHorizontal size={20} />
                    </button>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <div className={`flex items-center gap-2 text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </div>
                    {lastRefreshTime && <p className="text-xs text-gray-500 mt-1">Last refresh: {lastRefreshTime.toLocaleTimeString()}</p>}
                </div>
            </div>
        </header>
    );
};

export default Header;