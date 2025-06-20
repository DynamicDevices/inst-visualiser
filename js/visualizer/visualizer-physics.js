/**
 * Visualizer Physics Management
 * Handles physics simulation integration and node positioning
 */

class VisualizerPhysicsManager {
    constructor(visualizer) {
        this.visualizer = visualizer;
        this.simulationRunning = false;
        this.animationFrame = null;
    }

    /**
     * Initialize physics manager
     */
    initialize() {
        console.log('🔬 Physics Manager initialized');
    }

    /**
     * Start physics simulation
     */
    startSimulation() {
        if (this.simulationRunning) return;
        
        this.simulationRunning = true;
        this.visualizer.simulationRunning = true;
        
        eventBus.emit('physics-started');
        
        const simulate = () => {
            if (!this.simulationRunning || !this.visualizer.physicsEnabled) return;
            
            // Run physics simulation with high-performance parameters
            this.visualizer.physics.simulate(
                this.visualizer.nodes, 
                this.visualizer.connections, 
                this.visualizer.canvas.offsetWidth, 
                this.visualizer.canvas.offsetHeight
            );
            
            // Update visualisation
            this.visualizer.updateVisualisation();
            
            // Continue simulation
            this.animationFrame = requestAnimationFrame(simulate);
        };
        
        this.animationFrame = requestAnimationFrame(simulate);
    }

    /**
     * Stop physics simulation
     */
    stopSimulation() {
        this.simulationRunning = false;
        this.visualizer.simulationRunning = false;
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        eventBus.emit('physics-stopped');
    }

    /**
     * Reset physics state
     */
    resetPhysics() {
        // Reset all node velocities and forces
        this.visualizer.nodes.forEach(node => {
            if (!node.isRemoved) {
                node.vx = 0;
                node.vy = 0;
                node.fx = 0;
                node.fy = 0;
                node.hasInitialPosition = false; // Allow re-initialisation
            }
        });
        
        this.visualizer.loggingManager?.logInfo('🔄 Advanced Physics state reset - all velocities zeroed');
    }

    /**
     * Center nodes on display
     */
    centerNodes() {
        const activeNodes = Array.from(this.visualizer.nodes.values()).filter(node => !node.isRemoved);
        if (activeNodes.length === 0) return;
        
        // Calculate centre of mass
        let centerX = 0, centerY = 0;
        activeNodes.forEach(node => {
            centerX += node.x;
            centerY += node.y;
        });
        centerX /= activeNodes.length;
        centerY /= activeNodes.length;
        
        // Calculate offset to canvas centre
        const canvasCenterX = this.visualizer.canvas.offsetWidth / 2;
        const canvasCenterY = this.visualizer.canvas.offsetHeight / 2;
        const offsetX = canvasCenterX - centerX;
        const offsetY = canvasCenterY - centerY;
        
        // Move all nodes
        activeNodes.forEach(node => {
            node.x += offsetX;
            node.y += offsetY;
        });
        
        this.visualizer.loggingManager?.logSuccess('🎯 Nodes centred on display');
    }

    /**
     * Check and auto-center nodes if they drift
     */
    checkAndCenterNodes() {
        const activeNodes = Array.from(this.visualizer.nodes.values()).filter(node => !node.isRemoved);
        if (activeNodes.length === 0) return;
        
        // Calculate center of mass
        let centerX = 0, centerY = 0;
        activeNodes.forEach(node => {
            centerX += node.x;
            centerY += node.y;
        });
        centerX /= activeNodes.length;
        centerY /= activeNodes.length;
        
        // Check if center of mass has drifted too far from canvas center
        const canvasCenterX = this.visualizer.canvas.offsetWidth / 2;
        const canvasCenterY = this.visualizer.canvas.offsetHeight / 2;
        const driftX = Math.abs(centerX - canvasCenterX);
        const driftY = Math.abs(centerY - canvasCenterY);
        const maxDrift = Math.min(this.visualizer.canvas.offsetWidth, this.visualizer.canvas.offsetHeight) * 0.15;
        
        if (driftX > maxDrift || driftY > maxDrift) {
            this.centerNodes();
            if (this.visualizer.uiManager?.debugMode) {
                this.visualizer.loggingManager?.logInfo(`🎯 Auto-centered nodes - drift detected: ${driftX.toFixed(1)}px, ${driftY.toFixed(1)}px`);
            }
        }
    }

    /**
     * Update physics parameters
     */
    updateSpringStrength(value) {
        this.visualizer.physics.springConstant = parseFloat(value);
        this.visualizer.loggingManager?.logInfo(`Spring strength set to ${value} (High-performance mode)`);
    }

    /**
     * Update damping factor
     */
    updateDamping(value) {
        this.visualizer.physics.damping = parseFloat(value);
        this.visualizer.loggingManager?.logInfo(`Damping set to ${value} (minimal damping = maximum motion)`);
    }

    /**
     * Update node mass
     */
    updateMass(value) {
        this.visualizer.physics.mass = parseFloat(value);
        // Update mass for all existing nodes
        this.visualizer.nodes.forEach(node => {
            if (!node.isRemoved) node.mass = this.visualizer.physics.mass;
        });
        this.visualizer.loggingManager?.logInfo(`Node mass set to ${value} (lightweight = responsive positioning)`);
    }

    /**
     * Update distance scale
     */
    updateScale(value) {
        this.visualizer.physics.distanceScale = parseInt(value);
        this.visualizer.loggingManager?.logInfo(`Distance scale set to ${value}px/m`);
    }

    /**
     * Get physics statistics
     */
    getStats() {
        return {
            simulationRunning: this.simulationRunning,
            springConstant: this.visualizer.physics.springConstant,
            damping: this.visualizer.physics.damping,
            mass: this.visualizer.physics.mass,
            distanceScale: this.visualizer.physics.distanceScale,
            animationFrame: !!this.animationFrame
        };
    }
}

window.VisualizerPhysicsManager = VisualizerPhysicsManager;