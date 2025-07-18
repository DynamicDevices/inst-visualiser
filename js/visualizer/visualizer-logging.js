/**
 * Visualizer Logging Management
 * Handles console logging, message display, and log management
 */

class VisualizerLoggingManager {
    constructor(visualizer) {
        this.visualizer = visualizer;
        this.consoleVisible = false;
        this.maxLogEntries = 100;
    }

    /**
     * Initialize logging manager
     */
    initialize() {
        this.logVersionInfo();
        console.log('📋 Logging Manager initialized');
    }

    /**
     * Log version and initialization information
     */
    logVersionInfo() {
        this.logSuccess(`🎯 UWB Position Visualiser v${this.visualizer.version} initialised - Modular Architecture`);
        this.logInfo('📱 v4.0 MODULAR: Separated into focused, maintainable modules');
        this.logInfo('🎯 v4.0 EVENT-DRIVEN: Components communicate via event bus');
        this.logInfo('📱 v4.0 RESPONSIVE: Ultra-compact controls, larger touch targets, gesture support');
        this.logInfo('⚡ v4.0 COLLAPSIBLE: Organised sections with space-efficient layout');
        this.logInfo('🎨 v4.0 IMPROVED: Professional SVG logo with gradient design');
        this.logInfo('🚀 Advanced Physics: Spring 2.0, Damping 0.6, Mass 0.2 for responsive positioning');
        this.logInfo('💡 Tip: Use maximise button (⛶) for full-screen node visualisation');
        this.logInfo('📊 Touch-optimised statistics and quick actions for workflow');
    }

    /**
     * Log info message
     */
    logInfo(message) {
        this.addLogEntry(message, 'info');
    }

    /**
     * Log success message
     */
    logSuccess(message) {
        this.addLogEntry(message, 'success');
    }

    /**
     * Log warning message
     */
    logWarning(message) {
        this.addLogEntry(message, 'warning');
    }

    /**
     * Log error message
     */
    logError(message) {
        this.addLogEntry(message, 'error');
    }

    /**
     * Add log entry to console
     */
    addLogEntry(message, type) {
        const consoleContent = document.getElementById('consoleContent'); // FIXED: Renamed from 'console' to 'consoleContent'
        if (!consoleContent) return;
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.innerHTML = `<span class="log-timestamp">[${timestamp}]</span> ${message}`;
        
        consoleContent.appendChild(entry); // FIXED: Using consoleContent instead of console
        consoleContent.scrollTop = consoleContent.scrollHeight; // FIXED: Using consoleContent instead of console

        // Limit number of log entries
        while (consoleContent.children.length > this.maxLogEntries) { // FIXED: Using consoleContent instead of console
            consoleContent.removeChild(consoleContent.firstChild); // FIXED: Using consoleContent instead of console
        }

        // Also log to browser console for debugging - NOW WORKS because console is not shadowed
        if (type === 'error') {
            console.error(`[UWB Visualizer] ${message}`);
        } else if (type === 'warning') {
            console.warn(`[UWB Visualizer] ${message}`);
        } else {
            console.log(`[UWB Visualizer] ${message}`);
        }
    }

    /**
     * Clear console
     */
    clearConsole() {
        const consoleContent = document.getElementById('consoleContent');
        if (consoleContent) {
            consoleContent.innerHTML = '';
            this.logInfo('📋 Console cleared');
        }
    }

    /**
     * Toggle console visibility
     */
    toggleConsole() {
        const consolePanel = document.getElementById('consolePanel');
        const consoleContent = document.getElementById('consoleContent');
        const container = document.querySelector('.container');
        const toggleButton = document.getElementById('toggleConsole');
        
        this.consoleVisible = !this.consoleVisible;
        const isHidden = !this.consoleVisible;
        
        if (consoleContent) consoleContent.classList.toggle('hidden', isHidden);
        if (consolePanel) consolePanel.classList.toggle('collapsed', isHidden);
        if (container) container.classList.toggle('console-collapsed', isHidden);
        
        if (toggleButton) {
            toggleButton.textContent = isHidden ? 'Show' : 'Hide';
        }
        
        if (this.consoleVisible) {
            this.logInfo('📋 Console expanded');
        }
    }

    /**
     * Log system performance metrics
     */
    logPerformanceMetrics() {
        const stats = this.visualizer.getStats();
        this.logInfo(`📊 Performance: ${stats.nodeCount} nodes, ${stats.connectionCount} connections, ${stats.messageCount} messages processed`);
        
        if (performance.memory) {
            const memory = performance.memory;
            const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
            const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
            this.logInfo(`💾 Memory: ${usedMB}MB used of ${totalMB}MB allocated`);
        }
    }

    /**
     * Log debug information
     */
    logDebug(message) {
        if (this.visualizer.uiManager?.debugMode) {
            this.addLogEntry(`🐛 DEBUG: ${message}`, 'info');
        }
    }

    /**
     * Log network activity
     */
    logNetworkActivity(type, details) {
        const icons = {
            connected: '🔗',
            disconnected: '🔌',
            message: '📨',
            error: '❌'
        };
        
        const icon = icons[type] || '📡';
        this.addLogEntry(`${icon} ${details}`, type === 'error' ? 'error' : 'info');
    }

    /**
     * Log physics events
     */
    logPhysicsEvent(event, details) {
        const icons = {
            started: '🚀',
            stopped: '🛑',
            reset: '🔄',
            centered: '🎯'
        };
        
        const icon = icons[event] || '🔬';
        this.addLogEntry(`${icon} Physics: ${details}`, 'info');
    }

    /**
     * Log mobile events
     */
    logMobileEvent(event, details) {
        const icons = {
            orientation: '📱',
            gesture: '👆',
            touch: '👇'
        };
        
        const icon = icons[event] || '📱';
        this.addLogEntry(`${icon} Mobile: ${details}`, 'info');
    }

    /**
     * Export logs to file
     */
    exportLogs() {
        const consoleContent = document.getElementById('consoleContent');
        if (!consoleContent) return;
        
        const logs = Array.from(consoleContent.children).map(entry => entry.textContent);
        const logData = logs.join('\n');
        
        const dataBlob = new Blob([logData], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `uwb-visualizer-logs-${new Date().toISOString().slice(0, 19)}.txt`;
        link.click();
        
        this.logInfo('📋 Logs exported to file');
    }

    /**
     * Set maximum log entries
     */
    setMaxLogEntries(max) {
        this.maxLogEntries = Math.max(10, Math.min(1000, max));
        this.logInfo(
            `📋 Max log entries set to ${this.maxLogEntries}`
        );
    }

    /**
     * Get logging statistics
     */
    getStats() {
        const consoleContent = document.getElementById('consoleContent');
        const logCount = consoleContent ? consoleContent.children.length : 0;
        
        return {
            consoleVisible: this.consoleVisible,
            logCount,
            maxLogEntries: this.maxLogEntries
        };
    }

    /**
     * Filter logs by type
     */
    filterLogs(type) {
        const consoleContent = document.getElementById('consoleContent');
        if (!consoleContent) return;
        
        const entries = Array.from(consoleContent.children);
        entries.forEach(entry => {
            if (type === 'all' || entry.classList.contains(`log-${type}`)) {
                entry.style.display = '';
            } else {
                entry.style.display = 'none';
            }
        });
        
        this.logInfo(
            `📋 Filtered logs to show: ${type}`
        );
    }
}

window.VisualizerLoggingManager = VisualizerLoggingManager;