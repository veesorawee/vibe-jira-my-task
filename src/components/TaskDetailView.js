import React, { useState, useEffect, useMemo } from 'react';
import { User, History, MessageSquare, Palette, Loader2 } from 'lucide-react';
import Badge from './Badge';
import { parseDate } from '../utils/helpers';

const TaskDetailView = ({ task, onUpdateTask, jiraAPI, isConnected, updatingTaskId }) => {
    const [activeTab, setActiveTab] = useState('details');
    const [transitions, setTransitions] = useState([]);
    const [selectedTransitionId, setSelectedTransitionId] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [newPriority, setNewPriority] = useState(null);
    const [error, setError] = useState('');

    const priorities = ['Highest', 'High', 'Medium', 'Low'];
    const isCurrentlyUpdating = task?.id === updatingTaskId;

    useEffect(() => {
        if (task && !isCurrentlyUpdating) {
            // Reset form only if not updating or if the tab is switched back
            if (activeTab === 'actions') {
                setActiveTab('details');
            }
            setSelectedTransitionId(null);
            setNewComment('');
            setError('');
            setNewPriority(null);
        }
    }, [task, isCurrentlyUpdating]);

    useEffect(() => {
        if (activeTab === 'actions' && task && jiraAPI && isConnected) {
            const fetchTransitions = async () => {
                try {
                    const response = await jiraAPI.getTransitions(task.id);
                    setTransitions(response.transitions || []);
                } catch (err) {
                    console.error("Failed to fetch transitions:", err);
                    setError('Could not load actions.');
                }
            };
            fetchTransitions();
        }
    }, [activeTab, task, jiraAPI, isConnected]);

    const handleUpdate = async () => {
        if (!task || !onUpdateTask) return;
        setError('');
        try {
            await onUpdateTask(task.id, {
                statusId: selectedTransitionId,
                comment: newComment.trim() || null,
                priority: newPriority,
            });
        } catch (err) {
            setError(`Update failed: ${err.message}`);
        }
    };

    const activityFeed = useMemo(() => {
        if (!task) return [];
        const historyItems = (task.fullChangeHistory || []).map(item => ({ type: 'history', created: new Date(item.created), author: item.author, data: item.changes }));
        const commentItems = (task.comments || []).map(item => ({ type: 'comment', created: new Date(item.createdTimestamp), displayDate: item.created, author: item.author, data: item.body }));
        return [...historyItems, ...commentItems].sort((a, b) => b.created.getTime() - a.created.getTime());
    }, [task]);

    const canUpdate = !isCurrentlyUpdating && isConnected && (!!selectedTransitionId || newComment.trim() !== '' || !!newPriority);

    if (!task) return null;

    const renderDetails = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Column 1: Task Information */}
            <div className="space-y-6">
                <div className="grid grid-cols-2 text-sm">
                    <div><span className="text-gray-500 block">Assignee</span><p className="font-medium mt-1">{task.assignee}</p></div>
                    <div><span className="text-gray-500 block">Story Points</span><p className="font-medium mt-1">{task.storyPoints || 0}</p></div>
                </div>
                <div className="grid grid-cols-2 text-sm">
                    <div><span className="text-gray-500 block">Department</span><p className="font-medium mt-1">{task.department}</p></div>
                    <div><span className="text-gray-500 block">BI Category</span><p className="font-medium mt-1">{task.biCategory}</p></div>
                </div>
                <div className="grid grid-cols-3 text-sm">
                    <div><span className="text-gray-500 block">Start Date</span><p className="font-medium mt-1">{task.startDate || '–'}</p></div>
                    <div>
                        <span className="text-gray-500 block">Due Date</span>
                        <p className={`font-medium mt-1 ${task.dueDate && !task.resolutiondate && (new Date() > parseDate(task.dueDate)) ? 'text-red-600' : ''}`}>{task.dueDate || '–'}</p>
                    </div>
                    <div><span className="text-gray-500 block">Resolved</span><p className="font-medium mt-1">{task.resolutiondate || '–'}</p></div>
                </div>

                {task.labels && task.labels.length > 0 &&
                    <div>
                        <span className="text-gray-500 text-sm font-semibold">Labels</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {task.labels.map(label => (<span key={label} className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-800">{label}</span>))}
                        </div>
                    </div>
                }

                {(task.slackLink || (task.figmaLinks && task.figmaLinks.length > 0)) && (
                    <div>
                        <span className="text-gray-500 text-sm font-semibold">Related Links</span>
                        <div className="mt-2 flex flex-row flex-wrap gap-2">
                            {task.slackLink && (<a href={task.slackLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 text-sm font-medium"><MessageSquare size={16} className="mr-2"/> Open in Slack</a>)}
                            {task.figmaLinks && task.figmaLinks.map((link, index) => (<a key={index} href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1.5 bg-pink-100 text-pink-800 rounded-lg hover:bg-pink-200 text-sm font-medium"><Palette size={16} className="mr-2" /> {link.text || `Figma File #${index + 1}`}</a>))}
                        </div>
                    </div>
                )}

                 <div>
                    <span className="text-gray-500 text-sm font-semibold">Description</span>
                    <div className="mt-2 text-gray-800 bg-gray-50 p-4 rounded-md border prose prose-sm max-w-none break-words" dangerouslySetInnerHTML={{__html: task.description || '<p>No description available.</p>'}} />
                </div>
            </div>

            {/* Column 2: Activity Feed */}
            <div className="min-w-0">
                <h5 className="text-gray-500 text-sm font-semibold flex items-center mb-3"><History className="w-4 h-4 mr-2" />Activity Feed</h5>
                <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2 border-l pl-4">
                    {activityFeed.length > 0 ? activityFeed.map((item, index) => (
                        <div key={index} className="flex space-x-3 text-sm">
                            <div className="flex-shrink-0 pt-1"><User className="w-5 h-5 text-gray-400" /></div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800 break-words">{item.author} <span className="text-xs text-gray-500 ml-2 font-normal">{new Date(item.created).toLocaleString('en-GB')}</span></p>
                                {item.type === 'history' ? (
                                    <div className="mt-1 bg-gray-100 border rounded-lg p-2 space-y-1 break-words">
                                        {item.data.map((change, idx) => (
                                            <div key={idx} className="text-xs text-gray-600">
                                                <span className="font-semibold capitalize">{change.field}: </span>
                                                {change.from && <span className="line-through text-gray-400 mr-1">{change.from}</span>}
                                                <span className="mx-1">→</span>
                                                <span className="font-semibold text-gray-800">{change.to}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="mt-1 text-gray-800 bg-blue-50 border-l-2 border-blue-200 p-3 rounded-r-lg prose prose-sm max-w-none break-words" dangerouslySetInnerHTML={{__html: item.data}} />
                                )}
                            </div>
                        </div>
                    )) : <p className="text-sm text-gray-500 italic">No activity yet.</p>}
                </div>
            </div>
        </div>
    );

    const renderActions = () => (
        <div className="space-y-6 max-w-lg mx-auto">
            <div>
                <label className="block text-sm font-medium text-gray-700">Change Status</label>
                <div className="mt-2 flex flex-wrap gap-2">
                    {transitions.map(trans => (
                        <button key={trans.id}
                            onClick={() => setSelectedTransitionId(prevId => prevId === trans.id ? null : trans.id)}
                            className={`px-3 py-1 text-sm rounded-full border-2 ${selectedTransitionId === trans.id ? 'border-indigo-500 bg-indigo-100' : 'border-gray-200 bg-gray-100 hover:bg-gray-200'}`}
                        >
                            {trans.name}
                        </button>
                    ))}
                    {(transitions.length === 0 && !error) && <p className="text-sm text-gray-500 mt-2">No available transitions.</p>}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Change Priority (current: {task.priority})</label>
                <div className="mt-2 flex flex-wrap gap-2">
                    {priorities.map(p => (
                        <button key={p}
                            onClick={() => setNewPriority(prev => prev === p ? null : p)}
                            disabled={p === task.priority} className={`px-3 py-1 text-sm rounded-full border-2 ${newPriority === p ? 'border-indigo-500 bg-indigo-100' : 'border-gray-200 bg-gray-100 hover:bg-gray-200 disabled:opacity-50'}`}>
                            {p}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700">Add Comment</label>
                <textarea id="comment" value={newComment} onChange={e => setNewComment(e.target.value)} rows="4" className="mt-1 block w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"></textarea>
            </div>
            
            {error && <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">{error}</div>}

            <div className="mt-6 border-t pt-6">
                <button
                    onClick={handleUpdate}
                    disabled={!canUpdate}
                    className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isCurrentlyUpdating ? (
                        <><Loader2 className="animate-spin w-5 h-5 mr-3" />Updating...</>
                    ) : 'Update Task'}
                </button>
            </div>
        </div>
    );

    return (
        <div className={`p-6 space-y-6 transition-opacity ${isCurrentlyUpdating ? 'opacity-60' : ''}`}>
            <div className="flex justify-between items-start">
                <div>
                    <a href={`https://linemanwongnai.atlassian.net/browse/${task.id}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-indigo-600 font-mono">{task.id}</a>
                    <h2 className="text-2xl font-bold text-gray-900 mt-1">{task.title}</h2>
                </div>
                <div className="flex items-center space-x-1 bg-gray-200 p-1 rounded-full flex-shrink-0">
                    <button onClick={() => setActiveTab('details')} className={`px-3 py-1 rounded-full text-sm font-medium ${activeTab === 'details' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>Details</button>
                    <button onClick={() => setActiveTab('actions')} className={`px-3 py-1 rounded-full text-sm font-medium ${activeTab === 'actions' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>Actions</button>
                </div>
            </div>

            <div className="flex items-center flex-wrap gap-2">
                <Badge type="priority" task={task} />
                <Badge type="timeliness" task={task} />
                <Badge type="status" task={task} />
            </div>

            <div className="mt-4">
                {activeTab === 'details' ? renderDetails() : renderActions()}
            </div>
        </div>
    );
};

export default TaskDetailView;