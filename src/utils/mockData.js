// src/utils/mockData.js
export const getDynamicMockTasks = () => {
    const today = new Date();
    const MOCK_TASKS_CONFIG = [
        { 
            id: 'PROJ-1', 
            title: 'My First Mock Task', 
            assignee: 'Current User', 
            status: 'IN PROGRESS', priority: 'Highest', storyPoints: 8, 
            department: 'Engineering', biCategory: 'Feature Request',
            daysFromNow: { start: -2, due: 12 }, 
            description: '<p>This is a mock description for testing.</p><p>Check the dashboard: <a href="https://example.com" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline">redash #59969</a>.</p>',
            comments: [], fullChangeHistory: []
        },
        { id: 'PROJ-2', title: 'Database Migration', assignee: 'Current User', status: 'DONE', priority: 'Medium', storyPoints: 5, department: 'Data', biCategory: 'Maintenance', daysFromNow: { start: -40, due: -15, resolution: -15 }, comments: [], fullChangeHistory: [] },
    ];
    const formatDateString = (date) => date ? date.toISOString().split('T')[0] : null;
    return MOCK_TASKS_CONFIG.map(task => {
        if(task.daysFromNow) {
            const base = task.daysFromNow;
            const setDate = (days) => { const newDate = new Date(); newDate.setDate(today.getDate() + days); return newDate; };
            task.startDate = formatDateString(setDate(base.start));
            task.dueDate = formatDateString(setDate(base.due));
            if (base.resolution) {
                task.resolutiondate = formatDateString(setDate(base.resolution));
            } else if (task.status.toLowerCase().includes('done')) {
              task.resolutiondate = formatDateString(setDate(base.due));
            }
            task.lastUpdated = new Date().toLocaleString();
            delete task.daysFromNow;
        }
        return task;
    });
};