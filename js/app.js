/**
 * UWB Position Visualiser - Mobile-Optimised Application Initialisation
 * Copyright (C) Dynamic Devices Ltd 2025
 * 
 * Main application entry point and global setup
 * Enhanced for mobile devices with touch-optimised controls and responsive design
 */

// Global visualiser instance
let visualizer;

/**
 * Initialise the UWB Position Visualiser when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initialising UWB Position Visualiser v3.2 - Mobile Optimised...');
    visualizer = new UWBVisualizer();
    
    // Provide global debug function for development
    window.debugVisualizer = function() {
        console.log('=== UWB Position Visualiser v3.2 Debug Info ===');
        console.log('Visualiser object:', visualizer);
        console.log('Mobile device detected:', visualizer ? visualizer.isMobileDevice : 'No visualiser');
        console.log('Landscape orientation:', visualizer ? visualizer.isLandscape : 'No visualiser');
        console.log('Physics enabled:', visualizer ? visualizer.physicsEnabled : 'No visualiser');
        console.log('Simulation running:', visualizer ? visualizer.simulationRunning : 'No visualiser');
        console.log('Visualisation maximised:', visualizer ? visualizer.visualizationMaximized : 'No visualiser');
        console.log('Spring constant (ultra-fast):', visualizer ? visualizer.physics.springConstant : 'No physics');
        console.log('Damping (minimal):', visualizer ? visualizer.physics.damping : 'No physics');
        console.log('Mass (ultra-light):', visualizer ? visualizer.physics.mass : 'No physics');
        console.log('Mobile optimisations:', 'Touch-friendly controls, responsive layout, prioritised visualisation');
        console.log('Nodes:', visualizer ? visualizer.nodes : 'No visualiser');
        console.log('Connections:', visualizer ? visualizer.connections : 'No visualiser');
        console.log('=== Debug complete ===');
    };
    
    // Add mobile-specific utilities
    window.mobileUtils = {
        isMobile: () => visualizer?.isMobileDevice || false,
        isLandscape: () => visualizer?.isLandscape || false,
        maximiseVisualization: () => visualizer?.toggleMaximizeVisualization(),
        centerNodes: () => visualizer?.centerNodes(),
        toggleControls: () => visualizer?.toggleControls(),
        getStats: () => ({
            nodes: visualizer?.nodes.size || 0,
            connections: visualizer?.connections.size || 0,
            messages: visualizer?.messageCount || 0,
            version: visualizer?.version || 'Unknown'
        })
    };
    
    console.log('UWB Position Visualiser v3.2 ready! Mobile-optimised with touch-friendly controls and prioritised node display.');
    console.log('💡 Mobile features: Compact controls, maximise mode, touch gestures, responsive layout');
    console.log('⚡ Ultra-Fast Physics: 100x speed optimization for instant positioning');
    console.log('📱 Use mobileUtils.maximiseVisualization() for full-screen viewing');
});