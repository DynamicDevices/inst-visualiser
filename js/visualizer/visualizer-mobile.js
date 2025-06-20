/**
 * Visualizer Mobile Management
 * Handles mobile device optimizations and responsive behavior
 */

class VisualizerMobileManager {
    constructor(visualizer) {
        this.visualizer = visualizer;
        this.isMobileDevice = this.detectMobileDevice();
        this.isLandscape = window.innerWidth > window.innerHeight;
    }

    /**
     * Initialize mobile manager
     */
    initialize() {
        this.setupMobileOptimizations();
        console.log(`📱 Mobile Manager initialized - Device: ${this.isMobileDevice ? 'Mobile' : 'Desktop'}`);
    }

    /**
     * Detect if device is mobile
     */
    detectMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth <= 768;
    }

    /**
     * Set up mobile-specific optimizations
     */
    setupMobileOptimizations() {
        if (this.isMobileDevice) {
            // Prevent zoom on input focus
            document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
            
            // Handle orientation changes
            window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
            
            // Optimize viewport for mobile
            this.optimizeMobileViewport();
            
            // Auto-collapse certain sections on mobile
            this.optimizeMobileLayout();
            
            console.log('📱 Mobile optimizations applied');
        }
    }

    /**
     * Handle touch start events
     */
    handleTouchStart(event) {
        // Prevent accidental zoom on double-tap for control elements
        if (event.target.closest('.controls') || event.target.closest('.visualization-header')) {
            event.preventDefault();
        }
    }

    /**
     * Handle orientation changes
     */
    handleOrientationChange() {
        setTimeout(() => {
            this.isLandscape = window.innerWidth > window.innerHeight;
            this.optimizeMobileLayout();
            this.visualizer.physicsManager?.centerNodes(); // Re-center nodes after orientation change
            
            this.visualizer.loggingManager?.logInfo(`📱 Orientation changed to ${this.isLandscape ? 'landscape' : 'portrait'}`);
        }, 100);
    }

    /**
     * Optimize mobile viewport
     */
    optimizeMobileViewport() {
        // Ensure proper mobile viewport scaling
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover');
        }
    }

    /**
     * Optimize mobile layout
     */
    optimizeMobileLayout() {
        if (this.isMobileDevice) {
            // Auto-collapse advanced sections on mobile to save space
            const advancedSections = ['physics', 'advanced', 'display'];
            advancedSections.forEach(section => {
                const header = document.querySelector(`[data-section="${section}"]`);
                if (header) {
                    const content = header.nextElementSibling;
                    const toggle = header.querySelector('.collapse-toggle');
                    if (content && !content.classList.contains('collapsed')) {
                        content.classList.add('collapsed');
                        if (toggle) {
                            toggle.classList.add('collapsed');
                            toggle.textContent = '▶';
                        }
                    }
                }
            });
        }
    }

    /**
     * Auto-collapse controls on very small screens
     */
    autoCollapseMobileControls() {
        // On very small screens, start with controls collapsed
        if (window.innerWidth <= 480) {
            setTimeout(() => {
                this.visualizer.uiManager?.toggleControls();
            }, 500);
        }
    }

    /**
     * Add mobile-specific touch feedback to element
     */
    addTouchFeedback(element, scaleValue = 0.95) {
        if (!this.isMobileDevice) return;
        
        element.addEventListener('touchstart', () => {
            element.style.transform = `scale(${scaleValue})`;
        }, { passive: true });
        
        element.addEventListener('touchend', () => {
            setTimeout(() => {
                element.style.transform = '';
            }, 100);
        });
    }

    /**
     * Optimize node elements for mobile
     */
    optimizeNodeForMobile(nodeElement) {
        if (!this.isMobileDevice) return;
        
        // Add touch handling for mobile devices
        nodeElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            nodeElement.style.transform = 'scale(1.1)';
        }, { passive: false });
        
        nodeElement.addEventListener('touchend', () => {
            nodeElement.style.transform = '';
        });
    }

    /**
     * Handle mobile-specific gestures
     */
    setupMobileGestures() {
        if (!this.isMobileDevice) return;
        
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.visualizer.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        this.visualizer.canvas.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            // Detect swipe gestures
            if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
                // Handle swipe gestures here if needed
                console.log('📱 Swipe detected:', { deltaX, deltaY });
            }
        }, { passive: true });
    }

    /**
     * Provide haptic feedback if available
     */
    hapticFeedback(pattern = 50) {
        if (this.isMobileDevice && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }

    /**
     * Check if device is in landscape mode
     */
    isLandscapeMode() {
        return this.isLandscape;
    }

    /**
     * Get mobile-specific CSS classes
     */
    getMobileClasses() {
        const classes = [];
        
        if (this.isMobileDevice) {
            classes.push('mobile-device');
        }
        
        if (this.isLandscape) {
            classes.push('landscape');
        } else {
            classes.push('portrait');
        }
        
        return classes;
    }

    /**
     * Apply mobile-specific styling
     */
    applyMobileStyling() {
        const body = document.body;
        const classes = this.getMobileClasses();
        
        // Remove existing mobile classes
        body.classList.remove('mobile-device', 'landscape', 'portrait');
        
        // Add current mobile classes
        classes.forEach(className => {
            body.classList.add(className);
        });
    }

    /**
     * Get mobile statistics
     */
    getStats() {
        return {
            isMobileDevice: this.isMobileDevice,
            isLandscape: this.isLandscape,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            userAgent: navigator.userAgent,
            hasVibration: !!navigator.vibrate,
            touchSupport: 'ontouchstart' in window
        };
    }
}

window.VisualizerMobileManager = VisualizerMobileManager;