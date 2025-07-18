/**
 * UWB Position Visualiser - Utilities Management
 * Crisis utilities and debug functions
 */

class AppUtilsManager {
    constructor(appCore) {
        this.appCore = appCore;
    }

    /**
     * Initialize utilities manager
     */
    initialize() {
        this.setupCrisisUtils();
        console.log('🛠️ Utils Manager initialized');
    }

    /**
     * Set up crisis utilities
     */
    setupCrisisUtils() {
        // Create global crisis utilities object
        window.crisisUtils = {
            // Crisis display functions
            maximiseCasualtyView: () => {
                if (this.appCore.visualizer) {
                    this.appCore.visualizer.toggleMaximizeVisualization();
                    console.log('🚨 Crisis: Casualty view maximized for tactical display');
                }
            },

            // Crisis status functions
            getCrisisStatus: () => {
                const stats = this.appCore.getStats();
                const crisisStatus = {
                    system: 'INST Crisis Response System',
                    status: stats.visualizer ? 'OPERATIONAL' : 'OFFLINE',
                    casualties: stats.visualizer?.nodeCount || 0,
                    connections: stats.visualizer?.connectionCount || 0,
                    lastUpdate: stats.visualizer?.lastUpdateTime ? new Date(stats.visualizer.lastUpdateTime).toLocaleString() : 'Never',
                    simulation: stats.simulation?.running ? 'ACTIVE' : 'INACTIVE',
                    view: stats.view?.currentView || 'unknown',
                    mqttConnected: stats.visualizer?.mqttManager?.isConnected() || false
                };     
                console.table(crisisStatus);
                return crisisStatus;
            },

            // Simulation control functions
            startSimulation: () => {
                if (this.appCore.simulationManager) {
                    this.appCore.simulationManager.startSimulation();
                    console.log('🎭 Crisis: Simulation started for training/testing');
                } else {
                    console.error('❌ Simulation manager not available');
                }
            },

            stopSimulation: () => {
                if (this.appCore.simulationManager) {
                    this.appCore.simulationManager.stopSimulation();
                    console.log('🎭 Crisis: Simulation stopped');
                } else {
                    console.error('❌ Simulation manager not available');
                }
            },

            // View control functions
            switchToMapView: () => {
                if (this.appCore.viewManager) {
                    this.appCore.viewManager.switchToMapView();
                    console.log('🗺️ Crisis: Switched to tactical map view');
                }
            },

            switchToPhysicsView: () => {
                if (this.appCore.viewManager) {
                    this.appCore.viewManager.switchToPhysicsView();
                    console.log('🔬 Crisis: Switched to physics positioning view');
                }
            },

            // Emergency functions
            clearAllCasualties: () => {
                if (confirm('⚠️ CRISIS WARNING: This will clear all casualty positions. Continue?')) { // eslint-disable-line no-alert
                    if (this.appCore.visualizer) {
                        this.appCore.visualizer.clearAllNodes();
                        console.log('🚨 Crisis: All casualty positions cleared');
                    }
                }
            },

            centerCasualties: () => {
                if (this.appCore.visualizer) {
                    this.appCore.visualizer.centerNodes();
                    console.log('🎯 Crisis: Casualty positions centered for optimal viewing');
                }
            },

            // System diagnostics
            runDiagnostics: () => {
                console.log('🔧 Running INST Crisis System Diagnostics...');     
                const performance = {
                    nodeCount: this.appCore.visualizer?.nodes?.size || 0,
                    connectionCount: this.appCore.visualizer?.connections?.size || 0,
                    physicsRunning: this.appCore.visualizer?.simulationRunning || false
                };
                const diagnostics = {
                    timestamp: new Date().toISOString(),
                    system: 'INST Crisis Response System v4.0',
                    modules: {
                        visualizer: !!this.appCore.visualizer,
                        simulation: !!this.appCore.simulationManager,
                        gps: !!this.appCore.gpsManager,
                        views: !!this.appCore.viewManager,
                        controls: !!this.appCore.controlsManager,
                        utils: !!this.appCore.utilsManager
                    },
                    connectivity: {
                        mqtt: this.appCore.visualizer?.mqttManager?.isConnected() || false,
                        simulation: this.appCore.simulationManager?.isRunning() || false
                    },
                    performance
                };     
                console.table(diagnostics.modules);
                console.table(diagnostics.connectivity);
                console.table(diagnostics.performance);      
                return diagnostics;
            },

            // Export functions
            exportCrisisData: () => {
                const stats = this.appCore.getStats();
                const crisisData = {
                    timestamp: new Date().toISOString(),
                    system: 'INST Crisis Response System',
                    casualties: [],
                    connections: [],
                    metadata: stats
                };

                // Export node data
                if (this.appCore.visualizer?.nodes) {
                    this.appCore.visualizer.nodes.forEach((node, nodeId) => {
                        if (!node.isRemoved) {
                            crisisData.casualties.push({
                                id: nodeId,
                                position: { x: node.x, y: node.y },
                                type: node.type,
                                status: node.isStale ? 'stale' : 'active',
                                lastUpdate: node.lastUpdate
                            });
                        }
                    });
                }

                // Export connection data
                if (this.appCore.visualizer?.connections) {
                    this.appCore.visualizer.connections.forEach((connection, key) => {
                        if (!connection.isRemoved) {
                            crisisData.connections.push({
                                key,
                                nodes: [connection.node1, connection.node2],
                                distance: connection.distance,
                                accuracy: connection.accuracy,
                                status: connection.isStale ? 'stale' : 'active'
                            });
                        }
                    });
                }

                // Create download
                const dataStr = JSON.stringify(crisisData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(dataBlob);
                link.download = `crisis-data-${new Date().toISOString().slice(0, 19)}.json`;
                link.click();
                console.log('📊 Crisis data exported successfully');
                return crisisData;
            },

            // Help function
            help: () => {
                console.log(`
🚨 INST Crisis Response System - Available Commands:

📊 Status & Diagnostics:
  crisisUtils.getCrisisStatus()     - Get current crisis system status
  crisisUtils.runDiagnostics()      - Run full system diagnostics

🎭 Simulation Control:
  crisisUtils.startSimulation()     - Start UWB simulation for training
  crisisUtils.stopSimulation()      - Stop simulation

🗺️ View Control:
  crisisUtils.switchToMapView()     - Switch to tactical map view
  crisisUtils.switchToPhysicsView() - Switch to physics positioning view
  crisisUtils.maximiseCasualtyView() - Maximize display for tactical use

🚨 Emergency Functions:
  crisisUtils.centerCasualties()    - Center all casualty positions
  crisisUtils.clearAllCasualties()  - Clear all casualty data (with warning)

📊 Data Export:
  crisisUtils.exportCrisisData()    - Export crisis data to JSON file

💡 Keyboard Shortcuts:
  V - Toggle view (Physics ↔ Map)
  C - Center casualties
  M - Maximize visualization
  Ctrl+S - Toggle simulation

🚨 INST Mission: "Every second counts. Every life matters. Every position is precisely known."
                `);
            }
        };
        // Show help on initialization
        console.log('🛠️ Crisis utilities loaded. Type crisisUtils.help() for available commands.');
    }

    /**
     * Get utilities statistics
     */
    getStats() {
        return {
            crisisUtilsAvailable: !!window.crisisUtils,
            commandsAvailable: window.crisisUtils ? Object.keys(window.crisisUtils).length : 0
        };
    }
}

window.AppUtilsManager = AppUtilsManager;
