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
 * Added integrated UWB simulation support for testing and demonstration
 */

// Global crisis visualiser instance
let visualizer;
let uwbSimulator;

/**
 * Initialise the UWB Position Visualiser for Crisis Response when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initialising UWB Position Visualiser v3.7 - INST Crisis Response...');
    console.log('🚨 INST Project: Instantly Networked Smart Triage - Crisis Response System');
    console.log('💫 Funded by ESA & UKSA through BASS Programme for crisis response');
    console.log('🎯 Mission: Save lives in Mass Casualty Incidents through real-time casualty tracking');
    console.log('🏗️ v3.7: Integrated UWB simulation for testing and demonstration');
    console.log('🎭 New Feature: Built-in data simulation with realistic movement patterns');
    
    visualizer = new UWBVisualizer();
    
    // Initialise the UWB simulator after the visualiser is ready
    if (visualizer && visualizer.mqttManager) {
        uwbSimulator = new UWBSimulator(visualizer.mqttManager);
        console.log('🎭 UWB Simulator initialised');
        
        // Set up simulation event handlers
        setupSimulationControls();
    } else {
        console.error('❌ Failed to initialise UWB Simulator - MQTT Manager not available');
    }
    
    // Provide global debug function for emergency operations development
    window.debugVisualizer = function() {
        console.log('=== UWB Position Visualiser v3.7 Emergency Debug Info ===');
        console.log('Emergency visualiser object:', visualizer);
        console.log('MQTT manager:', visualizer.mqttManager);
        console.log('UWB simulator:', uwbSimulator);
        console.log('Emergency tablet detected:', visualizer ? visualizer.isMobileDevice : 'No visualiser');
        console.log('Emergency landscape mode:', visualizer ? visualizer.isLandscape : 'No visualiser');
        console.log('Emergency physics enabled:', visualizer ? visualizer.physicsEnabled : 'No visualiser');
        console.log('Emergency simulation running:', uwbSimulator ? uwbSimulator.isRunning() : 'No simulator');
        console.log('Tactical display maximised:', visualizer ? visualizer.visualizationMaximized : 'No visualiser');
        console.log('Emergency spring constant (ultra-fast):', visualizer ? visualizer.physics.springConstant : 'No physics');
        console.log('Emergency damping (minimal):', visualizer ? visualizer.physics.damping : 'No physics');
        console.log('Emergency mass (ultra-light):', visualizer ? visualizer.physics.mass : 'No physics');
        console.log('Emergency optimisations:', 'Touch-friendly controls, casualty prioritised layout, emergency-responsive design');
        console.log('Casualties tracked:', visualizer ? visualizer.nodes : 'No visualiser');
        console.log('Position measurements:', visualizer ? visualizer.connections : 'No visualiser');
        console.log('INST emergency network status:', visualizer ? (visualizer.mqttManager.isConnected() ? 'Connected' : 'Disconnected') : 'Unknown');
        console.log('Simulation statistics:', uwbSimulator ? uwbSimulator.getStats() : 'No simulator');
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
        
        // Simulation controls
        startSimulation: () => uwbSimulator?.start(),
        stopSimulation: () => uwbSimulator?.stop(),
        resetSimulation: () => uwbSimulator?.reset(),
        setSimulationRate: (rateHz) => uwbSimulator?.setPublishRate(rateHz),
        getSimulationStats: () => uwbSimulator?.getStats() || {},
        isSimulationRunning: () => uwbSimulator?.isRunning() || false,
        
        getCasualtyStats: () => ({
            casualties: visualizer?.nodes.size || 0,
            positions: visualizer?.connections.size || 0,
            updates: visualizer?.messageCount || 0,
            lastUpdate: visualizer?.lastUpdateTime || null,
            instConnected: visualizer?.mqttManager.isConnected() || false,
            simulationRunning: uwbSimulator?.isRunning() || false,
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
            readyForCrisis: visualizer?.physicsEnabled && !uwbSimulator?.isRunning(),
            architecture: 'Modular MQTT v3.7',
            simulationCapable: !!uwbSimulator,
            simulationActive: uwbSimulator?.isRunning() || false
        })
    };
    
    console.log('UWB Position Visualiser v3.7 ready for crisis operations!');
    console.log('🚨 Crisis features: Casualty tracking, INST network integration, tactical displays');
    console.log('📱 Mobile optimised: Touch-friendly crisis controls and prioritised casualty display');
    console.log('⚡ Ultra-Fast Physics: 100x speed optimisation for instant crisis positioning');
    console.log('🛰️ INST Integration: Satellite-enabled crisis response system ready');
    console.log('🏗️ Modular Architecture: Separated MQTT management for better maintainability');
    console.log('🎭 Simulation Ready: Built-in UWB data simulation with realistic movement patterns');
    console.log('💡 Crisis commands: crisisUtils.maximiseCasualtyView() for tactical display');
    console.log('🎯 Use crisisUtils.getCrisisStatus() for crisis system status');
    console.log('🎪 Simulation commands: crisisUtils.startSimulation() / .stopSimulation()');
    console.log('');
    console.log('🚨 INST Mission: "Every second counts. Every life matters. Every position is precisely known."');
});

/**
 * Set up event handlers for simulation controls
 */
function setupSimulationControls() {
    // Simulation rate slider
    const simulationRateSlider = document.getElementById('simulationRateSlider');
    const simulationRateValue = document.getElementById('simulationRateValue');
    
    if (simulationRateSlider && simulationRateValue) {
        simulationRateSlider.addEventListener('input', (e) => {
            const rate = parseFloat(e.target.value);
            simulationRateValue.textContent = rate.toFixed(1);
            
            if (uwbSimulator) {
                uwbSimulator.setPublishRate(rate);
            }
        });
        
        // Set initial value
        simulationRateValue.textContent = simulationRateSlider.value;
    }
    
    // Start simulation button
    const startSimBtn = document.getElementById('startSimulation');
    if (startSimBtn) {
        startSimBtn.addEventListener('click', () => {
            if (!uwbSimulator) {
                console.error('❌ UWB Simulator not available');
                return;
            }
            
            if (!visualizer?.mqttManager.isConnected()) {
                alert('Please connect to MQTT broker first before starting simulation');
                return;
            }
            
            try {
                uwbSimulator.start();
                updateSimulationStatus();
                updateStatusIndicator();
            } catch (error) {
                console.error('❌ Failed to start simulation:', error);
                alert('Failed to start simulation. Check console for details.');
            }
        });
    }
    
    // Stop simulation button
    const stopSimBtn = document.getElementById('stopSimulation');
    if (stopSimBtn) {
        stopSimBtn.addEventListener('click', () => {
            if (uwbSimulator) {
                uwbSimulator.stop();
                updateSimulationStatus();
                updateStatusIndicator();
            }
        });
    }
    
    console.log('🎭 Simulation controls set up successfully');
}

/**
 * Update simulation status display
 */
function updateSimulationStatus() {
    const statusElement = document.getElementById('simulationStatus');
    if (!statusElement || !uwbSimulator) return;
    
    const stats = uwbSimulator.getStats();
    
    if (stats.running) {
        statusElement.textContent = `🎭 Active: ${stats.messagesPublished} msgs, ${stats.averageRate.toFixed(2)} msg/s`;
        statusElement.classList.add('active');
    } else {
        statusElement.textContent = '🎭 Simulation: Ready';
        statusElement.classList.remove('active');
    }
}

/**
 * Update status indicator to show simulation state
 */
function updateStatusIndicator() {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    
    if (!statusIndicator || !statusText) return;
    
    // Clear existing classes
    statusIndicator.classList.remove('connected', 'simulating');
    
    if (uwbSimulator?.isRunning()) {
        statusIndicator.classList.add('simulating');
        statusText.textContent = 'Simulating';
    } else if (visualizer?.mqttManager.isConnected()) {
        statusIndicator.classList.add('connected');
        statusText.textContent = 'Connected';
    } else {
        statusText.textContent = 'Disconnected';
    }
}

// Set up periodic status updates
setInterval(() => {
    if (uwbSimulator?.isRunning()) {
        updateSimulationStatus();
    }
}, 2000); // Update every 2 seconds when simulation is running