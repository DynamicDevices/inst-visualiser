/**
 * UWB Position Visualiser - Mobile-Optimised Emergency Application Initialisation
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
 * Main emergency application entry point and global setup
 * Enhanced for emergency response tablets with touch-optimised controls and responsive design
 * Optimised for Mass Casualty Incident coordination and emergency response operations
 */

// Global crisis visualiser instance
let visualizer;

/**
 * Initialise the UWB Position Visualiser for Crisis Response when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initialising UWB Position Visualiser v3.5 - INST Crisis Response...');
    console.log('🚨 INST Project: Instantly Networked Smart Triage - Crisis Response System');
    console.log('💫 Funded by ESA & UKSA through BASS Programme for crisis response');
    console.log('🎯 Mission: Save lives in Mass Casualty Incidents through real-time casualty tracking');
    console.log('🏗️ v3.5: Modular architecture with separated MQTT management');
    
    visualizer = new UWBVisualizer();
    
    // Provide global debug function for emergency operations development
    window.debugVisualizer = function() {
        console.log('=== UWB Position Visualiser v3.5 Emergency Debug Info ===');
        console.log('Emergency visualiser object:', visualizer);
        console.log('MQTT manager:', visualizer.mqttManager);
        console.log('Emergency tablet detected:', visualizer ? visualizer.isMobileDevice : 'No visualiser');
        console.log('Emergency landscape mode:', visualizer ? visualizer.isLandscape : 'No visualiser');
        console.log('Emergency physics enabled:', visualizer ? visualizer.physicsEnabled : 'No visualiser');
        console.log('Emergency simulation running:', visualizer ? visualizer.simulationRunning : 'No visualiser');
        console.log('Tactical display maximised:', visualizer ? visualizer.visualizationMaximized : 'No visualiser');
        console.log('Emergency spring constant (ultra-fast):', visualizer ? visualizer.physics.springConstant : 'No physics');
        console.log('Emergency damping (minimal):', visualizer ? visualizer.physics.damping : 'No physics');
        console.log('Emergency mass (ultra-light):', visualizer ? visualizer.physics.mass : 'No physics');
        console.log('Emergency optimisations:', 'Touch-friendly controls, casualty prioritised layout, emergency-responsive design');
        console.log('Casualties tracked:', visualizer ? visualizer.nodes : 'No visualiser');
        console.log('Position measurements:', visualizer ? visualizer.connections : 'No visualiser');
        console.log('INST emergency network status:', visualizer ? (visualizer.mqttManager.isConnected() ? 'Connected' : 'Disconnected') : 'Unknown');
        console.log('=== Emergency Debug Complete ===');
    };
    
    // Add crisis-specific utilities for field operations
    window.crisisUtils = {
        isFieldTablet: () => visualizer?.isMobileDevice || false,
        isFieldLandscape: () => visualizer?.isLandscape || false,
        maximiseCasualtyView: () => visualizer?.toggleMaximizeVisualization(),
        centreCasualties: () => visualizer?.centerNodes(),
        toggleCrisisControls: () => visualizer?.toggleControls(),
        clearIncident: () => visualizer?.clearAllNodes(),
        resetCrisisPhysics: () => visualizer?.resetPhysics(),
        connectToINST: () => visualizer?.mqttManager.connect(),
        disconnectFromINST: () => visualizer?.mqttManager.disconnect(),
        getCasualtyStats: () => ({
            casualties: visualizer?.nodes.size || 0,
            positions: visualizer?.connections.size || 0,
            updates: visualizer?.messageCount || 0,
            lastUpdate: visualizer?.lastUpdateTime || null,
            instConnected: visualizer?.mqttManager.isConnected() || false,
            crisisVersion: visualizer?.version || 'Unknown'
        }),
        getCrisisStatus: () => ({
            mode: 'crisis_response',
            project: 'INST - Instantly Networked Smart Triage',
            mission: 'Mass Casualty Incident Response',
            funding: 'ESA & UKSA BASS Programme',
            networkStatus: visualizer?.mqttManager.isConnected() ? 'INST Connected' : 'INST Disconnected',
            physicsMode: 'Ultra-Fast Crisis Positioning',
            deviceType: visualizer?.isMobileDevice ? 'Field Tablet' : 'Command Centre',
            readyForCrisis: visualizer?.physicsEnabled && !visualizer?.simulationRunning,
            architecture: 'Modular MQTT v3.5'
        })
    };
    
    console.log('UWB Position Visualiser v3.5 ready for crisis operations!');
    console.log('🚨 Crisis features: Casualty tracking, INST network integration, tactical displays');
    console.log('📱 Mobile optimised: Touch-friendly crisis controls and prioritised casualty display');
    console.log('⚡ Ultra-Fast Physics: 100x speed optimisation for instant crisis positioning');
    console.log('🛰️ INST Integration: Satellite-enabled crisis response system ready');
    console.log('🏗️ Modular Architecture: Separated MQTT management for better maintainability');
    console.log('💡 Crisis commands: crisisUtils.maximiseCasualtyView() for tactical display');
    console.log('🎯 Use crisisUtils.getCrisisStatus() for crisis system status');
    console.log('');
    console.log('🚨 INST Mission: "Every second counts. Every life matters. Every position is precisely known."');
});