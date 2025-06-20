/**
 * Map Manager for UWB Position Visualiser
 * Handles OpenStreetMap integration with hybrid GPS/UWB positioning using physics engine
 */

class MapManager {
    constructor() {
        this.map = null;
        this.nodeMarkers = new Map();
        this.connectionLines = new Map(); // Store connection lines
        this.gpsUtils = new GPSUtils();
        this.gatewayPosition = { lat: 53.4084, lng: -2.9916 }; // Liverpool default
        this.isMapView = false;
        this.mapContainer = null;
        this.visualizer = null; // Reference to the main visualizer
        this.physicsUpdateInterval = null;
        this.gpsAnchors = new Map(); // Store GPS-enabled anchor nodes
        this.autoFitEnabled = true; // Enable automatic map fitting
        this.lastNodeCount = 0; // Track node count changes for auto-fitting
        this.lastBounds = null; // Track bounds changes for auto-fitting
        this.uwbToGpsScale = 1.0; // Scale factor for UWB to GPS conversion (meters per UWB unit)
        this.autoFitDebounceTimeout = null; // Debounce auto-fit updates
        this.movementThreshold = 0.00005; // Increased threshold for gentler movement (~5 meters)
        this.scaleControl = null; // Custom scale control
        this.physicsToMetersScale = 1.0; // Scale factor to convert physics units to actual meters
    }

    /**
     * Initialize the map with OpenStreetMap tiles
     */
    initializeMap() {
        const mapContainer = document.getElementById('mapContainer');
        if (!mapContainer) {
            console.error('❌ Map container not found');
            return false;
        }

        this.mapContainer = mapContainer;

        try {
            // Initialize Leaflet map
            this.map = L.map('mapContainer', {
                center: [this.gatewayPosition.lat, this.gatewayPosition.lng],
                zoom: 18,
                zoomControl: true,
                attributionControl: true,
                scaleControl: false // Disable default scale, we'll add custom one
            });

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(this.map);

            // Add custom scale control
            this.addCustomScaleControl();

            console.log('🗺️ Map initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize map:', error);
            return false;
        }
    }

    /**
     * Add custom scale control to top-right corner
     */
    addCustomScaleControl() {
        if (!this.map) return;

        // Create custom scale control
        const ScaleControl = L.Control.extend({
            onAdd: function(map) {
                const container = L.DomUtil.create('div', 'custom-scale-control');
                container.style.cssText = `
                    background: rgba(255, 255, 255, 0.9);
                    border: 2px solid #333;
                    border-radius: 4px;
                    padding: 4px 8px;
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    font-weight: bold;
                    color: #333;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                    pointer-events: none;
                    min-width: 80px;
                    text-align: center;
                `;
                
                this._container = container;
                this._map = map;
                
                // Update scale on map events
                map.on('zoomend moveend', this._updateScale, this);
                this._updateScale();
                
                return container;
            },

            onRemove: function(map) {
                map.off('zoomend moveend', this._updateScale, this);
            },

            _updateScale: function() {
                if (!this._map || !this._container) return;

                const bounds = this._map.getBounds();
                const centerLat = bounds.getCenter().lat;
                
                // Calculate meters per pixel at current zoom and latitude
                const zoom = this._map.getZoom();
                const metersPerPixel = 40075016.686 * Math.cos(centerLat * Math.PI / 180) / Math.pow(2, zoom + 8);
                
                // Create scale line for 100 pixels
                const scalePixels = 100;
                const scaleMeters = metersPerPixel * scalePixels;
                
                // Format scale distance
                let scaleText, scaleDistance;
                if (scaleMeters >= 1000) {
                    scaleDistance = Math.round(scaleMeters / 100) / 10;
                    scaleText = `${scaleDistance} km`;
                } else if (scaleMeters >= 1) {
                    scaleDistance = Math.round(scaleMeters);
                    scaleText = `${scaleDistance} m`;
                } else {
                    scaleDistance = Math.round(scaleMeters * 100);
                    scaleText = `${scaleDistance} cm`;
                }
                
                // Update container with scale line and text
                this._container.innerHTML = `
                    <div style="border-bottom: 3px solid #333; width: ${scalePixels}px; margin: 0 auto 2px auto;"></div>
                    <div>${scaleText}</div>
                `;
            }
        });

        // Add scale control to top-right
        this.scaleControl = new ScaleControl({ position: 'topright' });
        this.scaleControl.addTo(this.map);
    }

    /**
     * Show map view and hide physics canvas
     */
    showMapView() {
        if (!this.map) {
            if (!this.initializeMap()) {
                console.error('❌ Failed to initialize map for map view');
                return;
            }
        }

        this.isMapView = true;
        
        // Show map container
        if (this.mapContainer) {
            this.mapContainer.classList.remove('hidden');
        }

        // Invalidate map size to ensure proper rendering
        setTimeout(() => {
            if (this.map) {
                this.map.invalidateSize();
                this.updateAllNodesOnMap();
                this.startPhysicsPositioning();
                
                // Auto-fit map to show all nodes after a short delay
                setTimeout(() => {
                    this.fitMapToNodes();
                }, 500);
            }
        }, 100);

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
        console.log('🗺️ Map view deactivated');
    }

    /**
     * Set reference to the main visualizer
     */
    setVisualizer(visualizer) {
        this.visualizer = visualizer;
        console.log('🗺️ Visualizer reference set in MapManager');
    }

    /**
     * Start physics-based positioning updates for map view
     */
    startPhysicsPositioning() {
        if (this.physicsUpdateInterval) {
            clearInterval(this.physicsUpdateInterval);
        }

        // Update positions every 200ms for gentler map updates
        this.physicsUpdateInterval = setInterval(() => {
            this.updatePhysicsBasedPositions();
        }, 200);

        console.log('🗺️ Physics positioning started for map view');
    }

    /**
     * Stop physics-based positioning updates
     */
    stopPhysicsPositioning() {
        if (this.physicsUpdateInterval) {
            clearInterval(this.physicsUpdateInterval);
            this.physicsUpdateInterval = null;
        }
        
        // Clear any pending auto-fit
        if (this.autoFitDebounceTimeout) {
            clearTimeout(this.autoFitDebounceTimeout);
            this.autoFitDebounceTimeout = null;
        }
        
        console.log('🗺️ Physics positioning stopped');
    }

    /**
     * Update node positions using hybrid GPS/Physics approach
     */
    updatePhysicsBasedPositions() {
        if (!this.visualizer || !this.visualizer.nodes) return;

        // Step 1: Identify and position GPS anchor nodes (absolute positioning)
        this.updateGPSAnchors();
        
        // Step 2: Use physics engine to position UWB-only nodes relative to GPS anchors
        this.updateUWBNodesWithPhysics();
        
        // Step 3: Update connection lines between nodes
        this.updateConnectionLines();
        
        // Step 4: Auto-fit map if nodes have moved significantly (debounced)
        if (this.autoFitEnabled && this.shouldAutoFit()) {
            this.debouncedAutoFit();
        }
    }

    /**
     * Debounced auto-fit to prevent excessive map movements
     */
    debouncedAutoFit() {
        if (this.autoFitDebounceTimeout) {
            clearTimeout(this.autoFitDebounceTimeout);
        }
        
        this.autoFitDebounceTimeout = setTimeout(() => {
            this.fitMapToNodes();
            this.autoFitDebounceTimeout = null;
        }, 2000); // 2 second debounce for gentler movement
    }

    /**
     * Check if auto-fit should be triggered based on node movement
     */
    shouldAutoFit() {
        if (this.nodeMarkers.size !== this.lastNodeCount) {
            this.lastNodeCount = this.nodeMarkers.size;
            return true;
        }

        // Check if nodes have moved significantly
        if (this.nodeMarkers.size > 0) {
            const currentBounds = this.getNodeBounds();
            if (!this.lastBounds || this.boundsChanged(this.lastBounds, currentBounds)) {
                this.lastBounds = currentBounds;
                return true;
            }
        }

        return false;
    }

    /**
     * Get bounds of all current nodes
     */
    getNodeBounds() {
        if (this.nodeMarkers.size === 0) return null;

        let minLat = Infinity, maxLat = -Infinity;
        let minLng = Infinity, maxLng = -Infinity;

        this.nodeMarkers.forEach(marker => {
            const pos = marker.getLatLng();
            minLat = Math.min(minLat, pos.lat);
            maxLat = Math.max(maxLat, pos.lat);
            minLng = Math.min(minLng, pos.lng);
            maxLng = Math.max(maxLng, pos.lng);
        });

        return { minLat, maxLat, minLng, maxLng };
    }

    /**
     * Check if bounds have changed significantly (increased threshold for gentler movement)
     */
    boundsChanged(oldBounds, newBounds) {
        if (!oldBounds || !newBounds) return true;

        return Math.abs(oldBounds.minLat - newBounds.minLat) > this.movementThreshold ||
               Math.abs(oldBounds.maxLat - newBounds.maxLat) > this.movementThreshold ||
               Math.abs(oldBounds.minLng - newBounds.minLng) > this.movementThreshold ||
               Math.abs(oldBounds.maxLng - newBounds.maxLng) > this.movementThreshold;
    }

    /**
     * Update GPS anchor nodes with absolute positioning
     */
    updateGPSAnchors() {
        if (!this.visualizer || !this.visualizer.nodes) return;

        this.visualizer.nodes.forEach((node, nodeId) => {
            // Check if node has GPS coordinates (gateway or GPS-enabled nodes)
            if (node.gps || (nodeId === 'B5A4' && this.gatewayPosition)) {
                const gpsCoords = node.gps || this.gatewayPosition;
                
                // Store as GPS anchor
                this.gpsAnchors.set(nodeId, {
                    lat: gpsCoords.lat,
                    lng: gpsCoords.lng,
                    nodeId: nodeId
                });

                // Update marker position on map
                this.updateNodeOnMap(nodeId, node);
            }
        });
    }

    /**
     * Update UWB-only nodes using physics engine relative to GPS anchors
     */
    updateUWBNodesWithPhysics() {
        if (!this.visualizer || !this.visualizer.physics || this.gpsAnchors.size === 0) return;

        // Get physics positions for all nodes using available API
        let physicsNodes = new Map();
        
        try {
            // Access physics positions directly from visualizer nodes (they have x,y from physics)
            if (this.visualizer.nodes) {
                this.visualizer.nodes.forEach((node, nodeId) => {
                    if (node.x !== undefined && node.y !== undefined) {
                        physicsNodes.set(nodeId, {
                            x: node.x,
                            y: node.y
                        });
                    }
                });
            } else {
                console.warn('🗺️ No physics positions available for map positioning');
                return;
            }
        } catch (error) {
            console.error('🗺️ Error accessing physics positions:', error);
            return;
        }
        
        if (physicsNodes.size === 0) {
            console.warn('🗺️ No physics nodes found for positioning');
            return;
        }
        
        // Find a reference GPS anchor (preferably gateway)
        let referenceAnchor = this.gpsAnchors.get('B5A4') || this.gpsAnchors.values().next().value;
        if (!referenceAnchor) return;

        // Get reference node's physics position
        const referencePhysicsPos = physicsNodes.get(referenceAnchor.nodeId);
        if (!referencePhysicsPos) {
            console.warn(`🗺️ No physics position found for reference anchor ${referenceAnchor.nodeId}`);
            return;
        }

        // Calculate the physics-to-meters scale based on known distances
        this.calculatePhysicsScale(physicsNodes);

        // Update non-GPS nodes relative to reference anchor
        this.visualizer.nodes.forEach((node, nodeId) => {
            if (!this.gpsAnchors.has(nodeId)) {
                const physicsPos = physicsNodes.get(nodeId);
                if (physicsPos) {
                    // Calculate relative offset from reference anchor
                    const deltaXPhysics = physicsPos.x - referencePhysicsPos.x;
                    const deltaYPhysics = physicsPos.y - referencePhysicsPos.y;
                    
                    // Convert physics units to actual meters using calculated scale
                    const deltaXMeters = deltaXPhysics * this.physicsToMetersScale * this.uwbToGpsScale;
                    const deltaYMeters = deltaYPhysics * this.physicsToMetersScale * this.uwbToGpsScale;

                    // Convert physics offset to GPS coordinates
                    const newGPS = this.gpsUtils.offsetGPS(
                        referenceAnchor.lat,
                        referenceAnchor.lng,
                        deltaXMeters,
                        deltaYMeters
                    );

                    // Update node with calculated GPS position
                    const updatedNode = {
                        ...node,
                        gps: newGPS
                    };

                    this.updateNodeOnMap(nodeId, updatedNode);
                }
            }
        });
    }

    /**
     * Calculate the scale factor from physics units to actual meters
     */
    calculatePhysicsScale(physicsNodes) {
        if (!this.visualizer || !this.visualizer.connections || this.visualizer.connections.size === 0) {
            return;
        }

        let totalScaleRatio = 0;
        let scaleCount = 0;

        // Compare physics distances with actual measured distances
        this.visualizer.connections.forEach((connection, connectionKey) => {
            const [nodeId1, nodeId2] = connectionKey.split('-');
            const physicsPos1 = physicsNodes.get(nodeId1);
            const physicsPos2 = physicsNodes.get(nodeId2);
            
            if (physicsPos1 && physicsPos2 && connection.distance) {
                // Calculate physics distance
                const physicsDistance = Math.sqrt(
                    Math.pow(physicsPos2.x - physicsPos1.x, 2) + 
                    Math.pow(physicsPos2.y - physicsPos1.y, 2)
                );
                
                if (physicsDistance > 0.1) { // Avoid division by very small numbers
                    // Calculate scale: actual_meters / physics_units
                    const scaleRatio = connection.distance / physicsDistance;
                    totalScaleRatio += scaleRatio;
                    scaleCount++;
                }
            }
        });

        if (scaleCount > 0) {
            const newScale = totalScaleRatio / scaleCount;
            // Smooth the scale changes to avoid jumpy behavior
            this.physicsToMetersScale = this.physicsToMetersScale * 0.9 + newScale * 0.1;
            
            console.log(`🗺️ Physics scale updated: ${this.physicsToMetersScale.toFixed(3)} meters/physics-unit`);
        }
    }

    /**
     * Update connection lines between nodes with distance labels
     */
    updateConnectionLines() {
        if (!this.map || !this.isMapView || !this.visualizer) return;

        // Clear existing connection lines
        this.clearConnectionLines();

        // Get connections from visualizer
        if (!this.visualizer.connections) return;

        this.visualizer.connections.forEach((connection, connectionKey) => {
            const [nodeId1, nodeId2] = connectionKey.split('-');
            
            // Get markers for both nodes
            const marker1 = this.nodeMarkers.get(nodeId1);
            const marker2 = this.nodeMarkers.get(nodeId2);
            
            if (marker1 && marker2) {
                const pos1 = marker1.getLatLng();
                const pos2 = marker2.getLatLng();
                
                // Create line between nodes
                const line = L.polyline([pos1, pos2], {
                    color: '#3498db',
                    weight: 2,
                    opacity: 0.7,
                    dashArray: '5, 5'
                }).addTo(this.map);
                
                // Calculate midpoint for distance label
                const midLat = (pos1.lat + pos2.lat) / 2;
                const midLng = (pos1.lng + pos2.lng) / 2;
                
                // Create distance label with improved styling
                const distance = connection.distance || 0;
                const distanceLabel = L.divIcon({
                    className: 'map-distance-label',
                    html: `<div class="distance-text">${distance.toFixed(2)}m</div>`,
                    iconSize: [50, 20],
                    iconAnchor: [25, 10]
                });
                
                const distanceMarker = L.marker([midLat, midLng], { 
                    icon: distanceLabel,
                    interactive: false
                }).addTo(this.map);
                
                // Store line and label for cleanup
                const connectionId = `${nodeId1}-${nodeId2}`;
                this.connectionLines.set(connectionId, {
                    line: line,
                    label: distanceMarker
                });
            }
        });
        
        console.log(`🗺️ Updated ${this.connectionLines.size} connection lines on map`);
    }

    /**
     * Clear all connection lines from the map
     */
    clearConnectionLines() {
        this.connectionLines.forEach((connection, connectionId) => {
            if (this.map) {
                this.map.removeLayer(connection.line);
                this.map.removeLayer(connection.label);
            }
        });
        this.connectionLines.clear();
    }

    /**
     * Fit map view to show all nodes with 80% coverage of available space (gentler animation)
     */
    fitMapToNodes() {
        if (!this.map || !this.isMapView || this.nodeMarkers.size === 0) return;

        try {
            // Create a feature group from all node markers
            const markerArray = Array.from(this.nodeMarkers.values());
            const group = new L.featureGroup(markerArray);
            
            // Get bounds of all markers
            const bounds = group.getBounds();
            
            // Calculate padding to achieve 80% coverage
            const mapSize = this.map.getSize();
            const paddingX = Math.max(30, mapSize.x * 0.1); // 10% padding on each side
            const paddingY = Math.max(30, mapSize.y * 0.1);
            
            // Fit bounds with padding and gentler animation
            this.map.fitBounds(bounds, {
                padding: [paddingY, paddingX],
                maxZoom: 20, // Allow closer zoom for indoor positioning
                animate: true,
                duration: 1.5, // Slower, gentler animation
                easeLinearity: 0.1 // Smoother easing
            });
            
            console.log(`🗺️ Map fitted to ${this.nodeMarkers.size} nodes with 80% coverage (gentle animation)`);
            
        } catch (error) {
            console.error('🗺️ Error fitting map to nodes:', error);
        }
    }

    /**
     * Update all nodes from the visualizer on the map
     */
    updateAllNodesOnMap() {
        if (!this.visualizer || !this.visualizer.nodes || !this.map) return;

        this.visualizer.nodes.forEach((node, nodeId) => {
            this.updateNodeOnMap(nodeId, node);
        });

        console.log(`🗺️ Updated ${this.visualizer.nodes.size} nodes on map`);
        
        // Auto-fit map after updating all nodes (debounced)
        if (this.autoFitEnabled && this.nodeMarkers.size > 0) {
            this.debouncedAutoFit();
        }
    }

    /**
     * Get node styling to match physics view (DOUBLED SIZES)
     */
    getNodeStyling(nodeId, node) {
        const isGateway = nodeId === 'B5A4' || node.type === 'gateway';
        const isMobile = nodeId.startsWith('T') && nodeId.length === 4; // Mobile tags like T001, T002, etc.
        
        let nodeType, backgroundColor, borderColor, size, fontSize, typeLabel;
        
        if (isGateway) {
            nodeType = 'gateway';
            backgroundColor = '#e74c3c'; // Red for gateway (matches physics view)
            borderColor = '#c0392b';
            size = 60; // DOUBLED from 30
            fontSize = '12px'; // Increased font size
            typeLabel = 'GW';
        } else if (isMobile) {
            nodeType = 'mobile';
            backgroundColor = '#3498db'; // Blue for mobile tags (matches physics view)
            borderColor = '#2980b9';
            size = 50; // DOUBLED from 25
            fontSize = '11px'; // Increased font size
            typeLabel = 'T';
        } else {
            nodeType = 'anchor';
            backgroundColor = '#27ae60'; // Green for anchors (matches physics view)
            borderColor = '#229954';
            size = 50; // DOUBLED from 25
            fontSize = '11px'; // Increased font size
            typeLabel = 'A';
        }
        
        return {
            nodeType,
            backgroundColor,
            borderColor,
            size,
            fontSize,
            typeLabel
        };
    }

    /**
     * Update a single node on the map
     */
    updateNodeOnMap(nodeId, node) {
        if (!this.map || !this.isMapView) return;

        // Determine GPS coordinates
        let gpsCoords = node.gps;
        if (!gpsCoords && nodeId === 'B5A4') {
            gpsCoords = this.gatewayPosition;
        }

        if (!gpsCoords || !this.gpsUtils.isValidGPS(gpsCoords.lat, gpsCoords.lng)) {
            return; // Skip nodes without valid GPS coordinates
        }

        // Create or update marker
        if (this.nodeMarkers.has(nodeId)) {
            // Update existing marker position
            const marker = this.nodeMarkers.get(nodeId);
            marker.setLatLng([gpsCoords.lat, gpsCoords.lng]);
        } else {
            // Get node styling to match physics view (with doubled sizes)
            const styling = this.getNodeStyling(nodeId, node);

            // Create custom HTML marker with node ID and proper styling
            const markerHtml = `
                <div class="map-node-marker ${styling.nodeType}" style="
                    width: ${styling.size}px;
                    height: ${styling.size}px;
                    background: radial-gradient(circle at 30% 30%, ${styling.backgroundColor}dd, ${styling.backgroundColor}, ${styling.borderColor});
                    border: 3px solid rgba(255, 255, 255, 0.8);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: ${styling.fontSize};
                    font-weight: bold;
                    color: white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                    position: relative;
                    cursor: pointer;
                    transition: transform 0.2s ease;
                ">
                    ${nodeId}
                    <div style="
                        position: absolute;
                        top: -18px;
                        left: 50%;
                        transform: translateX(-50%);
                        font-size: 9px;
                        color: ${styling.backgroundColor};
                        font-weight: bold;
                        background: white;
                        padding: 2px 4px;
                        border-radius: 3px;
                        border: 1px solid ${styling.backgroundColor};
                    ">${styling.typeLabel}</div>
                </div>
            `;

            const customIcon = L.divIcon({
                className: 'map-node-marker-container',
                html: markerHtml,
                iconSize: [styling.size, styling.size],
                iconAnchor: [styling.size/2, styling.size/2]
            });

            const marker = L.marker([gpsCoords.lat, gpsCoords.lng], {
                icon: customIcon
            }).addTo(this.map);

            // Add popup with node information
            const popupContent = `
                <div style="text-align: center; font-family: Arial, sans-serif;">
                    <strong style="font-size: 16px; color: ${styling.backgroundColor};">${nodeId}</strong><br>
                    <span style="font-size: 14px;">${styling.nodeType === 'gateway' ? '🚪 Gateway' : styling.nodeType === 'mobile' ? '📱 Mobile Tag' : '⚓ Anchor'}</span><br>
                    <div style="font-size: 12px; color: #666; margin-top: 4px;">
                        Lat: ${gpsCoords.lat.toFixed(6)}<br>
                        Lng: ${gpsCoords.lng.toFixed(6)}<br>
                        Scale: ${this.physicsToMetersScale.toFixed(3)} m/unit
                    </div>
                </div>
            `;
            marker.bindPopup(popupContent);

            this.nodeMarkers.set(nodeId, marker);
        }
    }

    /**
     * Update gateway GPS position
     */
    updateGatewayPosition(lat, lng) {
        this.gatewayPosition = { lat, lng };

        if (this.map) {
            // Update gateway marker if it exists
            if (this.nodeMarkers.has('B5A4')) {
                const marker = this.nodeMarkers.get('B5A4');
                marker.setLatLng([lat, lng]);
            }
            
            // Auto-fit map to new gateway position and all nodes (debounced)
            this.debouncedAutoFit();
        }

        console.log(`🗺️ Gateway position updated to: ${lat}, ${lng}`);
    }

    /**
     * Set UWB to GPS scale factor
     * @param {number} scale - Scale factor (meters per UWB unit)
     */
    setUWBScale(scale) {
        this.uwbToGpsScale = Math.max(0.1, Math.min(10.0, scale));
        console.log(`🗺️ UWB to GPS scale set to: ${this.uwbToGpsScale}`);
        
        // Trigger immediate position update with new scale
        if (this.isMapView) {
            this.updatePhysicsBasedPositions();
        }
    }

    /**
     * Clear all nodes from the map
     */
    clearAllNodes() {
        this.nodeMarkers.forEach((marker, nodeId) => {
            if (this.map) {
                this.map.removeLayer(marker);
            }
        });
        this.nodeMarkers.clear();
        this.gpsAnchors.clear();
        this.lastNodeCount = 0;
        this.lastBounds = null;
        
        // Reset physics scale
        this.physicsToMetersScale = 1.0;
        
        // Also clear connection lines
        this.clearConnectionLines();
    }

    /**
     * Remove a node from the map
     * @param {string} nodeId - Node ID to remove
     */
    removeNodeFromMap(nodeId) {
        if (this.nodeMarkers.has(nodeId)) {
            const marker = this.nodeMarkers.get(nodeId);
            if (this.map) {
                this.map.removeLayer(marker);
            }
            this.nodeMarkers.delete(nodeId);
        }
        
        // Also remove from GPS anchors if it was one
        this.gpsAnchors.delete(nodeId);
        
        // Remove any connection lines involving this node
        const connectionsToRemove = [];
        this.connectionLines.forEach((connection, connectionId) => {
            if (connectionId.includes(nodeId)) {
                connectionsToRemove.push(connectionId);
            }
        });
        
        connectionsToRemove.forEach(connectionId => {
            const connection = this.connectionLines.get(connectionId);
            if (this.map && connection) {
                this.map.removeLayer(connection.line);
                this.map.removeLayer(connection.label);
            }
            this.connectionLines.delete(connectionId);
        });
        
        // Auto-fit map after node removal
        if (this.autoFitEnabled && this.nodeMarkers.size > 0) {
            this.debouncedAutoFit();
        }
    }

    /**
     * Center map on all nodes (legacy method - now uses fitMapToNodes)
     */
    centerOnNodes() {
        this.fitMapToNodes();
    }

    /**
     * Enable or disable automatic map fitting
     * @param {boolean} enabled - Whether to enable auto-fitting
     */
    setAutoFit(enabled) {
        this.autoFitEnabled = enabled;
        console.log(`🗺️ Auto-fit ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Get current map bounds
     */
    getMapBounds() {
        if (!this.map) return null;
        return this.map.getBounds();
    }

    /**
     * Check if map is currently visible
     */
    isMapVisible() {
        return this.isMapView && this.map !== null;
    }

    /**
     * Get map statistics
     */
    getMapStats() {
        return {
            initialized: !!this.map,
            visible: this.isMapView,
            nodeCount: this.nodeMarkers.size,
            gpsAnchors: this.gpsAnchors.size,
            connectionLines: this.connectionLines.size,
            center: this.map ? this.map.getCenter() : null,
            zoom: this.map ? this.map.getZoom() : null,
            autoFitEnabled: this.autoFitEnabled,
            uwbScale: this.uwbToGpsScale,
            physicsScale: this.physicsToMetersScale
        };
    }

    /**
     * Cleanup when destroyed
     */
    destroy() {
        this.stopPhysicsPositioning();
        this.clearAllNodes();
        this.clearConnectionLines();
        
        // Clear auto-fit timeout
        if (this.autoFitDebounceTimeout) {
            clearTimeout(this.autoFitDebounceTimeout);
        }
        
        // Remove scale control
        if (this.scaleControl && this.map) {
            this.map.removeControl(this.scaleControl);
        }
        
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }
}

// Export for use in other modules
window.MapManager = MapManager;