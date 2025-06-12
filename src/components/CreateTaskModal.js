// src/components/CreateTaskModal.js
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const CreateTaskModal = ({ 
    isOpen, 
    onClose, 
    onSubmit, 
    projectKey, 
    currentUser
}) => {
    const [summary, setSummary] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const priorities = ['Highest', 'High', 'Medium', 'Low'];

    useEffect(() => {
        if (isOpen) {
            // Reset form when modal opens
            setSummary(''); 
            setDescription(''); 
            setPriority('Medium');
            setErrors({}); 
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const validateForm = () => {
        const newErrors = {};
        if (!summary) newErrors.summary = "Summary is required.";
        if (!projectKey) newErrors.submit = "Project Key is not configured.";
        if (!currentUser) newErrors.submit = "Cannot create task: current user not identified.";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        setErrors({});

        const issueData = {
            fields: {
                project: { key: projectKey },
                summary: summary,
                description: { 
                    type: "doc", 
                    version: 1, 
                    content: [{ 
                        type: "paragraph", 
                        content: [{ type: "text", text: description || ' ' }] 
                    }] 
                },
                issuetype: { name: "Task" },
                priority: { name: priority },
                assignee: { accountId: currentUser.accountId },
                reporter: { accountId: currentUser.accountId }
            }
        };

        try {
            await onSubmit(issueData);
            onClose(); // Close on success
        } catch (err) {
            setErrors({ submit: err.message || 'An unknown error occurred.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 transition-opacity ease-in-out duration-200 bg-black bg-opacity-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col transition-all ease-in-out duration-300" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold">Create New Task in "{projectKey}"</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">Summary (Title) *</label>
                        <input id="summary" type="text" value={summary} onChange={(e) => setSummary(e.target.value)} className={`w-full p-2 border rounded-lg ${errors.summary ? 'border-red-500' : 'border-gray-300'}`} />
                        {errors.summary && <p className="text-red-500 text-xs mt-1">{errors.summary}</p>}
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea id="description" rows="4" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded-lg border-gray-300" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
                        <div className="flex flex-wrap gap-2">
                            {priorities.map(p => (
                                <button type="button" key={p} onClick={() => setPriority(p)} className={`px-3 py-1 text-sm rounded-full border-2 ${priority === p ? 'border-indigo-500 bg-indigo-100' : 'bg-gray-100 hover:bg-gray-200'}`}>
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    {errors.submit && (
                        <div className="col-span-2 bg-red-100 text-red-700 p-3 rounded-md text-sm">
                            <strong>Error:</strong> {errors.submit}
                        </div>
                    )}
                </form>
                <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button type="submit" onClick={handleSubmit} disabled={isSubmitting} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-wait">
                        {isSubmitting ? 'Creating...' : 'Create Task'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateTaskModal;