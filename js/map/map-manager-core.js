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

        // Tile layer management
        this.currentTileLayer = null;
        this.tileLayerType = 'standard'; // Current active layer type
        this.tileLayers = {};
        this.autoSwitchEnabled = true; // Enable automatic switching
        this.tileLoadErrors = new Map(); // Track tile load errors

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

        eventBus.on('visualization-maximized', (data) => {
            this.handleVisualizationMaximize(data.maximized);
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
                scaleControl: false,
                maxZoom: 25 // Increased max zoom for ~0.5m resolution
            });

            // Initialize tile layers
            this.initializeTileLayers();

            // Add default tile layer
            this.currentTileLayer = this.tileLayers.standard;
            this.currentTileLayer.addTo(this.map);

            // Set up automatic tile switching
            this.setupAutoTileSwitching();

            this.scaling.addCustomScaleControl();
            this.addTileLayerSelector();
            this.addAutoZoomToggle();
            this.addDistanceLabelToggle();

            console.log('🗺️ Map initialized successfully with max zoom 25');
            eventBus.emit('map-initialized', { map: this.map });
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize map:', error);
            return false;
        }
    }

    /**
     * Initialize all available tile layers (removed offline option)
     */
    initializeTileLayers() {
        // Standard OpenStreetMap tiles
        this.tileLayers.standard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
            errorTileUrl: this.createFallbackTile('No Data')
        });

        // Google Satellite
        this.tileLayers.satellite = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            attribution: '© Google',
            maxZoom: 25,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
            errorTileUrl: this.createFallbackTile('No Imagery')
        });

        // Google Hybrid (satellite + labels)
        this.tileLayers.hybrid = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
            attribution: '© Google',
            maxZoom: 25,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
            errorTileUrl: this.createFallbackTile('No Imagery')
        });

        // CartoDB Positron (clean, minimal)
        this.tileLayers.positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap © CartoDB',
            maxZoom: 20,
            subdomains: 'abcd',
            errorTileUrl: this.createFallbackTile('No Data')
        });

        // CartoDB Dark Matter
        this.tileLayers.dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap © CartoDB',
            maxZoom: 20,
            subdomains: 'abcd',
            errorTileUrl: this.createFallbackTile('No Data', '#333')
        });

        // OpenTopoMap
        this.tileLayers.topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)',
            maxZoom: 17,
            subdomains: 'abc',
            errorTileUrl: this.createFallbackTile('No Topo')
        });

        // Stamen Toner (high contrast)
        this.tileLayers.toner = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}{r}.png', {
            attribution: 'Map tiles by Stamen Design, CC BY 3.0 — Map data © OpenStreetMap contributors',
            maxZoom: 20,
            subdomains: 'abcd',
            errorTileUrl: this.createFallbackTile('No Data')
        });

        // Esri World Imagery
        this.tileLayers.esri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
            maxZoom: 19,
            errorTileUrl: this.createFallbackTile('No Imagery')
        });

        // Wikimedia Maps (fallback layer - most reliable)
        this.tileLayers.wikimedia = L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors, Wikimedia maps',
            maxZoom: 19,
            errorTileUrl: this.createFallbackTile('Fallback')
        });

        // Set up error handling for all layers
        Object.keys(this.tileLayers).forEach(layerType => {
            this.tileLayers[layerType].on('tileerror', (e) => {
                this.handleTileError(layerType, e);
            });
        });
    }

    /**
     * Create a fallback tile (simplified grey tile for errors only)
     */
    createFallbackTile(text = '', bgColor = '#f0f0f0', textColor = '#999') {
        const svg = `<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
            <rect width="256" height="256" fill="${bgColor}"/>
            <text x="128" y="128" text-anchor="middle" dy=".3em" font-family="Arial" font-size="10" fill="${textColor}">${text}</text>
        </svg>`;
        return 'data:image/svg+xml;base64,' + btoa(svg);
    }

    /**
     * Get tile layer options for dropdown (removed offline option)
     */
    getTileLayerOptions() {
        return {
            'standard': { name: '🗺️ Standard (OSM)', description: 'OpenStreetMap standard tiles' },
            'satellite': { name: '🛰️ Satellite', description: 'Google satellite imagery' },
            'hybrid': { name: '🌍 Hybrid', description: 'Satellite with labels' },
            'positron': { name: '⚪ Light', description: 'Clean minimal style' },
            'dark': { name: '⚫ Dark', description: 'Dark theme' },
            'topo': { name: '🏔️ Topographic', description: 'Topographic map' },
            'toner': { name: '🔲 High Contrast', description: 'Black and white' },
            'esri': { name: '🌐 Esri Imagery', description: 'Esri satellite imagery' },
            'wikimedia': { name: '📖 Wikimedia', description: 'Reliable fallback tiles' }
        };
    }

    /**
     * Add tile layer selector dropdown
     */
    addTileLayerSelector() {
        if (!this.map) return;

        const mapManager = this;
        const tileOptions = this.getTileLayerOptions();

        // Create tile selector control
        const TileSelectorControl = L.Control.extend({
            onAdd: function(map) {
                const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom tile-selector-control');
                
                // Create dropdown select
                const select = L.DomUtil.create('select', 'tile-selector', container);
                select.style.backgroundColor = 'white';
                select.style.border = 'none';
                select.style.padding = '5px';
                select.style.fontSize = '12px';
                select.style.cursor = 'pointer';
                select.style.minWidth = '120px';

                // Add options
                Object.keys(tileOptions).forEach(layerType => {
                    const option = document.createElement('option');
                    option.value = layerType;
                    option.textContent = tileOptions[layerType].name;
                    option.title = tileOptions[layerType].description;
                    if (layerType === mapManager.tileLayerType) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });

                // Handle selection change
                L.DomEvent.on(select, 'change', function(e) {
                    L.DomEvent.stopPropagation(e);
                    const selectedType = e.target.value;
                    mapManager.switchToTileLayer(selectedType, false);
                });

                // Prevent map interaction when using dropdown
                L.DomEvent.disableClickPropagation(container);
                L.DomEvent.disableScrollPropagation(container);

                return container;
            }
        });

        // Add control to map
        this.tileSelectorControl = new TileSelectorControl({ position: 'topright' });
        this.tileSelectorControl.addTo(this.map);
        
        console.log('🗺️ Tile layer selector added to map');
    }

    /**
     * Add auto-zoom toggle control
     */
    addAutoZoomToggle() {
        if (!this.map) return;

        const mapManager = this;

        // Create auto-zoom toggle control
        const AutoZoomToggleControl = L.Control.extend({
            onAdd: function(map) {
                const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom auto-zoom-control');
                
                const button = L.DomUtil.create('a', 'auto-zoom-toggle', container);
                button.href = '#';
                button.title = mapManager.autoFitEnabled ? 'Disable Auto-Zoom' : 'Enable Auto-Zoom';
                button.innerHTML = mapManager.autoFitEnabled ? '🔒' : '🔓';
                button.style.backgroundColor = mapManager.autoFitEnabled ? '#e8f5e8' : '#f5f5f5';
                button.style.width = '30px';
                button.style.height = '30px';
                button.style.lineHeight = '30px';
                button.style.textAlign = 'center';
                button.style.textDecoration = 'none';
                button.style.color = '#333';
                button.style.fontSize = '16px';
                button.style.cursor = 'pointer';

                L.DomEvent.on(button, 'click', function(e) {
                    L.DomEvent.stopPropagation(e);
                    L.DomEvent.preventDefault(e);
                    mapManager.toggleAutoZoom();
                });

                // Prevent map interaction when clicking the button
                L.DomEvent.disableClickPropagation(container);

                return container;
            }
        });

        // Add control to map (below tile selector)
        this.autoZoomToggleControl = new AutoZoomToggleControl({ position: 'topright' });
        this.autoZoomToggleControl.addTo(this.map);
        
        console.log('🗺️ Auto-zoom toggle added to map');
    }

    /**
     * Add distance label toggle control
     */
    addDistanceLabelToggle() {
        if (!this.map) return;

        const mapManager = this;

        // Create distance label toggle control
        const DistanceLabelToggleControl = L.Control.extend({
            onAdd: function(map) {
                const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom distance-label-control');
                
                const button = L.DomUtil.create('a', 'distance-label-toggle', container);
                button.href = '#';
                button.title = mapManager.markers.showDistanceLabels ? 'Hide Distance Labels' : 'Show Distance Labels';
                button.innerHTML = mapManager.markers.showDistanceLabels ? '📏' : '📐';
                button.style.backgroundColor = mapManager.markers.showDistanceLabels ? '#e8f5e8' : '#f5f5f5';
                button.style.width = '30px';
                button.style.height = '30px';
                button.style.lineHeight = '30px';
                button.style.textAlign = 'center';
                button.style.textDecoration = 'none';
                button.style.color = '#333';
                button.style.fontSize = '16px';
                button.style.cursor = 'pointer';

                L.DomEvent.on(button, 'click', function(e) {
                    L.DomEvent.stopPropagation(e);
                    L.DomEvent.preventDefault(e);
                    mapManager.toggleDistanceLabels();
                });

                // Prevent map interaction when clicking the button
                L.DomEvent.disableClickPropagation(container);

                return container;
            }
        });

        // Add control to map (below auto-zoom toggle)
        this.distanceLabelToggleControl = new DistanceLabelToggleControl({ position: 'topright' });
        this.distanceLabelToggleControl.addTo(this.map);
        
        console.log('🗺️ Distance label toggle added to map');
    }

    /**
     * Toggle auto-zoom functionality
     */
    toggleAutoZoom() {
        this.autoFitEnabled = !this.autoFitEnabled;
        
        // Update button appearance
        this.updateAutoZoomToggle();
        
        // Cancel any pending auto-fit
        if (!this.autoFitEnabled && this.autoFitDebounceTimeout) {
            clearTimeout(this.autoFitDebounceTimeout);
            this.autoFitDebounceTimeout = null;
        }
        
        const status = this.autoFitEnabled ? 'enabled' : 'disabled';
        console.log(`🗺️ Auto-zoom ${status}`);
        
        // Emit event for other components
        eventBus.emit('auto-zoom-toggled', { enabled: this.autoFitEnabled });
    }

    /**
     * Update auto-zoom toggle button appearance
     */
    updateAutoZoomToggle() {
        if (!this.autoZoomToggleControl) return;

        const button = this.autoZoomToggleControl.getContainer().querySelector('.auto-zoom-toggle');
        if (button) {
            button.innerHTML = this.autoFitEnabled ? '🔒' : '🔓';
            button.title = this.autoFitEnabled ? 'Disable Auto-Zoom (Currently: ON)' : 'Enable Auto-Zoom (Currently: OFF)';
            button.style.backgroundColor = this.autoFitEnabled ? '#e8f5e8' : '#f5f5f5';
        }
    }

    /**
     * Toggle distance label visibility
     */
    toggleDistanceLabels() {
        this.markers.toggleDistanceLabels();
        this.updateDistanceLabelToggle();
    }

    /**
     * Update distance label toggle button appearance
     */
    updateDistanceLabelToggle() {
        if (!this.distanceLabelToggleControl) return;

        const button = this.distanceLabelToggleControl.getContainer().querySelector('.distance-label-toggle');
        if (button) {
            button.innerHTML = this.markers.showDistanceLabels ? '📏' : '📐';
            button.title = this.markers.showDistanceLabels ? 'Hide Distance Labels (Currently: ON)' : 'Show Distance Labels (Currently: OFF)';
            button.style.backgroundColor = this.markers.showDistanceLabels ? '#e8f5e8' : '#f5f5f5';
        }
    }

    /**
     * Handle visualization maximize/restore
     */
    handleVisualizationMaximize(isMaximized) {
        if (!this.map || !this.isMapView) return;

        // Delay to allow CSS transitions to complete
        setTimeout(() => {
            this.map.invalidateSize();
            
            if (this.autoFitEnabled && this.markers.nodeMarkers.size > 0) {
                this.fitMapToNodes();
            }
            
            console.log(`🗺️ Map resized for ${isMaximized ? 'maximized' : 'normal'} view`);
        }, 300);
    }

    /**
     * Set up automatic tile switching based on zoom level and tile availability
     */
    setupAutoTileSwitching() {
        if (!this.map) return;

        this.map.on('zoomend', () => {
            if (this.autoSwitchEnabled) {
                this.checkAndAutoSwitchTiles();
            }
        });

        this.map.on('moveend', () => {
            if (this.autoSwitchEnabled) {
                // Reset error tracking on move to allow retrying
                this.tileLoadErrors.clear();
            }
        });
    }

    /**
     * Check if tiles should be automatically switched based on zoom level
     */
    checkAndAutoSwitchTiles() {
        if (!this.map) return;

        const currentZoom = this.map.getZoom();
        const currentLayer = this.tileLayers[this.tileLayerType];
        const maxZoom = currentLayer?.options?.maxZoom || 18;

        // Auto-switch to high-zoom capable layer at high zoom levels
        if (currentZoom > maxZoom && !['satellite', 'hybrid', 'wikimedia'].includes(this.tileLayerType)) {
            console.log(`🗺️ Auto-switching to satellite view at zoom ${currentZoom} (current max: ${maxZoom})`);
            this.switchToTileLayer('satellite', true);
        }
    }

    /**
     * Handle tile loading errors with Wikimedia fallback
     */
    handleTileError(layerType, errorEvent) {
        const zoom = this.map ? this.map.getZoom() : 0;
        const errorKey = `${layerType}_${zoom}`;
        
        // Track errors
        if (!this.tileLoadErrors.has(errorKey)) {
            this.tileLoadErrors.set(errorKey, 0);
        }
        this.tileLoadErrors.set(errorKey, this.tileLoadErrors.get(errorKey) + 1);

        // If tiles are consistently failing, switch to Wikimedia (most reliable)
        if (this.tileLoadErrors.get(errorKey) > 5 && this.autoSwitchEnabled && 
            layerType === this.tileLayerType && layerType !== 'wikimedia') {
            console.log(`🗺️ ${layerType} tiles failing at zoom ${zoom}, switching to Wikimedia fallback`);
            this.switchToTileLayer('wikimedia', true);
        }
        // If current layer is failing, try satellite as intermediate fallback
        else if (this.tileLoadErrors.get(errorKey) > 3 && this.autoSwitchEnabled && 
                 layerType === this.tileLayerType && layerType !== 'satellite' && layerType !== 'wikimedia') {
            console.log(`🗺️ ${layerType} tiles failing at zoom ${zoom}, auto-switching to satellite`);
            this.switchToTileLayer('satellite', true);
        }
    }

    /**
     * Switch to specific tile layer
     */
    switchToTileLayer(layerType, isAutoSwitch = false) {
        if (!this.map || !this.tileLayers[layerType] || layerType === this.tileLayerType) return;

        // Remove current layer
        if (this.currentTileLayer) {
            this.map.removeLayer(this.currentTileLayer);
        }

        // Switch to new layer
        this.tileLayerType = layerType;
        this.currentTileLayer = this.tileLayers[layerType];
        this.wasAutoSwitched = isAutoSwitch;

        // Add new layer
        this.currentTileLayer.addTo(this.map);

        // Update dropdown selection
        this.updateTileSelector();

        const switchType = isAutoSwitch ? 'Auto-switched' : 'Switched';
        const layerName = this.getTileLayerOptions()[layerType]?.name || layerType;
        console.log(`🗺️ ${switchType} to ${layerName}`);
    }

    /**
     * Update tile selector dropdown to reflect current selection
     */
    updateTileSelector() {
        if (!this.tileSelectorControl) return;

        const select = this.tileSelectorControl.getContainer().querySelector('.tile-selector');
        if (select) {
            select.value = this.tileLayerType;
            
            // Visual indication of auto-switch
            if (this.wasAutoSwitched) {
                if (this.tileLayerType === 'wikimedia') {
                    select.style.backgroundColor = '#ffe6e6'; // Light red for fallback
                } else {
                    select.style.backgroundColor = '#e8f4fd'; // Light blue for other auto-switches
                }
            } else {
                select.style.backgroundColor = 'white';
            }
        }
    }

    /**
     * Legacy method for backward compatibility
     */
    switchTileLayer(isAutoSwitch = false) {
        // Cycle through main tile types for backward compatibility
        const mainTypes = ['standard', 'satellite', 'hybrid'];
        const currentIndex = mainTypes.indexOf(this.tileLayerType);
        const nextIndex = (currentIndex + 1) % mainTypes.length;
        this.switchToTileLayer(mainTypes[nextIndex], isAutoSwitch);
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
                
                // Only auto-fit if enabled
                if (this.autoFitEnabled) {
                    setTimeout(() => this.fitMapToNodes(), 500);
                }
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
     * Update GPS anchor nodes with improved multi-GPS handling
     */
    updateGPSAnchors() {
        if (!this.visualizer || !this.visualizer.nodes) return;

        const previousGPSCount = this.gpsAnchors.size;

        this.visualizer.nodes.forEach((node, nodeId) => {
            if (node.gps || (nodeId === 'B5A4' && this.gatewayPosition)) {
                const gpsCoords = node.gps || this.gatewayPosition;
                
                // Validate GPS coordinates
                if (this.gpsUtils.isValidGPS(gpsCoords.lat, gpsCoords.lng)) {
                    this.gpsAnchors.set(nodeId, {
                        lat: gpsCoords.lat,
                        lng: gpsCoords.lng,
                        nodeId: nodeId,
                        timestamp: Date.now(),
                        accuracy: node.gps?.accuracy || null,
                        isAbsolute: !node.gps?.derived // Mark as absolute if not derived
                    });

                    this.updateNodeOnMap(nodeId, node);
                } else {
                    console.warn(`🗺️ Invalid GPS coordinates for node ${nodeId}:`, gpsCoords);
                }
            }
        });

        // Log GPS anchor changes
        if (this.gpsAnchors.size !== previousGPSCount) {
            console.log(`🗺️ GPS anchors updated: ${this.gpsAnchors.size} nodes with GPS coordinates`);
            this.logGPSAnchors();
        }
    }

    /**
     * Log current GPS anchors for debugging
     */
    logGPSAnchors() {
        if (this.gpsAnchors.size > 0) {
            console.log('🗺️ Current GPS anchors:');
            this.gpsAnchors.forEach((anchor, nodeId) => {
                const type = anchor.isAbsolute ? 'ABSOLUTE' : 'DERIVED';
                console.log(`  ${nodeId}: ${anchor.lat.toFixed(6)}, ${anchor.lng.toFixed(6)} (${type})`);
            });
        }
    }

    /**
     * Update UWB nodes with physics - improved multi-GPS handling
     */
    updateUWBNodesWithPhysics() {
        if (!this.visualizer || !this.visualizer.physics || this.gpsAnchors.size === 0) return;

        const physicsNodes = this.getPhysicsNodes();
        if (physicsNodes.size === 0) return;
        
        // Select best reference anchor (prefer B5A4, then most recent, then first available)
        const referenceAnchor = this.selectBestReferenceAnchor();
        if (!referenceAnchor) return;

        const referencePhysicsPos = physicsNodes.get(referenceAnchor.nodeId);
        if (!referencePhysicsPos) return;

        // Calculate physics scale using all available GPS anchors
        this.scaling.calculatePhysicsScale(physicsNodes, this.visualizer.connections, this.gpsAnchors);

        // Update non-GPS nodes using physics positioning
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

                    // Mark as derived position
                    newGPS.derived = true;
                    newGPS.referenceNode = referenceAnchor.nodeId;

                    this.updateNodeOnMap(nodeId, { ...node, gps: newGPS });
                }
            }
        });

        // Validate GPS consistency if multiple anchors exist
        if (this.gpsAnchors.size > 1) {
            this.validateGPSConsistency(physicsNodes);
        }
    }

    /**
     * Select the best reference anchor for coordinate transformation
     */
    selectBestReferenceAnchor() {
        if (this.gpsAnchors.size === 0) return null;

        // Prefer B5A4 (gateway) if available
        if (this.gpsAnchors.has('B5A4')) {
            return this.gpsAnchors.get('B5A4');
        }

        // Otherwise, use the most recently updated GPS anchor
        let bestAnchor = null;
        let latestTimestamp = 0;

        this.gpsAnchors.forEach((anchor, nodeId) => {
            if (anchor.timestamp > latestTimestamp) {
                latestTimestamp = anchor.timestamp;
                bestAnchor = anchor;
            }
        });

        return bestAnchor;
    }

    /**
     * Validate GPS consistency between multiple anchors
     */
    validateGPSConsistency(physicsNodes) {
        if (this.gpsAnchors.size < 2) return;

        const anchors = Array.from(this.gpsAnchors.entries());
        const referenceAnchor = anchors[0];
        
        for (let i = 1; i < anchors.length; i++) {
            const [nodeId, anchor] = anchors[i];
            const refPhysics = physicsNodes.get(referenceAnchor[0]);
            const currentPhysics = physicsNodes.get(nodeId);
            
            if (refPhysics && currentPhysics) {
                // Calculate expected GPS position based on physics
                const deltaXPhysics = currentPhysics.x - refPhysics.x;
                const deltaYPhysics = currentPhysics.y - refPhysics.y;
                
                const { deltaXMeters, deltaYMeters } = this.scaling.physicsToGPSOffset(
                    deltaXPhysics, deltaYPhysics
                );

                const expectedGPS = this.gpsUtils.offsetGPS(
                    referenceAnchor[1].lat,
                    referenceAnchor[1].lng,
                    deltaXMeters,
                    deltaYMeters
                );

                // Calculate distance between expected and actual GPS
                const actualDistance = this.gpsUtils.calculateDistance(
                    expectedGPS.lat, expectedGPS.lng,
                    anchor.lat, anchor.lng
                );

                // Warn if GPS positions are inconsistent (>10m difference)
                if (actualDistance > 10) {
                    console.warn(`🗺️ GPS inconsistency detected for ${nodeId}: expected vs actual = ${actualDistance.toFixed(1)}m difference`);
                }
            }
        }
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
     * Update node on map with GPS detection
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

        // Determine if this node has absolute GPS coordinates
        // A node has absolute GPS if it has GPS coordinates AND they are not marked as derived
        const hasAbsoluteGPS = gpsCoords && !gpsCoords.derived;

        this.markers.updateNodeMarker(nodeId, node, gpsCoords, hasAbsoluteGPS);
    }

    /**
     * Update all nodes on map with improved GPS handling
     */
    updateAllNodesOnMap() {
        if (!this.visualizer || !this.visualizer.nodes || !this.map) return;

        let gpsNodeCount = 0;
        let physicsNodeCount = 0;

        this.visualizer.nodes.forEach((node, nodeId) => {
            if (this.gpsAnchors.has(nodeId)) {
                gpsNodeCount++;
            } else {
                physicsNodeCount++;
            }
            this.updateNodeOnMap(nodeId, node);
        });

        console.log(`🗺️ Updated ${this.visualizer.nodes.size} nodes on map (${gpsNodeCount} GPS anchors, ${physicsNodeCount} physics-positioned)`);
        
        if (this.autoFitEnabled && this.markers.nodeMarkers.size > 0) {
            this.debouncedAutoFit();
        }
    }

    /**
     * Fit map to nodes (manual trigger)
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
                maxZoom: 25, // Allow fitting to use high zoom levels
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
     * Debounced auto-fit (only if auto-zoom enabled)
     */
    debouncedAutoFit() {
        if (!this.autoFitEnabled) return;
        
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
        if (!this.autoFitEnabled) return false;
        
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
        
        // Only auto-fit if enabled
        if (this.autoFitEnabled) {
            this.debouncedAutoFit();
        }
        
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
     * Get map statistics with GPS anchor information
     */
    getMapStats() {
        const gpsAnchors = Array.from(this.gpsAnchors.entries()).map(([nodeId, anchor]) => ({
            nodeId,
            lat: anchor.lat,
            lng: anchor.lng,
            timestamp: anchor.timestamp,
            isAbsolute: anchor.isAbsolute
        }));

        return {
            initialized: !!this.map,
            visible: this.isMapView,
            tileLayerType: this.tileLayerType,
            availableLayers: Object.keys(this.tileLayers),
            autoSwitchEnabled: this.autoSwitchEnabled,
            wasAutoSwitched: this.wasAutoSwitched,
            autoFitEnabled: this.autoFitEnabled,
            maxZoom: this.map ? this.map.options.maxZoom : null,
            ...this.markers.getStats(),
            ...this.scaling.getStats(),
            gpsAnchors: this.gpsAnchors.size,
            gpsAnchorDetails: gpsAnchors,
            center: this.map ? this.map.getCenter() : null,
            zoom: this.map ? this.map.getZoom() : null
        };
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopPhysicsPositioning();
        this.clearAllNodes();
        this.scaling.removeScaleControl();
        
        // Remove tile selector control
        if (this.tileSelectorControl && this.map) {
            this.map.removeControl(this.tileSelectorControl);
        }
        
        // Remove auto-zoom toggle control
        if (this.autoZoomToggleControl && this.map) {
            this.map.removeControl(this.autoZoomToggleControl);
        }
        
        // Remove distance label toggle control
        if (this.distanceLabelToggleControl && this.map) {
            this.map.removeControl(this.distanceLabelToggleControl);
        }
        
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }
}

window.MapManager = MapManager;