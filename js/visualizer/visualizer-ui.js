/* global eventBus */
/**
 * Visualizer UI Management
 * Handles UI controls, event listeners, and user interactions
 */

class VisualizerUIManager {
    constructor(visualizer) {
        this.visualizer = visualizer;
        this.controlsVisible = true;
        this.debugMode = false;
        this.showBoundingBox = false;
    }

    /**
     * Initialize UI manager
     */
    initialize() {
        this.setupEventListeners();
        console.log('🎛️ UI Manager initialized');
    }

    /**
     * Set up all UI event listeners
     */
    setupEventListeners() {
        // Helper function to safely add event listeners
        const safeAddEventListener = (elementId, event, handler, description = '') => {
            const element = document.getElementById(elementId);
            if (element) {
                element.addEventListener(event, handler);
                console.log(`✅ Event listener added: ${elementId} ${description}`);
            } else {
                console.warn(`⚠️ Element not found: ${elementId} ${description}`);
            }
        };

        // Collapsible sections with improved touch handling
        document.querySelectorAll('.control-group-header').forEach(header => {
            header.addEventListener('click', () => {
                this.toggleSection(header);
            });
            
            // Add touch feedback
            if (this.visualizer.mobileManager?.isMobileDevice) {
                header.addEventListener('touchstart', () => {
                    header.style.transform = 'scale(0.98)';
                }, { passive: true });
                
                header.addEventListener('touchend', () => {
                    header.style.transform = '';
                });
            }
        });

        // MQTT controls - using event bus to communicate with core
        safeAddEventListener('connectMqtt', 'click', () => {
            eventBus.emit('mqtt-connect-requested');
        }, '(MQTT Connect)');

        safeAddEventListener('disconnectMqtt', 'click', () => {
            eventBus.emit('mqtt-disconnect-requested');
        }, '(MQTT Disconnect)');

        // Physics controls
        safeAddEventListener('springStrengthSlider', 'input', (e) => {
            this.visualizer.physicsManager.updateSpringStrength(e.target.value);
            const valueElement = document.getElementById('springStrengthValue');
            if (valueElement) valueElement.textContent = e.target.value;
        }, '(Spring Strength)');

        safeAddEventListener('dampingSlider', 'input', (e) => {
            this.visualizer.physicsManager.updateDamping(e.target.value);
            const valueElement = document.getElementById('dampingValue');
            if (valueElement) valueElement.textContent = e.target.value;
        }, '(Damping)');

        safeAddEventListener('massSlider', 'input', (e) => {
            this.visualizer.physicsManager.updateMass(e.target.value);
            const valueElement = document.getElementById('massValue');
            if (valueElement) valueElement.textContent = e.target.value;
        }, '(Mass)');

        safeAddEventListener('scaleSlider', 'input', (e) => {
            this.visualizer.physicsManager.updateScale(e.target.value);
            const valueElement = document.getElementById('scaleValue');
            if (valueElement) valueElement.textContent = e.target.value;
        }, '(Scale)');

        // Zoom In/Out button controls
        const scaleSlider = document.getElementById('scaleSlider');
        const scaleValue = document.getElementById('scaleValue');
        const zoomInBtn = document.getElementById('zoomIn');
        const zoomOutBtn = document.getElementById('zoomOut');
        if (zoomInBtn && scaleSlider) {
            zoomInBtn.addEventListener('click', () => {
                const newValue = Math.min(parseInt(scaleSlider.value, 10) + 10, parseInt(scaleSlider.max, 10));
                scaleSlider.value = newValue;
                if (scaleValue) scaleValue.textContent = newValue;
                this.visualizer.physicsManager.updateScale(newValue);
            });
        }
        if (zoomOutBtn && scaleSlider) {
            zoomOutBtn.addEventListener('click', () => {
                const newValue = Math.max(parseInt(scaleSlider.value, 10) - 10, parseInt(scaleSlider.min, 10));
                scaleSlider.value = newValue;
                if (scaleValue) scaleValue.textContent = newValue;
                this.visualizer.physicsManager.updateScale(newValue);
            });
        }

        // Mouse wheel zoom support on canvas
        if (scaleSlider && this.visualizer.canvas) {
            this.visualizer.canvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                const delta = e.deltaY < 0 ? 10 : -10;
                let newValue = parseInt(scaleSlider.value, 10) + delta;
                newValue = Math.max(parseInt(scaleSlider.min, 10), Math.min(parseInt(scaleSlider.max, 10), newValue));
                scaleSlider.value = newValue;
                if (scaleValue) scaleValue.textContent = newValue;
                this.visualizer.physicsManager.updateScale(newValue);
            }, { passive: false });
        }

        safeAddEventListener('enablePhysics', 'change', (e) => {
            this.visualizer.togglePhysics(e.target.checked);
        }, '(Enable Physics)');

        safeAddEventListener('resetPhysics', 'click', () => {
            this.visualizer.resetPhysics();
        }, '(Reset Physics)');

        // Settings
        safeAddEventListener('staleTimeoutSlider', 'input', (e) => {
            this.visualizer.staleTimeoutMs = parseInt(e.target.value, 10) * 1000;
            const valueElement = document.getElementById('staleTimeoutValue');
            if (valueElement) valueElement.textContent = e.target.value;
            this.updateTotalTimeout();
            this.visualizer.loggingManager?.logInfo(`Stale timeout set to ${e.target.value}s`);
        }, '(Stale Timeout)');

        safeAddEventListener('removalTimeoutSlider', 'input', (e) => {
            this.visualizer.removalTimeoutMs = parseInt(e.target.value, 10) * 1000;
            const valueElement = document.getElementById('removalTimeoutValue');
            if (valueElement) valueElement.textContent = e.target.value;
            this.updateTotalTimeout();
            this.visualizer.loggingManager?.logInfo(`Removal timeout set to ${e.target.value}s (after stale)`);
        }, '(Removal Timeout)');

        safeAddEventListener('showAccuracy', 'change', () => {
            this.visualizer.connectionManager.updateDistanceLabels();
        }, '(Show Accuracy)');

        // Debug controls
        safeAddEventListener('debugMode', 'change', () => {
            this.debugMode = document.getElementById('debugMode').checked;
            this.visualizer.loggingManager?.logInfo(`🐛 Debug mode ${this.debugMode ? 'enabled' : 'disabled'}`);
        }, '(Debug Mode)');

        safeAddEventListener('showBoundingBox', 'change', (e) => {
            this.showBoundingBox = e.target.checked;
            this.visualizer.loggingManager?.logInfo(`🔲 Bounding box visualisation ${this.showBoundingBox ? 'enabled' : 'disabled'}`);
            if (!this.showBoundingBox) {
                this.visualizer.statsManager?.removeBoundingBox();
            }
        }, '(Show Bounding Box)');

        safeAddEventListener('rateLimitSlider', 'input', (e) => {
            const rateLimitSeconds = parseInt(e.target.value, 10);
            const valueElement = document.getElementById('rateLimitValue');
            if (valueElement) valueElement.textContent = rateLimitSeconds;
            this.visualizer.mqttManager?.publishRateLimitCommand(rateLimitSeconds);
        }, '(Rate Limit)');

        // Add event listener for auto scale toggle
        const autoScaleCheckbox = document.getElementById('autoScaleToggle');
        if (autoScaleCheckbox) {
            autoScaleCheckbox.addEventListener('change', (e) => {
                const enabled = e.target.checked;
                this.visualizer.physics.autoScaleEnabled = enabled;
                this.visualizer.loggingManager?.logInfo(`Auto Scale ${enabled ? 'enabled' : 'disabled'}`);
            });
        }

        // Button controls with touch feedback
        this.setupButtonControls();

        // Handle window resize for responsive layout
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    /**
     * Set up button controls with touch feedback
     */
    setupButtonControls() {
        const buttons = [
            { id: 'clearNodes', action: () => this.visualizer.clearAllNodes() },
            { id: 'centerNodes', action: () => this.visualizer.centerNodes() },
            { id: 'resetStats', action: () => this.visualizer.statsManager?.resetStats() },
            { id: 'clearConsole', action: () => this.visualizer.loggingManager?.clearConsole() },
            { id: 'toggleConsole', action: () => this.visualizer.toggleConsole() },
            { id: 'toggleControls', action: () => this.visualizer.toggleControls() },
            { id: 'maximizeVisualization', action: () => this.visualizer.toggleMaximizeVisualization() }
        ];

        buttons.forEach(({ id, action }) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', action);
                
                // Add touch feedback for mobile
                if (this.visualizer.mobileManager?.isMobileDevice) {
                    button.addEventListener('touchstart', () => {
                        button.style.transform = 'scale(0.95)';
                    }, { passive: true });
                    
                    button.addEventListener('touchend', () => {
                        setTimeout(() => {
                            button.style.transform = '';
                        }, 100);
                    });
                }
                console.log(`✅ Button listener added: ${id}`);
            } else {
                console.warn(`⚠️ Button not found: ${id}`);
            }
        });
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Update mobile detection on resize
        const wasMobile = this.visualizer.mobileManager?.isMobileDevice;
        if (this.visualizer.mobileManager) {
            this.visualizer.mobileManager.isMobileDevice = this.visualizer.mobileManager.detectMobileDevice();
            
            if (wasMobile !== this.visualizer.mobileManager.isMobileDevice) {
                this.visualizer.mobileManager.setupMobileOptimizations();
            }
        }
        
        // Re-center nodes after resize
        if (this.visualizer.nodes.size > 0) {
            setTimeout(() => this.visualizer.physicsManager?.centerNodes(), 100);
        }
    }

    /**
     * Toggle collapsible section
     */
    toggleSection(header) {
        const content = header.nextElementSibling;
        const toggle = header.querySelector('.collapse-toggle');
        const section = header.dataset.section;
        
        const isCollapsed = content.classList.contains('collapsed');
        
        if (isCollapsed) {
            content.classList.remove('collapsed');
            toggle.classList.remove('collapsed');
            toggle.textContent = '▼';
            this.visualizer.loggingManager?.logInfo(`📂 ${section.charAt(0).toUpperCase() + section.slice(1)} section expanded`);
        } else {
            content.classList.add('collapsed');
            toggle.classList.add('collapsed');
            toggle.textContent = '▶';
            this.visualizer.loggingManager?.logInfo(`📁 ${section.charAt(0).toUpperCase() + section.slice(1)} section collapsed`);
        }
    }

    /**
     * Update total timeout display
     */
    updateTotalTimeout() {
        const staleSeconds = this.visualizer.staleTimeoutMs / 1000;
        const removalSeconds = this.visualizer.removalTimeoutMs / 1000;
        const totalSeconds = staleSeconds + removalSeconds;
        const totalTimeoutElement = document.getElementById('totalTimeoutValue');
        if (totalTimeoutElement) {
            totalTimeoutElement.textContent = totalSeconds;
        }
    }

    /**
     * Toggle controls panel
     */
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
            this.visualizer.loggingManager?.logInfo('⚙️ Controls panel expanded');
        }
    }

    /**
     * Toggle visualization maximization
     */
    toggleMaximizeVisualization() {
        const container = document.querySelector('.container');
        const maximizeButton = document.getElementById('maximizeVisualization');
        
        this.visualizer.visualizationMaximized = !this.visualizer.visualizationMaximized;
        
        container.classList.toggle('visualization-maximized', this.visualizer.visualizationMaximized);
        
        if (this.visualizer.visualizationMaximized) {
            maximizeButton.textContent = '⛷'; // Minimize icon
            maximizeButton.title = 'Exit Full Screen';
            this.visualizer.loggingManager?.logInfo(
                '🔍 Visualisation maximised - full-screen mode for optimal node viewing'
            );
            
            // On mobile, provide haptic feedback if available
            if (this.visualizer.mobileManager?.isMobileDevice && navigator.vibrate) {
                navigator.vibrate(50);
            }
        } else {
            maximizeButton.textContent = '⛶'; // Maximize icon  
            maximizeButton.title = 'Maximise Visualisation';
            this.visualizer.loggingManager?.logInfo(
                '🔍 Visualisation restored to normal view'
            );
        }
        
        eventBus.emit('visualization-maximized', { 
            maximized: this.visualizer.visualizationMaximized 
        });
        
        // Re-center nodes after layout change
        setTimeout(() => {
            if (this.visualizer.nodes.size > 0) {
                this.visualizer.physicsManager?.centerNodes();
            }
        }, 100);
    }

    /**
     * Get UI statistics
     */
    getStats() {
        return {
            controlsVisible: this.controlsVisible,
            debugMode: this.debugMode,
            showBoundingBox: this.showBoundingBox,
            visualizationMaximized: this.visualizer.visualizationMaximized
        };
    }
}

window.VisualizerUIManager = VisualizerUIManager;