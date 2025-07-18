/**
 * UWB Position Visualiser - GPS Management
 * Handles GPS and mapping integration
 */

class AppGPSManager {
    constructor(appCore) {
        this.appCore = appCore;
        this.gpsUtils = null;
        this.mapManager = null;
    }

    /**
     * Initialize GPS and map functionality
     */
    async initialize() {
        // eslint-disable-next-line no-undef
        this.gpsUtils = new GPSUtils();
        // eslint-disable-next-line no-undef
        this.mapManager = new MapManager();
        this.setupGPSControls();
        this.setupMapIntegration();
        console.log('🗺️ GPS and Map functionality initialized');
    }

    /**
     * Set up GPS controls
     */
    setupGPSControls() {
        // Update GPS button
        const updateGPSBtn = document.getElementById('updateGatewayGPS');
        if (updateGPSBtn) {
            updateGPSBtn.addEventListener('click', () => this.updateGatewayGPS());
        }
        // UWB scale control
        const uwbScaleSlider = document.getElementById('uwbScaleSlider');
        const uwbScaleValue = document.getElementById('uwbScaleValue');
        if (uwbScaleSlider && uwbScaleValue) {
            uwbScaleSlider.addEventListener('input', (e) => {
                const scale = parseFloat(e.target.value);
                uwbScaleValue.textContent = scale.toFixed(1);
                if (this.mapManager) {
                    this.mapManager.setUWBScale(scale);
                }
            });
        }
    }

    /**
     * Set up map integration with visualizer
     */
    setupMapIntegration() {
        // Wait for visualizer to be ready
        setTimeout(() => {
            if (this.mapManager && this.appCore.visualizer) {
                this.mapManager.setVisualizer(this.appCore.visualizer);
                console.log('🗺️ Map manager integrated with visualizer');                
                this.hookVisualizerEvents();
            }
        }, 100);
    }

    /**
     * Hook into visualizer events for map updates
     */
    hookVisualizerEvents() {
        // Hook into visualizer's message processing
        const originalProcessMessage = this.appCore.visualizer.processMessage;
        this.appCore.visualizer.processMessage = (message) => {
            const result = originalProcessMessage.call(this.appCore.visualizer, message);           
            // Update map if in map view
            if (this.mapManager && this.appCore.viewManager?.getCurrentView() === 'map') {
                setTimeout(() => {
                    this.mapManager.updateAllNodesOnMap();
                }, 100);
            }           
            return result;
        };       
        // Hook into visualizer's clear nodes
        const originalClearAllNodes = this.appCore.visualizer.clearAllNodes;
        this.appCore.visualizer.clearAllNodes = () => {
            const result = originalClearAllNodes.call(this.appCore.visualizer);           
            // Clear map nodes
            if (this.mapManager) {
                this.mapManager.clearAllNodes();
            }
            
            return result;
        };
    }
    /**
     * Update gateway GPS position
     */
    updateGatewayGPS() {
        const latInput = document.getElementById('gatewayLat');
        const lngInput = document.getElementById('gatewayLng');
 
        if (latInput && lngInput) {
            const lat = parseFloat(latInput.value);
            const lng = parseFloat(lngInput.value);

            if (this.gpsUtils && this.gpsUtils.isValidGPS(lat, lng)) {
                // Update map manager
                if (this.mapManager) {
                    this.mapManager.updateGatewayPosition(lat, lng);
                }

                // Update simulator with GPS data
                const simulator = this.appCore.simulationManager?.getSimulator();
                if (simulator) {
                    simulator.updateGatewayGPS(lat, lng, 25); // 25m altitude default
                }

                console.log(`🗺️ Gateway GPS updated to: ${lat}, ${lng}`);
                eventBus.emit('gps-updated', { lat, lng }); // eslint-disable-line no-undef
            } else {
                alert('Invalid GPS coordinates. Please check latitude and longitude values.'); // eslint-disable-line no-alert
            }
        }
    }

    /**
     * Show map view
     */
    showMapView() {
        if (this.mapManager) {
            if (!this.mapManager.visualizer && this.appCore.visualizer) {
                this.mapManager.setVisualizer(this.appCore.visualizer);
            }
            this.mapManager.showMapView();
        }
    }

    /**
     * Hide map view
     */
    hideMapView() {
        if (this.mapManager) {
            this.mapManager.hideMapView();
        }
    }

    /**
     * Get GPS utilities
     */
    getGPSUtils() {
        return this.gpsUtils;
    }

    /**
     * Get map manager
     */
    getMapManager() {
        return this.mapManager;
    }

    /**
     * Get GPS statistics
     */
    getStats() {
        return {
            gpsUtilsAvailable: !!this.gpsUtils,
            mapManagerAvailable: !!this.mapManager,
            mapIntegrated: !!(this.mapManager && this.mapManager.visualizer)
        };
    }
}

window.AppGPSManager = AppGPSManager;
