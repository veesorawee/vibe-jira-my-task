import React, { useState, useEffect, useMemo, useCallback } from 'react';
import useJira from './hooks/useJira';
import { parseDate } from './utils/helpers';

// Import Components & Views
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import GanttView from './views/GanttView';
import InboxView from './views/InboxView';
import WorkloadView from './views/WorkloadView';
import KanbanView from './views/KanbanView';
import ConfigModal from './components/ConfigModal';
import CreateTaskModal from './components/CreateTaskModal';
import ErrorToast from './components/ErrorToast';

function App() {
    const { 
        allTasks, 
        loading, 
        error, 
        clearError, 
        isConnected, 
        isOfficeHours,
        lastRefreshTime, 
        activeTaskCount,
        jiraConfig, 
        saveJiraConfig, 
        loadJiraData, 
        jiraAPI,
        currentUser, 
        updateTask, 
        updateTaskStatus, 
        updatingTaskId 
    } = useJira();
    
    const [view, setView] = useState('kanban');
    const [showConfig, setShowConfig] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [filters, setFilters] = useState({ 
        status: [], 
        priority: [], 
        department: [], 
        biCategory: [] 
    });
    const [dateRange, setDateRange] = useState({ start: null, end: null });
    const [projectUsers, setProjectUsers] = useState([]);
    const [isCreatingTask, setIsCreatingTask] = useState(false);

    const memoizedLoadJiraData = useCallback(loadJiraData, [jiraConfig.projectKey]);

    useEffect(() => {
        if (jiraConfig.projectKey) {
            memoizedLoadJiraData({ isBackground: false });
        }
    }, [jiraConfig.projectKey, memoizedLoadJiraData]);
    
    useEffect(() => {
        if (isConnected && jiraConfig.projectKey) {
            const fetchUsers = async () => {
                try {
                    const users = await jiraAPI.getAssignableUsers(jiraConfig.projectKey);
                    users.sort((a, b) => a.displayName.localeCompare(b.displayName));
                    setProjectUsers(users);
                } catch (e) { console.error("Failed to fetch assignable users:", e); }
            };
            fetchUsers();
        }
    }, [isConnected, jiraConfig.projectKey, jiraAPI]);

    const handleCreateTask = async (issueData) => {
        setIsCreatingTask(true);
        try {
            await jiraAPI.createIssue(issueData);
            await loadJiraData({ isBackground: true });
            setIsCreateModalOpen(false);
        } catch (err) {
            console.error("Failed to create task:", err);
            throw err;
        } finally {
            setIsCreatingTask(false);
        }
    };
    
    const handleQuickTransition = async (taskId, targetStatus) => {
        if (!isConnected || updatingTaskId) return;
        try {
            const { transitions } = await jiraAPI.getTransitions(taskId);
            const target = transitions.find(t => t.name.toLowerCase().includes(targetStatus));
            if (target) {
                await updateTask(taskId, { statusId: target.id });
            } else {
                alert(`Transition to "${targetStatus}" not available.`);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const filteredTasks = useMemo(() => {
        let tasksToFilter = [...allTasks];
        if (dateRange.start) {
            const start = new Date(dateRange.start);
            start.setHours(0, 0, 0, 0);
            tasksToFilter = tasksToFilter.filter(task => {
                const taskDate = parseDate(task.startTimestamp);
                return taskDate && taskDate >= start;
            });
        }
        if (dateRange.end) {
            const end = new Date(dateRange.end);
            end.setHours(23, 59, 59, 999);
            tasksToFilter = tasksToFilter.filter(task => {
                const taskDate = parseDate(task.startTimestamp);
                return taskDate && taskDate <= end;
            });
        }
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
        if (filters.department.length > 0) {
            tasksToFilter = tasksToFilter.filter(task => filters.department.includes(task.department));
        }
        if (filters.biCategory.length > 0) {
            tasksToFilter = tasksToFilter.filter(task => filters.biCategory.includes(task.biCategory));
        }
        return tasksToFilter;
    }, [allTasks, searchTerm, filters, dateRange]);

    const filterOptions = useMemo(() => {
        const statuses = new Set();
        const departments = new Set();
        const biCategories = new Set();
        (allTasks || []).forEach(task => {
            if (task.status) statuses.add(task.status);
            if (task.department) departments.add(task.department);
            if (task.biCategory) biCategories.add(task.biCategory);
        });
        return {
            allStatuses: [...statuses].sort(),
            allPriorities: ['Highest', 'High', 'Medium', 'Low'],
            allDepartments: [...departments].sort(),
            allBiCategories: [...biCategories].sort(),
        };
    }, [allTasks]);
    
    const staticBiCategoriesForCreate = [
        'Product Spec. Tracking [D]', 'Product Analysis [D]',
        'Product Report/Ad-Hoc [D]', 'Initiation/Idea [D]', 'Others [CO]'
    ];

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
                    searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                    filters={filters} setFilters={setFilters}
                    dateRange={dateRange} setDateRange={setDateRange}
                    filterOptions={filterOptions} isConnected={isConnected}
                    isOfficeHours={isOfficeHours} lastRefreshTime={lastRefreshTime}
                    onRefresh={() => loadJiraData(false)}
                />
                <main className="flex-1 overflow-y-auto">
                    {loading && <div className="w-full h-full flex items-center justify-center"><p className="font-semibold">Loading tasks...</p></div>}
                    
                    {!loading && (
                        <div className="h-full">
                            {view === 'inbox' && <div className="p-1 h-full"><InboxView tasks={filteredTasks} activeTaskCount={activeTaskCount} onUpdateTask={updateTask} onQuickTransition={handleQuickTransition} updatingTaskId={updatingTaskId} jiraAPI={jiraAPI} isConnected={isConnected} isCreatingTask={isCreatingTask} /></div>}
                            {view === 'kanban' && <KanbanView tasks={allTasks} onUpdateStatus={updateTaskStatus} updatingTaskId={updatingTaskId} isCreatingTask={isCreatingTask} />}
                            {view === 'gantt' && <div className="p-1 h-full"><GanttView tasks={filteredTasks} /></div>}
                            {view === 'workload' && <div className="p-1 h-full"><WorkloadView tasks={allTasks} /></div>}
                        </div>
                    )}
                </main>
            </div>
            
            <ConfigModal isOpen={showConfig} onClose={() => setShowConfig(false)} jiraConfig={jiraConfig} saveJiraConfig={saveJiraConfig} isConnected={isConnected} />
            <CreateTaskModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSubmit={handleCreateTask} projectKey={jiraConfig.projectKey} currentUser={currentUser} assignableUsers={projectUsers} departmentOptions={filterOptions.allDepartments} biCategoryOptions={staticBiCategoriesForCreate} />
            
            {error && <ErrorToast message={error} onClose={clearError} />}
        </div>
    );
}

export default App;
