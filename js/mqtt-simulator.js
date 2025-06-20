/**
 * UWB Position Simulator - Browser-Compatible MQTT Simulation
 * Part of the INST Project - Indoor Positioning System Technology
 * Copyright (C) Dynamic Devices Ltd 2025
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Browser-compatible simulation of UWB positioning data for testing
 * the visualiser without requiring real hardware.
 */

class UWBSimulator {
    constructor(mqttManager) {
        this.mqttManager = mqttManager;
        this.running = false;
        this.intervalId = null;
        this.publishInterval = 1; // Default 1 second (changed from publishRate)
        this.timeOffset = 0.0;
        this.tagCount = 3; // Default 3 tags

        // Define node positions in coordinate system (metres) and GPS coordinates
        this.nodes = {
            "B5A4": { x: 0.0, y: 0.0, type: 'gateway', lat: 53.4084, lon: -2.9916 }, // Gateway at origin (Liverpool)
            "R001": { x: 3.0, y: 2.0, type: 'anchor' },    // Room 1
            "R002": { x: 1.5, y: 4.0, type: 'anchor' },    // Room 2
            "R003": { x: 5.0, y: 3.5, type: 'anchor' },    // Room 3
        };

        // Initialize mobile tags (configurable 1-10)
        this.mobileTags = [];
        this.tagMovement = new Map(); // Store movement parameters for each tag
        this.initializeMobileTags(this.tagCount); // Use tagCount instead of hardcoded 1
        this.noiseStddev = 0.05; // 5cm standard deviation

        // Statistics
        this.messagesPublished = 0;
        this.startTime = null;
    }

    /**
     * Generate Gaussian random noise
     */
    gaussianRandom(mean = 0, stddev = 1) {
        // Box-Muller transformation
        if (this.spare !== undefined) {
            const val = this.spare * stddev + mean;
            delete this.spare;
            return val;
        }

        const u1 = Math.random();
        const u2 = Math.random();
        const mag = stddev * Math.sqrt(-2.0 * Math.log(u1));
        const z0 = mag * Math.cos(2.0 * Math.PI * u2) + mean;
        this.spare = mag * Math.sin(2.0 * Math.PI * u2);

        return z0;
    }

    /**
     * Calculate distance between two positions with realistic noise
     */
    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // Add realistic measurement noise
        const noise = this.gaussianRandom(0, this.noiseStddev);
        distance += noise;

        // Ensure positive distance
        return Math.max(0.1, distance);
    }

    /**
     * Update positions of mobile tags with individual movement patterns
     */
    updateMobilePositions() {
        this.timeOffset += 0.1;

        this.mobileTags.forEach((tagId, index) => {
            const movement = this.tagMovement.get(tagId);
            if (!movement) return;

            // Calculate new position using circular movement pattern
            const angle = this.timeOffset * movement.speed + movement.phase;
            const newX = movement.centerX + Math.cos(angle) * movement.radius;
            const newY = movement.centerY + Math.sin(angle) * movement.radius;

            this.nodes[tagId].x = newX;
            this.nodes[tagId].y = newY;
        });
    }

    /**
     * Generate distance measurements between all node pairs
     */
    generateDistances() {
        this.updateMobilePositions();

        const distances = [];
        const nodeList = Object.keys(this.nodes);

        // Generate distances between all pairs
        for (let i = 0; i < nodeList.length; i++) {
            for (let j = i + 1; j < nodeList.length; j++) {
                const node1 = nodeList[i];
                const node2 = nodeList[j];

                const pos1 = this.nodes[node1];
                const pos2 = this.nodes[node2];

                const distance = this.calculateDistance(pos1, pos2);
                distances.push([node1, node2, Math.round(distance * 100) / 100]); // Round to 2 decimal places
            }
        }

        return distances;
    }

    /**
     * Publish simulated distance data via MQTT
     */
    publishDistances() {
        if (!this.mqttManager.isConnected()) {
            console.warn('📡 MQTT not connected - simulation data not published');
            return;
        }

        const distances = this.generateDistances();

        try {
            const topic = document.getElementById('mqttTopic').value.trim();
            const message = JSON.stringify(distances);

            const mqttMessage = new Paho.MQTT.Message(message);
            mqttMessage.destinationName = topic;
            mqttMessage.qos = 1;

            this.mqttManager.getClient().send(mqttMessage);

            this.messagesPublished++;

            // Log success with sample data
            console.log(`📤 Simulation: Published ${distances.length} distance measurements`);
            if (distances.length > 0) {
                console.log(`📍 Sample: ${distances[0][0]} ↔ ${distances[0][1]} = ${distances[0][2]}m`);
            }

            // Update simulation statistics
            this.updateSimulationStats();

        } catch (error) {
            console.error('❌ Simulation publish error:', error);
        }
    }

    /**
     * Update simulation statistics display
     */
    updateSimulationStats() {
        const uptimeSeconds = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
        const avgRate = this.messagesPublished / Math.max(uptimeSeconds, 1);

        // Update any simulation status display (if exists)
        const simStatus = document.getElementById('simulationStatus');
        if (simStatus) {
            simStatus.textContent = `🎭 Simulation: ${this.messagesPublished} messages, ${avgRate.toFixed(2)} msg/s, ${this.tagCount} tags, ${this.publishInterval}s interval`;
        }
    }

    /**
     * Start the simulation
     */
    start() {
        console.log('🎭 UWBSimulator.start() called');

        if (this.running) {
            console.warn('🎭 Simulation already running');
            return;
        }

        if (!this.mqttManager) {
            console.error('❌ MQTT Manager not provided to simulator');
            return;
        }

        if (!this.mqttManager.isConnected()) {
            console.error('❌ Cannot start simulation - MQTT not connected');
            return;
        }

        this.running = true;
        this.startTime = Date.now();
        this.messagesPublished = 0;
        this.timeOffset = 0.0;

        const intervalMs = this.publishInterval * 1000; // Fixed: use publishInterval instead of publishRate

        console.log('🎭 Starting UWB simulation...');
        console.log(`📍 Simulated network: Gateway B5A4 + 3 anchors + ${this.tagCount} mobile tags`);
        console.log(`🔄 Mobile tags moving in circular patterns with 5cm measurement noise`);
        console.log(`📡 Publishing every ${this.publishInterval}s (${intervalMs}ms)`); // Fixed: use publishInterval

        // Start the publishing interval
        this.intervalId = setInterval(() => {
            this.publishDistances();
        }, intervalMs);

        console.log(`✅ Simulation started with interval ID: ${this.intervalId}`);

        // Update UI
        this.updateSimulationUI(true);
    }

    /**
     * Stop the simulation
     */
    stop() {
        if (!this.running) {
            console.warn('🎭 Simulation not running');
            return;
        }

        this.running = false;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        const uptimeSeconds = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;

        console.log('🛑 UWB simulation stopped');
        console.log(`📊 Published ${this.messagesPublished} messages in ${uptimeSeconds.toFixed(1)}s`);

        // Update UI
        this.updateSimulationUI(false);
    }

    /**
     * Update simulation UI elements
     */
    updateSimulationUI(running) {
        const startBtn = document.getElementById('startSimulation');
        const stopBtn = document.getElementById('stopSimulation');

        if (startBtn) {
            startBtn.disabled = running;
            startBtn.textContent = running ? 'Simulation Running...' : 'Start Simulation';
        }

        if (stopBtn) {
            stopBtn.disabled = !running;
        }
    }

    /**
     * Set simulation publishing interval
     * @param {number} intervalSeconds - Interval in seconds (1-60)
     */
    setPublishInterval(intervalSeconds) {
        this.publishInterval = Math.max(1, Math.min(60, intervalSeconds)); // Clamp between 1 and 60 seconds

        console.log(`🔄 Simulation interval updated: ${this.publishInterval}s (every ${this.publishInterval * 1000}ms)`);

        // Restart interval if running
        if (this.running && this.intervalId) {
            clearInterval(this.intervalId);
            const intervalMs = this.publishInterval * 1000;
            this.intervalId = setInterval(() => {
                this.publishDistances();
            }, intervalMs);
        }
    }

    /**
     * Set number of mobile tags
     */
    setTagCount(count) {
        count = Math.max(1, Math.min(10, count)); // Clamp between 1-10 tags
        this.tagCount = count;
        this.initializeMobileTags(count);
        console.log(`🏷️ Tag count updated: ${count} mobile tags`);
    }

    /**
     * Get current node positions (for debugging)
     */
    getCurrentPositions() {
        return JSON.parse(JSON.stringify(this.nodes)); // Deep copy
    }

    /**
     * Initialize mobile tags with individual movement parameters
     */
    initializeMobileTags(count) {
        count = Math.max(1, Math.min(10, count)); // Clamp between 1-10 tags

        // Remove existing mobile tags from nodes
        this.mobileTags.forEach(tagId => {
            delete this.nodes[tagId];
        });

        this.mobileTags = [];
        this.tagMovement.clear();

        for (let i = 1; i <= count; i++) {
            const tagId = `T${String(i).padStart(3, '0')}`;

            // Create tag with initial position
            const tag = {
                id: tagId,
                type: 'mobile',
                x: (Math.random() - 0.5) * 8 + 2.5, // Random position within area
                y: (Math.random() - 0.5) * 8 + 2.5
            };

            // Create movement parameters for this tag
            const movement = {
                centerX: tag.x,
                centerY: tag.y,
                radius: 1 + Math.random() * 2, // Movement radius 1-3m
                speed: 0.2 + Math.random() * 0.4, // Speed 0.2-0.6 rad/s
                phase: Math.random() * Math.PI * 2, // Random starting phase
                noiseLevel: 0.05 // 5cm measurement noise
            };

            this.nodes[tagId] = tag;
            this.mobileTags.push(tagId);
            this.tagMovement.set(tagId, movement);
        }

        console.log(`🏷️ Initialized ${count} mobile tags with individual movement patterns`);
    }

    /**
     * Reset simulation state
     */
    reset() {
        this.stop();
        this.timeOffset = 0.0;
        this.messagesPublished = 0;
        this.startTime = null;

        // Reinitialize mobile tags
        this.initializeMobileTags(this.tagCount);

        console.log('🔄 Simulation reset');
    }

    /**
     * Check if simulation is running
     */
    isRunning() {
        return this.running;
    }

    /**
     * Get simulation statistics
     */
    getStats() {
        const uptimeSeconds = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
        const avgRate = this.messagesPublished / Math.max(uptimeSeconds, 1);

        return {
            running: this.running,
            messagesPublished: this.messagesPublished,
            uptimeSeconds: uptimeSeconds,
            averageRate: avgRate,
            currentInterval: this.publishInterval,
            nodeCount: Object.keys(this.nodes).length,
            mobileNodes: this.mobileTags.length,
            tagCount: this.tagCount
        };
    }
}