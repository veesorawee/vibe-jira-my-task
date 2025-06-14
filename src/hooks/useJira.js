import { useState, useEffect, useMemo, useCallback } from 'react';
import JiraAPI from '../services/JiraAPI';
import { getDynamicMockTasks } from '../utils/mockData';

const useJira = () => {
    const mockTasks = useMemo(() => getDynamicMockTasks(), []);
    const [allTasks, setAllTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastRefreshTime, setLastRefreshTime] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isOfficeHours, setIsOfficeHours] = useState(false);
    const [updatingTaskId, setUpdatingTaskId] = useState(null);

    const clearError = useCallback(() => setError(null), []);

    const [jiraConfig, setJiraConfig] = useState({
        projectKey: localStorage.getItem('jira_project') || '',
    });

    const jiraAPI = useMemo(() => new JiraAPI(), []);
    
    const activeTaskCount = useMemo(() => {
        return allTasks.filter(task => {
            const status = (task.status || '').toLowerCase();
            return !status.includes('done') && !status.includes('cancelled');
        }).length;
    }, [allTasks]);

    useEffect(() => {
        jiraAPI.projectKey = jiraConfig.projectKey;
    }, [jiraConfig.projectKey, jiraAPI]);

    const loadJiraData = useCallback(async (options = {}) => {
        const { isBackground = false } = options;
        if (!jiraConfig.projectKey) {
            if (!isBackground) setError('Please set your Jira Project Key in the Config.');
            setAllTasks(mockTasks);
            setIsConnected(false);
            return;
        }
        try {
            if (!isBackground) setLoading(true);
            setError(null);
            const [issues, me] = await Promise.all([
                jiraAPI.getProjectIssues(),
                jiraAPI.getMe()
            ]);
            setAllTasks(issues);
            setCurrentUser(me);
            setIsConnected(true);
            setLastRefreshTime(new Date());
        } catch (err) {
            setError(err.message); 
            setIsConnected(false); 
            setAllTasks(mockTasks);
            setCurrentUser(null);
        } finally {
            if (!isBackground) setLoading(false);
        }
    }, [jiraConfig.projectKey, jiraAPI, mockTasks]);

    const saveJiraConfig = (config) => {
        localStorage.setItem('jira_project', config.projectKey);
        setJiraConfig(prev => ({ ...prev, ...config }));
    };

    const updateTask = async (taskId, updates) => {
        if (!isConnected || updatingTaskId) return;
        setUpdatingTaskId(taskId);
        try {
            const { statusId, comment, priority } = updates;
            if (priority) {
                await jiraAPI.updateIssue(taskId, { fields: { priority: { name: priority } } });
            }
            if (statusId) {
                await jiraAPI.transitionIssue(taskId, statusId);
            }
            if (comment) {
                await jiraAPI.addComment(taskId, comment);
            }
            await loadJiraData({ isBackground: true });
        } catch (err) {
            console.error("Failed to update task:", err);
            setError(err.message);
            await loadJiraData({ isBackground: true });
        } finally {
            setUpdatingTaskId(null);
        }
    };
    
    const updateTaskStatus = async (taskId, newColumnName) => {
        if (!isConnected || updatingTaskId) return;
        
        const targetStatusMap = {
            'Backlog': '[BI] ON HOLD',
            'To Do': '[BI] OPEN',
            'In Progress': '[BI] In Progress',
            'Done': '[BI] DONE'
        };
        const newStatusName = targetStatusMap[newColumnName];
        if (!newStatusName) return;

        setUpdatingTaskId(taskId);
        try {
            const { transitions } = await jiraAPI.getTransitions(taskId);
            const targetTransition = transitions.find(t => t.name.toLowerCase() === newStatusName.toLowerCase());

            if (targetTransition) {
                await jiraAPI.transitionIssue(taskId, targetTransition.id);
                // After success, reload data to get the latest state from Jira
                await loadJiraData({ isBackground: true }); 
            } else {
                const available = transitions.map(t => t.name).join(', ') || 'none';
                console.warn(`Transition to "${newStatusName}" not available for task ${taskId}. Available transitions: ${available}`);
                setError(`Transition to "${newStatusName}" is not available for this task.`);
                // If transition fails, reload data to revert the UI state
                await loadJiraData({ isBackground: true });
            }
        } catch (err) {
            console.error("Failed to update task status:", err);
            setError(err.message);
            await loadJiraData({ isBackground: true });
        } finally {
            setUpdatingTaskId(null);
        }
    };

    useEffect(() => {
        const checkOfficeHours = () => {
            const now = new Date();
            const currentDay = now.getDay();
            const currentHour = now.getHours();
            const isWeekday = currentDay > 0 && currentDay < 6;
            const isWithinTime = currentHour >= 8 && currentHour < 19;
            setIsOfficeHours(isWeekday && isWithinTime);
        };
        checkOfficeHours();
        const intervalId = setInterval(checkOfficeHours, 60 * 1000);
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (!jiraConfig.projectKey || !isConnected) return;
        const REFRESH_INTERVAL_MS = 10 * 60 * 1000;
        const intervalId = setInterval(() => {
            if (isOfficeHours) {
                loadJiraData({ isBackground: true });
            }
        }, REFRESH_INTERVAL_MS);
        return () => clearInterval(intervalId);
    }, [loadJiraData, jiraConfig.projectKey, isConnected, isOfficeHours]);

    return {
        allTasks, loading, error, clearError,
        isConnected, isOfficeHours, lastRefreshTime, activeTaskCount,
        jiraConfig, saveJiraConfig,
        loadJiraData, jiraAPI, currentUser,
        updateTask,
        updateTaskStatus,
        updatingTaskId,
    };
};

export default useJira;
