/**
 * Map Marker Management
 * Handles creation, updating, and styling of map markers
 */

class MapMarkerManager {
    constructor(mapManager) {
        this.mapManager = mapManager;
        this.nodeMarkers = new Map();
        this.connectionLines = new Map();
        this.showDistanceLabels = true; // Default to showing labels
        this.showBoundingBox = false; // Default to hiding bounding box
        this.boundingBoxRect = null;
        this.boundingBoxLabels = [];
    }

    /**
     * Toggle distance label visibility
     */
    toggleDistanceLabels() {
        this.showDistanceLabels = !this.showDistanceLabels;
        
        // Update existing distance labels
        this.connectionLines.forEach((connection) => {
            if (connection.label) {
                if (this.showDistanceLabels) {
                    connection.label.addTo(this.mapManager.map);
                } else {
                    this.mapManager.map.removeLayer(connection.label);
                }
            }
        });

        console.log(`🗺️ Distance labels ${this.showDistanceLabels ? 'enabled' : 'disabled'}`);
        eventBus.emit('distance-labels-toggled', { enabled: this.showDistanceLabels });
    }

    /**
     * Get node styling configuration with GPS detection
     */
    getNodeStyling(nodeId, node, hasAbsoluteGPS = false) {
        const isGateway = nodeId === 'B5A4' || node.type === 'gateway';
        const isMobile = nodeId.startsWith('T') && nodeId.length === 4;

        // Override color for absolute GPS nodes
        if (hasAbsoluteGPS) {
            return {
                ...AppConfig.nodes.anchor,
                color: '#ff3333',
                borderColor: '#cc0000',
                typeLabel: 'GPS',
                size: 24 // Slightly larger for GPS nodes
            };
        }

        if (isGateway) {
            return AppConfig.nodes.gateway;
        } else if (isMobile) {
            return AppConfig.nodes.mobile;
        } else {
            return AppConfig.nodes.anchor;
        }
    }

    /**
     * Create or update a node marker
     */
    updateNodeMarker(nodeId, node, gpsCoords, hasAbsoluteGPS = false) {
        if (!this.mapManager.map || !this.mapManager.isMapView) return;

        if (this.nodeMarkers.has(nodeId)) {
            // Update existing marker position and style
            const marker = this.nodeMarkers.get(nodeId);
            marker.setLatLng([gpsCoords.lat, gpsCoords.lng]);
            
            // Update marker styling if GPS status changed
            this.updateMarkerStyle(nodeId, node, gpsCoords, hasAbsoluteGPS);
        } else {
            // Create new marker
            this.createNodeMarker(nodeId, node, gpsCoords, hasAbsoluteGPS);
        }
    }

    /**
     * Update existing marker style
     */
    updateMarkerStyle(nodeId, node, gpsCoords, hasAbsoluteGPS) {
        const marker = this.nodeMarkers.get(nodeId);
        if (!marker) return;

        const styling = this.getNodeStyling(nodeId, node, hasAbsoluteGPS);
        const nodeType = this.getNodeType(nodeId, node, hasAbsoluteGPS);

        // Recreate the icon with new styling
        const markerHtml = this.createMarkerHTML(nodeId, styling, nodeType);
        const customIcon = L.divIcon({
            className: 'map-node-marker-container',
            html: markerHtml,
            iconSize: [styling.size, styling.size],
            iconAnchor: [styling.size/2, styling.size/2]
        });

        marker.setIcon(customIcon);

        // Update popup content
        const popupContent = this.createPopupContent(nodeId, styling, nodeType, gpsCoords, hasAbsoluteGPS);
        marker.setPopupContent(popupContent);
    }

    /**
     * Create a new node marker
     */
    createNodeMarker(nodeId, node, gpsCoords, hasAbsoluteGPS = false) {
        const styling = this.getNodeStyling(nodeId, node, hasAbsoluteGPS);
        const nodeType = this.getNodeType(nodeId, node, hasAbsoluteGPS);

        const markerHtml = this.createMarkerHTML(nodeId, styling, nodeType);
        const customIcon = L.divIcon({
            className: 'map-node-marker-container',
            html: markerHtml,
            iconSize: [styling.size, styling.size],
            iconAnchor: [styling.size/2, styling.size/2]
        });

        const marker = L.marker([gpsCoords.lat, gpsCoords.lng], {
            icon: customIcon
        }).addTo(this.mapManager.map);

        // Add popup
        const popupContent = this.createPopupContent(nodeId, styling, nodeType, gpsCoords, hasAbsoluteGPS);
        marker.bindPopup(popupContent);

        this.nodeMarkers.set(nodeId, marker);

        // Emit event
        eventBus.emit('marker-created', { nodeId, marker, hasAbsoluteGPS });
    }

    /**
     * Create marker HTML with GPS indication
     */
    createMarkerHTML(nodeId, styling, nodeType) {
        const displayId = nodeId.length > 4 ? nodeId.substring(0, 4) : nodeId;
        
        return `
            <div class="map-node-marker ${nodeType} ${styling.typeLabel === 'GPS' ? 'gps-absolute' : ''}" style="
                width: ${styling.size}px;
                height: ${styling.size}px;
                background: radial-gradient(circle at 30% 30%, ${styling.color}dd, ${styling.color}, ${styling.borderColor});
                border: 3px solid ${styling.typeLabel === 'GPS' ? '#ff0000' : 'rgba(255, 255, 255, 0.8)'};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${styling.fontSize || '10px'};
                font-weight: bold;
                color: white;
                box-shadow: ${styling.typeLabel === 'GPS' ? '0 0 15px rgba(255, 0, 0, 0.6), 0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.4)'};
                position: relative;
                cursor: pointer;
                transition: transform 0.2s ease;
                ${styling.typeLabel === 'GPS' ? 'animation: gps-pulse 2s infinite;' : ''}
            ">
                ${displayId}
                <div style="
                    position: absolute;
                    top: -18px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 9px;
                    color: ${styling.color};
                    font-weight: bold;
                    background: white;
                    padding: 2px 4px;
                    border-radius: 3px;
                    border: 1px solid ${styling.color};
                    ${styling.typeLabel === 'GPS' ? 'background: #ffe6e6;' : ''}
                ">${styling.typeLabel}</div>
            </div>
        `;
    }

    /**
     * Create popup content with GPS information
     */
    createPopupContent(nodeId, styling, nodeType, gpsCoords, hasAbsoluteGPS) {
        const typeEmoji = hasAbsoluteGPS ? '🛰️' : 
                         nodeType === 'gateway' ? '🚪' : 
                         nodeType === 'mobile' ? '📱' : '⚓';
        
        const typeName = hasAbsoluteGPS ? 'GPS Anchor' :
                        nodeType === 'gateway' ? 'Gateway' : 
                        nodeType === 'mobile' ? 'Mobile Tag' : 'Anchor';

        const positionType = hasAbsoluteGPS ? 'Absolute GPS' : 'Derived Position';
        const accuracy = gpsCoords.accuracy ? ` (±${gpsCoords.accuracy}m)` : '';

        return `
            <div style="text-align: center; font-family: Arial, sans-serif;">
                <strong style="font-size: 16px; color: ${styling.color};">${nodeId}</strong><br>
                <span style="font-size: 14px;">${typeEmoji} ${typeName}</span><br>
                <div style="font-size: 12px; color: #666; margin-top: 4px;">
                    <strong>Position:</strong> ${positionType}${accuracy}<br>
                    <strong>Lat:</strong> ${gpsCoords.lat.toFixed(6)}<br>
                    <strong>Lng:</strong> ${gpsCoords.lng.toFixed(6)}<br>
                    ${gpsCoords.derived && gpsCoords.referenceNode ? 
                        `<strong>Reference:</strong> ${gpsCoords.referenceNode}<br>` : ''}
                    <strong>Scale:</strong> ${this.mapManager.scaling?.physicsToMetersScale?.toFixed(3) || '1.000'} m/unit
                </div>
            </div>
        `;
    }

    /**
     * Get node type with GPS consideration
     */
    getNodeType(nodeId, node, hasAbsoluteGPS = false) {
        if (hasAbsoluteGPS) return 'gps-anchor';
        
        const isGateway = nodeId === 'B5A4' || node.type === 'gateway';
        const isMobile = nodeId.startsWith('T') && nodeId.length === 4;
        
        if (isGateway) return 'gateway';
        if (isMobile) return 'mobile';
        return 'anchor';
    }

    /**
     * Update connection lines
     */
    updateConnectionLines(connections) {
        if (!this.mapManager.map || !this.mapManager.isMapView) return;

        this.clearConnectionLines();

        if (!connections) return;

        connections.forEach((connection, connectionKey) => {
            this.createConnectionLine(connectionKey, connection);
        });
    }

    /**
     * Create a connection line
     */
    createConnectionLine(connectionKey, connection) {
        const [nodeId1, nodeId2] = connectionKey.split('-');
        
        const marker1 = this.nodeMarkers.get(nodeId1);
        const marker2 = this.nodeMarkers.get(nodeId2);
        
        if (marker1 && marker2) {
            const pos1 = marker1.getLatLng();
            const pos2 = marker2.getLatLng();
            
            // Create line
            const line = L.polyline([pos1, pos2], {
                color: connection.isStale ? '#cccccc' : '#3498db',
                weight: 2,
                opacity: connection.isStale ? 0.4 : 0.7,
                dashArray: '5, 5'
            }).addTo(this.mapManager.map);
            
            // Create distance label
            const midLat = (pos1.lat + pos2.lat) / 2;
            const midLng = (pos1.lng + pos2.lng) / 2;
            
            const distance = connection.distance || 0;
            const distanceLabel = L.divIcon({
                className: 'map-distance-label',
                html: `<div class="distance-text" style="
                    background: rgba(255, 255, 255, 0.9);
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 10px;
                    font-weight: bold;
                    color: ${connection.isStale ? '#999' : '#333'};
                    border: 1px solid ${connection.isStale ? '#ccc' : '#3498db'};
                ">${distance.toFixed(2)}m</div>`,
                iconSize: [50, 20],
                iconAnchor: [25, 10]
            });
            
            const distanceMarker = L.marker([midLat, midLng], { 
                icon: distanceLabel,
                interactive: false
            });
            
            // Only add to map if distance labels are enabled
            if (this.showDistanceLabels) {
                distanceMarker.addTo(this.mapManager.map);
            }
            
            this.connectionLines.set(connectionKey, {
                line: line,
                label: distanceMarker
            });
        }
    }

    /**
     * Clear all connection lines
     */
    clearConnectionLines() {
        this.connectionLines.forEach((connection) => {
            if (this.mapManager.map) {
                this.mapManager.map.removeLayer(connection.line);
                if (connection.label) {
                    this.mapManager.map.removeLayer(connection.label);
                }
            }
        });
        this.connectionLines.clear();
    }

    /**
     * Clear all markers
     */
    clearAllMarkers() {
        this.nodeMarkers.forEach((marker) => {
            if (this.mapManager.map) {
                this.mapManager.map.removeLayer(marker);
            }
        });
        this.nodeMarkers.clear();
        this.clearConnectionLines();
        this.removeBoundingBox();
    }

    /**
     * Remove specific marker
     */
    removeMarker(nodeId) {
        if (this.nodeMarkers.has(nodeId)) {
            const marker = this.nodeMarkers.get(nodeId);
            if (this.mapManager.map) {
                this.mapManager.map.removeLayer(marker);
            }
            this.nodeMarkers.delete(nodeId);
        }

        // Remove connection lines involving this node
        const connectionsToRemove = [];
        this.connectionLines.forEach((connection, connectionId) => {
            if (connectionId.includes(nodeId)) {
                connectionsToRemove.push(connectionId);
            }
        });
        
        connectionsToRemove.forEach(connectionId => {
            const connection = this.connectionLines.get(connectionId);
            if (this.mapManager.map && connection) {
                this.mapManager.map.removeLayer(connection.line);
                if (connection.label) {
                    this.mapManager.map.removeLayer(connection.label);
                }
            }
            this.connectionLines.delete(connectionId);
        });
    }

    /**
     * Get marker statistics
     */
    getStats() {
        let gpsMarkers = 0;
        let derivedMarkers = 0;

        this.nodeMarkers.forEach((marker, nodeId) => {
            // Check if this is a GPS marker by looking at the marker's class
            const markerElement = marker.getElement();
            if (markerElement && markerElement.querySelector('.gps-absolute')) {
                gpsMarkers++;
            } else {
                derivedMarkers++;
            }
        });

        return {
            nodeMarkers: this.nodeMarkers.size,
            gpsMarkers: gpsMarkers,
            derivedMarkers: derivedMarkers,
            connectionLines: this.connectionLines.size,
            showDistanceLabels: this.showDistanceLabels,
            showBoundingBox: this.showBoundingBox
        };
    }

    /**
     * Toggle bounding box visibility
     */
    toggleBoundingBox() {
        this.showBoundingBox = !this.showBoundingBox;

        if (this.showBoundingBox) {
            this.updateBoundingBox();
        } else {
            this.removeBoundingBox();
        }

        console.log(`🗺️ Bounding box ${this.showBoundingBox ? 'enabled' : 'disabled'}`);
        eventBus.emit('bounding-box-toggled', { enabled: this.showBoundingBox });
    }

    /**
     * Update bounding box around all nodes
     */
    updateBoundingBox() {
        if (!this.mapManager.map || !this.mapManager.isMapView || !this.showBoundingBox) return;

        // Remove existing bounding box
        this.removeBoundingBox();

        if (this.nodeMarkers.size < 2) return; // Need at least 2 nodes for a meaningful box

        // Calculate bounds
        let minLat = Infinity, maxLat = -Infinity;
        let minLng = Infinity, maxLng = -Infinity;

        this.nodeMarkers.forEach(marker => {
            const pos = marker.getLatLng();
            minLat = Math.min(minLat, pos.lat);
            maxLat = Math.max(maxLat, pos.lat);
            minLng = Math.min(minLng, pos.lng);
            maxLng = Math.max(maxLng, pos.lng);
        });

        // Add some padding (5% of the range)
        const latRange = maxLat - minLat;
        const lngRange = maxLng - minLng;
        const latPadding = latRange * 0.05;
        const lngPadding = lngRange * 0.05;

        minLat -= latPadding;
        maxLat += latPadding;
        minLng -= lngPadding;
        maxLng += lngPadding;

        // Create bounding box rectangle
        const bounds = [[minLat, minLng], [maxLat, maxLng]];
        this.boundingBoxRect = L.rectangle(bounds, {
            color: '#ff7800',
            weight: 2,
            fillOpacity: 0.1,
            dashArray: '5, 5'
        }).addTo(this.mapManager.map);

        // Calculate distances in meters
        const widthMeters = this.mapManager.gpsUtils.calculateDistance(minLat, minLng, minLat, maxLng);
        const heightMeters = this.mapManager.gpsUtils.calculateDistance(minLat, minLng, maxLat, minLng);

        // Add distance labels
        this.addBoundingBoxLabels(minLat, maxLat, minLng, maxLng, widthMeters, heightMeters);

        console.log(`🗺️ Bounding box updated: ${widthMeters.toFixed(1)}m × ${heightMeters.toFixed(1)}m`);
    }

    /**
     * Add distance labels to bounding box
     */
    addBoundingBoxLabels(minLat, maxLat, minLng, maxLng, widthMeters, heightMeters) {
        this.boundingBoxLabels = [];

        // Width label (bottom center)
        const widthLabelPos = [minLat, (minLng + maxLng) / 2];
        const widthLabel = L.divIcon({
            className: 'bounding-box-label',
            html: `<div style="
                background: rgba(255, 120, 0, 0.9);
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 11px;
                font-weight: bold;
                text-align: center;
                white-space: nowrap;
            ">${widthMeters.toFixed(1)}m</div>`,
            iconSize: [60, 20],
            iconAnchor: [30, 10]
        });

        const widthMarker = L.marker(widthLabelPos, {
            icon: widthLabel,
            interactive: false
        }).addTo(this.mapManager.map);
        this.boundingBoxLabels.push(widthMarker);

        // Height label (left center, rotated)
        const heightLabelPos = [(minLat + maxLat) / 2, minLng];
        const heightLabel = L.divIcon({
            className: 'bounding-box-label',
            html: `<div style="
                background: rgba(255, 120, 0, 0.9);
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 11px;
                font-weight: bold;
                text-align: center;
                white-space: nowrap;
                transform: rotate(-90deg);
            ">${heightMeters.toFixed(1)}m</div>`,
            iconSize: [60, 20],
            iconAnchor: [30, 10]
        });

        const heightMarker = L.marker(heightLabelPos, {
            icon: heightLabel,
            interactive: false
        }).addTo(this.mapManager.map);
        this.boundingBoxLabels.push(heightMarker);
    }

    /**
     * Remove bounding box
     */
    removeBoundingBox() {
        if (this.boundingBoxRect) {
            this.mapManager.map.removeLayer(this.boundingBoxRect);
            this.boundingBoxRect = null;
        }

        if (this.boundingBoxLabels) {
            this.boundingBoxLabels.forEach(label => {
                this.mapManager.map.removeLayer(label);
            });
            this.boundingBoxLabels = [];
        }
    }
}

// After the original updateConnectionLines method
const originalUpdateConnectionLines = MapMarkerManager.prototype.updateConnectionLines;
MapMarkerManager.prototype.updateConnectionLines = function(connections) {
    originalUpdateConnectionLines.call(this, connections);

    if (this.showBoundingBox) {
        this.updateBoundingBox();
    }
};

window.MapMarkerManager = MapMarkerManager;