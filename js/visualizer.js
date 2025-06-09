/**
 * UWB Position Visualiser - Responsive Main Visualiser Class
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
 * Core visualisation functionality with separated MQTT handling
 * Optimised for touch devices with responsive controls and prioritised display
 */

class UWBVisualizer {
    constructor() {
        this.nodes = new Map();
        this.connections = new Map();
        this.canvas = document.getElementById('canvas');
        this.consoleVisible = false;
        this.controlsVisible = true;
        this.debugMode = false;
        this.showBoundingBox = false;
        this.version = "3.5";
        this.messageCount = 0;
        this.staleTimeoutMs = 30000;
        this.removalTimeoutMs = 30000;
        this.lastUpdateTime = null;
        this.visualizationMaximized = false;
        
        // Spring-mass physics system with FAST parameters
        this.physics = new SpringMassSystem();
        this.physicsEnabled = true;
        this.simulationRunning = false;
        this.animationFrame = null;
        
        // Mobile optimization properties
        this.isMobileDevice = this.detectMobileDevice();
        this.isLandscape = window.innerWidth > window.innerHeight;
        
        // MQTT Manager for separated MQTT functionality
        this.mqttManager = new MQTTManager(this);
        
        this.initialiseEventListeners();
        this.setupMobileOptimizations();
        this.startStaleNodeChecker();
        this.startNodeCenteringChecker();
        this.updateTotalTimeout();
        this.logVersionInfo();
        this.updateStats();
        this.startPhysicsSimulation();
        
        // Initialize with console collapsed and auto-collapse controls on mobile
        document.querySelector('.container').classList.add('console-collapsed');
        if (this.isMobileDevice) {
            this.autoCollapseMobileControls();
        }
    }

    detectMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth <= 768;
    }

    setupMobileOptimizations() {
        // Add mobile-specific optimizations
        if (this.isMobileDevice) {
            // Prevent zoom on input focus
            document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
            
            // Handle orientation changes
            window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
            
            // Optimize viewport for mobile
            this.optimizeMobileViewport();
            
            // Auto-collapse certain sections on mobile
            this.optimizeMobileLayout();
        }
    }

    handleTouchStart(event) {
        // Prevent accidental zoom on double-tap for control elements
        if (event.target.closest('.controls') || event.target.closest('.visualization-header')) {
            event.preventDefault();
        }
    }

    handleOrientationChange() {
        setTimeout(() => {
            this.isLandscape = window.innerWidth > window.innerHeight;
            this.optimizeMobileLayout();
            this.centerNodes(); // Re-center nodes after orientation change
        }, 100);
    }

    optimizeMobileViewport() {
        // Ensure proper mobile viewport scaling
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover');
        }
    }

    optimizeMobileLayout() {
        if (this.isMobileDevice) {
            // Auto-collapse advanced sections on mobile to save space
            const advancedSections = ['physics', 'device', 'debug', 'version'];
            advancedSections.forEach(section => {
                const header = document.querySelector(`[data-section="${section}"]`);
                if (header) {
                    const content = header.nextElementSibling;
                    const toggle = header.querySelector('.collapse-toggle');
                    if (content && !content.classList.contains('collapsed')) {
                        content.classList.add('collapsed');
                        toggle.classList.add('collapsed');
                        toggle.textContent = '▶';
                    }
                }
            });
        }
    }

    autoCollapseMobileControls() {
        // On very small screens, start with controls collapsed
        if (window.innerWidth <= 480) {
            setTimeout(() => {
                this.toggleControls();
            }, 500);
        }
    }

    logVersionInfo() {
        this.logSuccess(`🎯 UWB Position Visualiser v${this.version} initialised - Responsive Advanced Physics`);
        this.logInfo('📱 v3.5 MODULAR: Separated MQTT management for better code organisation');
        this.logInfo('🎯 v3.5 PRIORITISED: Node visualisation takes 80%+ of screen space');
        this.logInfo('📱 v3.5 RESPONSIVE: Ultra-compact controls, larger touch targets, gesture support');
        this.logInfo('⚡ v3.5 COLLAPSIBLE: Organised sections with space-efficient layout');
        this.logInfo('🎨 v3.5 IMPROVED: Professional SVG logo with gradient design');
        this.logInfo('🚀 Advanced Physics: Spring 2.0, Damping 0.6, Mass 0.2 for responsive positioning');
        this.logInfo('💡 Tip: Use maximise button (⛶) for full-screen node visualisation');
        this.logInfo('📊 Touch-optimised statistics and quick actions for workflow');
    }

    initialiseEventListeners() {
        // Enhanced mobile-friendly event listeners
        
        // Collapsible sections with improved touch handling
        document.querySelectorAll('.control-group-header').forEach(header => {
            header.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSection(header);
            });
            
            // Add touch feedback
            header.addEventListener('touchstart', (e) => {
                header.style.transform = 'scale(0.98)';
            }, { passive: true });
            
            header.addEventListener('touchend', () => {
                header.style.transform = '';
            });
        });

        // MQTT controls - using separated MQTT manager
        document.getElementById('connectMqtt').addEventListener('click', () => this.mqttManager.connect());
        document.getElementById('disconnectMqtt').addEventListener('click', () => this.mqttManager.disconnect());

        // Physics controls - adjusted ranges for ultra-fast mode
        document.getElementById('springStrengthSlider').addEventListener('input', (e) => {
            this.physics.springConstant = parseFloat(e.target.value);
            document.getElementById('springStrengthValue').textContent = e.target.value;
            this.logInfo(`Spring strength set to ${e.target.value} (High-performance mode)`);
        });

        document.getElementById('dampingSlider').addEventListener('input', (e) => {
            this.physics.damping = parseFloat(e.target.value);
            document.getElementById('dampingValue').textContent = e.target.value;
            this.logInfo(`Damping set to ${e.target.value} (minimal damping = maximum motion)`);
        });

        document.getElementById('massSlider').addEventListener('input', (e) => {
            this.physics.mass = parseFloat(e.target.value);
            document.getElementById('massValue').textContent = e.target.value;
            // Update mass for all existing nodes
            this.nodes.forEach(node => {
                if (!node.isRemoved) node.mass = this.physics.mass;
            });
            this.logInfo(`Node mass set to ${e.target.value} (lightweight = responsive positioning)`);
        });

        document.getElementById('scaleSlider').addEventListener('input', (e) => {
            this.physics.distanceScale = parseInt(e.target.value);
            document.getElementById('scaleValue').textContent = e.target.value;
            this.logInfo(`Distance scale set to ${e.target.value}px/m`);
        });

        document.getElementById('enablePhysics').addEventListener('change', (e) => {
            this.physicsEnabled = e.target.checked;
            this.logInfo(`Advanced Physics ${this.physicsEnabled ? 'enabled' : 'disabled'}`);
            if (this.physicsEnabled && !this.simulationRunning) {
                this.startPhysicsSimulation();
            } else if (!this.physicsEnabled && this.simulationRunning) {
                this.stopPhysicsSimulation();
            }
        });

        document.getElementById('resetPhysics').addEventListener('click', () => this.resetPhysics());

        // Settings
        document.getElementById('staleTimeoutSlider').addEventListener('input', (e) => {
            this.staleTimeoutMs = parseInt(e.target.value) * 1000;
            document.getElementById('staleTimeoutValue').textContent = e.target.value;
            this.updateTotalTimeout();
            this.logInfo(`Stale timeout set to ${e.target.value}s`);
        });

        document.getElementById('removalTimeoutSlider').addEventListener('input', (e) => {
            this.removalTimeoutMs = parseInt(e.target.value) * 1000;
            document.getElementById('removalTimeoutValue').textContent = e.target.value;
            this.updateTotalTimeout();
            this.logInfo(`Removal timeout set to ${e.target.value}s (after stale)`);
        });

        document.getElementById('showAccuracy').addEventListener('change', (e) => {
            this.updateDistanceLabels();
        });

        document.getElementById('debugMode').addEventListener('change', (e) => {
            this.debugMode = e.target.checked;
            this.logInfo(`🐛 Debug mode ${this.debugMode ? 'enabled' : 'disabled'}`);
        });

        document.getElementById('showBoundingBox').addEventListener('change', (e) => {
            this.showBoundingBox = e.target.checked;
            this.logInfo(`🔲 Bounding box visualisation ${this.showBoundingBox ? 'enabled' : 'disabled'}`);
            if (!this.showBoundingBox) {
                this.removeBoundingBox();
            }
        });

        document.getElementById('rateLimitSlider').addEventListener('input', (e) => {
            const rateLimitSeconds = parseInt(e.target.value);
            document.getElementById('rateLimitValue').textContent = rateLimitSeconds;
            this.mqttManager.publishRateLimitCommand(rateLimitSeconds);
        });

        // Enhanced button controls with touch feedback
        const buttons = [
            { id: 'clearNodes', action: () => this.clearAllNodes() },
            { id: 'centerNodes', action: () => this.centerNodes() },
            { id: 'resetStats', action: () => this.resetStats() },
            { id: 'clearConsole', action: () => this.clearConsole() },
            { id: 'toggleConsole', action: () => this.toggleConsole() },
            { id: 'toggleControls', action: () => this.toggleControls() },
            { id: 'maximizeVisualization', action: () => this.toggleMaximizeVisualization() }
        ];

        buttons.forEach(({ id, action }) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', action);
                
                // Add touch feedback for mobile
                if (this.isMobileDevice) {
                    button.addEventListener('touchstart', () => {
                        button.style.transform = 'scale(0.95)';
                    }, { passive: true });
                    
                    button.addEventListener('touchend', () => {
                        setTimeout(() => {
                            button.style.transform = '';
                        }, 100);
                    });
                }
            }
        });

        // Handle window resize for responsive layout
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    handleResize() {
        // Update mobile detection on resize
        const wasMobile = this.isMobileDevice;
        this.isMobileDevice = this.detectMobileDevice();
        
        if (wasMobile !== this.isMobileDevice) {
            this.setupMobileOptimizations();
        }
        
        // Re-center nodes after resize
        if (this.nodes.size > 0) {
            setTimeout(() => this.centerNodes(), 100);
        }
    }

    toggleSection(header) {
        const content = header.nextElementSibling;
        const toggle = header.querySelector('.collapse-toggle');
        const section = header.dataset.section;
        
        const isCollapsed = content.classList.contains('collapsed');
        
        if (isCollapsed) {
            content.classList.remove('collapsed');
            toggle.classList.remove('collapsed');
            toggle.textContent = '▼';
            this.logInfo(`📂 ${section.charAt(0).toUpperCase() + section.slice(1)} section expanded`);
        } else {
            content.classList.add('collapsed');
            toggle.classList.add('collapsed');
            toggle.textContent = '▶';
            this.logInfo(`📁 ${section.charAt(0).toUpperCase() + section.slice(1)} section collapsed`);
        }
    }

    startPhysicsSimulation() {
        if (this.simulationRunning) return;
        
        this.simulationRunning = true;
        this.logInfo('🚀 Advanced Physics simulation started - optimised for responsive display!');
        
        const simulate = () => {
            if (!this.simulationRunning || !this.physicsEnabled) return;
            
            // Run physics simulation with high-performance parameters
            this.physics.simulate(
                this.nodes, 
                this.connections, 
                this.canvas.offsetWidth, 
                this.canvas.offsetHeight
            );
            
            // Update visualisation
            this.updateVisualisation();
            
            // Continue simulation
            this.animationFrame = requestAnimationFrame(simulate);
        };
        
        this.animationFrame = requestAnimationFrame(simulate);
    }

    stopPhysicsSimulation() {
        this.simulationRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        this.logInfo('🛑 Advanced Physics simulation stopped');
    }

    resetPhysics() {
        // Reset all node velocities and forces
        this.nodes.forEach(node => {
            if (!node.isRemoved) {
                node.vx = 0;
                node.vy = 0;
                node.fx = 0;
                node.fy = 0;
                node.hasInitialPosition = false; // Allow re-initialisation
            }
        });
        
        this.logInfo('🔄 Advanced Physics state reset - all velocities zeroed');
    }

    centerNodes() {
        const activeNodes = Array.from(this.nodes.values()).filter(node => !node.isRemoved);
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
        const canvasCenterX = this.canvas.offsetWidth / 2;
        const canvasCenterY = this.canvas.offsetHeight / 2;
        const offsetX = canvasCenterX - centerX;
        const offsetY = canvasCenterY - centerY;
        
        // Move all nodes
        activeNodes.forEach(node => {
            node.x += offsetX;
            node.y += offsetY;
        });
        
        this.logSuccess('🎯 Nodes centred on display');
    }

    startStaleNodeChecker() {
        setInterval(() => {
            this.checkStaleNodes();
        }, 1000);
    }

    startNodeCenteringChecker() {
        // Check every 5 seconds if nodes need re-centering
        setInterval(() => {
            this.checkAndCenterNodes();
        }, 5000);
    }

    checkAndCenterNodes() {
        const activeNodes = Array.from(this.nodes.values()).filter(node => !node.isRemoved);
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
        const canvasCenterX = this.canvas.offsetWidth / 2;
        const canvasCenterY = this.canvas.offsetHeight / 2;
        const driftX = Math.abs(centerX - canvasCenterX);
        const driftY = Math.abs(centerY - canvasCenterY);
        const maxDrift = Math.min(this.canvas.offsetWidth, this.canvas.offsetHeight) * 0.15;
        
        if (driftX > maxDrift || driftY > maxDrift) {
            this.centerNodes();
            if (this.debugMode) {
                this.logInfo(`🎯 Auto-centered nodes - drift detected: ${driftX.toFixed(1)}px, ${driftY.toFixed(1)}px`);
            }
        }
    }

    updateTotalTimeout() {
        const staleSeconds = this.staleTimeoutMs / 1000;
        const removalSeconds = this.removalTimeoutMs / 1000;
        const totalSeconds = staleSeconds + removalSeconds;
        document.getElementById('totalTimeoutValue').textContent = totalSeconds;
    }

    checkStaleNodes() {
        const currentTime = Date.now();
        const nodesToRemove = [];
        let statsChanged = false;
        
        this.nodes.forEach((node, nodeId) => {
            const timeSinceUpdate = currentTime - node.lastUpdate;
            const wasStale = node.isStale;
            const wasRemoved = node.isRemoved;
            
            node.isStale = timeSinceUpdate > this.staleTimeoutMs;
            node.isRemoved = timeSinceUpdate > (this.staleTimeoutMs + this.removalTimeoutMs);
            
            if (node.isRemoved && !wasRemoved) {
                this.logWarning(`❌ Node ${nodeId} removed after ${Math.round(timeSinceUpdate/1000)}s without updates`);
                nodesToRemove.push(nodeId);
                statsChanged = true;
            } else if (node.isStale && !wasStale && !node.isRemoved) {
                this.logWarning(`⏰ Node ${nodeId} marked as stale`);
                this.updateNodeAppearance(node);
            } else if (!node.isStale && wasStale && !node.isRemoved) {
                this.logSuccess(`✅ Node ${nodeId} back online`);
                this.updateNodeAppearance(node);
            }
        });

        nodesToRemove.forEach(nodeId => {
            this.removeNodeFromDisplay(nodeId);
        });

        this.connections.forEach((connection, key) => {
            const node1 = this.nodes.get(connection.node1);
            const node2 = this.nodes.get(connection.node2);
            const wasStale = connection.isStale;
            const wasRemoved = connection.isRemoved;
            
            connection.isStale = (node1?.isStale || node2?.isStale) || 
                               (currentTime - connection.lastUpdate > this.staleTimeoutMs);
            
            connection.isRemoved = (node1?.isRemoved || node2?.isRemoved) || 
                                 (currentTime - connection.lastUpdate > (this.staleTimeoutMs + this.removalTimeoutMs));
            
            if (connection.isRemoved && !wasRemoved) {
                this.removeConnectionFromDisplay(key);
                statsChanged = true;
            } else if (connection.isStale !== wasStale) {
                this.updateConnectionAppearance(connection);
            }
        });
        
        // Update statistics if any nodes or connections were removed
        if (statsChanged) {
            this.updateStats();
        }
    }

    removeNodeFromDisplay(nodeId) {
        const node = this.nodes.get(nodeId);
        if (node?.element) {
            node.element.remove();
            node.element = null;
        }
    }

    removeConnectionFromDisplay(connectionKey) {
        const line = this.canvas.querySelector(`[data-connection-key="${connectionKey}"]`);
        if (line) line.remove();
        
        const label = this.canvas.querySelector(`.distance-label[data-connection-key="${connectionKey}"]`);
        if (label) label.remove();
    }

    updateStats() {
        const nodeCountElement = document.getElementById('nodeCount');
        const connectionCountElement = document.getElementById('connectionCount');
        const messageCountElement = document.getElementById('messageCount');
        const totalAreaElement = document.getElementById('totalArea');
        const lastMessageTimeElement = document.getElementById('lastMessageTime');
        
        if (nodeCountElement) {
            const currentNodeCount = Array.from(this.nodes.values()).filter(node => !node.isRemoved).length;
            nodeCountElement.textContent = currentNodeCount;
            nodeCountElement.classList.add('updated');
            setTimeout(() => nodeCountElement.classList.remove('updated'), 500);
        }
        
        if (connectionCountElement) {
            const currentConnectionCount = Array.from(this.connections.values()).filter(conn => !conn.isRemoved).length;
            connectionCountElement.textContent = currentConnectionCount;
            connectionCountElement.classList.add('updated');
            setTimeout(() => connectionCountElement.classList.remove('updated'), 500);
        }
        
        if (messageCountElement) {
            messageCountElement.textContent = this.messageCount;
            messageCountElement.classList.add('updated');
            setTimeout(() => messageCountElement.classList.remove('updated'), 500);
        }
        
        if (totalAreaElement) {
            const boundingBoxDimensions = this.calculateBoundingBoxDimensions();
            totalAreaElement.textContent = boundingBoxDimensions;
            totalAreaElement.classList.add('updated');
            setTimeout(() => totalAreaElement.classList.remove('updated'), 500);
        }
        
        if (lastMessageTimeElement && this.lastUpdateTime) {
            const timestamp = new Date(this.lastUpdateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            lastMessageTimeElement.textContent = timestamp;
            lastMessageTimeElement.classList.add('updated');
            setTimeout(() => lastMessageTimeElement.classList.remove('updated'), 500);
        }
    }

    calculateBoundingBoxDimensions() {
        const activeNodes = Array.from(this.nodes.values()).filter(node => !node.isRemoved);
        
        if (activeNodes.length < 2) {
            return '0×0m';
        }
        
        // Calculate bounding box in pixels
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        activeNodes.forEach(node => {
            minX = Math.min(minX, node.x);
            maxX = Math.max(maxX, node.x);
            minY = Math.min(minY, node.y);
            maxY = Math.max(maxY, node.y);
        });
        
        // Convert pixels to metres using the physics distance scale
        const widthPixels = maxX - minX;
        const heightPixels = maxY - minY;
        const widthMeters = widthPixels / this.physics.distanceScale;
        const heightMeters = heightPixels / this.physics.distanceScale;
        
        // Return compact dimensions for mobile
        return `${widthMeters.toFixed(1)}×${heightMeters.toFixed(1)}m`;
    }

    updateBoundingBox() {
        const activeNodes = Array.from(this.nodes.values()).filter(node => !node.isRemoved);
        
        if (activeNodes.length < 2) {
            this.removeBoundingBox();
            return;
        }
        
        // Calculate bounding box coordinates
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        activeNodes.forEach(node => {
            minX = Math.min(minX, node.x);
            maxX = Math.max(maxX, node.x);
            minY = Math.min(minY, node.y);
            maxY = Math.max(maxY, node.y);
        });
        
        const width = maxX - minX;
        const height = maxY - minY;
        
        // Convert to metres for labels
        const widthMeters = (width / this.physics.distanceScale).toFixed(1);
        const heightMeters = (height / this.physics.distanceScale).toFixed(1);
        
        // Remove existing bounding box elements
        this.removeBoundingBox();
        
        // Create bounding box rectangle
        const boundingBox = document.createElement('div');
        boundingBox.className = 'bounding-box';
        boundingBox.style.left = `${minX}px`;
        boundingBox.style.top = `${minY}px`;
        boundingBox.style.width = `${width}px`;
        boundingBox.style.height = `${height}px`;
        this.canvas.appendChild(boundingBox);
        
        // Create horizontal distance label (top)
        const horizontalLabel = document.createElement('div');
        horizontalLabel.className = 'bounding-box-label horizontal';
        horizontalLabel.textContent = `${widthMeters}m`;
        horizontalLabel.style.left = `${minX + width / 2}px`;
        horizontalLabel.style.top = `${minY - 8}px`;
        this.canvas.appendChild(horizontalLabel);
        
        // Create vertical distance label (left)
        const verticalLabel = document.createElement('div');
        verticalLabel.className = 'bounding-box-label vertical';
        verticalLabel.textContent = `${heightMeters}m`;
        verticalLabel.style.left = `${minX - 8}px`;
        verticalLabel.style.top = `${minY + height / 2}px`;
        this.canvas.appendChild(verticalLabel);
    }

    removeBoundingBox() {
        this.canvas.querySelectorAll('.bounding-box, .bounding-box-label').forEach(el => el.remove());
    }

    resetStats() {
        this.messageCount = 0;
        this.lastUpdateTime = null;
        document.getElementById('lastMessageTime').textContent = 'Never';
        
        // Clear all nodes and connections
        this.nodes.clear();
        this.connections.clear();
        this.canvas.querySelectorAll('.node, .connection, .distance-label, .bounding-box, .bounding-box-label').forEach(el => el.remove());
        
        this.updateStats();
        this.logInfo('📊 Statistics reset - all data cleared');
    }

    processDistanceData(distanceArray) {
        this.messageCount++;
        this.lastUpdateTime = Date.now();
        
        if (this.debugMode) {
            this.logInfo(`🔄 Processing message #${this.messageCount} with ${distanceArray.length} distance measurements (Advanced mode)`);
        }
        
        // Create/update nodes
        distanceArray.forEach(([node1, node2, distance]) => {
            this.ensureNodeExists(node1);
            this.ensureNodeExists(node2);
            
            this.nodes.get(node1).lastUpdate = this.lastUpdateTime;
            this.nodes.get(node2).lastUpdate = this.lastUpdateTime;
        });

        // Update connections (spring rest lengths)
        distanceArray.forEach(([node1, node2, distance]) => {
            const key = this.getConnectionKey(node1, node2);
            
            let accuracy = 'accurate';
            if (distance > 8 || distance < 0.5) {
                accuracy = 'approximate';
            }
            
            const existingConnection = this.connections.get(key);
            const wasRemoved = existingConnection?.isRemoved;
            
            this.connections.set(key, {
                node1, node2, distance,
                accuracy: accuracy,
                lastUpdate: this.lastUpdateTime,
                isStale: false,
                isRemoved: false
            });
            
            if (wasRemoved) {
                this.logSuccess(`🔄 Restored connection ${node1}-${node2}: ${distance.toFixed(2)}m (will snap quickly!)`);
            } else if (this.debugMode) {
                this.logInfo(`📏 Spring connection ${node1}-${node2}: ${distance.toFixed(2)}m (advanced physics)`);
            }
        });

        this.updateStats();
    }

    ensureNodeExists(nodeId) {
        if (!this.nodes.has(nodeId)) {
            const isGateway = nodeId === 'B5A4' || nodeId.includes('GW') || nodeId.includes('gateway');
            
            this.nodes.set(nodeId, {
                id: nodeId,
                x: 0, // Will be initialised by physics system
                y: 0,
                vx: 0,
                vy: 0,
                fx: 0,
                fy: 0,
                mass: this.physics.mass, // Use lighter mass for faster movement
                type: isGateway ? 'gateway' : 'standard',
                element: null,
                lastUpdate: Date.now(),
                isStale: false,
                isRemoved: false,
                hasInitialPosition: false
            });
            
            this.logSuccess(`✨ Created new ${isGateway ? 'gateway' : 'standard'} node: ${nodeId} (advanced physics enabled)`);
            this.updateStats();
        } else {
            const node = this.nodes.get(nodeId);
            if (node.isRemoved) {
                node.isRemoved = false;
                node.isStale = false;
                node.lastUpdate = Date.now();
                this.logSuccess(`🔄 Restored previously removed node: ${nodeId} (will move to position quickly)`);
            }
        }
    }

    updateVisualisation() {
        this.updateNodes();
        this.updateConnections();
        this.updateDistanceLabels();
        
        // Show bounding box if bounding box option is enabled
        if (this.showBoundingBox) {
            this.updateBoundingBox();
        } else {
            this.removeBoundingBox();
        }
    }

    updateNodes() {
        this.nodes.forEach((node, nodeId) => {
            if (node.isRemoved) {
                if (node.element) {
                    node.element.remove();
                    node.element = null;
                }
                return;
            }

            if (!node.element) {
                node.element = this.createNodeElement(node);
                this.canvas.appendChild(node.element);
            }

            const element = node.element;
            
            // Update position (no transitions needed - physics provides smooth movement)
            element.style.transition = 'none';
            element.style.left = `${node.x - element.offsetWidth / 2}px`;
            element.style.top = `${node.y - element.offsetHeight / 2}px`;
            
            element.textContent = nodeId.length > 4 ? nodeId.substring(0, 4) : nodeId;
            this.updateNodeAppearance(node);
        });
    }

    createNodeElement(node) {
        const element = document.createElement('div');
        element.className = `node ${node.type}`;
        
        // Add touch handling for mobile devices
        if (this.isMobileDevice) {
            element.addEventListener('touchstart', (e) => {
                e.preventDefault();
                element.style.transform = 'scale(1.1)';
            }, { passive: false });
            
            element.addEventListener('touchend', () => {
                element.style.transform = '';
            });
        }
        
        return element;
    }

    updateNodeAppearance(node) {
        if (!node.element) return;
        
        if (node.isStale) {
            node.element.classList.add('stale');
        } else {
            node.element.classList.remove('stale');
        }
    }

    updateConnections() {
        const existingConnections = new Map();
        this.canvas.querySelectorAll('.connection').forEach(el => {
            const key = el.dataset.connectionKey;
            if (key) {
                existingConnections.set(key, el);
            }
        });

        this.connections.forEach((connection, key) => {
            if (connection.isRemoved) {
                const line = existingConnections.get(key);
                if (line) {
                    line.remove();
                    existingConnections.delete(key);
                }
                return;
            }

            const node1 = this.nodes.get(connection.node1);
            const node2 = this.nodes.get(connection.node2);

            if (!node1 || !node2 || node1.isRemoved || node2.isRemoved) {
                const line = existingConnections.get(key);
                if (line) {
                    line.remove();
                    existingConnections.delete(key);
                }
                return;
            }

            const dx = node2.x - node1.x;
            const dy = node2.y - node1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;

            let line = existingConnections.get(key);
            
            if (line) {
                line.style.transition = 'none'; // No CSS transitions needed
                line.style.left = `${node1.x}px`;
                line.style.top = `${node1.y}px`;
                line.style.width = `${distance}px`;
                line.style.transform = `rotate(${angle}deg)`;
                existingConnections.delete(key);
            } else {
                line = document.createElement('div');
                line.className = 'connection';
                line.dataset.connectionKey = key;
                line.style.transition = 'none';
                line.style.left = `${node1.x}px`;
                line.style.top = `${node1.y}px`;
                line.style.width = `${distance}px`;
                line.style.transform = `rotate(${angle}deg)`;
                this.canvas.appendChild(line);
            }

            this.updateConnectionAppearance(connection);
        });

        existingConnections.forEach(el => el.remove());
    }

    updateConnectionAppearance(connection) {
        const key = this.getConnectionKey(connection.node1, connection.node2);
        const line = this.canvas.querySelector(`[data-connection-key="${key}"]`);
        
        if (line) {
            if (connection.isStale) {
                line.classList.add('stale');
            } else {
                line.classList.remove('stale');
            }
        }
    }

    updateDistanceLabels() {
        if (!document.getElementById('showAccuracy').checked) {
            this.canvas.querySelectorAll('.distance-label').forEach(el => el.remove());
            return;
        }

        const existingLabels = new Map();
        this.canvas.querySelectorAll('.distance-label').forEach(el => {
            const key = el.dataset.connectionKey;
            if (key) {
                existingLabels.set(key, el);
            }
        });

        this.connections.forEach((connection, key) => {
            if (connection.isRemoved) {
                const label = existingLabels.get(key);
                if (label) {
                    label.remove();
                    existingLabels.delete(key);
                }
                return;
            }

            const node1 = this.nodes.get(connection.node1);
            const node2 = this.nodes.get(connection.node2);

            if (!node1 || !node2 || node1.isRemoved || node2.isRemoved) {
                const label = existingLabels.get(key);
                if (label) {
                    label.remove();
                    existingLabels.delete(key);
                }
                return;
            }

            const midX = (node1.x + node2.x) / 2;
            const midY = (node1.y + node2.y) / 2;

            let label = existingLabels.get(key);
            const labelText = `${connection.distance.toFixed(1)}m`;
            
            if (label) {
                label.style.transition = 'none'; // No CSS transitions needed
                label.style.left = `${midX}px`;
                label.style.top = `${midY}px`;
                label.textContent = labelText;
                label.className = `distance-label ${connection.accuracy}`;
                existingLabels.delete(key);
            } else {
                label = document.createElement('div');
                label.className = `distance-label ${connection.accuracy}`;
                label.dataset.connectionKey = key;
                label.style.transition = 'none';
                label.style.left = `${midX}px`;
                label.style.top = `${midY}px`;
                label.textContent = labelText;
                this.canvas.appendChild(label);
            }

            if (connection.isStale) {
                label.classList.add('stale');
            } else {
                label.classList.remove('stale');
            }
        });

        existingLabels.forEach(el => el.remove());
    }

    getConnectionKey(node1, node2) {
        return [node1, node2].sort().join('-');
    }

    clearAllNodes() {
        this.nodes.clear();
        this.connections.clear();
        this.canvas.querySelectorAll('.node, .connection, .distance-label, .bounding-box, .bounding-box-label').forEach(el => el.remove());
        this.logInfo('🗑️ All nodes cleared');
        this.updateStats();
    }

    updateStatus(text, connected) {
        document.getElementById('statusText').textContent = text;
        document.getElementById('statusIndicator').classList.toggle('connected', connected);
    }

    // Logging methods
    logInfo(message) {
        this.addLogEntry(message, 'info');
    }

    logSuccess(message) {
        this.addLogEntry(message, 'success');
    }

    logWarning(message) {
        this.addLogEntry(message, 'warning');
    }

    logError(message) {
        this.addLogEntry(message, 'error');
    }

    addLogEntry(message, type) {
        const console = document.getElementById('consoleContent');
        const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
        
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.innerHTML = `<span class="log-timestamp">[${timestamp}]</span> ${message}`;
        
        console.appendChild(entry);
        console.scrollTop = console.scrollHeight;

        while (console.children.length > 100) {
            console.removeChild(console.firstChild);
        }
    }

    clearConsole() {
        document.getElementById('consoleContent').innerHTML = '';
    }

    toggleConsole() {
        const consolePanel = document.getElementById('consolePanel');
        const consoleContent = document.getElementById('consoleContent');
        const container = document.querySelector('.container');
        const toggleButton = document.getElementById('toggleConsole');
        
        this.consoleVisible = !this.consoleVisible;
        const isHidden = !this.consoleVisible;
        
        consoleContent.classList.toggle('hidden', isHidden);
        consolePanel.classList.toggle('collapsed', isHidden);
        container.classList.toggle('console-collapsed', isHidden);
        
        toggleButton.textContent = isHidden ? 'Show' : 'Hide';
        
        if (this.consoleVisible) {
            this.logInfo('📋 Console expanded');
        }
    }

    toggleControls() {
        const controlsPanel = document.getElementById('controlsPanel');
        const controlsContent = document.getElementById('controlsContent');
        const container = document.querySelector('.container');
        const toggleButton = document.getElementById('toggleControls');
        
        this.controlsVisible = !this.controlsVisible;
        const isHidden = !this.controlsVisible;
        
        // Enhanced mobile handling
        if (isHidden) {
            controlsContent.classList.add('hidden');
            controlsPanel.classList.add('collapsed');
            container.classList.add('controls-collapsed');
            toggleButton.textContent = 'Show';
        } else {
            controlsContent.classList.remove('hidden');
            controlsPanel.classList.remove('collapsed');
            container.classList.remove('controls-collapsed');
            toggleButton.textContent = 'Hide';
            this.logInfo('⚙️ Controls panel expanded');
        }
    }

    toggleMaximizeVisualization() {
        const container = document.querySelector('.container');
        const maximizeButton = document.getElementById('maximizeVisualization');
        
        this.visualizationMaximized = !this.visualizationMaximized;
        
        container.classList.toggle('visualization-maximized', this.visualizationMaximized);
        
        if (this.visualizationMaximized) {
            maximizeButton.textContent = '⛷'; // Minimize icon
            maximizeButton.title = 'Exit Full Screen';
            this.logInfo('🔍 Visualisation maximised - full-screen mode for optimal node viewing');
            
            // On mobile, provide haptic feedback if available
            if (this.isMobileDevice && navigator.vibrate) {
                navigator.vibrate(50);
            }
        } else {
            maximizeButton.textContent = '⛶'; // Maximize icon  
            maximizeButton.title = 'Maximise Visualisation';
            this.logInfo('🔍 Visualisation restored to normal view');
        }
        
        // Re-center nodes after layout change
        setTimeout(() => {
            if (this.nodes.size > 0) {
                this.centerNodes();
            }
        }, 100);
    }
}