/**
 * UWB Position Visualiser - Application Core
 * Main application coordination and initialization
 * Part of the INST Project - Instantly Networked Smart Triage
 */

class AppCore {
    constructor() {
        this.version = "4.0";
        this.visualizer = null;
        this.initialized = false;
        
        // Sub-managers
        this.simulationManager = null;
        this.gpsManager = null;
        this.viewManager = null;
        this.controlsManager = null;
        this.utilsManager = null;
    }

    /**
     * Initialize the application
     */
    async initialize() {
        if (this.initialized) {
            console.warn('⚠️ App already initialized');
            return;
        }

        console.log('🚀 Initializing UWB Position Visualiser v4.0 - INST Crisis Response...');

        try {
            // Initialize core visualizer first
            // eslint-disable-next-line no-undef
            this.visualizer = new UWBVisualizer();
            
            // Initialize sub-managers
            // eslint-disable-next-line no-undef
            this.gpsManager = new AppGPSManager(this);
            // eslint-disable-next-line no-undef
            this.viewManager = new AppViewManager(this);
            // eslint-disable-next-line no-undef
            this.simulationManager = new AppSimulationManager(this);
            // eslint-disable-next-line no-undef
            this.controlsManager = new AppControlsManager(this);
            // eslint-disable-next-line no-undef
            this.utilsManager = new AppUtilsManager(this);

            // Initialize all managers
            await this.initializeManagers();

            // Set up event listeners
            this.setupEventListeners();

            // Log initialization complete
            this.logInitializationComplete();

            this.initialized = true;
            console.log('✅ UWB Position Visualiser v4.0 ready for crisis operations!');

        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            throw error;
        }
    }

    /**
     * Initialize all sub-managers
     */
    async initializeManagers() {
        // Initialize GPS and mapping first
        await this.gpsManager.initialize();
        
        // Initialize view management
        this.viewManager.initialize();
        
        // Initialize simulation after visualizer is ready
        if (this.visualizer && this.visualizer.mqttManager) {
            this.simulationManager.initialize();
        } else {
            console.error('❌ Failed to initialize simulation - MQTT Manager not available');
        }
        
        // Initialize controls
        this.controlsManager.initialize();
        
        // Initialize utilities
        this.utilsManager.initialize();
    }

    /**
     * Set up event listeners for inter-manager communication
     */
    setupEventListeners() {
        // MQTT connection events
        // eslint-disable-next-line no-undef
        eventBus.on('mqtt-connected', () => {
            this.simulationManager.onMQTTConnected();
        });

        // eslint-disable-next-line no-undef
        eventBus.on('mqtt-disconnected', () => {
            this.simulationManager.onMQTTDisconnected();
        });

        // View switching events
        // eslint-disable-next-line no-undef
        eventBus.on('view-switched', (data) => {
            console.log(`🔄 View switched to: ${data.view}`);
        });

        // Simulation events
        // eslint-disable-next-line no-undef
        eventBus.on('simulation-started', () => {
            this.updateStatusIndicator();
        });

        // eslint-disable-next-line no-undef
        eventBus.on('simulation-stopped', () => {
            this.updateStatusIndicator();
        });

        // GPS events
        // eslint-disable-next-line no-undef
        eventBus.on('gps-updated', (data) => {
            console.log(`🗺️ GPS updated: ${data.lat}, ${data.lng}`);
        });
    }

    /**
     * Update status indicator to show simulation state
     */
    updateStatusIndicator() {
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        
        if (!statusIndicator || !statusText) return;
        
        // Clear existing classes
        statusIndicator.classList.remove('connected', 'simulating');
        
        if (this.simulationManager?.isRunning()) {
            statusIndicator.classList.add('simulating');
            statusText.textContent = 'Simulating';
        } else if (this.visualizer?.mqttManager.isConnected()) {
            statusIndicator.classList.add('connected');
            statusText.textContent = 'Connected';
        } else {
            statusText.textContent = 'Disconnected';
        }
    }

    /**
     * Log initialization completion messages
     */
    logInitializationComplete() {
        console.log('🚨 INST Project: Instantly Networked Smart Triage - Crisis Response System');
        console.log('💫 Funded by ESA & UKSA through BASS Programme for crisis response');
        console.log('🎯 Mission: Save lives in Mass Casualty Incidents through real-time casualty tracking');
        console.log('🏗️ v4.0: Enhanced Map Visualization with improved controls');
        console.log('🎭 New Feature: Single toggle view switching and improved map scaling');
        console.log('🚨 Crisis features: Casualty tracking, INST network integration, tactical displays');
        console.log('📱 Mobile optimised: Touch-friendly crisis controls and prioritised casualty display');
        console.log('⚡ Ultra-Fast Physics: 100x speed optimisation for instant crisis positioning');
        console.log('🛰️ INST Integration: Satellite-enabled crisis response system ready');
        console.log('🏗️ Modular Architecture: Separated components for better maintainability');
        console.log('🎭 Simulation Ready: Built-in UWB data simulation with realistic movement patterns');
        console.log('🗺️ GPS & Mapping: Enhanced map visualization with improved scaling');
        console.log('💡 Crisis commands: crisisUtils.maximiseCasualtyView() for tactical display');
        console.log('🎯 Use crisisUtils.getCrisisStatus() for crisis system status');
        console.log('🎪 Simulation commands: crisisUtils.startSimulation() / .stopSimulation()');
        console.log('');
        console.log('🚨 INST Mission: "Every second counts. Every life matters. Every position is precisely known."');
    }

    /**
     * Get application statistics
     */
    getStats() {
        return {
            version: this.version,
            initialized: this.initialized,
            visualizer: this.visualizer ? this.visualizer.getStats() : null,
            simulation: this.simulationManager ? this.simulationManager.getStats() : null,
            gps: this.gpsManager ? this.gpsManager.getStats() : null,
            view: this.viewManager ? this.viewManager.getStats() : null
        };
    }

    /**
     * Get visualizer instance
     */
    getVisualizer() {
        return this.visualizer;
    }

    /**
     * Get simulation manager
     */
    getSimulationManager() {
        return this.simulationManager;
    }

    /**
     * Get GPS manager
     */
    getGPSManager() {
        return this.gpsManager;
    }

    /**
     * Get view manager
     */
    getViewManager() {
        return this.viewManager;
    }

    /**
     * Get utils manager
     */
    getUtilsManager() {
        return this.utilsManager;
    }
}

window.AppCore = AppCore;