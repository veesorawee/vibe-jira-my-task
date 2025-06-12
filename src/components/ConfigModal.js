import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const ConfigModal = ({ isOpen, onClose, jiraConfig, saveJiraConfig, isConnected }) => {
    const [configForm, setConfigForm] = useState(jiraConfig);

    useEffect(() => {
        setConfigForm(jiraConfig);
    }, [jiraConfig]);

    if (!isOpen) return null;

    const handleSave = () => {
        saveJiraConfig(configForm);
        onClose();
    };
    
    const extractFromUrl = (url) => {
        if (!url) return;
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            const projectIndex = pathParts.indexOf('projects');
            const projectKey = projectIndex > -1 ? pathParts[projectIndex + 1] : '';
            setConfigForm(prev => ({ ...prev, projectKey: projectKey.toUpperCase() || prev.projectKey }));
        } catch (error) {
            console.error('Invalid URL for parsing project key');
        }
    };

    return (
        <div className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity ease-in-out duration-200 ${isOpen ? 'bg-black bg-opacity-50' : 'bg-opacity-0 pointer-events-none'}`} onClick={onClose}>
            <div 
                className={`bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 transition-all ease-in-out duration-300 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold">Jira Configuration</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className={`p-3 rounded-lg ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                    </div>
                     <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Quick Setup</h4>
                        <p className="text-sm text-blue-800 mb-3">Paste your Jira project URL to auto-fill Project Key:</p>
                        <input type="text" placeholder="https://mycompany.atlassian.net/jira/software/projects/PROJ/boards/1" className="w-full p-2 border rounded text-sm" onBlur={(e) => extractFromUrl(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project Key *</label>
                        <input type="text" placeholder="PROJ" className="w-full p-3 border rounded-lg" value={configForm.projectKey} onChange={(e) => setConfigForm(prev => ({ ...prev, projectKey: e.target.value.toUpperCase() }))} />
                         <p className="text-xs text-gray-500 mt-1">This is the unique identifier for your Jira project (e.g., 'BUSINT').</p>
                    </div>
                </div>
                <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSave} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Save & Close</button>
                </div>
            </div>
        </div>
    );
};

export default ConfigModal;