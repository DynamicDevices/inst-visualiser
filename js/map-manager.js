/**
 * Map Manager for UWB Position Visualiser
 * Handles OpenStreetMap integration and GPS-based node positioning
 */

class MapManager {
    constructor() {
        this.map = null;
        this.nodeMarkers = new Map();
        this.gpsUtils = new GPSUtils();
        this.gatewayPosition = { lat: 53.4084, lng: -2.9916 }; // Liverpool default
        this.isMapView = false;
        this.mapContainer = null;
        this.visualizer = null; // Reference to the main visualizer
    }

    /**
     * Set reference to the main visualizer
     * @param {UWBVisualizer} visualizer - Main visualizer instance
     */
    setVisualizer(visualizer) {
        this.visualizer = visualizer;
        console.log('🗺️ MapManager: Visualizer reference set');
    }

    /**
     * Initialize the map
     * @param {string} containerId - Map container element ID
     */
    initializeMap(containerId) {
        this.mapContainer = document.getElementById(containerId);
        
        if (!this.mapContainer) {
            console.error('Map container not found:', containerId);
            return;
        }

        // Initialize Leaflet map
        this.map = L.map(containerId, {
            center: [this.gatewayPosition.lat, this.gatewayPosition.lng],
            zoom: 18,
            zoomControl: true,
            attributionControl: true
        });

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        console.log('🗺️ Map initialized at Liverpool:', this.gatewayPosition);
        
        // Update all existing nodes when map is initialized
        this.updateAllNodesOnMap();
    }

    /**
     * Switch to map view
     */
    showMapView() {
        if (!this.map) {
            this.initializeMap('mapContainer');
        }
        
        this.isMapView = true;
        this.mapContainer.classList.remove('hidden');
        
        // Refresh map size after showing
        setTimeout(() => {
            if (this.map) {
                this.map.invalidateSize();
                this.updateAllNodesOnMap();
                this.centerOnNodes();
            }
        }, 100);
    }

    /**
     * Switch to physics view
     */
    hideMapView() {
        this.isMapView = false;
        if (this.mapContainer) {
            this.mapContainer.classList.add('hidden');
        }
    }

    /**
     * Update gateway GPS position
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     */
    updateGatewayPosition(lat, lng) {
        if (!this.gpsUtils.isValidGPS(lat, lng)) {
            console.error('Invalid GPS coordinates:', lat, lng);
            return;
        }

        this.gatewayPosition = { lat, lng };
        
        if (this.map) {
            this.map.setView([lat, lng], this.map.getZoom());
        }

        console.log('🗺️ Gateway position updated:', this.gatewayPosition);
        
        // Update all nodes when gateway position changes
        this.updateAllNodesOnMap();
    }

    /**
     * Update all nodes from the visualizer on the map
     */
    updateAllNodesOnMap() {
        if (!this.map || !this.isMapView || !this.visualizer) return;

        // Clear existing markers
        this.clearAllNodes();

        // Add all nodes from the visualizer
        if (this.visualizer.nodes) {
            this.visualizer.nodes.forEach((node, nodeId) => {
                this.updateNodeOnMap(node);
            });
        }

        // Center map on all nodes
        setTimeout(() => this.centerOnNodes(), 200);
    }

    /**
     * Add or update a node on the map
     * @param {Object} node - Node data with id, position, type, etc.
     */
    updateNodeOnMap(node) {
        if (!this.map || !this.isMapView) return;

        const nodeId = node.id;
        let lat, lng;

        // Determine position based on available data
        if (node.gps && node.gps.lat && node.gps.lng) {
            // Node has GPS coordinates - use absolute positioning
            lat = node.gps.lat;
            lng = node.gps.lng;
        } else if (node.x !== undefined && node.y !== undefined) {
            // Node has UWB coordinates - convert to GPS relative to gateway
            const gpsPos = this.gpsUtils.localToGPS(
                node.x, node.y,
                this.gatewayPosition.lat, this.gatewayPosition.lng
            );
            lat = gpsPos.lat;
            lng = gpsPos.lng;
        } else {
            // No position data available
            return;
        }

        // Create or update marker
        if (this.nodeMarkers.has(nodeId)) {
            // Update existing marker
            const marker = this.nodeMarkers.get(nodeId);
            marker.setLatLng([lat, lng]);
            this.updateMarkerPopup(marker, node);
        } else {
            // Create new marker
            const marker = this.createNodeMarker(node, lat, lng);
            this.nodeMarkers.set(nodeId, marker);
            marker.addTo(this.map);
        }
    }

    /**
     * Create a marker for a node with physics-style appearance
     * @param {Object} node - Node data
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {L.Marker} Leaflet marker
     */
    createNodeMarker(node, lat, lng) {
        // Determine node type and styling to match physics view
        let isGateway = false;
        let isStale = false;
        
        // Check if this is a gateway node
        if (node.type === 'gateway' || node.id === 'B5A4' || 
            (node.gps && node.gps.lat && node.gps.lng)) {
            isGateway = true;
        }
        
        // Check if node is stale
        if (node.lastUpdate) {
            const now = Date.now();
            const staleTimeout = 30000; // 30 seconds default
            isStale = (now - node.lastUpdate) > staleTimeout;
        }

        // Create custom icon that matches physics view styling
        const size = isGateway ? 60 : 50;
        const fontSize = isGateway ? '9px' : '9px';
        const label = isGateway ? 'GW' : 'T';
        
        let backgroundColor, boxShadow;
        if (isStale) {
            backgroundColor = '#95a5a6'; // Stale color
            boxShadow = '0 2px 4px rgba(149, 165, 166, 0.3)';
        } else if (isGateway) {
            backgroundColor = '#e74c3c'; // Gateway red
            boxShadow = '0 6px 16px rgba(231, 76, 60, 0.5)';
        } else {
            backgroundColor = '#3498db'; // Standard blue
            boxShadow = '0 4px 12px rgba(52, 152, 219, 0.5)';
        }

        const customIcon = L.divIcon({
            className: 'custom-node-marker',
            html: `
                <div style="
                    position: relative;
                    width: ${size}px;
                    height: ${size}px;
                    background: radial-gradient(circle at 30% 30%, ${backgroundColor}, ${this.darkenColor(backgroundColor, 20)});
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: ${fontSize};
                    font-weight: bold;
                    color: white;
                    box-shadow: ${boxShadow};
                    cursor: pointer;
                    z-index: 10;
                    opacity: ${isStale ? '0.6' : '1'};
                ">
                    ${node.id}
                    <div style="
                        position: absolute;
                        top: -12px;
                        left: 50%;
                        transform: translateX(-50%);
                        font-size: 7px;
                        color: ${backgroundColor};
                        font-weight: bold;
                        background: white;
                        padding: 1px 3px;
                        border-radius: 2px;
                    ">${label}</div>
                </div>
            `,
            iconSize: [size, size],
            iconAnchor: [size/2, size/2]
        });

        const marker = L.marker([lat, lng], { icon: customIcon });
        this.updateMarkerPopup(marker, node);
        
        return marker;
    }

    /**
     * Darken a color by a percentage
     * @param {string} color - Hex color
     * @param {number} percent - Percentage to darken
     * @returns {string} Darkened hex color
     */
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    /**
     * Update marker popup content
     * @param {L.Marker} marker - Leaflet marker
     * @param {Object} node - Node data
     */
    updateMarkerPopup(marker, node) {
        const hasGPS = node.gps && node.gps.lat && node.gps.lng;
        const positionSource = hasGPS ? 'GPS Absolute' : 'UWB Relative';
        const isGateway = node.type === 'gateway' || node.id === 'B5A4' || hasGPS;
        
        const popupContent = `
            <div style="font-family: 'Segoe UI', sans-serif; font-size: 12px; min-width: 200px;">
                <div style="font-weight: bold; color: ${isGateway ? '#e74c3c' : '#3498db'}; margin-bottom: 8px;">
                    ${node.id} ${isGateway ? '(Gateway)' : '(Tag)'}
                </div>
                <div style="margin-bottom: 4px;">
                    <strong>Position Source:</strong> ${positionSource}
                </div>
                ${hasGPS ? 
                    `<div style="margin-bottom: 4px;">
                        <strong>GPS:</strong> ${node.gps.lat.toFixed(6)}, ${node.gps.lng.toFixed(6)}
                    </div>` :
                    `<div style="margin-bottom: 4px;">
                        <strong>UWB:</strong> ${node.x?.toFixed(2) || 'N/A'}m, ${node.y?.toFixed(2) || 'N/A'}m
                    </div>`
                }
                <div style="margin-bottom: 4px;">
                    <strong>Last Update:</strong> ${new Date(node.lastUpdate || Date.now()).toLocaleTimeString()}
                </div>
                ${node.connections ? 
                    `<div style="font-size: 10px; color: #666; margin-top: 8px;">
                        Connected to ${node.connections.size || 0} other nodes
                    </div>` : ''
                }
            </div>
        `;
        
        marker.bindPopup(popupContent);
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
    }

    /**
     * Center map on all nodes
     */
    centerOnNodes() {
        if (!this.map || this.nodeMarkers.size === 0) return;

        const markers = Array.from(this.nodeMarkers.values());
        if (markers.length === 1) {
            // Single node - center on it with appropriate zoom
            const marker = markers[0];
            this.map.setView(marker.getLatLng(), 18);
        } else if (markers.length > 1) {
            // Multiple nodes - fit bounds
            const group = new L.featureGroup(markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    /**
     * Get current map bounds
     * @returns {Object} Map bounds
     */
    getMapBounds() {
        if (!this.map) return null;
        
        const bounds = this.map.getBounds();
        return {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
        };
    }

    /**
     * Handle node updates from the visualizer
     * @param {Object} node - Updated node data
     */
    onNodeUpdate(node) {
        if (this.isMapView) {
            this.updateNodeOnMap(node);
        }
    }

    /**
     * Handle node removal from the visualizer
     * @param {string} nodeId - ID of removed node
     */
    onNodeRemove(nodeId) {
        this.removeNodeFromMap(nodeId);
    }
}

// Export for use in other modules
window.MapManager = MapManager;