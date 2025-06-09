/**
 * UWB Position Visualiser - Application Initialisation
 * Copyright (C) Dynamic Devices Ltd 2025
 * 
 * Main application entry point and global setup
 * Handles DOM ready events and provides debug functionality
 */

// Global visualiser instance
let visualizer;

/**
 * Initialise the UWB Position Visualiser when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initialising UWB Position Visualiser v3.1...');
    visualizer = new UWBVisualizer();
    
    // Provide global debug function for development
    window.debugVisualizer = function() {
        console.log('=== UWB Position Visualiser v3.1 Debug Info ===');
        console.log('Visualiser object:', visualizer);
        console.log('Physics enabled:', visualizer ? visualizer.physicsEnabled : 'No visualiser');
        console.log('Simulation running:', visualizer ? visualizer.simulationRunning : 'No visualiser');
        console.log('Spring constant (ultra-fast):', visualizer ? visualizer.physics.springConstant : 'No physics');
        console.log('Damping (minimal):', visualizer ? visualizer.physics.damping : 'No physics');
        console.log('Mass (ultra-light):', visualizer ? visualizer.physics.mass : 'No physics');
        console.log('Mobile optimisations:', 'Ultra-compact controls pane for mobile devices');
        console.log('Nodes:', visualizer ? visualizer.nodes : 'No visualiser');
        console.log('=== Debug complete ===');
    };
    
    console.log('UWB Position Visualiser v3.1 ready! Mobile optimised ULTRA FAST physics-based positioning enabled (100x speed).');
});