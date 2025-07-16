/**
 * UWB Position Visualiser - Physics Engine v3.5
 * Copyright (C) Dynamic Devices Ltd 2025
 * 
 * Advanced spring-mass physics system for high-performance positioning simulation
 * Optimised for 100x faster movement with minimal damping and ultra-light masses
 */

class SpringMassSystem {
    constructor() {
        // HIGH PERFORMANCE PHYSICS PARAMETERS - Optimised for 100x faster movement
        this.springConstant = 2.0;     // 100x increase: extremely strong springs
        this.damping = 0.6;            // Minimal damping: allows maximum sustained motion
        this.mass = 0.2;               // 1/10 original mass: near-instant acceleration
        this.distanceScale = 120;      // Keep same visual scale
        this.timeStep = 1/60;          // 60fps unchanged
        
        // EXTREME FORCES - All scaled up 100x for lightning-fast response
        this.boundaryForce = 10.0;     // 100x increase: instant boundary containment
        this.screenMargin = 0.1;       // Keep 80% usable area
        
        // Repulsion parameters - 100x stronger
        this.repulsionStrength = 80000; // 100x increase: instant node separation
        this.minDistance = 80;         // Keep minimum distance same
        
        // Centering force - 200x stronger for better centralization
        this.centeringForce = 0.1;     // 200x increase: powerful center attraction
        
        // Auto-scaling parameters - highly responsive with better centering
        this.targetScreenUsage = 0.7;   // Target 70% usage for better centering
        this.scaleAdjustmentRate = 0.1; // Ultra-fast scale adjustments
        this.autoScaleEnabled = true; // Allow toggling auto/manual scaling
    }
    
    initializeNode(node, canvasWidth, canvasHeight) {
        // Initialise physics properties
        node.vx = node.vx || 0;        // Velocity X
        node.vy = node.vy || 0;        // Velocity Y
        node.fx = 0;                   // Force X
        node.fy = 0;                   // Force Y
        node.mass = this.mass;         // Use lighter mass for faster movement
        
        // If position not set, place in centre area
        if (!node.hasInitialPosition) {
            const centerX = canvasWidth / 2;
            const centerY = canvasHeight / 2;
            const maxRadius = Math.min(canvasWidth, canvasHeight) * 0.2; // Start in centre 40%
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * maxRadius;
            
            node.x = centerX + Math.cos(angle) * radius;
            node.y = centerY + Math.sin(angle) * radius;
            node.hasInitialPosition = true;
        }
    }
    
    applySpringForces(nodes, connections) {
        // Apply spring forces between connected nodes (masses connected by springs)
        connections.forEach(connection => {
            if (connection.isRemoved) return;
            
            const node1 = nodes.get(connection.node1);
            const node2 = nodes.get(connection.node2);
            
            if (!node1 || !node2 || node1.isRemoved || node2.isRemoved) return;
            
            // Calculate current distance between masses
            const dx = node2.x - node1.x;
            const dy = node2.y - node1.y;
            const currentDistance = Math.sqrt(dx*dx + dy*dy);
            
            if (currentDistance > 0) {
                // Target spring rest length in pixels
                const restLength = connection.distance * this.distanceScale;
                
                // Spring force: F = -k * (current_length - rest_length)
                // Using much stronger spring constant for faster response
                const displacement = currentDistance - restLength;
                const force = this.springConstant * displacement;
                
                // Unit vector along spring
                const ux = dx / currentDistance;
                const uy = dy / currentDistance;
                
                // Apply equal and opposite forces to the two masses
                const fx = force * ux;
                const fy = force * uy;
                
                node1.fx += fx;
                node1.fy += fy;
                node2.fx -= fx;
                node2.fy -= fy;
            }
        });
    }
    
    applyRepulsionForces(nodes) {
        // Prevent masses from overlapping - 10x stronger
        const nodeArray = Array.from(nodes.values()).filter(node => !node.isRemoved);
        
        for (let i = 0; i < nodeArray.length; i++) {
            for (let j = i + 1; j < nodeArray.length; j++) {
                const node1 = nodeArray[i];
                const node2 = nodeArray[j];
                
                const dx = node2.x - node1.x;
                const dy = node2.y - node1.y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                if (distance > 0 && distance < this.minDistance) {
                    // Much stronger repulsion force for faster separation
                    const force = this.repulsionStrength / (distance * distance);
                    
                    const ux = dx / distance;
                    const uy = dy / distance;
                    
                    const fx = force * ux;
                    const fy = force * uy;
                    
                    node1.fx -= fx;
                    node1.fy -= fy;
                    node2.fx += fx;
                    node2.fy += fy;
                }
            }
        }
    }
    
    applyBoundaryForces(nodes, canvasWidth, canvasHeight) {
        // Use a smaller margin when zoomed out (distanceScale < 40)
        let margin;
        if (this.distanceScale < 40) {
            margin = Math.min(canvasWidth, canvasHeight) * 0.05;
        } else {
            margin = Math.min(canvasWidth, canvasHeight) * 0.15;
        }
        const minX = margin;
        const maxX = canvasWidth - margin;
        const minY = margin;
        const maxY = canvasHeight - margin;
        
        nodes.forEach(node => {
            if (node.isRemoved) return;
            
            // Much stronger boundary forces for faster containment
            if (node.x < minX) {
                node.fx += this.boundaryForce * (minX - node.x);
            } else if (node.x > maxX) {
                node.fx += this.boundaryForce * (maxX - node.x);
            }
            
            if (node.y < minY) {
                node.fy += this.boundaryForce * (minY - node.y);
            } else if (node.y > maxY) {
                node.fy += this.boundaryForce * (maxY - node.y);
            }
        });
    }
    
    applyCenteringForce(nodes, canvasWidth, canvasHeight) {
        // Stronger force towards centre to prevent drift - 200x stronger
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        
        nodes.forEach(node => {
            if (node.isRemoved) return;
            
            const dx = centerX - node.x;
            const dy = centerY - node.y;
            const distanceFromCenter = Math.sqrt(dx*dx + dy*dy);
            
            // Base centering force
            node.fx += dx * this.centeringForce;
            node.fy += dy * this.centeringForce;
            
            // Additional strong centering force when nodes drift too far from center
            const maxCenterDistance = Math.min(canvasWidth, canvasHeight) * 0.25;
            if (distanceFromCenter > maxCenterDistance) {
                const extraForce = (distanceFromCenter - maxCenterDistance) * 0.5;
                const ux = dx / distanceFromCenter;
                const uy = dy / distanceFromCenter;
                node.fx += ux * extraForce;
                node.fy += uy * extraForce;
            }
        });
    }
    
    autoScale(nodes, canvasWidth, canvasHeight) {
        // Automatically adjust distance scale to maintain 70% screen usage - faster adjustments
        const activeNodes = Array.from(nodes.values()).filter(node => !node.isRemoved);
        if (activeNodes.length < 2) return;
        
        // Calculate current bounding box
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        activeNodes.forEach(node => {
            minX = Math.min(minX, node.x);
            maxX = Math.max(maxX, node.x);
            minY = Math.min(minY, node.y);
            maxY = Math.max(maxY, node.y);
        });
        
        const currentWidth = maxX - minX;
        const currentHeight = maxY - minY;
        const currentSize = Math.max(currentWidth, currentHeight);
        
        // Target size (70% of smaller screen dimension for better centering)
        const targetSize = Math.min(canvasWidth, canvasHeight) * 0.7;
        
        // Adjust scale if needed - faster adjustment rate
        if (currentSize > 0) {
            const sizeRatio = targetSize / currentSize;
            if (sizeRatio < 0.85 || sizeRatio > 1.15) {
                // More aggressive scale adjustment for faster response
                const adjustment = (sizeRatio - 1) * this.scaleAdjustmentRate;
                this.distanceScale *= (1 + adjustment);
                // Use the same min/max as the UI slider
                this.distanceScale = Math.max(10, Math.min(this.distanceScale, 500));
            }
        }
    }
    
    integrateMotion(nodes) {
        // Update velocities and positions of masses - with reduced damping for more motion
        nodes.forEach(node => {
            if (node.isRemoved) return;
            
            // Calculate acceleration (F = ma) - lighter mass means higher acceleration
            const ax = node.fx / node.mass;
            const ay = node.fy / node.mass;
            
            // Update velocity with less damping for more sustained motion
            node.vx = (node.vx + ax * this.timeStep) * this.damping;
            node.vy = (node.vy + ay * this.timeStep) * this.damping;
            
            // Update position
            node.x += node.vx * this.timeStep;
            node.y += node.vy * this.timeStep;
            
            // Reset forces for next iteration
            node.fx = 0;
            node.fy = 0;
        });
    }
    
    simulate(nodes, connections, canvasWidth, canvasHeight) {
        // Initialise new masses
        nodes.forEach(node => {
            if (!node.isRemoved) {
                this.initializeNode(node, canvasWidth, canvasHeight);
            }
        });
        
        // Apply all forces to the mass-spring system - all forces are now 10x stronger
        this.applySpringForces(nodes, connections);
        this.applyRepulsionForces(nodes);
        this.applyBoundaryForces(nodes, canvasWidth, canvasHeight);
        this.applyCenteringForce(nodes, canvasWidth, canvasHeight);
        
        // Auto-scale to maintain 80% screen usage - only if enabled
        if (this.autoScaleEnabled) {
            this.autoScale(nodes, canvasWidth, canvasHeight);
        }
        
        // Integrate equations of motion - less damping, lighter mass = faster movement
        this.integrateMotion(nodes);
    }
    
    // Calculate system energy for monitoring
    calculateEnergy(nodes) {
        let kineticEnergy = 0;
        nodes.forEach(node => {
            if (!node.isRemoved) {
                const speed = Math.sqrt(node.vx*node.vx + node.vy*node.vy);
                kineticEnergy += 0.5 * node.mass * speed * speed;
            }
        });
        return kineticEnergy;
    }
}