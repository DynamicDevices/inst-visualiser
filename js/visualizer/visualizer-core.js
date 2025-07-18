/* global eventBus, SpringMassSystem, VisualizerNodeManager, VisualizerConnectionManager, 
   VisualizerPhysicsManager, VisualizerUIManager, VisualizerMobileManager, VisualizerStatsManager, 
   VisualizerLoggingManager, MQTTManager */
/**
 * UWB Visualizer Core - Main Coordination Class
 * Coordinates all visualizer sub-modules using event-driven architecture
 */

class UWBVisualizer {
    constructor() {
        this.version = "4.0";
        this.canvas = document.getElementById('canvas');
        this.nodes = new Map();
        this.connections = new Map();
        this.messageCount = 0;
        this.lastUpdateTime = null;
        this.visualizationMaximized = false;
        
        // Physics integration
        this.physics = new SpringMassSystem();
        this.physicsEnabled = true;
        this.simulationRunning = false;
        this.animationFrame = null;
        
        // Timeout settings
        this.staleTimeoutMs = 30000; // 30 seconds
        this.removalTimeoutMs = 30000; // 30 seconds after stale
        
        // Initialize sub-managers
        this.nodeManager = new VisualizerNodeManager(this);
        this.connectionManager = new VisualizerConnectionManager(this);
        this.physicsManager = new VisualizerPhysicsManager(this);
        this.uiManager = new VisualizerUIManager(this);
        this.mobileManager = new VisualizerMobileManager(this);
        this.statsManager = new VisualizerStatsManager(this);
        this.loggingManager = new VisualizerLoggingManager(this);
        
        // Use original MQTTManager - will be set up after initialization
        this.mqttManager = null;
        
        // Initialize everything
        this.initialize();
    }

    /**
     * Initialize all sub-systems
     */
    initialize() {
        console.log('🎯 Initializing UWB Visualizer v4.0 - Modular Architecture');
        
        // Initialize MQTT Manager using original implementation
        this.initializeMQTTManager();
        
        // Initialize sub-managers
        this.uiManager.initialize();
        this.mobileManager.initialize();
        this.physicsManager.initialize();
        this.statsManager.initialize();
        this.loggingManager.initialize();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start background processes
        this.startStaleNodeChecker();
        this.startNodeCenteringChecker();
        
        // Update initial stats
        this.statsManager.updateStats();
        
        // Start physics simulation
        this.physicsManager.startSimulation();
        
        // Initialize with console collapsed
        const container = document.querySelector('.container');
        if (container) {
            container.classList.add('console-collapsed');
        }
        
        // Auto-collapse controls on mobile
        if (this.mobileManager.isMobileDevice) {
            this.mobileManager.autoCollapseMobileControls();
        }
        
        console.log('✅ UWB Visualizer initialization complete');
    }

    /**
     * Initialize MQTT Manager using original MQTTManager class
     */
    initializeMQTTManager() {
        // Use the original MQTTManager class from mqtt.js
        this.mqttManager = new MQTTManager(this);
        
        // Add compatibility methods for the modular system
        this.mqttManager.setMessageHandler = () => {
            // The original MQTTManager already handles messages via this.processMessage
            this.loggingManager.logInfo('📡 Message handler set (using original MQTTManager)');
        };
        
        // Add isConnected method if it doesn't exist
        if (!this.mqttManager.isConnected) {
            this.mqttManager.isConnected = () => this.mqttManager.connected;
        }
        
        // For app.js compatibility
        this.mqttManager.onConnect = null;
        
        console.log('📡 MQTT Manager initialized (using original MQTTManager)');
    }

    /**
     * Set up event listeners for inter-module communication
     */
    setupEventListeners() {
        // Node events
        eventBus.on('node-created', () => {
            this.statsManager.updateStats();
            this.loggingManager.logSuccess('✨ Created new node');
        });

        eventBus.on('node-removed', () => {
            this.statsManager.updateStats();
            this.loggingManager.logWarning('❌ Node removed');
        });

        eventBus.on('node-restored', () => {
            this.statsManager.updateStats();
            this.loggingManager.logSuccess('🔄 Restored node');
        });

        // Connection events
        eventBus.on('connection-created', (data) => {
            this.statsManager.updateStats();
        });

        eventBus.on('connection-removed', (data) => {
            this.statsManager.updateStats();
        });

        // Physics events
        eventBus.on('physics-started', () => {
            this.loggingManager.logInfo('🚀 Advanced Physics simulation started');
        });

        eventBus.on('physics-stopped', () => {
            this.loggingManager.logInfo('🛑 Advanced Physics simulation stopped');
        });

        // UI events
        eventBus.on('visualization-maximized', (data) => {
            this.visualizationMaximized = data.maximized;
            if (data.maximized) {
                this.loggingManager.logInfo('🔍 Visualization maximized');
            } else {
                this.loggingManager.logInfo('🔍 Visualization restored');
            }
        });

        // Message processing events
        eventBus.on('message-processed', (data) => {
            this.messageCount++;
            this.lastUpdateTime = Date.now();
            this.statsManager.updateStats();
        });

        // MQTT events - use original MQTTManager methods
        eventBus.on('mqtt-connect-requested', () => {
            this.mqttManager.connect();
        });

        eventBus.on('mqtt-disconnect-requested', () => {
            this.mqttManager.disconnect();
        });
    }

    /**
     * Process incoming distance data (called by original MQTTManager)
     */
    processMessage(message) {
        try {
            const data = JSON.parse(message);
            if (data.distances && Array.isArray(data.distances)) {
                this.processDistanceData(data.distances);
                eventBus.emit('message-processed', { 
                    messageCount: this.messageCount,
                    distanceCount: data.distances.length 
                });
                return true;
            }
        } catch (error) {
            this.loggingManager.logError(`❌ Failed to process message: ${error.message}`);
            return false;
        }
        return false;
    }

    /**
     * Process distance data array (called by original MQTTManager)
     */
    processDistanceData(distanceArray) {
        this.messageCount++;
        this.lastUpdateTime = Date.now();
        
        if (this.uiManager.debugMode) {
            this.loggingManager.logInfo(`🔄 Processing message #${this.messageCount} with ${distanceArray.length} measurements`);
        }
        
        // Process nodes
        distanceArray.forEach(([node1, node2, distance]) => {
            this.nodeManager.ensureNodeExists(node1);
            this.nodeManager.ensureNodeExists(node2);
            this.nodeManager.updateNodeTimestamp(node1, this.lastUpdateTime);
            this.nodeManager.updateNodeTimestamp(node2, this.lastUpdateTime);
        });

        // Process connections
        distanceArray.forEach(([node1, node2, distance]) => {
            this.connectionManager.updateConnection(node1, node2, distance, this.lastUpdateTime);
        });

        this.statsManager.updateStats();
    }

    /**
     * Log info message (called by original MQTTManager)
     */
    logInfo(message) {
        this.loggingManager.logInfo(message);
    }

    /**
     * Log success message (called by original MQTTManager)
     */
    logSuccess(message) {
        this.loggingManager.logSuccess(message);
    }

    /**
     * Log warning message (called by original MQTTManager)
     */
    logWarning(message) {
        this.loggingManager.logWarning(message);
    }

    /**
     * Log error message (called by original MQTTManager)
     */
    logError(message) {
        this.loggingManager.logError(message);
    }

    /**
     * Update status display (called by original MQTTManager)
     */
    updateStatus(text, connected) {
        const statusText = document.getElementById('statusText');
        const statusIndicator = document.getElementById('statusIndicator');
        if (statusText) statusText.textContent = text;
        if (statusIndicator) statusIndicator.classList.toggle('connected', connected);
    }

    /**
     * Start stale node checker
     */
    startStaleNodeChecker() {
        setInterval(() => {
            this.checkStaleNodes();
        }, 1000);
    }

    /**
     * Start node centering checker
     */
    startNodeCenteringChecker() {
        setInterval(() => {
            this.physicsManager.checkAndCenterNodes();
        }, 5000);
    }

    /**
     * Check for stale nodes and connections
     */
    checkStaleNodes() {
        const currentTime = Date.now();
        let statsChanged = false;
        
        // Check nodes
        this.nodes.forEach((node, nodeId) => {
            const timeSinceUpdate = currentTime - node.lastUpdate;
            const wasStale = node.isStale;
            const wasRemoved = node.isRemoved;
            
            node.isStale = timeSinceUpdate > this.staleTimeoutMs;
            node.isRemoved = timeSinceUpdate > (this.staleTimeoutMs + this.removalTimeoutMs);
            
            if (node.isRemoved && !wasRemoved) {
                this.nodeManager.removeNodeFromDisplay(nodeId);
                eventBus.emit('node-removed', { nodeId, timeSinceUpdate });
                statsChanged = true;
            } else if (node.isStale && !wasStale && !node.isRemoved) {
                this.nodeManager.updateNodeAppearance(node);
                this.loggingManager.logWarning(`⏰ Node ${nodeId} marked as stale`);
            } else if (!node.isStale && wasStale && !node.isRemoved) {
                this.nodeManager.updateNodeAppearance(node);
                this.loggingManager.logSuccess(`✅ Node ${nodeId} back online`);
            }
        });

        // Check connections
        this.connections.forEach((connection, key) => {
            const node1 = this.nodes.get(connection.node1);
            const node2 = this.nodes.get(connection.node2);
            const wasRemoved = connection.isRemoved;
            
            connection.isStale = (node1?.isStale || node2?.isStale)
                || (currentTime - connection.lastUpdate > this.staleTimeoutMs);
            
            connection.isRemoved = (node1?.isRemoved || node2?.isRemoved)
                || (currentTime - connection.lastUpdate > (this.staleTimeoutMs + this.removalTimeoutMs));
            
            if (connection.isRemoved && !wasRemoved) {
                this.connectionManager.removeConnectionFromDisplay(key);
                eventBus.emit('connection-removed', { key });
                statsChanged = true;
            } else if (connection.isStale !== connection.wasStale) {
                this.connectionManager.updateConnectionAppearance(connection);
                connection.wasStale = connection.isStale;
            }
        });
        
        if (statsChanged) {
            this.statsManager.updateStats();
        }
    }

    /**
     * Update visualization
     */
    updateVisualisation() {
        this.nodeManager.updateNodes();
        this.connectionManager.updateConnections();
        this.connectionManager.updateDistanceLabels();
        
        if (this.uiManager.showBoundingBox) {
            this.statsManager.updateBoundingBox();
        } else {
            this.statsManager.removeBoundingBox();
        }
    }

    /**
     * Clear all nodes and connections
     */
    clearAllNodes() {
        this.nodes.clear();
        this.connections.clear();
        this.canvas.querySelectorAll(
            '.node, .connection, .distance-label, .bounding-box, .bounding-box-label'
        ).forEach(el => el.remove());
        this.loggingManager.logInfo('🗑️ All nodes cleared');
        this.statsManager.updateStats();
    }

    /**
     * Center nodes on display
     */
    centerNodes() {
        this.physicsManager.centerNodes();
    }

    /**
     * Reset physics simulation
     */
    resetPhysics() {
        this.physicsManager.resetPhysics();
    }

    /**
     * Toggle physics simulation
     */
    togglePhysics(enabled) {
        this.physicsEnabled = enabled;
        if (enabled && !this.simulationRunning) {
            this.physicsManager.startSimulation();
        } else if (!enabled && this.simulationRunning) {
            this.physicsManager.stopSimulation();
        }
    }

    /**
     * Toggle controls panel
     */
    toggleControls() {
        this.uiManager.toggleControls();
    }

    /**
     * Toggle console panel
     */
    toggleConsole() {
        this.loggingManager.toggleConsole();
    }

    /**
     * Toggle visualization maximization
     */
    toggleMaximizeVisualization() {
        this.uiManager.toggleMaximizeVisualization();
    }

    /**
     * Get visualizer statistics
     */
    getStats() {
        return {
            version: this.version,
            messageCount: this.messageCount,
            nodeCount: Array.from(this.nodes.values()).filter(node => !node.isRemoved).length,
            connectionCount: Array.from(this.connections.values()).filter(conn => !conn.isRemoved).length,
            lastUpdateTime: this.lastUpdateTime,
            physicsEnabled: this.physicsEnabled,
            simulationRunning: this.simulationRunning,
            visualizationMaximized: this.visualizationMaximized,
            isMobileDevice: this.mobileManager?.isMobileDevice || false
        };
    }
}

window.UWBVisualizer = UWBVisualizer;