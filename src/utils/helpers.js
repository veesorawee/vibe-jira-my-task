// src/utils/helpers.js

// --- FIX: This is the correct version of the function ---
// It formats time to show relative time for today, "Yesterday", or date for older
export const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return ''; // Return empty if date is invalid

        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        
        // Check if it's today
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        if (dateDay.getTime() === today.getTime()) {
            // Less than 1 minute
            if (diffMins < 1) {
                return 'Just now';
            }
            // Less than 60 minutes
            if (diffMins < 60) {
                return `${diffMins}m ago`;
            }
            // Less than 24 hours (but still today)
            return `${diffHours}h ago`;
        }

        // Check if it's yesterday
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (dateDay.getTime() === yesterday.getTime()) {
            return 'Yesterday';
        }

        // For older dates, show the date
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (error) {
        console.error('Error formatting date:', error);
        return '';
    }
};

export const parseDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date) ? null : date;
};

export const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-700';
    const s = status.toLowerCase();
    if (s.includes('done') || s.includes('cancelled')) return 'bg-green-100 text-green-800';
    if (s.includes('progress') || s.includes('review')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-700';
};

export const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
};

export const formatDateFull = (date) => {
    if (!date) return null;
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
};

const escapeHtml = (text) => {
    if (typeof text !== 'string') return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

export const adfToHtml = (adf) => {
    if (!adf || !adf.content) return { html: '', slackLink: null, figmaLinks: [] };

    let slackLink = null;
    const figmaLinks = [];

    const renderNode = (node) => {
        let childrenHtml = node.content ? node.content.map(renderNode).join('') : '';

        switch (node.type) {
            case 'doc':
                return childrenHtml;
            case 'paragraph':
                return childrenHtml.trim() === '' ? '' : `<p>${childrenHtml}</p>`;
            case 'inlineCard':
                {
                    const url = escapeHtml(node.attrs.url);
                    let docType = 'Linked Document',
                        icon = '🔗';
                    if (url.includes('docs.google.com/document')) {
                        docType = 'Google Doc';
                        icon = '📄';
                    } else if (url.includes('docs.google.com/spreadsheets')) {
                        docType = 'Google Sheet';
                        icon = '📊';
                    }
                    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline inline-flex items-center gap-1">${icon} ${docType}</a>`;
                }
            case 'text':
                {
                    let text = escapeHtml(node.text || '');
                    if (node.marks) {
                        for (const mark of node.marks) {
                            if (mark.type === 'link') {
                                const href = escapeHtml(mark.attrs.href);
                                if (href.includes('lmwn.slack.com')) {
                                    if (!slackLink) slackLink = href;
                                    return ''; // Don't render slack links inline
                                }
                                if (href.includes('figma.com')) {
                                    const match = href.match(/\/(?:design|file)\/[^/]+\/([^/?]+)/);
                                    let linkText = text || `Figma File #${figmaLinks.length + 1}`;
                                    if (match && match[1]) {
                                        linkText = decodeURIComponent(match[1]).replace(/[-_]/g, ' ');
                                    }
                                    figmaLinks.push({ href, text: linkText });
                                    return ''; // Don't render figma links inline
                                }
                                if (href.includes('lmwn-redash.linecorp.com/queries/')) {
                                    const match = href.match(/queries\/(\d+)/);
                                    const queryId = match ? match[1] : 'unknown';
                                    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline">redash #${queryId}</a>`;
                                }
                                return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline">${text}</a>`;
                            }
                        }
                    }
                    return text;
                }
            default:
                return childrenHtml;
        }
    };

    const html = adf.content.map(renderNode).join('').replace(/<p><\/p>/g, '');
    return { html, slackLink, figmaLinks };
};

export const formatDate = (date) => {
    if (!date) return null;
    return date instanceof Date ? date.toISOString().split('T')[0] : new Date(date).toISOString().split('T')[0];
};