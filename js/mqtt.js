/**
 * UWB Position Visualiser - MQTT Manager
 * Part of the INST Project - Indoor Positioning System Technology
 * Copyright (C) Dynamic Devices Ltd 2025
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 * 
 * MQTT connection and message handling functionality
 * Separated from main visualiser for better code organisation
 */

class MQTTManager {
    constructor(visualizer) {
        this.visualizer = visualizer;
        this.client = null;
        this.connected = false;
    }

    connect() {
        if (this.connected) {
            this.visualizer.logWarning('⚠️ Already connected to MQTT broker');
            return;
        }

        const host = document.getElementById('mqttHost').value.trim();
        const port = parseInt(document.getElementById('mqttPort').value, 10);
        const topic = document.getElementById('mqttTopic').value.trim();

        if (!host || !port || !topic) {
            this.visualizer.logError('❌ Please fill in all MQTT settings');
            return;
        }

        if (typeof Paho === 'undefined' || typeof Paho.MQTT === 'undefined') {
            this.visualizer.logError('❌ Eclipse Paho MQTT client not loaded');
            return;
        }

        this.visualizer.logInfo('📡 Connecting to MQTT broker...');
        this.attemptConnectionWithAutodetection(host, port, topic);
    }

    attemptConnectionWithAutodetection(host, port, topic) {
        // Always try SSL/WSS connections first, then fall back to non-SSL
        const strategies = [
            { useSSL: true, path: '/mqtt', description: 'WSS with standard WebSocket path' },
            { useSSL: true, path: '', description: 'WSS with root WebSocket path' },
            { useSSL: false, path: '/mqtt', description: 'WS fallback with standard path' },
            { useSSL: false, path: '', description: 'WS fallback with root path' }
        ];

        this.tryConnectionStrategies(host, port, topic, strategies, 0);
    }

    shouldUseSSL(port) {
        const sslPorts = [8084, 8883, 443, 9001];
        const nonSslPorts = [8080, 8083, 1883, 9000];
        
        if (sslPorts.includes(port)) return true;
        if (nonSslPorts.includes(port)) return false;
        return port > 8083;
    }

    tryConnectionStrategies(host, port, topic, strategies, index) {
        if (index >= strategies.length) {
            this.visualizer.logError('❌ All connection strategies failed');
            return;
        }

        const strategy = strategies[index];
        this.visualizer.logInfo(`🔗 Strategy ${index + 1}/${strategies.length}: ${strategy.description}`);
        
        this.attemptConnection(host, port, topic, strategy.useSSL, strategy.path, () => {
            setTimeout(() => {
                this.tryConnectionStrategies(host, port, topic, strategies, index + 1);
            }, 1000);
        });
    }

    attemptConnection(host, port, topic, useSSL, path, onFailure) {
        try {
            const clientId = "uwb_visualiser_" + Math.random().toString(16).substring(2, 8);
            
            if (path) {
                this.client = new Paho.MQTT.Client(host, port, path, clientId);
            } else {
                this.client = new Paho.MQTT.Client(host, port, clientId);
            }
            
            this.client.onConnectionLost = (responseObject) => {
                this.onConnectionLost(responseObject);
            };
            
            this.client.onMessageArrived = (message) => {
                this.onMessageArrived(message);
            };

            const connectOptions = {
                onSuccess: () => this.onConnectSuccess(topic),
                onFailure: (error) => {
                    const errorMsg = error.errorMessage || error.message || 'Unknown error';
                    this.visualizer.logWarning(`⚠️ Connection failed: ${errorMsg}`);
                    if (onFailure) onFailure();
                },
                timeout: 10,
                keepAliveInterval: 30,
                cleanSession: true,
                useSSL: useSSL,
            };

            this.client.connect(connectOptions);
            
        } catch (error) {
            this.visualizer.logError(`❌ Connection setup error: ${error.message}`);
            if (onFailure) onFailure();
        }
    }

    onConnectSuccess(topic) {
        this.connected = true;
        this.visualizer.updateStatus('Connected', true);
        this.visualizer.logSuccess('✅ Connected to MQTT broker successfully');
        
        try {
            this.client.subscribe(topic, {
                onSuccess: () => {
                    this.visualizer.logSuccess(`📡 Subscribed to topic: ${topic}`);
                    this.visualizer.logInfo('📡 Listening for UWB positioning messages... (Advanced mode ready!)');
                    // Auto-collapse MQTT panel after successful connection
                    this.collapseMqttPanel();
                },
                onFailure: (error) => {
                    this.visualizer.logError(`❌ Subscription failed: ${error.errorMessage}`);
                }
            });
        } catch (error) {
            this.visualizer.logError(`❌ Subscription error: ${error.message}`);
        }
        
        document.getElementById('connectMqtt').disabled = true;
        document.getElementById('disconnectMqtt').disabled = false;
    }

    onConnectionLost(responseObject) {
        this.connected = false;
        this.visualizer.updateStatus('Connection Lost', false);
        
        if (responseObject.errorCode !== 0) {
            this.visualizer.logError(`❌ Connection lost: ${responseObject.errorMessage}`);
        }
        
        document.getElementById('connectMqtt').disabled = false;
        document.getElementById('disconnectMqtt').disabled = true;
        this.client = null;
    }

    onMessageArrived(message) {
        const topic = message.destinationName;
        const payload = message.payloadString;
        
        this.visualizer.logSuccess(`📨 MQTT message received: ${payload}`);
        
        try {
            const distanceData = JSON.parse(payload);
            
            if (Array.isArray(distanceData)) {
                this.visualizer.processDistanceData(distanceData);
            } else {
                this.visualizer.logWarning('⚠️ Invalid message format - expected array');
            }
        } catch (error) {
            this.visualizer.logError(`❌ Failed to parse message: ${error.message}`);
        }
    }

    disconnect() {
        if (!this.connected) {
            this.visualizer.logWarning('⚠️ Not connected to MQTT broker');
            return;
        }

        this.visualizer.logInfo('📡 Disconnecting from MQTT broker...');
        
        if (this.client) {
            try {
                this.client.disconnect();
                this.visualizer.logInfo('📡 Disconnected from MQTT broker');
            } catch (error) {
                this.visualizer.logError(`❌ Disconnect error: ${error.message}`);
            }
            this.client = null;
        }
        
        this.connected = false;
        this.visualizer.updateStatus('Disconnected', false);
        
        document.getElementById('connectMqtt').disabled = false;
        document.getElementById('disconnectMqtt').disabled = true;
    }

    publishRateLimitCommand(rateLimitSeconds) {
        if (!this.connected || !this.client) {
            this.visualizer.logWarning('⚠️ Cannot send rate limit command - MQTT not connected');
            return;
        }

        const baseTopic = document.getElementById('mqttTopic').value.trim();
        const commandTopic = `${baseTopic}/cmd`;
        const payload = `set rate_limit ${rateLimitSeconds}`;

        try {
            const message = new Paho.MQTT.Message(payload);
            message.destinationName = commandTopic;
            message.qos = 1; // Ensure delivery
            
            this.client.send(message);
            this.visualizer.logSuccess(`📡 Rate limit command sent: ${payload} → ${commandTopic}`);
        } catch (error) {
            this.visualizer.logError(`❌ Failed to send rate limit command: ${error.message}`);
        }
    }

    collapseMqttPanel() {
        // Force collapse the MQTT panel after successful connection
        const mqttHeader = document.querySelector('[data-section="mqtt"]');
        if (mqttHeader) {
            const content = mqttHeader.nextElementSibling;
            const toggle = mqttHeader.querySelector('.collapse-toggle');
            
            if (content && toggle && !content.classList.contains('collapsed')) {
                content.classList.add('collapsed');
                toggle.classList.add('collapsed');
                toggle.textContent = '▶';
                this.visualizer.logInfo('📁 MQTT connection panel auto-collapsed after successful connection');
            }
        }
    }

    isConnected() {
        return this.connected;
    }

    getClient() {
        return this.client;
    }
}