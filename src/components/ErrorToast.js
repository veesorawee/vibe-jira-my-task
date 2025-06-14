// src/components/ErrorToast.js
import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const ErrorToast = ({ message, onClose }) => {
    // ตั้งเวลาให้ Toast หายไปเองใน 7 วินาที
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 7000);

        return () => {
            clearTimeout(timer);
        };
    }, [onClose]);

    return (
        <div 
            className="fixed bottom-5 right-5 z-50 flex items-center max-w-sm p-4 text-white bg-red-600 rounded-lg shadow-lg animate-fade-in-up"
            role="alert"
        >
            <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="ml-3 text-sm font-medium">
                {message}
            </div>
            <button 
                type="button" 
                className="ml-4 -mr-2 -my-2 p-1.5 text-red-200 hover:text-white hover:bg-red-700 rounded-lg inline-flex h-8 w-8" 
                onClick={onClose}
                aria-label="Close"
            >
                <span className="sr-only">Close</span>
                <X className="w-5 h-5" />
            </button>
        </div>
    );
};

export default ErrorToast;