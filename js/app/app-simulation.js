/**
 * UWB Position Visualiser - Simulation Management
 * Handles UWB simulation controls and status updates
 */

class AppSimulationManager {
    constructor(appCore) {
        this.appCore = appCore;
        this.uwbSimulator = null;
        this.statusUpdateInterval = null;
    }

    /**
     * Initialize simulation manager
     */
    initialize() {
        if (this.appCore.visualizer && this.appCore.visualizer.mqttManager) {
            this.uwbSimulator = new UWBSimulator(this.appCore.visualizer.mqttManager);
            console.log('🎭 UWB Simulator initialized');
            
            this.setupSimulationControls();
            this.setupMQTTConnectionHandler();
            this.startStatusUpdates();
        } else {
            console.error('❌ Failed to initialize UWB Simulator - MQTT Manager not available');
        }
    }

    /**
     * Set up event handlers for simulation controls
     */
    setupSimulationControls() {
        // Simulation interval slider
        const simulationRateSlider = document.getElementById('simulationRateSlider');
        const simulationRateValue = document.getElementById('simulationRateValue');
        
        if (simulationRateSlider && simulationRateValue) {
            simulationRateSlider.addEventListener('input', (e) => {
                const intervalSeconds = parseInt(e.target.value);
                simulationRateValue.textContent = intervalSeconds;
                
                if (this.uwbSimulator) {
                    this.uwbSimulator.setPublishInterval(intervalSeconds);
                }
            });
            
            // Set initial value
            simulationRateValue.textContent = simulationRateSlider.value;
        }

        // Tag count slider
        const tagCountSlider = document.getElementById('tagCountSlider');
        const tagCountValue = document.getElementById('tagCountValue');
        if (tagCountSlider && tagCountValue) {
            tagCountSlider.addEventListener('input', (e) => {
                const count = parseInt(e.target.value);
                tagCountValue.textContent = count;
                if (this.uwbSimulator) {
                    this.uwbSimulator.setTagCount(count);
                }
            });
        }
        
        // Start simulation button
        const startSimBtn = document.getElementById('startSimulation');
        if (startSimBtn) {
            startSimBtn.addEventListener('click', () => {
                this.startSimulation();
            });
        }
        
        // Stop simulation button
        const stopSimBtn = document.getElementById('stopSimulation');
        if (stopSimBtn) {
            stopSimBtn.addEventListener('click', () => {
                this.stopSimulation();
            });
        }
        
        console.log('🎭 Simulation controls set up successfully');
    }

    /**
     * Start simulation
     */
    startSimulation() {
        if (!this.uwbSimulator) {
            console.error('❌ UWB Simulator not available');
            return;
        }
        
        if (!this.appCore.visualizer?.mqttManager.isConnected()) {
            alert('Please connect to MQTT broker first before starting simulation');
            return;
        }
        
        try {
            this.uwbSimulator.start();
            this.updateSimulationStatus();
            this.appCore.updateStatusIndicator();
            eventBus.emit('simulation-started');
        } catch (error) {
            console.error('❌ Failed to start simulation:', error);
            alert('Failed to start simulation. Check console for details.');
        }
    }

    /**
     * Stop simulation
     */
    stopSimulation() {
        if (this.uwbSimulator) {
            this.uwbSimulator.stop();
            this.updateSimulationStatus();
            this.appCore.updateStatusIndicator();
            eventBus.emit('simulation-stopped');
        }
    }

    /**
     * Set up MQTT connection handler to auto-open simulation pane
     */
    setupMQTTConnectionHandler() {
        // Wait for visualizer to be fully initialized
        setTimeout(() => {
            if (this.appCore.visualizer && this.appCore.visualizer.mqttManager) {
                // Store the original onConnect callback
                const originalOnConnect = this.appCore.visualizer.mqttManager.onConnect;
                
                // Override the onConnect callback to include simulation pane opening
                this.appCore.visualizer.mqttManager.onConnect = () => {
                    // Call the original callback first
                    if (originalOnConnect) {
                        originalOnConnect.call(this.appCore.visualizer.mqttManager);
                    }
                    
                    // Auto-open simulation pane when connected
                    setTimeout(() => this.autoOpenSimulationPane(), 500);
                    eventBus.emit('mqtt-connected');
                };
            }
        }, 1000);
    }

    /**
     * Auto-open simulation pane when MQTT connects
     */
    autoOpenSimulationPane() {
        const simulationHeader = document.querySelector('[data-section="simulation"] .control-group-header');
        const simulationContent = document.querySelector('[data-section="simulation"] .control-group-content');
        const collapseToggle = document.querySelector('[data-section="simulation"] .collapse-toggle');

        if (simulationHeader && simulationContent && collapseToggle) {
            // Open the simulation pane
            simulationContent.classList.remove('collapsed');
            collapseToggle.classList.remove('collapsed');
            collapseToggle.textContent = '▼';

            console.log('🎭 Simulation pane auto-opened after MQTT connection');
        }
    }

    /**
     * Update simulation status display
     */
    updateSimulationStatus() {
        const statusElement = document.getElementById('simulationStatus');
        if (!statusElement || !this.uwbSimulator) return;

        const stats = this.uwbSimulator.getStats();

        if (stats.running) {
//            statusElement.textContent = `🎭 Running: ${stats.messagesPublished} msgs, ${stats.averageRate.toFixed(2)} msg/s, ${stats.currentInterval}s interval`;
//            statusElement.classList.add('active');
        } else {
            statusElement.textContent = '🎭 Simulation: Ready';
            statusElement.classList.remove('active');
        }
    }

    /**
     * Start periodic status updates
     */
    startStatusUpdates() {
        this.statusUpdateInterval = setInterval(() => {
            if (this.uwbSimulator?.isRunning()) {
                this.updateSimulationStatus();
            }
        }, 2000); // Update every 2 seconds when simulation is running
    }

    /**
     * Handle MQTT connected event
     */
    onMQTTConnected() {
        console.log('🎭 Simulation manager: MQTT connected');
    }

    /**
     * Handle MQTT disconnected event
     */
    onMQTTDisconnected() {
        console.log('🎭 Simulation manager: MQTT disconnected');
        if (this.uwbSimulator?.isRunning()) {
            this.stopSimulation();
        }
    }

    /**
     * Check if simulation is running
     */
    isRunning() {
        return this.uwbSimulator?.isRunning() || false;
    }

    /**
     * Get simulation statistics
     */
    getStats() {
        return this.uwbSimulator ? this.uwbSimulator.getStats() : {
            running: false,
            messagesPublished: 0,
            averageRate: 0,
            currentInterval: 1
        };
    }

    /**
     * Get UWB simulator instance
     */
    getSimulator() {
        return this.uwbSimulator;
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.statusUpdateInterval) {
            clearInterval(this.statusUpdateInterval);
            this.statusUpdateInterval = null;
        }
        
        if (this.uwbSimulator?.isRunning()) {
            this.stopSimulation();
        }
    }
}

window.AppSimulationManager = AppSimulationManager;