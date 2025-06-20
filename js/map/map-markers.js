/**
 * Map Marker Management
 * Handles creation, updating, and styling of map markers
 */

class MapMarkerManager {
    constructor(mapManager) {
        this.mapManager = mapManager;
        this.nodeMarkers = new Map();
        this.connectionLines = new Map();
    }

    /**
     * Get node styling configuration
     */
    getNodeStyling(nodeId, node) {
        const isGateway = nodeId === 'B5A4' || node.type === 'gateway';
        const isMobile = nodeId.startsWith('T') && nodeId.length === 4;
        
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
    updateNodeMarker(nodeId, node, gpsCoords) {
        if (!this.mapManager.map || !this.mapManager.isMapView) return;

        if (this.nodeMarkers.has(nodeId)) {
            // Update existing marker position
            const marker = this.nodeMarkers.get(nodeId);
            marker.setLatLng([gpsCoords.lat, gpsCoords.lng]);
        } else {
            // Create new marker
            this.createNodeMarker(nodeId, node, gpsCoords);
        }
    }

    /**
     * Create a new node marker
     */
    createNodeMarker(nodeId, node, gpsCoords) {
        const styling = this.getNodeStyling(nodeId, node);
        const nodeType = this.getNodeType(nodeId, node);

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
        const popupContent = this.createPopupContent(nodeId, styling, nodeType, gpsCoords);
        marker.bindPopup(popupContent);

        this.nodeMarkers.set(nodeId, marker);

        // Emit event
        eventBus.emit('marker-created', { nodeId, marker });
    }

    /**
     * Create marker HTML
     */
    createMarkerHTML(nodeId, styling, nodeType) {
        return `
            <div class="map-node-marker ${nodeType}" style="
                width: ${styling.size}px;
                height: ${styling.size}px;
                background: radial-gradient(circle at 30% 30%, ${styling.color}dd, ${styling.color}, ${styling.borderColor});
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
                    color: ${styling.color};
                    font-weight: bold;
                    background: white;
                    padding: 2px 4px;
                    border-radius: 3px;
                    border: 1px solid ${styling.color};
                ">${styling.typeLabel}</div>
            </div>
        `;
    }

    /**
     * Create popup content
     */
    createPopupContent(nodeId, styling, nodeType, gpsCoords) {
        const typeEmoji = nodeType === 'gateway' ? '🚪' : 
                         nodeType === 'mobile' ? '📱' : '⚓';
        const typeName = nodeType === 'gateway' ? 'Gateway' : 
                        nodeType === 'mobile' ? 'Mobile Tag' : 'Anchor';

        return `
            <div style="text-align: center; font-family: Arial, sans-serif;">
                <strong style="font-size: 16px; color: ${styling.color};">${nodeId}</strong><br>
                <span style="font-size: 14px;">${typeEmoji} ${typeName}</span><br>
                <div style="font-size: 12px; color: #666; margin-top: 4px;">
                    Lat: ${gpsCoords.lat.toFixed(6)}<br>
                    Lng: ${gpsCoords.lng.toFixed(6)}<br>
                    Scale: ${this.mapManager.physicsToMetersScale?.toFixed(3) || '1.000'} m/unit
                </div>
            </div>
        `;
    }

    /**
     * Get node type
     */
    getNodeType(nodeId, node) {
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
                color: '#3498db',
                weight: 2,
                opacity: 0.7,
                dashArray: '5, 5'
            }).addTo(this.mapManager.map);
            
            // Create distance label
            const midLat = (pos1.lat + pos2.lat) / 2;
            const midLng = (pos1.lng + pos2.lng) / 2;
            
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
            }).addTo(this.mapManager.map);
            
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
                this.mapManager.map.removeLayer(connection.label);
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
                this.mapManager.map.removeLayer(connection.label);
            }
            this.connectionLines.delete(connectionId);
        });
    }

    /**
     * Get marker statistics
     */
    getStats() {
        return {
            nodeMarkers: this.nodeMarkers.size,
            connectionLines: this.connectionLines.size
        };
    }
}

window.MapMarkerManager = MapMarkerManager;