/**
 * Map Scaling Management
 * Handles physics-to-GPS scaling and scale control display
 */

class MapScalingManager {
    constructor(mapManager) {
        this.mapManager = mapManager;
        this.uwbToGpsScale = 1.0;
        this.physicsToMetersScale = 1.0;
        this.scaleControl = null;
    }

    /**
     * Add custom scale control to map
     */
    addCustomScaleControl() {
        if (!this.mapManager.map) return;

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
                
                const zoom = this._map.getZoom();
                const metersPerPixel = 40075016.686 * Math.cos(centerLat * Math.PI / 180) / Math.pow(2, zoom + 8);
                
                const scalePixels = 100;
                const scaleMeters = metersPerPixel * scalePixels;
                
                let scaleText;
                if (scaleMeters >= 1000) {
                    const scaleDistance = Math.round(scaleMeters / 100) / 10;
                    scaleText = `${scaleDistance} km`;
                } else if (scaleMeters >= 1) {
                    const scaleDistance = Math.round(scaleMeters);
                    scaleText = `${scaleDistance} m`;
                } else {
                    const scaleDistance = Math.round(scaleMeters * 100);
                    scaleText = `${scaleDistance} cm`;
                }
                
                this._container.innerHTML = `
                    <div style="border-bottom: 3px solid #333; width: ${scalePixels}px; margin: 0 auto 2px auto;"></div>
                    <div>${scaleText}</div>
                `;
            }
        });

        this.scaleControl = new ScaleControl({ position: 'topright' });
        this.scaleControl.addTo(this.mapManager.map);
    }

    /**
     * Calculate physics to meters scale
     */
    calculatePhysicsScale(physicsNodes, connections) {
        if (!connections || connections.size === 0) return;

        let totalScaleRatio = 0;
        let scaleCount = 0;

        connections.forEach((connection, connectionKey) => {
            const [nodeId1, nodeId2] = connectionKey.split('-');
            const physicsPos1 = physicsNodes.get(nodeId1);
            const physicsPos2 = physicsNodes.get(nodeId2);
            
            if (physicsPos1 && physicsPos2 && connection.distance) {
                const physicsDistance = Math.sqrt(
                    Math.pow(physicsPos2.x - physicsPos1.x, 2) + 
                    Math.pow(physicsPos2.y - physicsPos1.y, 2)
                );
                
                if (physicsDistance > 0.1) {
                    const scaleRatio = connection.distance / physicsDistance;
                    totalScaleRatio += scaleRatio;
                    scaleCount++;
                }
            }
        });

        if (scaleCount > 0) {
            const newScale = totalScaleRatio / scaleCount;
            // Smooth the scale changes
            this.physicsToMetersScale = this.physicsToMetersScale * 0.9 + newScale * 0.1;
            
            console.log(`🗺️ Physics scale updated: ${this.physicsToMetersScale.toFixed(3)} meters/physics-unit`);
            
            // Emit scale update event
            eventBus.emit('physics-scale-updated', {
                scale: this.physicsToMetersScale,
                sampleCount: scaleCount
            });
        }
    }

    /**
     * Set UWB to GPS scale factor
     */
    setUWBScale(scale) {
        this.uwbToGpsScale = Math.max(0.1, Math.min(10.0, scale));
        console.log(`🗺️ UWB to GPS scale set to: ${this.uwbToGpsScale}`);
        
        eventBus.emit('uwb-scale-updated', { scale: this.uwbToGpsScale });
    }

    /**
     * Convert physics coordinates to GPS offset
     */
    physicsToGPSOffset(deltaXPhysics, deltaYPhysics) {
        const deltaXMeters = deltaXPhysics * this.physicsToMetersScale * this.uwbToGpsScale;
        const deltaYMeters = deltaYPhysics * this.physicsToMetersScale * this.uwbToGpsScale;
        
        return { deltaXMeters, deltaYMeters };
    }

    /**
     * Remove scale control
     */
    removeScaleControl() {
        if (this.scaleControl && this.mapManager.map) {
            this.mapManager.map.removeControl(this.scaleControl);
            this.scaleControl = null;
        }
    }

    /**
     * Get scaling statistics
     */
    getStats() {
        return {
            uwbToGpsScale: this.uwbToGpsScale,
            physicsToMetersScale: this.physicsToMetersScale,
            hasScaleControl: !!this.scaleControl
        };
    }
}

window.MapScalingManager = MapScalingManager;