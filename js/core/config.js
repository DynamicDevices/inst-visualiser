/**
 * Application Configuration
 * Centralized configuration for the UWB Position Visualiser
 */

const AppConfig = {
    // Map configuration
    map: {
        defaultPosition: { lat: 53.4084, lng: -2.9916 }, // Liverpool
        defaultZoom: 18,
        maxZoom: 20,
        updateInterval: 200, // ms
        movementThreshold: 0.00005,
        autoFitDebounce: 2000, // ms
        animationDuration: 1.5 // seconds
    },

    // Physics configuration
    physics: {
        springStrength: 2.0,
        damping: 0.6,
        mass: 0.2,
        updateInterval: 16 // ms (60fps)
    },

    // Simulation configuration
    simulation: {
        defaultInterval: 1, // seconds
        maxTags: 10,
        noiseStddev: 0.05, // 5cm
        defaultTagCount: 3
    },

    // UI configuration
    ui: {
        debounceTime: 2000,
        animationDuration: 1.5,
        nodeUpdateDelay: 100
    },

    // Node styling
    nodes: {
        gateway: {
            size: 60,
            fontSize: '12px',
            color: '#e74c3c',
            borderColor: '#c0392b',
            typeLabel: 'GW'
        },
        mobile: {
            size: 50,
            fontSize: '11px',
            color: '#3498db',
            borderColor: '#2980b9',
            typeLabel: 'T'
        },
        anchor: {
            size: 50,
            fontSize: '11px',
            color: '#27ae60',
            borderColor: '#229954',
            typeLabel: 'A'
        }
    }
};

// Export for use in other modules
window.AppConfig = AppConfig;