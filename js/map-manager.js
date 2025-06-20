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

        console.log('Map initialized at Liverpool:', this.gatewayPosition);
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

        console.log('Gateway position updated:', this.gatewayPosition);
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
     * Create a marker for a node
     * @param {Object} node - Node data
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {L.Marker} Leaflet marker
     */
    createNodeMarker(node, lat, lng) {
        // Determine marker color based on node type
        let color = '#3498db'; // Default blue
        let icon = '📍';
        
        if (node.type === 'gateway') {
            color = '#e74c3c'; // Red for gateway
            icon = '🏠';
        } else if (node.type === 'anchor') {
            color = '#f39c12'; // Orange for anchors
            icon = '⚓';
        } else if (node.type === 'tag') {
            color = '#2ecc71'; // Green for tags
            icon = '🏷️';
        }

        // Create custom icon
        const customIcon = L.divIcon({
            className: 'custom-node-marker',
            html: `
                <div style="
                    background-color: ${color};
                    border: 2px solid white;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: bold;
                    color: white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                ">
                    ${node.id}
                </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        const marker = L.marker([lat, lng], { icon: customIcon });
        this.updateMarkerPopup(marker, node);
        
        return marker;
    }

    /**
     * Update marker popup content
     * @param {L.Marker} marker - Leaflet marker
     * @param {Object} node - Node data
     */
    updateMarkerPopup(marker, node) {
        const hasGPS = node.gps && node.gps.lat && node.gps.lng;
        const positionSource = hasGPS ? 'GPS' : 'UWB Relative';
        
        const popupContent = `
            <div style="font-family: monospace; font-size: 12px;">
                <strong>${node.id}</strong> (${node.type || 'unknown'})<br>
                <strong>Position:</strong> ${positionSource}<br>
                ${hasGPS ? 
                    `<strong>GPS:</strong> ${node.gps.lat.toFixed(6)}, ${node.gps.lng.toFixed(6)}<br>` :
                    `<strong>UWB:</strong> ${node.x?.toFixed(2) || 'N/A'}m, ${node.y?.toFixed(2) || 'N/A'}m<br>`
                }
                <strong>Last Update:</strong> ${new Date(node.lastUpdate || Date.now()).toLocaleTimeString()}
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

        const group = new L.featureGroup(Array.from(this.nodeMarkers.values()));
        this.map.fitBounds(group.getBounds().pad(0.1));
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
}

// Export for use in other modules
window.MapManager = MapManager;