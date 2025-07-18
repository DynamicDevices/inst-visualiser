/* global eventBus, AppConfig */
/**
 * Visualizer Node Management
 * Handles node creation, updating, and rendering
 */

class VisualizerNodeManager {
    constructor(visualizer) {
        this.visualizer = visualizer;
    }

    /**
     * Ensure a node exists in the system
     */
    ensureNodeExists(nodeId) {
        if (!this.visualizer.nodes.has(nodeId)) {
            this.createNode(nodeId);
        } else {
            const node = this.visualizer.nodes.get(nodeId);
            if (node.isRemoved) {
                this.restoreNode(nodeId);
            }
        }
    }

    /**
     * Create a new node
     */
    createNode(nodeId) {
        const isGateway = nodeId === 'B5A4' || nodeId.includes('GW') || nodeId.includes('gateway');
        const isMobile = nodeId.startsWith('T') && nodeId.length === 4;

        let nodeType = 'standard';
        if (isGateway) nodeType = 'gateway';
        else if (isMobile) nodeType = 'mobile';

        const node = {
            id: nodeId,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            fx: 0,
            fy: 0,
            mass: this.visualizer.physics.mass,
            type: nodeType,
            element: null,
            lastUpdate: Date.now(),
            isStale: false,
            isRemoved: false,
            hasInitialPosition: false,
            gps: null // GPS coordinates if available
        };

        this.visualizer.nodes.set(nodeId, node);

        eventBus.emit('node-created', {
            nodeId,
            type: nodeType,
            isGateway,
            isMobile
        });
    }

    /**
     * Restore a previously removed node
     */
    restoreNode(nodeId) {
        const node = this.visualizer.nodes.get(nodeId);
        if (node) {
            node.isRemoved = false;
            node.isStale = false;
            node.lastUpdate = Date.now();
            
            eventBus.emit('node-restored', { nodeId });
        }
    }

    /**
     * Update node timestamp
     */
    updateNodeTimestamp(nodeId, timestamp) {
        const node = this.visualizer.nodes.get(nodeId);
        if (node) {
            node.lastUpdate = timestamp;
        }
    }

    /**
     * Update all nodes in the visualization
     */
    updateNodes() {
        this.visualizer.nodes.forEach((node, nodeId) => {
            if (node.isRemoved) {
                this.removeNodeFromDisplay(nodeId);
                return;
            }

            if (!node.element) {
                node.element = this.createNodeElement(node);
                this.visualizer.canvas.appendChild(node.element);
            }

            this.updateNodePosition(node);
            this.updateNodeContent(node, nodeId);
            this.updateNodeAppearance(node);
        });
    }

    /**
     * Create a DOM element for a node
     */
    createNodeElement(node) {
        const element = document.createElement('div');
        element.className = `node ${node.type}`;
        
        // Add touch handling for mobile devices
        if (this.visualizer.mobileManager?.isMobileDevice) {
            element.addEventListener('touchstart', (e) => {
                e.preventDefault();
                element.style.transform = 'scale(1.1)';
            }, { passive: false });
            
            element.addEventListener('touchend', () => {
                element.style.transform = '';
            });
        }
        
        return element;
    }

    /**
     * Update node position
     */
    updateNodePosition(node) {
        if (!node.element) return;
        
        const element = node.element;
        element.style.transition = 'none';
        element.style.left = `${node.x - element.offsetWidth / 2}px`;
        element.style.top = `${node.y - element.offsetHeight / 2}px`;
    }

    /**
     * Update node content
     */
    updateNodeContent(node, nodeId) {
        if (!node.element) return;
        
        const displayText = nodeId.length > 4 ? nodeId.substring(0, 4) : nodeId;
        node.element.textContent = displayText;
    }

    /**
     * Update node appearance based on state
     */
    updateNodeAppearance(node) {
        if (!node.element) return;
        
        if (node.isStale) {
            node.element.classList.add('stale');
        } else {
            node.element.classList.remove('stale');
        }
    }

    /**
     * Remove node from display
     */
    removeNodeFromDisplay(nodeId) {
        const node = this.visualizer.nodes.get(nodeId);
        if (node?.element) {
            node.element.remove();
            node.element = null;
        }
    }

    /**
     * Get node styling configuration
     */
    getNodeStyling(nodeId) {
        const node = this.visualizer.nodes.get(nodeId);
        if (!node) return AppConfig.nodes.standard;
        
        switch (node.type) {
            case 'gateway':
                return AppConfig.nodes.gateway;
            case 'mobile':
                return AppConfig.nodes.mobile;
            default:
                return AppConfig.nodes.anchor;
        }
    }

    /**
     * Get active nodes (not removed)
     */
    getActiveNodes() {
        return Array.from(this.visualizer.nodes.values()).filter(node => !node.isRemoved);
    }

    /**
     * Get node statistics
     */
    getStats() {
        const activeNodes = this.getActiveNodes();
        const staleNodes = activeNodes.filter(node => node.isStale);

        return {
            total: this.visualizer.nodes.size,
            active: activeNodes.length,
            stale: staleNodes.length,
            removed: this.visualizer.nodes.size - activeNodes.length
        };
    }

    /**
     * Update node with GPS coordinates
     */
    updateNodeGPS(nodeId, gpsCoords, isAbsolute = true) {
        const node = this.visualizer.nodes.get(nodeId);
        if (node) {
            node.gps = {
                lat: gpsCoords.lat,
                lng: gpsCoords.lng,
                accuracy: gpsCoords.accuracy || null,
                derived: !isAbsolute,
                timestamp: Date.now()
            };

            eventBus.emit('node-gps-updated', {
                nodeId,
                gps: node.gps,
                isAbsolute
            });
        }
    }
}

window.VisualizerNodeManager = VisualizerNodeManager;