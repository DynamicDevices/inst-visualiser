/**
 * Core Map Manager - Simplified and Modular
 * Main coordination class for map functionality
 */

class MapManager {
    constructor() {
        this.map = null;
        this.gpsUtils = new GPSUtils();
        this.gatewayPosition = AppConfig.map.defaultPosition;
        this.isMapView = false;
        this.mapContainer = null;
        this.visualizer = null;
        this.physicsUpdateInterval = null;
        this.gpsAnchors = new Map();
        this.autoFitEnabled = true;
        this.lastNodeCount = 0;
        this.lastBounds = null;
        this.autoFitDebounceTimeout = null;
        this.movementThreshold = AppConfig.map.movementThreshold;

        // Initialize sub-managers
        this.markers = new MapMarkerManager(this);
        this.scaling = new MapScalingManager(this);
        
        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        eventBus.on('uwb-scale-updated', (data) => {
            if (this.isMapView) {
                this.updatePhysicsBasedPositions();
            }
        });

        eventBus.on('physics-scale-updated', (data) => {
            // Scale has been updated, positions may need refreshing
        });
    }

    /**
     * Initialize the map
     */
    initializeMap() {
        const mapContainer = document.getElementById('mapContainer');
        if (!mapContainer) {
            console.error('❌ Map container not found');
            return false;
        }

        this.mapContainer = mapContainer;

        try {
            this.map = L.map('mapContainer', {
                center: [this.gatewayPosition.lat, this.gatewayPosition.lng],
                zoom: AppConfig.map.defaultZoom,
                zoomControl: true,
                attributionControl: true,
                scaleControl: false
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: AppConfig.map.maxZoom
            }).addTo(this.map);

            this.scaling.addCustomScaleControl();

            console.log('🗺️ Map initialized successfully');
            eventBus.emit('map-initialized', { map: this.map });
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize map:', error);
            return false;
        }
    }

    /**
     * Show map view
     */
    showMapView() {
        if (!this.map && !this.initializeMap()) {
            console.error('❌ Failed to initialize map for map view');
            return;
        }

        this.isMapView = true;
        
        if (this.mapContainer) {
            this.mapContainer.classList.remove('hidden');
        }

        setTimeout(() => {
            if (this.map) {
                this.map.invalidateSize();
                this.updateAllNodesOnMap();
                this.startPhysicsPositioning();
                
                setTimeout(() => this.fitMapToNodes(), 500);
            }
        }, 100);

        eventBus.emit('map-view-shown');
        console.log('🗺️ Map view activated');
    }

    /**
     * Hide map view
     */
    hideMapView() {
        this.isMapView = false;
        
        if (this.mapContainer) {
            this.mapContainer.classList.add('hidden');
        }

        this.stopPhysicsPositioning();
        eventBus.emit('map-view-hidden');
        console.log('🗺️ Map view deactivated');
    }

    /**
     * Set visualizer reference
     */
    setVisualizer(visualizer) {
        this.visualizer = visualizer;
        console.log('🗺️ Visualizer reference set in MapManager');
    }

    /**
     * Start physics positioning updates
     */
    startPhysicsPositioning() {
        if (this.physicsUpdateInterval) {
            clearInterval(this.physicsUpdateInterval);
        }

        this.physicsUpdateInterval = setInterval(() => {
            this.updatePhysicsBasedPositions();
        }, AppConfig.map.updateInterval);

        console.log('🗺️ Physics positioning started for map view');
    }

    /**
     * Stop physics positioning updates
     */
    stopPhysicsPositioning() {
        if (this.physicsUpdateInterval) {
            clearInterval(this.physicsUpdateInterval);
            this.physicsUpdateInterval = null;
        }
        
        if (this.autoFitDebounceTimeout) {
            clearTimeout(this.autoFitDebounceTimeout);
            this.autoFitDebounceTimeout = null;
        }
        
        console.log('🗺️ Physics positioning stopped');
    }

    /**
     * Update physics-based positions
     */
    updatePhysicsBasedPositions() {
        if (!this.visualizer || !this.visualizer.nodes) return;

        this.updateGPSAnchors();
        this.updateUWBNodesWithPhysics();
        this.markers.updateConnectionLines(this.visualizer.connections);
        
        if (this.autoFitEnabled && this.shouldAutoFit()) {
            this.debouncedAutoFit();
        }
    }

    /**
     * Update GPS anchor nodes
     */
    updateGPSAnchors() {
        if (!this.visualizer || !this.visualizer.nodes) return;

        this.visualizer.nodes.forEach((node, nodeId) => {
            if (node.gps || (nodeId === 'B5A4' && this.gatewayPosition)) {
                const gpsCoords = node.gps || this.gatewayPosition;
                
                this.gpsAnchors.set(nodeId, {
                    lat: gpsCoords.lat,
                    lng: gpsCoords.lng,
                    nodeId: nodeId
                });

                this.updateNodeOnMap(nodeId, node);
            }
        });
    }

    /**
     * Update UWB nodes with physics
     */
    updateUWBNodesWithPhysics() {
        if (!this.visualizer || !this.visualizer.physics || this.gpsAnchors.size === 0) return;

        const physicsNodes = this.getPhysicsNodes();
        if (physicsNodes.size === 0) return;
        
        const referenceAnchor = this.gpsAnchors.get('B5A4') || this.gpsAnchors.values().next().value;
        if (!referenceAnchor) return;

        const referencePhysicsPos = physicsNodes.get(referenceAnchor.nodeId);
        if (!referencePhysicsPos) return;

        this.scaling.calculatePhysicsScale(physicsNodes, this.visualizer.connections);

        this.visualizer.nodes.forEach((node, nodeId) => {
            if (!this.gpsAnchors.has(nodeId)) {
                const physicsPos = physicsNodes.get(nodeId);
                if (physicsPos) {
                    const deltaXPhysics = physicsPos.x - referencePhysicsPos.x;
                    const deltaYPhysics = physicsPos.y - referencePhysicsPos.y;
                    
                    const { deltaXMeters, deltaYMeters } = this.scaling.physicsToGPSOffset(
                        deltaXPhysics, deltaYPhysics
                    );

                    const newGPS = this.gpsUtils.offsetGPS(
                        referenceAnchor.lat,
                        referenceAnchor.lng,
                        deltaXMeters,
                        deltaYMeters
                    );

                    this.updateNodeOnMap(nodeId, { ...node, gps: newGPS });
                }
            }
        });
    }

    /**
     * Get physics node positions
     */
    getPhysicsNodes() {
        const physicsNodes = new Map();
        
        if (this.visualizer.nodes) {
            this.visualizer.nodes.forEach((node, nodeId) => {
                if (node.x !== undefined && node.y !== undefined) {
                    physicsNodes.set(nodeId, { x: node.x, y: node.y });
                }
            });
        }
        
        return physicsNodes;
    }

    /**
     * Update node on map
     */
    updateNodeOnMap(nodeId, node) {
        if (!this.map || !this.isMapView) return;

        let gpsCoords = node.gps;
        if (!gpsCoords && nodeId === 'B5A4') {
            gpsCoords = this.gatewayPosition;
        }

        if (!gpsCoords || !this.gpsUtils.isValidGPS(gpsCoords.lat, gpsCoords.lng)) {
            return;
        }

        this.markers.updateNodeMarker(nodeId, node, gpsCoords);
    }

    /**
     * Update all nodes on map
     */
    updateAllNodesOnMap() {
        if (!this.visualizer || !this.visualizer.nodes || !this.map) return;

        this.visualizer.nodes.forEach((node, nodeId) => {
            this.updateNodeOnMap(nodeId, node);
        });

        console.log(`🗺️ Updated ${this.visualizer.nodes.size} nodes on map`);
        
        if (this.autoFitEnabled && this.markers.nodeMarkers.size > 0) {
            this.debouncedAutoFit();
        }
    }

    /**
     * Fit map to nodes
     */
    fitMapToNodes() {
        if (!this.map || !this.isMapView || this.markers.nodeMarkers.size === 0) return;

        try {
            const markerArray = Array.from(this.markers.nodeMarkers.values());
            const group = new L.featureGroup(markerArray);
            const bounds = group.getBounds();
            
            const mapSize = this.map.getSize();
            const paddingX = Math.max(30, mapSize.x * 0.1);
            const paddingY = Math.max(30, mapSize.y * 0.1);
            
            this.map.fitBounds(bounds, {
                padding: [paddingY, paddingX],
                maxZoom: AppConfig.map.maxZoom,
                animate: true,
                duration: AppConfig.map.animationDuration,
                easeLinearity: 0.1
            });
            
            console.log(`🗺️ Map fitted to ${this.markers.nodeMarkers.size} nodes`);
            
        } catch (error) {
            console.error('🗺️ Error fitting map to nodes:', error);
        }
    }

    /**
     * Debounced auto-fit
     */
    debouncedAutoFit() {
        if (this.autoFitDebounceTimeout) {
            clearTimeout(this.autoFitDebounceTimeout);
        }
        
        this.autoFitDebounceTimeout = setTimeout(() => {
            this.fitMapToNodes();
            this.autoFitDebounceTimeout = null;
        }, AppConfig.map.autoFitDebounce);
    }

    /**
     * Check if auto-fit should be triggered
     */
    shouldAutoFit() {
        if (this.markers.nodeMarkers.size !== this.lastNodeCount) {
            this.lastNodeCount = this.markers.nodeMarkers.size;
            return true;
        }

        if (this.markers.nodeMarkers.size > 0) {
            const currentBounds = this.getNodeBounds();
            if (!this.lastBounds || this.boundsChanged(this.lastBounds, currentBounds)) {
                this.lastBounds = currentBounds;
                return true;
            }
        }

        return false;
    }

    /**
     * Get node bounds
     */
    getNodeBounds() {
        if (this.markers.nodeMarkers.size === 0) return null;

        let minLat = Infinity, maxLat = -Infinity;
        let minLng = Infinity, maxLng = -Infinity;

        this.markers.nodeMarkers.forEach(marker => {
            const pos = marker.getLatLng();
            minLat = Math.min(minLat, pos.lat);
            maxLat = Math.max(maxLat, pos.lat);
            minLng = Math.min(minLng, pos.lng);
            maxLng = Math.max(maxLng, pos.lng);
        });

        return { minLat, maxLat, minLng, maxLng };
    }

    /**
     * Check if bounds changed
     */
    boundsChanged(oldBounds, newBounds) {
        if (!oldBounds || !newBounds) return true;

        return Math.abs(oldBounds.minLat - newBounds.minLat) > this.movementThreshold ||
               Math.abs(oldBounds.maxLat - newBounds.maxLat) > this.movementThreshold ||
               Math.abs(oldBounds.minLng - newBounds.minLng) > this.movementThreshold ||
               Math.abs(oldBounds.maxLng - newBounds.maxLng) > this.movementThreshold;
    }

    /**
     * Update gateway position
     */
    updateGatewayPosition(lat, lng) {
        this.gatewayPosition = { lat, lng };

        if (this.map && this.markers.nodeMarkers.has('B5A4')) {
            const marker = this.markers.nodeMarkers.get('B5A4');
            marker.setLatLng([lat, lng]);
        }
        
        this.debouncedAutoFit();
        console.log(`🗺️ Gateway position updated to: ${lat}, ${lng}`);
    }

    /**
     * Set UWB scale
     */
    setUWBScale(scale) {
        this.scaling.setUWBScale(scale);
        
        if (this.isMapView) {
            this.updatePhysicsBasedPositions();
        }
    }

    /**
     * Clear all nodes
     */
    clearAllNodes() {
        this.markers.clearAllMarkers();
        this.gpsAnchors.clear();
        this.lastNodeCount = 0;
        this.lastBounds = null;
        this.scaling.physicsToMetersScale = 1.0;
    }

    /**
     * Get map statistics
     */
    getMapStats() {
        return {
            initialized: !!this.map,
            visible: this.isMapView,
            ...this.markers.getStats(),
            ...this.scaling.getStats(),
            gpsAnchors: this.gpsAnchors.size,
            center: this.map ? this.map.getCenter() : null,
            zoom: this.map ? this.map.getZoom() : null,
            autoFitEnabled: this.autoFitEnabled
        };
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopPhysicsPositioning();
        this.clearAllNodes();
        this.scaling.removeScaleControl();
        
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }
}

window.MapManager = MapManager;