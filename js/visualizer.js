/**
 * INST Tag Visualizer v1.4 - Main JavaScript
 * Real-time UWB positioning visualization with MQTT connectivity
 */

(function() {
    'use strict';

    // === Configuration & Constants ===
    const CONFIG = {
        REVISION: 1.4,
        DEFAULT_SCALE: 5,
        PIXELS_PER_METER_BASE: 50,
        ANIMATION_DURATION: 2000,
        CONNECTION_TIMEOUT: 15000,
        SUBSCRIPTION_TIMEOUT: 10000,
        ACCURACY_TOLERANCE: 0.3,
        FAST_MESSAGE_THRESHOLD: 500,
        NODE_RADIUS: 30,
        NODE_DIAMETER: 60
    };

    // === Global State ===
    const state = {
        nodes: new Map(),
        connections: [],
        currentDistances: new Map(),
        mqttClient: null,
        currentTopic: null,
        simulationInterval: null,
        connectionTimer: null,
        animationFrameId: null,
        layoutUpdateInterval: null,
        
        // Flags
        isConnected: false,
        isLayoutAnimating: false,
        consoleVisible: false,
        animationsEnabled: true,
        fastMessageMode: false,
        showAccuracyIndicators: true,
        
        // Counters
        messagesReceived: 0,
        lastMessageTime: 0,
        
        // Settings
        nodeSpacing: CONFIG.DEFAULT_SCALE
    };

    // === Utility Functions ===
    const utils = {
        /**
         * Generate unique client ID for MQTT
         */
        generateClientId() {
            return 'WebClient_' + Math.random().toString(16).substr(2, 8);
        },

        /**
         * Clamp value between min and max
         */
        clamp(value, min, max) {
            return Math.max(min, Math.min(max, value));
        },

        /**
         * Calculate distance between two points
         */
        calculateDistance(x1, y1, x2, y2) {
            const dx = x2 - x1;
            const dy = y2 - y1;
            return Math.sqrt(dx * dx + dy * dy);
        },

        /**
         * Ease-in-out interpolation
         */
        easeInOut(progress) {
            return progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        },

        /**
         * Safe element query selector
         */
        $(selector) {
            return document.querySelector(selector);
        },

        /**
         * Safe element query selector all
         */
        $$(selector) {
            return document.querySelectorAll(selector);
        }
    };

    // === Logging System ===
    const logger = {
        /**
         * Log message to console with timestamp and type
         */
        log(message, type = 'info') {
            const timestamp = new Date().toLocaleTimeString();
            const line = document.createElement('div');
            line.className = `console-line ${type}`;
            line.textContent = `[${timestamp}] ${message}`;
            
            const consoleContent = utils.$('#consoleContent');
            if (consoleContent) {
                consoleContent.appendChild(line);
                consoleContent.scrollTop = consoleContent.scrollHeight;
            }
            
            // Also log to browser console for debugging
            console[type === 'error' ? 'error' : type === 'success' ? 'info' : 'log'](message);
        },

        info(message) { this.log(message, 'info'); },
        success(message) { this.log(message, 'success'); },
        error(message) { this.log(message, 'error'); },

        /**
         * Clear console
         */
        clear() {
            const consoleContent = utils.$('#consoleContent');
            if (consoleContent) {
                consoleContent.innerHTML = '';
                this.info('Console cleared');
            }
        }
    };

    // === MQTT Connection Management ===
    const mqtt = {
        /**
         * Connect to MQTT broker
         */
        connect() {
            const host = utils.$('#brokerHost').value.trim();
            const port = parseInt(utils.$('#brokerPort').value);
            const topic = utils.$('#topicName').value.trim();
            
            if (!host || !port || !topic) {
                logger.error('❌ Please fill in all connection fields');
                return;
            }
            
            // Validate topic format
            if (topic.includes('#') && !topic.endsWith('#')) {
                logger.error('❌ Invalid topic: # wildcard must be at the end');
                return;
            }
            
            // Disconnect existing connection if any
            if (state.mqttClient && state.mqttClient.isConnected()) {
                logger.info('🔌 Disconnecting existing MQTT connection...');
                state.mqttClient.disconnect();
            }
            
            state.currentTopic = topic;
            
            // Generate unique client ID
            const clientId = utils.generateClientId();
            logger.info(`🆔 Client ID: ${clientId}`);
            logger.info(`🔗 Connecting to Eclipse Paho MQTT broker: ${host}:${port} (SSL)`);
            logger.info(`📡 Will subscribe to topic: ${topic}`);
            
            // Create new Paho MQTT client
            state.mqttClient = new Paho.MQTT.Client(host, port, clientId);
            
            // Set up event callbacks
            state.mqttClient.onConnectionLost = this.onConnectionLost.bind(this);
            state.mqttClient.onMessageArrived = this.onMessageArrived.bind(this);
            
            // Connection options
            const connectOptions = {
                onSuccess: this.onConnect.bind(this),
                onFailure: this.onConnectFailure.bind(this),
                timeout: CONFIG.CONNECTION_TIMEOUT / 1000,
                keepAliveInterval: 30,
                cleanSession: true,
                useSSL: true,
                mqttVersion: 4
            };
            
            logger.info('🔄 Attempting Eclipse Paho MQTT connection with SSL (15s timeout)...');
            ui.updateConnectionStatus('connecting');
            
            // Set up timeout monitoring
            state.connectionTimer = setTimeout(() => {
                if (!state.isConnected) {
                    logger.error('⏰ Connection timeout after 15 seconds');
                    logger.error(`• Check if broker is reachable at ${host}:${port}`);
                    logger.error('• Verify SSL/TLS is properly configured on the broker');
                    logger.error('• Check firewall and network connectivity');
                    ui.updateConnectionStatus('disconnected');
                }
            }, CONFIG.CONNECTION_TIMEOUT);
            
            try {
                state.mqttClient.connect(connectOptions);
            } catch (error) {
                if (state.connectionTimer) {
                    clearTimeout(state.connectionTimer);
                    state.connectionTimer = null;
                }
                logger.error(`❌ Eclipse Paho MQTT connection error: ${error.message}`);
                ui.updateConnectionStatus('disconnected');
            }
        },

        /**
         * Handle successful connection
         */
        onConnect() {
            if (state.connectionTimer) {
                clearTimeout(state.connectionTimer);
                state.connectionTimer = null;
            }
            
            logger.success('✅ Eclipse Paho MQTT connected successfully!');
            state.isConnected = true;
            ui.updateConnectionStatus('connected');
            ui.updateProgress();
            
            // Auto-subscribe to topic
            if (state.currentTopic) {
                logger.info(`📡 Auto-subscribing to user topic: ${state.currentTopic}`);
                this.subscribeToTopic();
            } else {
                logger.error('⚠️ No topic specified for subscription');
            }
        },

        /**
         * Handle connection failure
         */
        onConnectFailure(responseObject) {
            if (state.connectionTimer) {
                clearTimeout(state.connectionTimer);
                state.connectionTimer = null;
            }
            
            logger.error(`❌ Eclipse Paho MQTT connection failed: ${responseObject.errorMessage}`);
            logger.error(`💡 Error code: ${responseObject.errorCode}`);
            
            // Provide specific error guidance
            this.provideErrorGuidance(responseObject.errorCode, responseObject.errorMessage);
            
            logger.info('💡 Try "Start Simulation" to test the visualizer without MQTT');
            ui.updateConnectionStatus('disconnected');
            ui.updateProgress();
        },

        /**
         * Provide helpful error messages based on error code
         */
        provideErrorGuidance(errorCode, errorMessage) {
            if (errorCode === 7) {
                logger.error('• Check if WebSocket over SSL is enabled on the broker');
                logger.error('• Verify the port supports secure WebSocket connections (wss://)');
                logger.error('• Common secure MQTT WebSocket ports: 8084, 8883, 443');
                logger.error('• Ensure SSL certificate is valid');
            } else if (errorCode === 8) {
                logger.error('• Check if the broker is running and accessible');
                logger.error('• Verify network connectivity and firewall settings');
                logger.error('• Ensure CORS is configured for your domain');
            } else if (errorMessage && errorMessage.includes('timeout')) {
                logger.error('• Connection timed out - broker may be unreachable');
                logger.error('• Try increasing timeout or check network latency');
                logger.error('• Verify broker is online and responding');
            }
        },

        /**
         * Handle connection lost
         */
        onConnectionLost(responseObject) {
            if (responseObject.errorCode !== 0) {
                logger.error(`🔌 Eclipse Paho MQTT connection lost: ${responseObject.errorMessage}`);
            } else {
                logger.info('🔌 Eclipse Paho MQTT disconnected cleanly');
            }
            
            state.isConnected = false;
            ui.updateConnectionStatus('disconnected');
            ui.updateProgress();
        },

        /**
         * Handle incoming message
         */
        onMessageArrived(message) {
            const topic = message.destinationName;
            const payload = message.payloadString;
            
            // Track message timing for performance optimization
            const currentTime = Date.now();
            const timeSinceLastMessage = currentTime - state.lastMessageTime;
            
            // Fast message mode detection
            if (timeSinceLastMessage < CONFIG.FAST_MESSAGE_THRESHOLD && state.lastMessageTime > 0) {
                if (!state.fastMessageMode) {
                    state.fastMessageMode = true;
                    state.animationsEnabled = false;
                    logger.info('⚡ Fast message mode enabled - animations disabled for performance');
                }
            } else if (state.fastMessageMode && timeSinceLastMessage > 1000) {
                state.fastMessageMode = false;
                state.animationsEnabled = true;
                logger.info('🎬 Normal message rate - animations re-enabled');
            }
            
            state.lastMessageTime = currentTime;
            
            logger.info(`📨 Received message on topic "${topic}"`);
            logger.info(`📦 Payload (${payload.length} bytes): ${payload}`);
            logger.info(`🔍 QoS: ${message.qos}, Retained: ${message.retained}`);
            logger.info(`⏱️ Time since last message: ${timeSinceLastMessage}ms`);
            
            state.messagesReceived++;
            dataProcessor.process(payload);
            ui.updateProgress();
        },

        /**
         * Subscribe to topic
         */
        subscribeToTopic() {
            if (!state.mqttClient || !state.mqttClient.isConnected()) {
                logger.error('❌ Cannot subscribe - no active MQTT connection');
                return;
            }
            
            if (!state.currentTopic || state.currentTopic.trim() === '') {
                logger.error('❌ Cannot subscribe - no topic specified');
                return;
            }
            
            const topic = state.currentTopic.trim();
            logger.info(`📡 Subscribing to user topic: "${topic}"`);
            
            // Subscription timeout
            const subscriptionTimer = setTimeout(() => {
                logger.error(`⏰ Subscription timeout for topic: ${topic}`);
                logger.error('• Topic may not exist on the broker');
                logger.error('• Check topic permissions and ACL settings');
            }, CONFIG.SUBSCRIPTION_TIMEOUT);
            
            try {
                state.mqttClient.subscribe(topic, {
                    qos: 0,
                    onSuccess: (granted) => {
                        clearTimeout(subscriptionTimer);
                        logger.success(`✅ Successfully subscribed to topic: "${topic}"`);
                        logger.success(`📊 QoS granted: ${granted.grantedQos !== undefined ? granted.grantedQos : '0'}`);
                        logger.info(`🎧 Listening for messages on topic: "${topic}"`);
                    },
                    onFailure: (error) => {
                        clearTimeout(subscriptionTimer);
                        logger.error(`❌ Failed to subscribe to topic "${topic}": ${error.errorMessage}`);
                        logger.error(`💡 Error code: ${error.errorCode}`);
                        
                        if (error.errorCode === 128) {
                            logger.error('• Topic filter may be invalid');
                            logger.error('• Check topic syntax and wildcard usage');
                        } else if (error.errorCode === 135) {
                            logger.error('• Not authorized to subscribe to this topic');
                            logger.error('• Check broker ACL settings and user permissions');
                        }
                    }
                });
            } catch (error) {
                clearTimeout(subscriptionTimer);
                logger.error(`❌ Exception while subscribing to topic: ${error.message}`);
            }
        },

        /**
         * Disconnect from MQTT broker
         */
        disconnect() {
            if (state.connectionTimer) {
                clearTimeout(state.connectionTimer);
                state.connectionTimer = null;
            }
            
            if (state.mqttClient && state.mqttClient.isConnected()) {
                logger.info('🔌 Disconnecting from Eclipse Paho MQTT broker...');
                state.mqttClient.disconnect();
            } else {
                logger.info('⚠️ No active MQTT connection to disconnect');
                state.isConnected = false;
                ui.updateConnectionStatus('disconnected');
                ui.updateProgress();
            }
        },

        /**
         * Manual resubscribe
         */
        resubscribe() {
            if (!state.mqttClient || !state.mqttClient.isConnected()) {
                logger.error('❌ Cannot resubscribe - no active Eclipse Paho MQTT connection');
                return;
            }
            
            const newTopic = utils.$('#topicName').value.trim();
            
            if (!newTopic) {
                logger.error('❌ Cannot resubscribe - no topic specified');
                return;
            }
            
            if (newTopic !== state.currentTopic) {
                logger.info(`🔄 Topic changed from "${state.currentTopic}" to "${newTopic}"`);
                state.currentTopic = newTopic;
            }
            
            logger.info(`🔄 Manually resubscribing to topic: "${state.currentTopic}"`);
            this.subscribeToTopic();
        }
    };

    // === Data Processing ===
    const dataProcessor = {
        /**
         * Process incoming MQTT payload
         */
        process(payload) {
            try {
                logger.info('🔍 Processing MQTT payload...');
                logger.info(`📦 Raw payload: ${payload}`);
                
                // Parse JSON
                let data;
                try {
                    data = JSON.parse(payload);
                } catch (parseError) {
                    logger.error(`❌ Invalid JSON format: ${parseError.message}`);
                    logger.error('💡 Expected: [["node1","node2",1.5], ["node2","node3",2.1]]');
                    logger.error(`❌ Received: ${payload.substring(0, 200)}${payload.length > 200 ? '...' : ''}`);
                    return;
                }
                
                logger.success('✅ JSON parsed successfully');
                
                // Validate structure
                if (!this.validatePayload(data, payload)) {
                    return;
                }
                
                // Process connections
                const { validConnections, errors, nodeIds } = this.validateConnections(data);
                
                if (errors.length > 0) {
                    logger.error(`⚠️ Found ${errors.length} invalid connection(s):`);
                    errors.forEach(error => logger.error(`  • ${error}`));
                }
                
                if (validConnections.length === 0) {
                    logger.error('❌ No valid connections found to display');
                    logger.error('💡 Expected: [["node1","node2",1.5], ["node2","node3",2.1]]');
                    visualization.clear();
                    return;
                }
                
                logger.info(`📊 Unique nodes detected: [${Array.from(nodeIds).join(', ')}]`);
                logger.info(`📈 Processing ${validConnections.length} valid connection(s)`);
                
                this.updateVisualization(validConnections, nodeIds);
                
            } catch (error) {
                logger.error(`❌ Error processing MQTT payload: ${error.message}`);
                logger.error('💡 Expected: [["node1","node2",1.5], ["node2","node3",2.1]]');
            }
        },

        /**
         * Validate payload structure
         */
        validatePayload(data, payload) {
            if (!Array.isArray(data)) {
                logger.error('❌ Payload must be an array of connections');
                logger.error('💡 Expected: [["node1","node2",1.5], ["node2","node3",2.1]]');
                logger.error(`❌ Received: ${typeof data} - ${JSON.stringify(data).substring(0, 100)}`);
                return false;
            }
            
            if (data.length === 0) {
                logger.info('⚠️ Received empty array - no connections to display');
                visualization.clear();
                return false;
            }
            
            logger.info(`📊 Found ${data.length} connection(s) to process`);
            return true;
        },

        /**
         * Validate individual connections
         */
        validateConnections(data) {
            const validConnections = [];
            const errors = [];
            const nodeIds = new Set();
            
            for (let i = 0; i < data.length; i++) {
                const conn = data[i];
                const connIndex = i + 1;
                
                const validation = this.validateSingleConnection(conn, connIndex);
                if (validation.valid) {
                    validConnections.push(validation.connection);
                    nodeIds.add(validation.connection[0]);
                    nodeIds.add(validation.connection[1]);
                    logger.success(`✅ Connection ${connIndex}: "${validation.connection[0]}" ↔ "${validation.connection[1]}" (${validation.connection[2].toFixed(2)}m)`);
                } else {
                    errors.push(validation.error);
                }
            }
            
            return { validConnections, errors, nodeIds };
        },

        /**
         * Validate single connection
         */
        validateSingleConnection(conn, connIndex) {
            if (!Array.isArray(conn)) {
                return {
                    valid: false,
                    error: `Connection ${connIndex}: must be an array [node_id_1, node_id_2, distance_m]`
                };
            }
            
            if (conn.length < 3) {
                return {
                    valid: false,
                    error: `Connection ${connIndex}: must have 3 elements [node_id_1, node_id_2, distance_m]`
                };
            }
            
            let [nodeId1, nodeId2, distance] = conn;
            
            // Validate node IDs
            if (nodeId1 === null || nodeId1 === undefined || nodeId1 === '') {
                return {
                    valid: false,
                    error: `Connection ${connIndex}: node_id_1 cannot be null/empty`
                };
            }
            
            if (nodeId2 === null || nodeId2 === undefined || nodeId2 === '') {
                return {
                    valid: false,
                    error: `Connection ${connIndex}: node_id_2 cannot be null/empty`
                };
            }
            
            // Convert to strings
            nodeId1 = String(nodeId1);
            nodeId2 = String(nodeId2);
            
            // Validate different nodes
            if (nodeId1 === nodeId2) {
                return {
                    valid: false,
                    error: `Connection ${connIndex}: node_id_1 and node_id_2 cannot be the same (${nodeId1})`
                };
            }
            
            // Validate distance
            const numDistance = parseFloat(distance);
            if (isNaN(numDistance)) {
                return {
                    valid: false,
                    error: `Connection ${connIndex}: distance "${distance}" is not a valid number`
                };
            }
            
            if (numDistance <= 0) {
                return {
                    valid: false,
                    error: `Connection ${connIndex}: distance must be positive (got ${numDistance})`
                };
            }
            
            return {
                valid: true,
                connection: [nodeId1, nodeId2, numDistance]
            };
        },

        /**
         * Update visualization with new data
         */
        updateVisualization(validConnections, nodeIds) {
            // Track changes
            const { distanceChanges, newNodes } = this.trackChanges(validConnections, nodeIds);
            
            // Create new nodes
            if (newNodes.length > 0) {
                logger.info(`🆕 Creating new nodes: [${newNodes.join(', ')}]`);
                const positions = layoutEngine.calculate(validConnections);
                newNodes.forEach(nodeId => {
                    nodeManager.create(nodeId, positions[nodeId].x, positions[nodeId].y);
                });
            }
            
            // Update connections
            connectionManager.clearAll();
            const createdConnections = [];
            for (const conn of validConnections) {
                connectionManager.create(conn[0], conn[1], conn[2]);
                createdConnections.push(`${conn[0]}↔${conn[1]}(${conn[2]}m)`);
            }
            
            logger.success(`✅ Connections updated: [${createdConnections.join(', ')}]`);
            
            // Update layout if needed
            if (distanceChanges > 0 || (state.currentDistances.size >= 2 && state.nodes.size >= 3)) {
                logger.info(`🔄 Triggering layout update due to ${distanceChanges > 0 ? distanceChanges + ' distance changes' : 'sufficient data for optimization'}`);
                
                setTimeout(() => {
                    layoutEngine.update();
                }, newNodes.length > 0 ? 1000 : 100);
            }
            
            const nodeCount = state.nodes.size;
            logger.success(`🎨 *** VISUALIZATION COMPLETE *** ${nodeCount} nodes and ${validConnections.length} connections displayed`);
            
            // Verify DOM
            setTimeout(() => {
                this.verifyDOM(nodeCount);
            }, 200);
        },

        /**
         * Track changes in distance measurements
         */
        trackChanges(validConnections, nodeIds) {
            let distanceChanges = 0;
            const newNodes = [];
            
            // Update distance measurements
            for (const conn of validConnections) {
                const key = [conn[0], conn[1]].sort().join('-');
                const newDistance = conn[2];
                const oldDistance = state.currentDistances.get(key);
                
                if (oldDistance === undefined) {
                    logger.info(`📏 New distance measurement: ${key} = ${newDistance}m`);
                } else if (Math.abs(oldDistance - newDistance) > 0.1) {
                    logger.info(`📏 Distance change: ${key} = ${oldDistance}m → ${newDistance}m`);
                    distanceChanges++;
                }
                
                state.currentDistances.set(key, newDistance);
            }
            
            // Check for new nodes
            nodeIds.forEach(nodeId => {
                if (!state.nodes.has(nodeId)) {
                    newNodes.push(nodeId);
                }
            });
            
            return { distanceChanges, newNodes };
        },

        /**
         * Verify DOM elements match data structures
         */
        verifyDOM(expectedNodeCount) {
            const visibleNodes = utils.$$('.node');
            const visibleConnections = utils.$$('.connection');
            
            logger.info(`🔍 DOM verification: ${visibleNodes.length} nodes, ${Math.floor(visibleConnections.length/2)} connections in DOM`);
            
            if (visibleNodes.length !== expectedNodeCount) {
                logger.error(`⚠️ Node count mismatch! Expected: ${expectedNodeCount}, Found: ${visibleNodes.length}`);
            } else {
                logger.success('✅ All nodes successfully displayed in visualization');
            }
        }
    };

    // === Layout Engine ===
    const layoutEngine = {
        /**
         * Calculate initial layout for nodes
         */
        calculate(connections) {
            const nodeSet = new Set();
            const distances = {};
            
            // Extract nodes and distances
            for (const conn of connections) {
                if (conn.length >= 3) {
                    nodeSet.add(conn[0]);
                    nodeSet.add(conn[1]);
                    const key = [conn[0], conn[1]].sort().join('-');
                    distances[key] = parseFloat(conn[2]);
                }
            }
            
            const nodeArray = Array.from(nodeSet);
            const viz = utils.$('#visualization');
            const centerX = viz.offsetWidth / 2;
            const centerY = viz.offsetHeight / 2;
            
            if (nodeArray.length === 0) return {};
            if (nodeArray.length === 1) {
                return { [nodeArray[0]]: { x: centerX, y: centerY } };
            }
            
            if (nodeArray.length === 2) {
                return this.calculateTwoNodeLayout(nodeArray, distances, centerX, centerY, viz);
            }
            
            // Multiple nodes - circular layout with distance-based radius
            const maxDistance = Math.max(...Object.values(distances));
            let radius = Math.min(viz.offsetWidth, viz.offsetHeight) / 4 * state.nodeSpacing * (maxDistance / 5);
            radius = utils.clamp(radius, 100, Math.min(viz.offsetWidth, viz.offsetHeight) / 3);
            
            const positions = {};
            for (let i = 0; i < nodeArray.length; i++) {
                const angle = (i / nodeArray.length) * 2 * Math.PI;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                positions[nodeArray[i]] = { x, y };
            }
            
            return positions;
        },

        /**
         * Calculate layout for two nodes
         */
        calculateTwoNodeLayout(nodeArray, distances, centerX, centerY, viz) {
            const distance = distances[[nodeArray[0], nodeArray[1]].sort().join('-')] || 1;
            const separation = Math.min(distance * 30 * state.nodeSpacing, viz.offsetWidth * 0.6);
            
            return {
                [nodeArray[0]]: { x: centerX - separation/2, y: centerY },
                [nodeArray[1]]: { x: centerX + separation/2, y: centerY }
            };
        },

        /**
         * Calculate optimal layout based on current distances
         */
        calculateOptimal(distances, currentPositions) {
            const viz = utils.$('#visualization');
            const centerX = viz.offsetWidth / 2;
            const centerY = viz.offsetHeight / 2;
            const nodeIds = Array.from(new Set([...distances.keys()].flatMap(key => key.split('-'))));
            
            if (nodeIds.length === 0) return {};
            
            const pixelsPerMeter = state.nodeSpacing * CONFIG.PIXELS_PER_METER_BASE;
            
            if (nodeIds.length === 1) {
                return { [nodeIds[0]]: { x: centerX, y: centerY } };
            }
            
            if (nodeIds.length === 2) {
                return this.calculateTwoNodeOptimal(nodeIds, distances, centerX, centerY, pixelsPerMeter);
            }
            
            if (nodeIds.length === 3) {
                return this.calculateTriangleLayout(nodeIds, distances, centerX, centerY, pixelsPerMeter);
            }
            
            return this.calculateForceDirectedLayout(nodeIds, distances, currentPositions, centerX, centerY, pixelsPerMeter);
        },

        /**
         * Calculate optimal positions for two nodes
         */
        calculateTwoNodeOptimal(nodeIds, distances, centerX, centerY, pixelsPerMeter) {
            const [node1, node2] = nodeIds;
            const key = [node1, node2].sort().join('-');
            const distance = distances.get(key) || 1;
            const pixelDistance = distance * pixelsPerMeter;
            
            const positions = {
                [node1]: { x: centerX - pixelDistance/2, y: centerY },
                [node2]: { x: centerX + pixelDistance/2, y: centerY }
            };
            
            logger.info(`📐 Two nodes: ${node1} and ${node2} placed ${pixelDistance.toFixed(0)}px apart (${distance}m)`);
            return positions;
        },

        /**
         * Calculate triangle layout for three nodes
         */
        calculateTriangleLayout(nodeIds, distances, centerX, centerY, pixelsPerMeter) {
            const [node1, node2, node3] = nodeIds;
            
            // Get distances between all pairs
            const d12 = distances.get([node1, node2].sort().join('-')) || 1;
            const d13 = distances.get([node1, node3].sort().join('-')) || 1;
            const d23 = distances.get([node2, node3].sort().join('-')) || 1;
            
            // Convert to pixels
            const a = d23 * pixelsPerMeter;
            const b = d13 * pixelsPerMeter;
            const c = d12 * pixelsPerMeter;
            
            logger.info(`📐 Triangle layout: ${node1}-${node2}=${d12}m (${c.toFixed(0)}px), ${node1}-${node3}=${d13}m (${b.toFixed(0)}px), ${node2}-${node3}=${d23}m (${a.toFixed(0)}px)`);
            
            // Check triangle inequality
            if (a + b <= c || a + c <= b || b + c <= a) {
                logger.error('⚠️ Invalid triangle distances (triangle inequality violated), using fallback circular layout');
                return this.calculateCircularLayout(nodeIds, centerX, centerY, 100);
            }
            
            const positions = {};
            
            // Place first two nodes
            positions[node1] = { x: centerX - c/2, y: centerY };
            positions[node2] = { x: centerX + c/2, y: centerY };
            
            // Calculate third node using law of cosines
            const cosA = (b*b + c*c - a*a) / (2*b*c);
            const clampedCosA = utils.clamp(cosA, -1, 1);
            const angleA = Math.acos(clampedCosA);
            
            const x3 = positions[node1].x + b * Math.cos(angleA);
            const y3 = positions[node1].y - b * Math.sin(angleA);
            positions[node3] = { x: x3, y: y3 };
            
            // Center the triangle
            const avgX = (positions[node1].x + positions[node2].x + positions[node3].x) / 3;
            const avgY = (positions[node1].y + positions[node2].y + positions[node3].y) / 3;
            const offsetX = centerX - avgX;
            const offsetY = centerY - avgY;
            
            Object.keys(positions).forEach(nodeId => {
                positions[nodeId].x += offsetX;
                positions[nodeId].y += offsetY;
                
                // Keep within bounds
                const viz = utils.$('#visualization');
                positions[nodeId].x = utils.clamp(positions[nodeId].x, 50, viz.offsetWidth - 50);
                positions[nodeId].y = utils.clamp(positions[nodeId].y, 50, viz.offsetHeight - 50);
            });
            
            logger.success('✅ Triangle positioned with geometric accuracy');
            return positions;
        },

        /**
         * Calculate force-directed layout for 4+ nodes
         */
        calculateForceDirectedLayout(nodeIds, distances, currentPositions, centerX, centerY, pixelsPerMeter) {
            const positions = {};
            
            // Initialize positions
            if (currentPositions) {
                nodeIds.forEach(nodeId => {
                    if (currentPositions[nodeId]) {
                        positions[nodeId] = { x: currentPositions[nodeId].x, y: currentPositions[nodeId].y };
                    } else {
                        positions[nodeId] = { 
                            x: centerX + (Math.random() - 0.5) * 100, 
                            y: centerY + (Math.random() - 0.5) * 100 
                        };
                    }
                });
            } else {
                Object.assign(positions, this.calculateCircularLayout(nodeIds, centerX, centerY, 150));
            }
            
            // Force-directed algorithm
            const iterations = 200;
            const springStrength = 0.05;
            const dampening = 0.95;
            
            for (let iter = 0; iter < iterations; iter++) {
                const forces = {};
                let maxForce = 0;
                
                // Initialize forces
                nodeIds.forEach(nodeId => {
                    forces[nodeId] = { x: 0, y: 0 };
                });
                
                // Calculate spring forces
                distances.forEach((targetDistance, key) => {
                    const [node1, node2] = key.split('-');
                    
                    if (!positions[node1] || !positions[node2]) return;
                    
                    const dx = positions[node2].x - positions[node1].x;
                    const dy = positions[node2].y - positions[node1].y;
                    const currentDistance = Math.sqrt(dx * dx + dy * dy);
                    const targetPixelDistance = targetDistance * pixelsPerMeter;
                    
                    if (currentDistance > 0) {
                        const error = targetPixelDistance - currentDistance;
                        const force = error * springStrength;
                        const fx = (dx / currentDistance) * force;
                        const fy = (dy / currentDistance) * force;
                        
                        forces[node1].x -= fx;
                        forces[node1].y -= fy;
                        forces[node2].x += fx;
                        forces[node2].y += fy;
                        
                        maxForce = Math.max(maxForce, Math.abs(fx), Math.abs(fy));
                    }
                });
                
                // Apply forces
                const viz = utils.$('#visualization');
                nodeIds.forEach(nodeId => {
                    positions[nodeId].x += forces[nodeId].x * dampening;
                    positions[nodeId].y += forces[nodeId].y * dampening;
                    
                    // Keep within bounds
                    positions[nodeId].x = utils.clamp(positions[nodeId].x, 80, viz.offsetWidth - 80);
                    positions[nodeId].y = utils.clamp(positions[nodeId].y, 80, viz.offsetHeight - 80);
                });
                
                // Early termination if converged
                if (maxForce < 0.1) {
                    logger.info(`📐 Force-directed layout converged after ${iter + 1} iterations`);
                    break;
                }
            }
            
            logger.info(`📐 Force-directed layout completed with ${nodeIds.length} nodes, scale: ${pixelsPerMeter}px/m`);
            return positions;
        },

        /**
         * Calculate circular layout
         */
        calculateCircularLayout(nodeIds, centerX, centerY, radius) {
            const positions = {};
            for (let i = 0; i < nodeIds.length; i++) {
                const angle = (i / nodeIds.length) * 2 * Math.PI;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                positions[nodeIds[i]] = { x, y };
            }
            return positions;
        },

        /**
         * Update layout based on current distances
         */
        update() {
            if (state.currentDistances.size === 0 || state.isLayoutAnimating) return;
            
            state.isLayoutAnimating = true;
            
            logger.info('🔄 Updating node layout based on distance measurements...');
            
            // Get current positions
            const currentPositions = {};
            state.nodes.forEach((nodeData, nodeId) => {
                currentPositions[nodeId] = { x: nodeData.x, y: nodeData.y };
            });
            
            // Calculate optimal positions
            const optimalPositions = this.calculateOptimal(state.currentDistances, currentPositions);
            
            // Move nodes to new positions
            Object.keys(optimalPositions).forEach(nodeId => {
                const newPos = optimalPositions[nodeId];
                nodeManager.moveToPosition(nodeId, newPos.x, newPos.y);
            });
            
            // Mark complete after animation
            setTimeout(() => {
                state.isLayoutAnimating = false;
                logger.success('✅ Layout update complete with smooth connection following');
            }, CONFIG.ANIMATION_DURATION + 100);
        }
    };

    // === Node Management ===
    const nodeManager = {
        /**
         * Create a new node
         */
        create(nodeId, x, y) {
            const viz = utils.$('#visualization');
            if (!viz) {
                logger.error('❌ Visualization container not found!');
                return;
            }
            
            const safeX = utils.clamp(x, CONFIG.NODE_RADIUS, viz.offsetWidth - CONFIG.NODE_RADIUS);
            const safeY = utils.clamp(y, CONFIG.NODE_RADIUS, viz.offsetHeight - CONFIG.NODE_RADIUS);
            
            logger.info(`🔧 Creating node "${nodeId}" at position (${safeX}, ${safeY}) [Animations: ${state.animationsEnabled ? 'ON' : 'OFF'}]`);
            
            const node = document.createElement('div');
            const isGateway = nodeId === 'B5A4';
            
            // Determine display text
            const displayText = isGateway ? 'GW' : (nodeId.length > 4 ? nodeId.substring(0, 4) : nodeId);
            
            if (isGateway) {
                logger.info(`📝 Special display: Node "${nodeId}" will show as "${displayText}" (Gateway styling)`);
            }
            
            // Set up node element
            let nodeClasses = 'node';
            if (isGateway) nodeClasses += ' gateway';
            if (state.animationsEnabled) nodeClasses += ' pulse';
            
            node.className = nodeClasses;
            node.style.left = `${safeX - CONFIG.NODE_RADIUS}px`;
            node.style.top = `${safeY - CONFIG.NODE_RADIUS}px`;
            node.textContent = displayText;
            node.title = `Node: ${nodeId}${isGateway ? ' (Gateway)' : ''} (Position: ${safeX}, ${safeY})`;
            node.setAttribute('data-node-id', nodeId);
            
            viz.appendChild(node);
            state.nodes.set(nodeId, { x: safeX, y: safeY, element: node });
            
            // Remove pulse animation
            if (state.animationsEnabled) {
                setTimeout(() => {
                    node.classList.remove('pulse');
                }, 1000);
            }
            
            logger.success(`✅ Node "${nodeId}" created and added to DOM${state.animationsEnabled ? ' with animation' : ''}${isGateway ? ' [GATEWAY STYLING]' : ''}`);
        },

        /**
         * Move node to new position with animation
         */
        moveToPosition(nodeId, newX, newY) {
            const nodeData = state.nodes.get(nodeId);
            if (!nodeData || !nodeData.element) return;
            
            const element = nodeData.element;
            const startX = nodeData.x;
            const startY = nodeData.y;
            const startTime = Date.now();
            
            // Add moving class for CSS animation
            element.classList.add('moving');
            
            // Update CSS position
            element.style.left = `${newX - CONFIG.NODE_RADIUS}px`;
            element.style.top = `${newY - CONFIG.NODE_RADIUS}px`;
            
            // Animate stored position for connection updates
            const animatePosition = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / CONFIG.ANIMATION_DURATION, 1);
                const easedProgress = utils.easeInOut(progress);
                
                // Update stored position
                nodeData.x = startX + (newX - startX) * easedProgress;
                nodeData.y = startY + (newY - startY) * easedProgress;
                
                // Update connections
                connectionManager.updateAll();
                
                if (progress < 1) {
                    state.animationFrameId = requestAnimationFrame(animatePosition);
                } else {
                    // Animation complete
                    nodeData.x = newX;
                    nodeData.y = newY;
                    element.classList.remove('moving');
                    connectionManager.updateAll();
                }
            };
            
            animatePosition();
            logger.info(`📍 Moving node "${nodeId}" to position (${Math.round(newX)}, ${Math.round(newY)}) with live connection updates`);
        }
    };

    // === Connection Management ===
    const connectionManager = {
        /**
         * Create connection between two nodes
         */
        create(node1, node2, distance) {
            const pos1 = state.nodes.get(node1);
            const pos2 = state.nodes.get(node2);
            
            if (!pos1 || !pos2) return;
            
            const deltaX = pos2.x - pos1.x;
            const deltaY = pos2.y - pos1.y;
            const actualPixelDistance = utils.calculateDistance(pos1.x, pos1.y, pos2.x, pos2.y);
            const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
            
            // Calculate connection line positions
            const startX = pos1.x + CONFIG.NODE_RADIUS * Math.cos(Math.atan2(deltaY, deltaX));
            const startY = pos1.y + CONFIG.NODE_RADIUS * Math.sin(Math.atan2(deltaY, deltaX));
            const connectionLength = Math.max(0, actualPixelDistance - CONFIG.NODE_DIAMETER);
            
            // Create connection line
            const connection = document.createElement('div');
            connection.className = 'connection';
            connection.style.left = `${startX}px`;
            connection.style.top = `${startY - 1.5}px`;
            connection.style.width = `${connectionLength}px`;
            connection.style.transform = `rotate(${angle}deg)`;
            
            utils.$('#visualization').appendChild(connection);
            state.connections.push(connection);
            
            // Create distance label
            this.createDistanceLabel(pos1, pos2, distance, actualPixelDistance);
        },

        /**
         * Create distance label
         */
        createDistanceLabel(pos1, pos2, distance, actualPixelDistance) {
            const label = document.createElement('div');
            label.className = 'distance-label';
            label.style.left = `${(pos1.x + pos2.x) / 2 - 25}px`;
            label.style.top = `${(pos1.y + pos2.y) / 2 - 15}px`;
            
            const expectedPixels = distance * (state.nodeSpacing * CONFIG.PIXELS_PER_METER_BASE);
            const actualMeters = actualPixelDistance / (state.nodeSpacing * CONFIG.PIXELS_PER_METER_BASE);
            const accuracy = Math.abs(distance - actualMeters) < CONFIG.ACCURACY_TOLERANCE ? '✓' : '⚠';
            
            // Display text based on settings
            const displayText = state.showAccuracyIndicators 
                ? `${distance.toFixed(1)}m ${accuracy}` 
                : `${distance.toFixed(1)}m`;
            
            label.textContent = displayText;
            label.title = `Target: ${distance}m, Actual position: ${actualMeters.toFixed(2)}m (${actualPixelDistance.toFixed(0)}px). ${Math.abs(distance - actualMeters) < CONFIG.ACCURACY_TOLERANCE ? 'Good accuracy' : 'Position approximated due to layout constraints'}`;
            
            utils.$('#visualization').appendChild(label);
            state.connections.push(label);
            
            // Log if significantly off
            if (Math.abs(distance - actualMeters) > 0.5) {
                logger.info(`📏 Distance ${pos1.nodeId}↔${pos2.nodeId}: target=${distance}m, actual=${actualMeters.toFixed(2)}m (layout approximation)`);
            }
        },

        /**
         * Update all connections
         */
        updateAll() {
            this.clearAll();
            
            state.currentDistances.forEach((distance, key) => {
                const nodeIds = key.split('-');
                this.create(nodeIds[0], nodeIds[1], distance);
            });
        },

        /**
         * Clear all connections
         */
        clearAll() {
            const viz = utils.$('#visualization');
            if (!viz) return;
            
            const existingConnections = viz.querySelectorAll('.connection, .distance-label');
            existingConnections.forEach(elem => elem.remove());
            
            state.connections = [];
        }
    };

    // === Simulation System ===
    const simulation = {
        /**
         * Start simulation mode
         */
        start() {
            if (state.simulationInterval) {
                this.stop();
                return;
            }

            logger.info('🎮 Starting simulation mode...');
            
            utils.$('button[onclick="startSimulation()"]').textContent = 'Stop Simulation';
            
            state.simulationInterval = setInterval(() => {
                this.generateData();
            }, 2000);
            
            // Generate initial data
            this.generateData();
        },

        /**
         * Stop simulation
         */
        stop() {
            if (state.simulationInterval) {
                clearInterval(state.simulationInterval);
                state.simulationInterval = null;
                logger.info('🎮 Simulation stopped');
            }
            
            utils.$('button[onclick="startSimulation()"]').textContent = 'Start Simulation';
        },

        /**
         * Generate simulation data
         */
        generateData() {
            const nodeIds = ['A', 'B', 'C', 'D', 'E'];
            
            // Sometimes include gateway
            if (Math.random() > 0.7) {
                nodeIds.push('B5A4');
                logger.info('🎮 Including gateway node B5A4 in this simulation round');
            }
            
            const connections = [];
            
            // Generate random connections
            for (let i = 0; i < nodeIds.length; i++) {
                for (let j = i + 1; j < nodeIds.length; j++) {
                    if (Math.random() > 0.4) { // 60% chance
                        const distance = parseFloat((Math.random() * 8 + 1).toFixed(2));
                        connections.push([nodeIds[i], nodeIds[j], distance]);
                    }
                }
            }

            if (connections.length > 0) {
                const payload = JSON.stringify(connections);
                logger.info(`🎮 Generated simulation data: ${payload}`);
                logger.info('📋 Format: [["node1","node2",distance], ["node2","node3",distance], ...]');
                
                // Reset fast message mode for simulation
                if (state.fastMessageMode) {
                    state.fastMessageMode = false;
                    state.animationsEnabled = true;
                    logger.info('🎬 Simulation mode - animations re-enabled');
                }
                
                dataProcessor.process(payload);
                state.messagesReceived++;
                ui.updateProgress();
            } else {
                logger.info('🎮 No connections generated this round');
            }
        }
    };

    // === Testing System ===
    const testing = {
        /**
         * Test MQTT format with sample data
         */
        testFormat() {
            logger.info('🧪 Testing MQTT payload format with accurate distance positioning...');
            
            const testPayload = [
                ["B5A4", "Room2", 2.0],
                ["B5A4", "Room3", 3.0],
                ["Room2", "Room3", 2.5]
            ];
            
            const jsonPayload = JSON.stringify(testPayload);
            logger.info(`📋 Test payload: ${jsonPayload}`);
            logger.info('📊 Expected positioning:');
            logger.info('  • B5A4 (GW) should be positioned as one vertex of triangle');
            logger.info('  • Room2 should be 2.0m (100px) from GW');
            logger.info('  • Room3 should be 3.0m (150px) from GW');
            logger.info('  • Room2 and Room3 should be 2.5m (125px) from each other');
            logger.info('  • Triangle geometry will determine exact positions');
            logger.info('📊 Processing test data with geometric layout...');
            
            visualization.clear();
            dataProcessor.process(jsonPayload);
            
            if (!state.simulationInterval) {
                state.messagesReceived++;
                ui.updateProgress();
            }
            
            logger.success('🔍 Test complete! Nodes should now be positioned with correct relative distances.');
            logger.info('💡 Tip: Hover over nodes to see their exact positions');
        },

        /**
         * Verify nodes and connections
         */
        verifyNodes() {
            logger.info('🔍 === Node Verification ===');
            
            const viz = utils.$('#visualization');
            if (!viz) {
                logger.error('❌ Visualization container not found!');
                return;
            }
            
            const domNodes = utils.$$('.node');
            const domConnections = utils.$$('.connection');
            const domLabels = utils.$$('.distance-label');
            
            logger.info('📊 DOM Elements Found:');
            logger.info(`  • Nodes in DOM: ${domNodes.length}`);
            logger.info(`  • Connections in DOM: ${domConnections.length}`);
            logger.info(`  • Distance labels in DOM: ${domLabels.length}`);
            
            logger.info('📊 Data Structures:');
            logger.info(`  • Nodes in Map: ${state.nodes.size}`);
            logger.info(`  • Connections in Array: ${state.connections.length}`);
            logger.info(`  • Distance measurements: ${state.currentDistances.size}`);
            logger.info(`  • Animation Mode: ${state.animationsEnabled ? 'Enabled' : 'Disabled (Fast Messages)'}`);
            logger.info(`  • Layout Animating: ${state.isLayoutAnimating ? 'Yes' : 'No'}`);
            
            if (state.currentDistances.size > 0) {
                logger.info('📏 Current Distance Measurements:');
                state.currentDistances.forEach((distance, key) => {
                    logger.info(`  • ${key}: ${distance}m`);
                });
            }
            
            if (domNodes.length > 0) {
                logger.info('📋 Node Details:');
                
                Array.from(domNodes).forEach(node => {
                    const nodeId = node.getAttribute('data-node-id') || node.textContent;
                    const rect = node.getBoundingClientRect();
                    const vizRect = viz.getBoundingClientRect();
                    const relativeX = rect.left - vizRect.left + rect.width/2;
                    const relativeY = rect.top - vizRect.top + rect.height/2;
                    
                    logger.info(`  • Node "${nodeId}": Position(${Math.round(relativeX)}, ${Math.round(relativeY)}), Size: ${rect.width}x${rect.height}, Visible: ${rect.width > 0}`);
                });
                
                logger.success('✅ Nodes are displayed and positioned (60px circles with dynamic layout)');
                
                // Highlight nodes briefly
                domNodes.forEach(node => {
                    node.style.boxShadow = '0 0 15px #ff6b6b';
                    setTimeout(() => {
                        node.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                    }, 2000);
                });
                
            } else {
                logger.error('❌ No nodes found in DOM!');
                logger.error('💡 Try sending MQTT data or using "Test Format" button');
            }
        },

        /**
         * Check connection status
         */
        checkStatus() {
            logger.info('🔍 === Connection Status Check ===');
            
            if (state.mqttClient) {
                const connected = state.mqttClient.isConnected();
                logger.info(`📊 Eclipse Paho MQTT Status: ${connected ? 'Connected ✅' : 'Disconnected ❌'}`);
                
                if (connected) {
                    logger.info(`📊 Client ID: ${state.mqttClient.clientId}`);
                    logger.info(`📊 Current Topic: ${state.currentTopic || 'None'}`);
                    logger.info(`📊 Messages Received: ${state.messagesReceived}`);
                } else {
                    logger.info('📊 Connection State: Disconnected');
                }
            } else {
                logger.info('📊 No MQTT client instance created');
            }
            
            logger.info(`📊 Connection Timer: ${state.connectionTimer ? 'Active' : 'None'}`);
            logger.info(`📊 Simulation Mode: ${state.simulationInterval ? 'Active ✅' : 'Inactive ❌'}`);
            logger.info(`📊 Total Nodes Visible: ${state.nodes.size}`);
            logger.info(`📊 Distance Measurements: ${state.currentDistances.size}`);
            logger.info(`📊 Animation Status: ${state.animationsEnabled ? 'Enabled' : 'Disabled (Fast Messages)'}`);
            logger.info(`📊 Fast Message Mode: ${state.fastMessageMode ? 'Active' : 'Inactive'}`);
            logger.info(`📊 Layout Animation: ${state.isLayoutAnimating ? 'In Progress' : 'Idle'}`);
            logger.info('📋 Expected MQTT Format: [["node1","node2",1.5], ["node2","node3",2.1]]');
        }
    };

    // === Visualization Management ===
    const visualization = {
        /**
         * Clear all visualization elements
         */
        clear() {
            const viz = utils.$('#visualization');
            if (!viz) {
                logger.error('❌ Visualization container not found!');
                return;
            }
            
            const nodeCount = state.nodes.size;
            const connectionCount = state.connections.length;
            const distanceCount = state.currentDistances.size;
            
            if (nodeCount > 0 || connectionCount > 0 || distanceCount > 0) {
                logger.info(`🧹 Clearing visualization: ${nodeCount} nodes, ${connectionCount} connections, ${distanceCount} distance measurements`);
            }
            
            // Clear timers
            if (state.layoutUpdateInterval) {
                clearTimeout(state.layoutUpdateInterval);
                state.layoutUpdateInterval = null;
            }
            
            // Clear DOM
            while (viz.firstChild) {
                viz.removeChild(viz.firstChild);
            }
            
            // Clear state
            state.nodes.clear();
            state.connections = [];
            state.currentDistances.clear();
            state.isLayoutAnimating = false;
            
            logger.success('✅ Visualization cleared and ready for new data');
        }
    };

    // === UI Management ===
    const ui = {
        /**
         * Update connection status display
         */
        updateConnectionStatus(status) {
            const statusEl = utils.$('#connectionStatus');
            const connectBtn = utils.$('#connectBtn');
            const disconnectBtn = utils.$('#disconnectBtn');
            
            statusEl.className = `connection-status ${status}`;
            
            switch (status) {
                case 'disconnected':
                    statusEl.textContent = 'Disconnected';
                    connectBtn.style.display = 'inline-block';
                    disconnectBtn.style.display = 'none';
                    break;
                case 'connecting':
                    statusEl.textContent = 'Connecting...';
                    connectBtn.style.display = 'none';
                    disconnectBtn.style.display = 'inline-block';
                    break;
                case 'connected':
                    const connectionType = state.simulationInterval ? 'Simulation + Paho MQTT (SSL)' : 'Eclipse Paho MQTT (SSL)';
                    statusEl.textContent = `Connected (${connectionType})`;
                    connectBtn.style.display = 'none';
                    disconnectBtn.style.display = 'inline-block';
                    break;
            }
        },

        /**
         * Update progress information
         */
        updateProgress() {
            const info = utils.$('#progressInfo');
            const visibleNodes = state.nodes.size;
            const statusIcon = state.isConnected ? '🔗' : (state.simulationInterval ? '🎮' : '⭕');
            
            if (!state.isConnected && !state.simulationInterval) {
                info.innerHTML = `
                    Ready to connect. Configure broker settings above and click "Connect" for secure Eclipse Paho MQTT (SSL) or "Start Simulation" for demo data.<br>
                    <strong>Expected MQTT Format:</strong> [["node1","node2",1.5], ["node2","node3",2.1], ...]<br>
                    <strong>Positioning:</strong> Nodes positioned with accurate relative distances (50px = 1 meter)
                `;
                return;
            }
            
            let connectionType = '';
            if (state.isConnected && state.simulationInterval) {
                connectionType = 'Eclipse Paho MQTT (SSL) + Simulation';
            } else if (state.isConnected) {
                connectionType = 'Eclipse Paho MQTT (SSL)';
            } else if (state.simulationInterval) {
                connectionType = 'Simulation Mode';
            }
            
            info.innerHTML = `
                <strong>Status:</strong> ${statusIcon} ${connectionType}<br>
                <strong>Messages:</strong> ${state.messagesReceived}<br>
                <strong>Nodes:</strong> ${visibleNodes}<br>
                <strong>Scale:</strong> ${state.nodeSpacing}x${state.currentTopic ? '<br><strong>Topic:</strong> ' + state.currentTopic : ''}
            `;
        },

        /**
         * Update scale setting
         */
        updateScale(value) {
            state.nodeSpacing = parseInt(value);
            utils.$('#spacingValue').textContent = value;
            logger.info(`🔧 Display scale changed to ${value}x`);
            
            if (state.nodes.size > 0) {
                logger.info('🔄 Re-rendering visualization with new scale');
            }
        },

        /**
         * Update accuracy display setting
         */
        updateAccuracyDisplay() {
            state.showAccuracyIndicators = utils.$('#showAccuracy').checked;
            logger.info(`🎛️ Accuracy indicators ${state.showAccuracyIndicators ? 'enabled' : 'disabled'}`);
            
            if (state.currentDistances.size > 0) {
                connectionManager.updateAll();
                logger.info('🔄 Updated display for existing connections');
            }
        },

        /**
         * Toggle console visibility
         */
        toggleConsole() {
            const container = utils.$('#consoleContainer');
            const btn = utils.$('button[onclick="toggleConsole()"]');
            
            state.consoleVisible = !state.consoleVisible;
            if (state.consoleVisible) {
                container.classList.remove('hidden');
                btn.textContent = 'Hide Console';
            } else {
                container.classList.add('hidden');
                btn.textContent = 'Show Console';
            }
        }
    };

    // === Global Functions (for onclick handlers) ===
    window.connectMQTT = () => mqtt.connect();
    window.disconnectMQTT = () => mqtt.disconnect();
    window.manualResubscribe = () => mqtt.resubscribe();
    window.startSimulation = () => simulation.start();
    window.testMqttFormat = () => testing.testFormat();
    window.verifyNodes = () => testing.verifyNodes();
    window.checkConnectionStatus = () => testing.checkStatus();
    window.clearVisualization = () => visualization.clear();
    window.clearConsole = () => logger.clear();
    window.toggleConsole = () => ui.toggleConsole();
    window.updateScale = (value) => ui.updateScale(value);
    window.updateAccuracyDisplay = () => ui.updateAccuracyDisplay();

    // === Initialization ===
    function initialize() {
        logger.info(`INST Tag Visualiser v${CONFIG.REVISION} loaded (Eclipse Paho MQTT with SSL, 15s timeout)`);
        logger.info('📋 Expected MQTT payload format: [["node1","node2",1.5], ["node2","node3",2.1], ...]');
        ui.updateProgress();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();