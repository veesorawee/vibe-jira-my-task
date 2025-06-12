// src/hooks/useJira.js
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

    // --- LOGIC UPDATED ---
    // เพิ่ม options object เพื่อให้สามารถเลือกรีเฟรชแบบ background ได้
    const loadJiraData = useCallback(async (options = {}) => {
        const { isBackground = false } = options;

        if (!jiraConfig.projectKey) {
            if (!isBackground) setError('Please set your Jira Project Key in the Config.');
            setAllTasks(mockTasks);
            setIsConnected(false);
            return;
        }
        
        try {
            if (!isBackground) setLoading(true); // จะแสดงหน้า Loading เต็มหน้าจอต่อเมื่อไม่ใช่ background update
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
    }, [jiraConfig.projectKey]);

    const saveJiraConfig = (config) => {
        localStorage.setItem('jira_project', config.projectKey);
        setJiraConfig(prev => ({ ...prev, ...config }));
    };

    // Auto-refresh logic
    useEffect(() => {
        if (!jiraConfig.projectKey) return;
        
        const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
        const intervalId = setInterval(() => {
            const now = new Date();
            const currentHour = now.getHours();
            if (currentHour >= 8 && currentHour < 19) {
                console.log(`Auto-refreshing at ${now.toLocaleTimeString()}`);
                loadJiraData({ isBackground: true }); // Auto-refresh เป็นแบบ background เสมอ
            }
        }, REFRESH_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [loadJiraData, jiraConfig.projectKey]);


    return {
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
    };
};

export default useJira;