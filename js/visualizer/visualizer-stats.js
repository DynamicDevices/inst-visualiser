/**
 * Visualizer Statistics Management
 * Handles statistics tracking, display, and bounding box calculations
 */

class VisualizerStatsManager {
    constructor(visualizer) {
        this.visualizer = visualizer;
    }

    /**
     * Initialize statistics manager
     */
    initialize() {
        this.updateStats();
        console.log('📊 Statistics Manager initialized');
    }

    /**
     * Update all statistics displays
     */
    updateStats() {
        this.updateNodeCount();
        this.updateConnectionCount();
        this.updateMessageCount();
        this.updateTotalArea();
        this.updateLastMessageTime();
    }

    /**
     * Update node count display
     */
    updateNodeCount() {
        const nodeCountElement = document.getElementById('nodeCount');
        if (nodeCountElement) {
            const currentNodeCount = Array.from(this.visualizer.nodes.values())
                .filter(node => !node.isRemoved).length;
            nodeCountElement.textContent = currentNodeCount;
            this.addUpdateAnimation(nodeCountElement);
        }
    }

    /**
     * Update connection count display
     */
    updateConnectionCount() {
        const connectionCountElement = document.getElementById('connectionCount');
        if (connectionCountElement) {
            const currentConnectionCount = Array.from(this.visualizer.connections.values())
                .filter(conn => !conn.isRemoved).length;
            connectionCountElement.textContent = currentConnectionCount;
            this.addUpdateAnimation(connectionCountElement);
        }
    }

    /**
     * Update message count display
     */
    updateMessageCount() {
        const messageCountElement = document.getElementById('messageCount');
        if (messageCountElement) {
            messageCountElement.textContent = this.visualizer.messageCount;
            this.addUpdateAnimation(messageCountElement);
        }
    }

    /**
     * Update total area display
     */
    updateTotalArea() {
        const totalAreaElement = document.getElementById('totalArea');
        if (totalAreaElement) {
            const boundingBoxDimensions = this.calculateBoundingBoxDimensions();
            totalAreaElement.textContent = boundingBoxDimensions;
            this.addUpdateAnimation(totalAreaElement);
        }
    }

    /**
     * Update last message time display
     */
    updateLastMessageTime() {
        const lastMessageTimeElement = document.getElementById('lastMessageTime');
        if (lastMessageTimeElement && this.visualizer.lastUpdateTime) {
            const timestamp = new Date(this.visualizer.lastUpdateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            lastMessageTimeElement.textContent = timestamp;
            this.addUpdateAnimation(lastMessageTimeElement);
        }
    }

    /**
     * Add update animation to element
     */
    addUpdateAnimation(element) {
        element.classList.add('updated');
        setTimeout(() => element.classList.remove('updated'), 500);
    }

    /**
     * Calculate bounding box dimensions
     */
    calculateBoundingBoxDimensions() {
        const activeNodes = Array.from(this.visualizer.nodes.values()).filter(node => !node.isRemoved);
        
        if (activeNodes.length < 2) {
            return '0×0m';
        }
        
        // Calculate bounding box in pixels
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        
        activeNodes.forEach(node => {
            minX = Math.min(minX, node.x);
            maxX = Math.max(maxX, node.x);
            minY = Math.min(minY, node.y);
            maxY = Math.max(maxY, node.y);
        });
        
        // Convert pixels to metres using the physics distance scale
        const widthPixels = maxX - minX;
        const heightPixels = maxY - minY;
        const widthMeters = widthPixels / this.visualizer.physics.distanceScale;
        const heightMeters = heightPixels / this.visualizer.physics.distanceScale;
        
        // Return compact dimensions for mobile
        return `${widthMeters.toFixed(1)}×${heightMeters.toFixed(1)}m`;
    }

    /**
     * Update bounding box visualization
     */
    updateBoundingBox() {
        const activeNodes = Array.from(this.visualizer.nodes.values()).filter(node => !node.isRemoved);
        
        if (activeNodes.length < 2) {
            this.removeBoundingBox();
            return;
        }
        
        // Calculate bounding box coordinates
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        
        activeNodes.forEach(node => {
            minX = Math.min(minX, node.x);
            maxX = Math.max(maxX, node.x);
            minY = Math.min(minY, node.y);
            maxY = Math.max(maxY, node.y);
        });
        
        const width = maxX - minX;
        const height = maxY - minY;
        
        // Convert to metres for labels
        const widthMeters = (width / this.visualizer.physics.distanceScale).toFixed(1);
        const heightMeters = (height / this.visualizer.physics.distanceScale).toFixed(1);
        
        // Remove existing bounding box elements
        this.removeBoundingBox();
        
        // Create bounding box rectangle
        const boundingBox = document.createElement('div');
        boundingBox.className = 'bounding-box';
        boundingBox.style.left = `${minX}px`;
        boundingBox.style.top = `${minY}px`;
        boundingBox.style.width = `${width}px`;
        boundingBox.style.height = `${height}px`;
        this.visualizer.canvas.appendChild(boundingBox);
        
        // Create horizontal distance label (top)
        const horizontalLabel = document.createElement('div');
        horizontalLabel.className = 'bounding-box-label horizontal';
        horizontalLabel.textContent = `${widthMeters}m`;
        horizontalLabel.style.left = `${minX + width / 2}px`;
        horizontalLabel.style.top = `${minY - 8}px`;
        this.visualizer.canvas.appendChild(horizontalLabel);
        
        // Create vertical distance label (left)
        const verticalLabel = document.createElement('div');
        verticalLabel.className = 'bounding-box-label vertical';
        verticalLabel.textContent = `${heightMeters}m`;
        verticalLabel.style.left = `${minX - 8}px`;
        verticalLabel.style.top = `${minY + height / 2}px`;
        this.visualizer.canvas.appendChild(verticalLabel);
    }

    /**
     * Remove bounding box visualization
     */
    removeBoundingBox() {
        this.visualizer.canvas.querySelectorAll('.bounding-box, .bounding-box-label').forEach(el => el.remove());
    }

    /**
     * Reset all statistics
     */
    resetStats() {
        this.visualizer.messageCount = 0;
        this.visualizer.lastUpdateTime = null;
        
        const lastMessageTimeElement = document.getElementById('lastMessageTime');
        if (lastMessageTimeElement) {
            lastMessageTimeElement.textContent = 'Never';
        }
        
        // Clear all nodes and connections
        this.visualizer.nodes.clear();
        this.visualizer.connections.clear();
        this.visualizer.canvas.querySelectorAll('.node, .connection, .distance-label, .bounding-box, .bounding-box-label').forEach(el => el.remove());
        
        this.updateStats();
        this.visualizer.loggingManager?.logInfo('📊 Statistics reset - all data cleared');
    }

    /**
     * Get comprehensive statistics
     */
    getComprehensiveStats() {
        const nodeStats = this.visualizer.nodeManager?.getStats() || {};
        const connectionStats = this.visualizer.connectionManager?.getStats() || {};
        const physicsStats = this.visualizer.physicsManager?.getStats() || {};
        const uiStats = this.visualizer.uiManager?.getStats() || {};
        const mobileStats = this.visualizer.mobileManager?.getStats() || {};
        
        return {
            version: this.visualizer.version,
            messageCount: this.visualizer.messageCount,
            lastUpdateTime: this.visualizer.lastUpdateTime,
            boundingBoxDimensions: this.calculateBoundingBoxDimensions(),
            nodes: nodeStats,
            connections: connectionStats,
            physics: physicsStats,
            ui: uiStats,
            mobile: mobileStats,
            performance: {
                memoryUsage: this.getMemoryUsage(),
                uptime: this.getUptime()
            }
        };
    }

    /**
     * Get memory usage if available
     */
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        return null;
    }

    /**
     * Get application uptime
     */
    getUptime() {
        return Math.round(performance.now() / 1000);
    }

    /**
     * Export statistics as JSON
     */
    exportStats() {
        const stats = this.getComprehensiveStats();
        const dataStr = JSON.stringify(stats, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `uwb-visualizer-stats-${new Date().toISOString().slice(0, 19)}.json`;
        link.click();
        
        this.visualizer.loggingManager?.logInfo('📊 Statistics exported to file');
    }

    /**
     * Get basic statistics for display
     */
    getStats() {
        return {
            nodeCount: Array.from(this.visualizer.nodes.values()).filter(node => !node.isRemoved).length,
            connectionCount: Array.from(this.visualizer.connections.values()).filter(conn => !conn.isRemoved).length,
            messageCount: this.visualizer.messageCount,
            boundingBoxDimensions: this.calculateBoundingBoxDimensions(),
            lastUpdateTime: this.visualizer.lastUpdateTime
        };
    }
}

window.VisualizerStatsManager = VisualizerStatsManager;