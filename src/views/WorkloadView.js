import React, { useMemo, useState } from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { parseDate } from '../utils/helpers';
import Badge from '../components/Badge';
import TaskDetailView from '../components/TaskDetailView';
import useJira from '../hooks/useJira';
import { X } from 'lucide-react';

const StatusColumn = ({ title, tasks = [], onTaskClick }) => {
    const getStatusSimpleColor = (status) => {
        const s = status.toLowerCase();
        if (s.includes('done') || s.includes('cancelled')) return 'bg-green-100';
        if (s.includes('progress') || s.includes('review')) return 'bg-blue-100';
        return 'bg-gray-100';
    };

    return (
        <div className="bg-white rounded-lg shadow-md flex flex-col h-96">
            <div className={`p-4 border-b flex-shrink-0 ${getStatusSimpleColor(title)}`}>
                <h3 className="font-semibold text-gray-800">{title} <span className="text-sm font-normal text-gray-500">({tasks.length})</span></h3>
            </div>
            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                {tasks.length === 0 ? (
                    <p className="text-gray-500 text-center pt-10 text-sm">No tasks in this status.</p>
                ) : (
                    tasks.map(task => (
                        <div key={task.id} className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors bg-white" onClick={() => onTaskClick(task)}>
                            <p className="text-sm font-medium text-gray-900 mb-2 truncate" title={task.title}>{task.title}</p>
                            <div className="mt-2 pt-2 border-t border-gray-100">
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <span>{task.id}</span>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <Badge type="timeliness" task={task} />
                                        <Badge type="priority" task={task} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const WorkloadView = ({ tasks }) => {
    const { jiraAPI, isConnected, loadJiraData } = useJira();
    const [selectedTask, setSelectedTask] = useState(null);
    const [workloadView, setWorkloadView] = useState('assignee'); // 'assignee', 'department', 'biCategory'

    // Memo to prepare data for grouping and coloring
    const { uniqueAssignees, allDepartments, allBiCategories, assigneeColors, departmentColors, biCategoryColors } = useMemo(() => {
        const uniqueAssignees = [...new Set(tasks.map(task => task.assignee).filter(Boolean))].sort();
        const allDepartments = [...new Set(tasks.map(t => t.department).filter(Boolean))].sort();
        const allBiCategories = [...new Set(tasks.map(t => t.biCategory).filter(Boolean))].sort();
        
        const colorGen = (keys, colors) => {
            const colorMap = {};
            keys.forEach((key, index) => { colorMap[key] = colors[index % colors.length]; });
            colorMap['N/A'] = '#9ca3af';
            colorMap['Unassigned'] = '#9ca3af';
            return colorMap;
        };

        const baseColors1 = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#84cc16', '#6366f1'];
        const baseColors2 = ['#a855f7', '#14b8a6', '#6366f1', '#eab308', '#0891b2', '#db2777', '#65a30d', '#f472b6'];
        const baseColors3 = [
            '#667eea', '#764ba2', '#43e97b', '#ff9a9e', 
            '#fbc2eb', '#fdbb2d', '#ff6b6b', '#3f5efb'
        ];
        return {
            uniqueAssignees,
            allDepartments,
            allBiCategories,
            assigneeColors: colorGen(uniqueAssignees, baseColors1),
            departmentColors: colorGen(allDepartments, baseColors2),
            biCategoryColors: colorGen(allBiCategories, baseColors3),
        };
    }, [tasks]);

    const dailyWorkloadData = useMemo(() => {
        const dataToProcess = tasks;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        if (dataToProcess.length === 0) return { chartData: [], todayFormatted: todayStr, activeChartKeys: [], chartColors: {} };
        
        const allStartDates = dataToProcess.map(task => parseDate(task.startDate)).filter(Boolean);
        if(allStartDates.length === 0) return { chartData: [], todayFormatted: todayStr, activeChartKeys: [], chartColors: {} };

        const minDate = new Date(Math.min.apply(null, allStartDates));
        const chartStartDate = new Date(minDate);
        const chartEndDate = new Date();
        
        const data = [];
        let keys, colors;

        // Determine which group to use based on the view state
        if (workloadView === 'assignee') {
            keys = uniqueAssignees;
            colors = assigneeColors;
        } else if (workloadView === 'department') {
            keys = allDepartments;
            colors = departmentColors;
        } else { // biCategory
            keys = allBiCategories;
            colors = biCategoryColors;
        }

        for (let d = new Date(chartStartDate); d <= chartEndDate; d.setDate(d.getDate() + 1)) {
            const currentDateIter = new Date(d);
            currentDateIter.setHours(0, 0, 0, 0);
            
            const dayData = { 
                date: currentDateIter.toISOString().split('T')[0], 
                displayDate: currentDateIter.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
            };
            
            // Calculate workload for each key in the selected group
            keys.forEach(key => {
                dayData[key] = dataToProcess.filter(task => {
                    const groupKey = workloadView === 'assignee' ? task.assignee : (workloadView === 'department' ? task.department : task.biCategory);
                    if (groupKey !== key) return false;

                    const taskStartDate = parseDate(task.startDate);
                    if (!taskStartDate || currentDateIter < taskStartDate) return false;
                    
                    const isResolved = task.status.toLowerCase().includes('done') || task.status.toLowerCase().includes('cancelled');
                    if (isResolved) {
                        const taskResolutionDate = parseDate(task.resolutiondate);
                        return taskResolutionDate && currentDateIter < taskResolutionDate;
                    }
                    return true;
                }).length;
            });
            
            data.push(dayData);
        }
        
        const activeKeys = keys.filter(key => data.some(dayData => dayData[key] > 0));
        return { chartData: data, activeChartKeys: activeKeys, chartColors: colors, todayFormatted: todayStr };
    }, [tasks, workloadView, uniqueAssignees, allDepartments, allBiCategories, assigneeColors, departmentColors, biCategoryColors]);

    const groupedByStatus = useMemo(() => {
        const grouped = tasks.reduce((acc, task) => {
            const status = task.status || 'N/A';
            if (!acc[status]) acc[status] = [];
            acc[status].push(task);
            return acc;
        }, {});
        
        const getStatusOrder = (status) => {
            const s = status.toLowerCase();
            if (s.includes('progress')) return 1;
            if (s.includes('review') || s.includes('pending')) return 2;
            if (s.includes('open') || s.includes('to do')) return 3;
            if (s.includes('done') || s.includes('cancel')) return 4;
            return 5; 
        };
        
        return new Map(Object.entries(grouped).sort(([statusA], [statusB]) => getStatusOrder(statusA) - getStatusOrder(statusB)));
    }, [tasks]);
    
    const handleUpdateTask = async (taskId, updates) => {
        if (!isConnected) return;
        try {
            const { statusId, comment, priority } = updates;
            if (priority) await jiraAPI.updateIssue(taskId, { fields: { priority: { name: priority } } });
            if (statusId) await jiraAPI.transitionIssue(taskId, statusId);
            if (comment) await jiraAPI.addComment(taskId, comment);
            await loadJiraData();
        } catch (err) {
            console.error("Failed to update task:", err);
        } finally {
            setSelectedTask(null);
        }
    };

    return (
        <div className="h-full overflow-y-auto">
            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">Daily Workload</h3>
                        <div className="bg-gray-100 p-1 rounded-lg shadow-inner inline-flex items-center">
                            <button onClick={() => setWorkloadView('assignee')} className={`px-3 py-1 rounded-md transition-colors text-sm ${workloadView === 'assignee' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Total</button>
                            <button onClick={() => setWorkloadView('department')} className={`px-3 py-1 rounded-md transition-colors text-sm ${workloadView === 'department' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 hover:bg-gray-200'}`}>By Department</button>
                            <button onClick={() => setWorkloadView('biCategory')} className={`px-3 py-1 rounded-md transition-colors text-sm ${workloadView === 'biCategory' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 hover:bg-gray-200'}`}>By BI Category</button>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dailyWorkloadData.chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={'#e5e7eb'} />
                            <XAxis dataKey="displayDate" fontSize={12} interval="preserveStartEnd" tick={{ fill: '#6b7280' }} />
                            <YAxis allowDecimals={false} tick={{ fill: '#6b7280' }}/>
                            <Tooltip contentStyle={{ backgroundColor: 'white', borderColor: '#e5e7eb' }} labelStyle={{ color: '#111827' }} />
                            <Legend />
                            {dailyWorkloadData.activeChartKeys.map(key => (
                                <Line key={key} type="monotone" dataKey={key} name={key} stroke={dailyWorkloadData.chartColors[key] || '#9ca3af'} strokeWidth={2} dot={{r: 2}} activeDot={{r: 6}} />
                            ))}
                            <ReferenceLine x={dailyWorkloadData.todayFormatted} stroke="red" strokeWidth={2} label={{ value: "Today", position: "insideTopRight", fill: "red", fontSize: 12 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from(groupedByStatus.keys()).map(statusName => (
                        <StatusColumn 
                            key={statusName} 
                            title={statusName}
                            tasks={groupedByStatus.get(statusName) || []}
                            onTaskClick={setSelectedTask}
                        />
                    ))}
                </div>
            </div>

            {/* Task Detail Drawer */}
             <div className={`fixed inset-0 z-50 transition-opacity ${!!selectedTask ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                <div 
                    className={`absolute inset-0 bg-black transition-opacity ease-in-out duration-300 ${!!selectedTask ? 'bg-opacity-50' : 'bg-opacity-0'}`} 
                    onClick={() => setSelectedTask(null)}>
                </div>
                <div className={`fixed top-0 right-0 h-full bg-white w-full max-w-2xl shadow-xl transition-transform transform ease-in-out duration-300 flex flex-col ${!!selectedTask ? 'translate-x-0' : 'translate-x-full'}`}>
                    {selectedTask && (
                        <>
                            <div className="flex items-center justify-end p-2 border-b">
                                <button onClick={() => setSelectedTask(null)} className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <TaskDetailView 
                                    task={selectedTask}
                                    onUpdateTask={handleUpdateTask}
                                    jiraAPI={jiraAPI}
                                    isConnected={isConnected}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkloadView;