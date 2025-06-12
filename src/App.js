import React, { useState, useEffect, useMemo, useCallback } from 'react';
import useJira from './hooks/useJira';

// Import Components & Views
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import FilterModal from './components/FilterModal';
import GanttView from './views/GanttView';
import InboxView from './views/InboxView';
import WorkloadView from './views/WorkloadView';
import ConfigModal from './components/ConfigModal';
import CreateTaskModal from './components/CreateTaskModal';

function App() {
    const { 
        allTasks, 
        loading, 
        error, 
        isConnected, 
        lastRefreshTime, 
        activeTaskCount,
        jiraConfig, 
        saveJiraConfig, 
        loadJiraData, 
        jiraAPI,
        currentUser 
    } = useJira();
    
    const [view, setView] = useState('inbox');
    const [showConfig, setShowConfig] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ status: [], priority: [] });
    const [updatingTaskId, setUpdatingTaskId] = useState(null);

    const memoizedLoadJiraData = useCallback(loadJiraData, [jiraConfig.projectKey]);
    useEffect(() => {
        if (jiraConfig.projectKey) {
            memoizedLoadJiraData({ isBackground: false });
        }
    }, [jiraConfig.projectKey, memoizedLoadJiraData]);

    const handleCreateTask = async (issueData) => {
        if (!isConnected) throw new Error("Disconnected");
        try {
            await jiraAPI.createIssue(issueData);
            await loadJiraData({ isBackground: true });
            setIsCreateModalOpen(false);
        } catch (err) {
            console.error("Failed to create task:", err);
            throw err;
        }
    };

    const handleUpdateTask = async (taskId, updates) => {
        if (!isConnected || updatingTaskId) return;
        setUpdatingTaskId(taskId);
        try {
            const { statusId, comment, priority } = updates;
            const fieldsPayload = {};
            if (priority) fieldsPayload.priority = { name: priority };
            
            if (Object.keys(fieldsPayload).length > 0) await jiraAPI.updateIssue(taskId, { fields: fieldsPayload });
            if (statusId) await jiraAPI.transitionIssue(taskId, statusId);
            if (comment) await jiraAPI.addComment(taskId, comment);
            
            await loadJiraData({ isBackground: true });
        } catch (err) {
            console.error("Failed to update task:", err);
            throw err;
        } finally {
            setUpdatingTaskId(null);
        }
    };

    const handleQuickTransition = async (taskId, targetStatus) => {
        if (!isConnected || updatingTaskId) return;
        setUpdatingTaskId(taskId);
        try {
            const { transitions } = await jiraAPI.getTransitions(taskId);
            const targetTransition = transitions.find(t => 
                t.name.toLowerCase().includes(targetStatus.toLowerCase())
            );
            if (targetTransition) {
                await jiraAPI.transitionIssue(taskId, targetTransition.id);
                await loadJiraData({ isBackground: true });
            } else {
                alert(`Transition to "${targetStatus}" not available for this task.`);
            }
        } catch (err) {
            console.error(`Failed to transition to ${targetStatus}:`, err);
            alert(`Error: ${err.message}`);
        } finally {
            setUpdatingTaskId(null);
        }
    };

    const filteredTasks = useMemo(() => {
        let tasksToFilter = [...allTasks];
        if (searchTerm) {
            tasksToFilter = tasksToFilter.filter(task => 
                task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                task.id.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (filters.status.length > 0) {
            tasksToFilter = tasksToFilter.filter(task => filters.status.includes(task.status));
        }
        if (filters.priority.length > 0) {
            tasksToFilter = tasksToFilter.filter(task => filters.priority.includes(task.priority));
        }
        return tasksToFilter;
    }, [allTasks, searchTerm, filters]);

    return (
        <div className="flex h-screen bg-gray-100 text-gray-800">
            <Sidebar
                view={view}
                setView={setView}
                activeTaskCount={activeTaskCount}
                onCreateClick={() => setIsCreateModalOpen(true)}
                onConfigClick={() => setShowConfig(true)}
            />
            <div className="flex-1 flex flex-col min-w-0">
                <Header
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    onFilterClick={() => setIsFilterModalOpen(true)}
                    isConnected={isConnected}
                    lastRefreshTime={lastRefreshTime}
                />
                {/* --- LAYOUT FIX: overflow-hidden สร้างขอบเขตความสูงที่ชัดเจนให้ child (View) --- */}
                <main className="flex-1 p-6 overflow-hidden">
                    {loading && <div className="w-full h-full flex items-center justify-center"><p className="font-semibold">Loading tasks...</p></div>}
                    {error && <div className="m-4 p-4 bg-red-100 text-red-700 rounded-lg">⚠️ Error: {error}</div>}
                    
                    {!loading && !error && (
                        <>
                            {view === 'inbox' && 
                                <InboxView 
                                    tasks={filteredTasks}
                                    activeTaskCount={activeTaskCount}
                                    onUpdateTask={handleUpdateTask}
                                    onQuickTransition={handleQuickTransition}
                                    updatingTaskId={updatingTaskId}
                                    jiraAPI={jiraAPI}
                                    isConnected={isConnected}
                                />
                            }
                            {view === 'gantt' && <GanttView tasks={filteredTasks} />}
                            {view === 'workload' && <WorkloadView tasks={allTasks} />}
                        </>
                    )}
                </main>
            </div>
            
            <ConfigModal isOpen={showConfig} onClose={() => setShowConfig(false)} jiraConfig={jiraConfig} saveJiraConfig={saveJiraConfig} isConnected={isConnected} />
            <CreateTaskModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSubmit={handleCreateTask} projectKey={jiraConfig.projectKey} currentUser={currentUser} />
            <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} tasks={allTasks} filters={filters} setFilters={setFilters} />
        </div>
    );
}

export default App;