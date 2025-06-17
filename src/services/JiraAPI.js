import { adfToHtml, formatDate } from '../utils/helpers';

class JiraAPI {
    constructor() {
        this.proxyURL = 'http://localhost:4000/api/jira';
        this.projectKey = '';
    }

    async getProjectIssues() {
        if (!this.projectKey) {
            throw new Error('Jira Project Key is required');
        }
        try {
            // Updated JQL to fetch tasks for the current user in a specific project
            const jql = `project = ${this.projectKey} AND assignee = currentUser() ORDER BY created DESC`;
            
            const fields = 'summary,assignee,status,created,updated,duedate,priority,description,comment,customfield_10016,resolutiondate,labels,customfield_10306,customfield_10307,changelog';
            const expand = 'changelog';

            let allIssues = [];
            let startAt = 0;
            const maxResults = 100;
            let total = 0;
            do {
                const response = await fetch(
                    `${this.proxyURL}/search?jql=${encodeURIComponent(jql)}&fields=${fields}&expand=${expand}&startAt=${startAt}&maxResults=${maxResults}`
                );
                if (!response.ok) {
                    let errorBody;
                    try { errorBody = await response.json(); }
                    catch (e) { errorBody = await response.text(); }
                    const errorMessage = errorBody?.errorMessages?.join(', ') || JSON.stringify(errorBody);
                    throw new Error(`Jira API Error (${response.status}): ${errorMessage}`);
                }
                const data = await response.json();
                allIssues = allIssues.concat(data.issues);
                total = data.total;
                startAt += maxResults;
            } while (allIssues.length < total);
            return this.transformJiraIssues(allIssues);
        } catch (error) {
            console.error('Error fetching Jira issues via proxy:', error);
            throw error;
        }
    }

    async getTransitions(issueId) {
        const response = await fetch(`${this.proxyURL}/issue/${issueId}/transitions`);
        if (!response.ok) {
            throw new Error(`Failed to get transitions: ${response.statusText}`);
        }
        return await response.json();
    }

    async createIssue(issueData) {
        const response = await fetch(`${this.proxyURL}/issue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(issueData),
        });

        const responseData = await response.json();
        if (!response.ok) {
            const errorMessages = responseData.errors ? JSON.stringify(responseData.errors) : 'Unknown error';
            throw new Error(`Failed to create issue: ${errorMessages}`);
        }
        return responseData;
    }

    async updateIssue(issueId, updatePayload) {
        const response = await fetch(`${this.proxyURL}/issue/${issueId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload),
        });

        if (!response.ok && response.status !== 204) {
            const errorText = await response.text();
            throw new Error(`Failed to update issue: ${errorText}`);
        }
    }

     async getAssignableUsers(projectKey) {
        try {
            const response = await fetch(`${this.proxyURL}/user/assignable/search?project=${projectKey}`);
            if (!response.ok) {
                throw new Error(`Failed to get assignable users: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching assignable users:', error);
            throw error;
        }
    }

    async getMe() {
        try {
            const response = await fetch(`${this.proxyURL}/myself`);
            if (!response.ok) {
                throw new Error(`Failed to get current user: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching current user:', error);
            throw error;
        }
    }

        async transitionIssue(issueId, transitionId) {
        const body = { transition: { id: transitionId } };
        const response = await fetch(`${this.proxyURL}/issue/${issueId}/transitions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok && response.status !== 204) {
            const errorText = await response.text();
            throw new Error(`Failed to transition issue: ${errorText}`);
        }
    }
    
    async addComment(issueId, comment) {
        const body = {
            body: {
                type: "doc",
                version: 1,
                content: [
                    {
                        type: "paragraph",
                        content: [
                            {
                                type: "text",
                                text: comment
                            }
                        ]
                    }
                ]
            }
        };

        const response = await fetch(`${this.proxyURL}/issue/${issueId}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to add comment: ${errorText}`);
        }
        return await response.json();
    }
    // transformJiraIssues and other methods remain largely the same...
    transformJiraIssues(jiraIssues) {
        return jiraIssues.map(issue => {
            const fields = issue.fields;
            const createdDate = new Date(fields.created);

            const originalLabels = fields.labels || [];
            const filteredLabels = originalLabels.filter(label => (label || '').endsWith('@lmwn.com'));
            
            let lastUpdateDetail = null;
            let fullChangeHistory = [];
            
            const issueUpdatedTimestamp = new Date(fields.updated).getTime();

            if (issue.changelog && issue.changelog.histories) {
                const comments = issue.fields.comment.comments;
                if (comments && comments.length > 0) {
                    const lastComment = comments[comments.length - 1];
                    const lastCommentTimestamp = new Date(lastComment.created).getTime();
                    if (Math.abs(issueUpdatedTimestamp - lastCommentTimestamp) < 5000) {
                        lastUpdateDetail = { type: 'twoLine', line1: 'add', line2: 'Comment' };
                    }
                }

                if (!lastUpdateDetail) {
                    const humanChanges = issue.changelog.histories.filter(
                        history => history.author.displayName !== 'Automation for Jira'
                    );

                    fullChangeHistory = humanChanges.map(history => ({
                        author: history.author.displayName,
                        created: history.created,
                        changes: history.items.map(item => ({
                            field: item.field,
                            from: item.fromString,
                            to: item.toString
                        }))
                    }));

                    if (fullChangeHistory.length > 0) {
                        const lastChangeSet = fullChangeHistory[0];
                        const lastChangeTimestamp = new Date(lastChangeSet.created).getTime();
                        
                        if (Math.abs(issueUpdatedTimestamp - lastChangeTimestamp) < 5000) {
                            const statusChange = lastChangeSet.changes.find(c => c.field.toLowerCase() === 'status');
                            const priorityChange = lastChangeSet.changes.find(c => c.field.toLowerCase() === 'priority');
                            const firstChange = lastChangeSet.changes[0];

                            if (statusChange) {
                                const newValueLower = (statusChange.to || '').toLowerCase();
                                if (newValueLower.includes('done') || newValueLower.includes('cancel')) {
                                    lastUpdateDetail = { type: 'simple', text: 'Close Task' };
                                } else {
                                    lastUpdateDetail = { type: 'fromTo', from: statusChange.from, to: statusChange.to };
                                }
                            } else if (priorityChange) {
                                lastUpdateDetail = { type: 'fromTo', from: priorityChange.from, to: priorityChange.to };
                            } else if (firstChange) {
                                const fieldName = firstChange.field.charAt(0).toUpperCase() + firstChange.field.slice(1);
                                lastUpdateDetail = { type: 'twoLine', line1: 'change', line2: fieldName };
                            }
                        }
                    }
                }
            }

            return {
                id: issue.key,
                title: fields.summary,
                assignee: fields.assignee ? fields.assignee.displayName : 'Unassigned',
                assigneeEmail: fields.assignee ? fields.assignee.emailAddress : null,
                status: fields.status ? fields.status.name : 'Unknown',
                startDate: formatDate(createdDate), 
                startTimestamp: fields.created,
                lastUpdated: fields.updated,
                endDate: fields.resolutiondate ? formatDate(new Date(fields.resolutiondate)) : (fields.duedate ? formatDate(new Date(fields.duedate)) : null),
                dueDate: fields.duedate ? formatDate(new Date(fields.duedate)) : null,
                resolutiondate: fields.resolutiondate ? formatDate(new Date(fields.resolutiondate)) : null,
                priority: fields.priority ? fields.priority.name : 'Medium',
                description: adfToHtml(fields.description).html,
                slackLink: adfToHtml(fields.description).slackLink,
                figmaLinks: adfToHtml(fields.description).figmaLinks,
                storyPoints: fields.customfield_10016 || 0,
                department: fields.customfield_10306 ? (fields.customfield_10306.value || fields.customfield_10306) : 'N/A',
                biCategory: fields.customfield_10307 ? (fields.customfield_10307.value || fields.customfield_10307) : 'N/A',
                labels: filteredLabels,
                comments: fields.comment ? this.transformComments(fields.comment.comments) : [],
                lastUpdateDetail: lastUpdateDetail,
                fullChangeHistory: fullChangeHistory,
            };
        });
    }

    transformComments(commentsData) {
        if (!commentsData) return [];
        return commentsData.map(comment => {
            const { html: commentHtml } = adfToHtml(comment.body);
            return {
                author: comment.author ? comment.author.displayName : 'Unknown',
                created: new Date(comment.created).toLocaleString('th-TH'),
                createdTimestamp: comment.created,
                body: commentHtml || 'No content'
            };
        });
    }
}

export default JiraAPI;