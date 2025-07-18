/**
 * UWB Position Visualiser - View Management
 * Handles switching between physics and map views
 */

class AppViewManager {
    constructor(appCore) {
        this.appCore = appCore;
        this.currentView = 'physics'; // 'physics' or 'map'
    }

    /**
     * Initialize view manager
     */
    initialize() {
        this.setupViewToggle();
        console.log('🔄 View Manager initialized');
    }

    /**
     * Set up single view toggle button
     */
    setupViewToggle() {
        const viewToggleBtn = document.getElementById('viewToggle');
        if (viewToggleBtn) {
            viewToggleBtn.addEventListener('click', () => this.toggleView());
        }
    }

    /**
     * Toggle between physics and map view
     */
    toggleView() {
        const viewToggleBtn = document.getElementById('viewToggle');
        if (this.currentView === 'physics') {
            this.switchToMapView();
        } else {
            this.switchToPhysicsView();
        }

        // Update button state
        if (viewToggleBtn) {
            if (this.currentView === 'map') {
                viewToggleBtn.textContent = '🔬 Physics View';
                viewToggleBtn.setAttribute('data-view', 'map');
                viewToggleBtn.classList.add('map-active');
            } else {
                viewToggleBtn.textContent = '🗺️ Map View';
                viewToggleBtn.setAttribute('data-view', 'physics');
                viewToggleBtn.classList.remove('map-active');
            }
        }

        // eslint-disable-next-line no-undef
        eventBus.emit('view-switched', { view: this.currentView });
    }

    /**
     * Switch to map view
     */
    switchToMapView() {
        this.currentView = 'map';

        // Show map, hide physics
        const canvas = document.getElementById('canvas');
        if (canvas) {
            canvas.style.display = 'none';
        }

        // Show map view
        this.appCore.gpsManager?.showMapView();
        console.log('🗺️ Switched to map view');
    }

    /**
     * Switch to physics view
     */
    switchToPhysicsView() {
        this.currentView = 'physics';
        // Show physics, hide map
        const canvas = document.getElementById('canvas');
        if (canvas) {
            canvas.style.display = 'block';
        }
        // Hide map view
        this.appCore.gpsManager?.hideMapView();
        console.log('🔬 Switched to physics view');
    }

    /**
     * Get current view
     */
    getCurrentView() {
        return this.currentView;
    }

    /**
     * Check if in physics view
     */
    isPhysicsView() {
        return this.currentView === 'physics';
    }

    /**
     * Check if in map view
     */
    isMapView() {
        return this.currentView === 'map';
    }

    /**
     * Get view statistics
     */
    getStats() {
        return {
            currentView: this.currentView,
            isPhysicsView: this.isPhysicsView(),
            isMapView: this.isMapView()
        };
    }
}

window.AppViewManager = AppViewManager;
