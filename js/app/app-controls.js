/**
 * UWB Position Visualiser - Controls Management
 * Handles UI control setup and additional event handling
 */

class AppControlsManager {
    constructor(appCore) {
        this.appCore = appCore;
    }

    /**
     * Initialize controls manager
     */
    initialize() {
        this.setupAdditionalControls();
        console.log('🎛️ Controls Manager initialized');
    }

    /**
     * Set up additional UI controls not handled by other managers
     */
    setupAdditionalControls() {
        // Any additional control setup can go here
        // Most controls are handled by the visualizer UI manager
        // This is for app-level controls that don't fit elsewhere
        this.setupKeyboardShortcuts();
        this.setupWindowEvents();
    }

    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            switch (e.key.toLowerCase()) {
                case 'v':
                    // V key to toggle view
                    if (this.appCore.viewManager) {
                        this.appCore.viewManager.toggleView();
                    }
                    break;
                case 'c':
                    // C key to center nodes
                    if (this.appCore.visualizer) {
                        this.appCore.visualizer.centerNodes();
                    }
                    break;
                case 's':
                    // S key to toggle simulation
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        if (this.appCore.simulationManager) {
                            if (this.appCore.simulationManager.isRunning()) {
                                this.appCore.simulationManager.stopSimulation();
                            } else {
                                this.appCore.simulationManager.startSimulation();
                            }
                        }
                    }
                    break;
                case 'm':
                    // M key to maximize visualization
                    if (this.appCore.visualizer) {
                        this.appCore.visualizer.toggleMaximizeVisualization();
                    }
                    break;
            }
        });
    }

    /**
     * Set up window-level events
     */
    setupWindowEvents() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Page is hidden - could pause simulation or reduce updates
                console.log('📱 Page hidden - reducing activity');
            } else {
                // Page is visible - resume normal operation
                console.log('📱 Page visible - resuming normal activity');
            }
        });

        // Handle before unload
        window.addEventListener('beforeunload', (e) => {
            if (this.appCore.simulationManager?.isRunning()) {
                e.preventDefault();
                e.returnValue = 'Simulation is running. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    }

    /**
     * Get controls statistics
     */
    getStats() {
        return {
            keyboardShortcutsEnabled: true,
            windowEventsSetup: true
        };
    }
}

window.AppControlsManager = AppControlsManager;
