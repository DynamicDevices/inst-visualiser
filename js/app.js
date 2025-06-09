/**
 * UWB Position Visualiser - Responsive Application Initialisation
 * Part of the INST Project - Instantly Networked Smart Triage
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
 * Main application entry point and global setup
 * Enhanced for tablets with touch-optimised controls and responsive design
 * Optimised for professional positioning applications and system monitoring
 */

// Global visualiser instance
let visualizer;

/**
 * Initialise the UWB Position Visualiser when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initialising UWB Position Visualiser v3.4 - Professional Positioning...');
    console.log('📍 INST Project: Instantly Networked Smart Triage - Professional Positioning System');
    console.log('💫 Funded by ESA & UKSA through BASS Programme for positioning technology');
    console.log('🎯 Mission: Precise real-time positioning through advanced UWB technology');
    
    visualizer = new UWBVisualizer();
    
    // Provide global debug function for development
    window.debugVisualizer = function() {
        console.log('=== UWB Position Visualiser v3.4 Debug Info ===');
        console.log('Visualiser object:', visualizer);
        console.log('Mobile device detected:', visualizer ? visualizer.isMobileDevice : 'No visualiser');
        console.log('Landscape mode:', visualizer ? visualizer.isLandscape : 'No visualiser');
        console.log('Physics enabled:', visualizer ? visualizer.physicsEnabled : 'No visualiser');
        console.log('Simulation running:', visualizer ? visualizer.simulationRunning : 'No visualiser');
        console.log('Display maximised:', visualizer ? visualizer.visualizationMaximized : 'No visualiser');
        console.log('Spring constant (optimised):', visualizer ? visualizer.physics.springConstant : 'No physics');
        console.log('Damping (minimal):', visualizer ? visualizer.physics.damping : 'No physics');
        console.log('Mass (lightweight):', visualizer ? visualizer.physics.mass : 'No physics');
        console.log('System optimisations:', 'Touch-friendly controls, node prioritised layout, responsive design');
        console.log('Nodes tracked:', visualizer ? visualizer.nodes : 'No visualiser');
        console.log('Position measurements:', visualizer ? visualizer.connections : 'No visualiser');
        console.log('MQTT network status:', visualizer ? (visualizer.mqttConnected ? 'Connected' : 'Disconnected') : 'Unknown');
        console.log('=== Debug Complete ===');
    };
    
    // Add system-specific utilities for operations
    window.systemUtils = {
        isTabletDevice: () => visualizer?.isMobileDevice || false,
        isLandscapeMode: () => visualizer?.isLandscape || false,
        maximiseDisplay: () => visualizer?.toggleMaximizeVisualization(),
        centreNodes: () => visualizer?.centerNodes(),
        toggleControls: () => visualizer?.toggleControls(),
        clearAllData: () => visualizer?.clearAllNodes(),
        resetPhysics: () => visualizer?.resetPhysics(),
        connectMQTT: () => visualizer?.connectMQTT(),
        disconnectMQTT: () => visualizer?.disconnectMQTT(),
        getSystemStats: () => ({
            nodes: visualizer?.nodes.size || 0,
            connections: visualizer?.connections.size || 0,
            updates: visualizer?.messageCount || 0,
            lastUpdate: visualizer?.lastUpdateTime || null,
            mqttConnected: visualizer?.mqttConnected || false,
            version: visualizer?.version || 'Unknown'
        }),
        getSystemStatus: () => ({
            mode: 'professional_positioning',
            project: 'INST - Instantly Networked Smart Triage',
            mission: 'Real-time positioning and tracking',
            funding: 'ESA & UKSA BASS Programme',
            networkStatus: visualizer?.mqttConnected ? 'MQTT Connected' : 'MQTT Disconnected',
            physicsMode: 'High-Performance Positioning',
            deviceType: visualizer?.isMobileDevice ? 'Tablet Device' : 'Desktop System',
            readyForOperation: visualizer?.physicsEnabled && !visualizer?.simulationRunning
        })
    };
    
    console.log('UWB Position Visualiser v3.4 ready for operation!');
    console.log('📍 Features: Node tracking, MQTT network integration, positioning displays');
    console.log('📱 Responsive design: Touch-friendly controls and prioritised node display');
    console.log('⚡ Advanced Physics: 100x speed optimisation for responsive positioning');
    console.log('🛰️ MQTT Integration: Network-enabled positioning system ready');
    console.log('💡 Commands: systemUtils.maximiseDisplay() for full-screen display');
    console.log('🎯 Use systemUtils.getSystemStatus() for system status');
    console.log('');
    console.log('📍 INST Mission: "Precision positioning made simple"');
});