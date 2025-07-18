/* global eventBus */
/**
 * Visualizer Connection Management
 * Handles connection creation, updating, and rendering
 */

class VisualizerConnectionManager {
    constructor(visualizer) {
        this.visualizer = visualizer;
    }

    /**
     * Update or create a connection
     */
    updateConnection(node1, node2, distance, timestamp) {
        const key = this.getConnectionKey(node1, node2);
        
        let accuracy = 'accurate';
        if (distance > 8 || distance < 0.5) {
            accuracy = 'approximate';
        }
        
        const existingConnection = this.visualizer.connections.get(key);
        const wasRemoved = existingConnection?.isRemoved;
        
        this.visualizer.connections.set(key, {
            node1,
            node2,
            distance,
            accuracy,
            lastUpdate: timestamp,
            isStale: false,
            isRemoved: false,
            wasStale: false
        });
        
        if (wasRemoved) {
            eventBus.emit('connection-restored', { key, node1, node2, distance });
        } else if (!existingConnection) {
            eventBus.emit('connection-created', { key, node1, node2, distance });
        }
        
        if (this.visualizer.uiManager?.debugMode) {
            this.visualizer.loggingManager?.logInfo(`📏 Connection ${node1}-${node2}: ${distance.toFixed(2)}m`);
        }
    }

    /**
     * Update all connections in the visualization
     */
    updateConnections() {
        const existingConnections = new Map();
        this.visualizer.canvas.querySelectorAll('.connection').forEach(el => {
            const key = el.dataset.connectionKey;
            if (key) {
                existingConnections.set(key, el);
            }
        });

        this.visualizer.connections.forEach((connection, key) => {
            if (connection.isRemoved) {
                this.removeConnectionElement(key, existingConnections);
                return;
            }

            const node1 = this.visualizer.nodes.get(connection.node1);
            const node2 = this.visualizer.nodes.get(connection.node2);

            if (!node1 || !node2 || node1.isRemoved || node2.isRemoved) {
                this.removeConnectionElement(key, existingConnections);
                return;
            }

            this.updateConnectionElement(connection, key, node1, node2, existingConnections);
        });

        // Remove any remaining unused elements
        existingConnections.forEach(el => el.remove());
    }

    /**
     * Update a single connection element
     */
    updateConnectionElement(connection, key, node1, node2, existingConnections) {
        const dx = node2.x - node1.x;
        const dy = node2.y - node1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        let line = existingConnections.get(key);
        
        if (line) {
            this.updateLinePosition(line, node1, distance, angle);
            existingConnections.delete(key);
        } else {
            line = this.createConnectionElement(key, node1, distance, angle);
            this.visualizer.canvas.appendChild(line);
        }

        this.updateConnectionAppearance(connection);
    }

    /**
     * Create a new connection element
     */
    createConnectionElement(key, node1, distance, angle) {
        const line = document.createElement('div');
        line.className = 'connection';
        line.dataset.connectionKey = key;
        this.updateLinePosition(line, node1, distance, angle);
        return line;
    }

    /**
     * Update line position and rotation
     */
    updateLinePosition(line, node1, distance, angle) {
        line.style.transition = 'none';
        line.style.left = `${node1.x}px`;
        line.style.top = `${node1.y}px`;
        line.style.width = `${distance}px`;
        line.style.transform = `rotate(${angle}deg)`;
    }

    /**
     * Remove connection element
     */
    removeConnectionElement(key, existingConnections) {
        const line = existingConnections?.get(key)
            || this.visualizer.canvas.querySelector(`[data-connection-key="${key}"]`);
        if (line) {
            line.remove();
            existingConnections?.delete(key);
        }
    }

    /**
     * Update connection appearance based on state
     */
    updateConnectionAppearance(connection) {
        const key = this.getConnectionKey(connection.node1, connection.node2);
        const line = this.visualizer.canvas.querySelector(`[data-connection-key="${key}"]`);
        
        if (line) {
            if (connection.isStale) {
                line.classList.add('stale');
            } else {
                line.classList.remove('stale');
            }
        }
    }

    /**
     * Update distance labels
     */
    updateDistanceLabels() {
        const showAccuracy = document.getElementById('showAccuracy')?.checked;
        
        if (!showAccuracy) {
            this.visualizer.canvas.querySelectorAll('.distance-label').forEach(el => el.remove());
            return;
        }

        const existingLabels = new Map();
        this.visualizer.canvas.querySelectorAll('.distance-label').forEach(el => {
            const key = el.dataset.connectionKey;
            if (key) {
                existingLabels.set(key, el);
            }
        });

        this.visualizer.connections.forEach((connection, key) => {
            if (connection.isRemoved) {
                this.removeLabelElement(key, existingLabels);
                return;
            }

            const node1 = this.visualizer.nodes.get(connection.node1);
            const node2 = this.visualizer.nodes.get(connection.node2);

            if (!node1 || !node2 || node1.isRemoved || node2.isRemoved) {
                this.removeLabelElement(key, existingLabels);
                return;
            }

            this.updateDistanceLabelElement(connection, key, node1, node2, existingLabels);
        });

        // Remove any remaining unused labels
        existingLabels.forEach(el => el.remove());
    }

    /**
     * Update a single distance label element
     */
    updateDistanceLabelElement(connection, key, node1, node2, existingLabels) {
        const midX = (node1.x + node2.x) / 2;
        const midY = (node1.y + node2.y) / 2;
        const labelText = `${connection.distance.toFixed(1)}m`;

        let label = existingLabels.get(key);
        
        if (label) {
            this.updateLabelPosition(label, midX, midY, labelText, connection.accuracy);
            existingLabels.delete(key);
        } else {
            label = this.createDistanceLabelElement(key, midX, midY, labelText, connection.accuracy);
            this.visualizer.canvas.appendChild(label);
        }

        // Update stale appearance
        if (connection.isStale) {
            label.classList.add('stale');
        } else {
            label.classList.remove('stale');
        }
    }

    /**
     * Create a new distance label element
     */
    createDistanceLabelElement(key, midX, midY, labelText, accuracy) {
        const label = document.createElement('div');
        label.className = `distance-label ${accuracy}`;
        label.dataset.connectionKey = key;
        this.updateLabelPosition(label, midX, midY, labelText, accuracy);
        return label;
    }

    /**
     * Update label position and content
     */
    updateLabelPosition(label, midX, midY, labelText, accuracy) {
        label.style.transition = 'none';
        label.style.left = `${midX}px`;
        label.style.top = `${midY}px`;
        label.textContent = labelText;
        label.className = `distance-label ${accuracy}`;
    }

    /**
     * Remove label element
     */
    removeLabelElement(key, existingLabels) {
        const label = existingLabels?.get(key)
            || this.visualizer.canvas.querySelector(`.distance-label[data-connection-key="${key}"]`);
        if (label) {
            label.remove();
            existingLabels?.delete(key);
        }
    }

    /**
     * Remove connection from display
     */
    removeConnectionFromDisplay(connectionKey) {
        this.removeConnectionElement(connectionKey);
        this.removeLabelElement(connectionKey);
    }

    /**
     * Get connection key from node IDs
     */
    getConnectionKey(node1, node2) {
        return [node1, node2].sort().join('-');
    }

    /**
     * Get active connections (not removed)
     */
    getActiveConnections() {
        return Array.from(this.visualizer.connections.values()).filter(conn => !conn.isRemoved);
    }

    /**
     * Get connection statistics
     */
    getStats() {
        const activeConnections = this.getActiveConnections();
        const staleConnections = activeConnections.filter(conn => conn.isStale);
        
        return {
            total: this.visualizer.connections.size,
            active: activeConnections.length,
            stale: staleConnections.length,
            removed: this.visualizer.connections.size - activeConnections.length
        };
    }
}

window.VisualizerConnectionManager = VisualizerConnectionManager;