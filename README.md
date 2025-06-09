# UWB Position Visualiser v3.5

**Part of the INST Project - Instantly Networked Smart Triage**

A real-time visualisation tool for UWB (Ultra-Wideband) positioning data via MQTT featuring advanced spring-mass physics simulation, modular architecture, and touch-optimised UX design for positioning applications and system monitoring.

![UWB Position Visualiser Demo](resources/demo-pic.png)

**🚀 Try it now: [Live Demo](https://dynamicdevices.github.io/inst-visualiser/)**

## 🚨 About the INST Project

**INST (Instantly Networked Smart Triage)** is a positioning system designed for emergency response applications. Developed with funding from the **European Space Agency (ESA)** and **UK Space Agency (UKSA)** through the Business Applications and Space Solutions Programme (BASS), INST addresses positioning and coordination challenges in various operational environments.

### The Technology INST Provides

The 2017 Manchester Arena incident highlighted coordination challenges between emergency services. The public inquiry identified that **better real-time coordination between police, ambulance services, and fire departments would have improved response effectiveness**. INST was created to address these coordination needs.

### How INST Works

INST is a **satellite-enabled positioning system** that provides real-time situational awareness through:

- **Low-cost, lightweight devices** that can be quickly deployed for positioning
- **Satellite communication networks** enabling coverage even when terrestrial infrastructure fails
- **Real-time position tracking** showing exactly where each tracked item is located
- **Status indicators** helping operators prioritise response activities
- **Live monitoring** providing accurate operational scale assessment

> *"Precision positioning technology made simple."* - Joseph Spear, Director of Communications

## 🎯 UWB Positioning: The Foundation of Real-Time Tracking

### What is Ultra-Wideband (UWB)?

Ultra-Wideband technology forms the **precision positioning backbone** of the INST system. UWB provides:

- **Centimetre-level accuracy** for indoor and outdoor positioning
- **Low power consumption** essential for extended device operation
- **Penetration through obstacles** maintaining signal in challenging environments
- **Minimal interference** with other communication systems
- **Real-time performance** with microsecond timing precision

### UWB in Applications

In positioning applications, **knowing exactly where each element is located provides significant operational advantages**. The UWB positioning system enables:

#### 🏥 **Monitoring**
- **Spatial mapping** - visualise distribution of tracked elements across operational zones
- **Priority routing** - direct personnel to most important locations first
- **Resource allocation** - deploy teams based on real positioning data

#### 🚑 **Coordinated Operations** 
- **Unified situational picture** - all teams see the same real-time data
- **Avoid duplication** - prevent multiple teams responding to same location
- **Coverage gaps** - identify areas that may have been missed

#### 📍 **Precision in Complex Environments**
- **GPS-denied environments** - works inside buildings, underground locations
- **Obstacle navigation** - track positions even when landmarks are obscured
- **24/7 operations** - position tracking independent of visibility conditions

## 📱 Touch-First Interface (v3.5)

The visualiser is optimised for operations with a **touch-friendly, field-ready interface** and **modular architecture**:

🎯 **Operations UX:**
- **Compact Controls**: Greatly reduced control panel size, prioritising positioning display  
- **Critical Information Priority**: Position and status data prominently displayed
- **Touch-Friendly Operations**: Larger tap targets, gesture support
- **Prioritised Visualisation**: Node positions take 80%+ of screen space
- **Rapid Assessment Sections**: Quick-access essential controls
- **Field-Ready Display**: High contrast, readable in various lighting conditions
- **Command Centre Mode**: Full-screen tactical display for operational command

📱 **Response Features:**
- **Maximise Mode**: Full-screen positioning tracking for optimal situation awareness (⛶ button)
- **Auto-Collapse**: Non-essential settings collapse automatically to save space
- **System Branding**: Clear visual identity for operational use
- **Touch Gestures**: Pinch, zoom, and tap interactions for rapid field use
- **Orientation Support**: Adapts layout for portrait and landscape tablets
- **Battery Optimisation**: Efficient rendering for extended field operations

⚡ **High-Performance Physics System (v3.1+):**
- **Spring Constant**: 2.0 (100x stronger) for lightning-fast positioning response  
- **Minimal Damping**: 0.6 (allows maximum sustained motion for dynamic situations)
- **Ultra-Light Mass**: 0.2 (near-instant response to changing positions)
- **Extreme Forces**: All boundary, repulsion, and centring forces increased 100x
- **Result**: Nodes position ~100x faster for real-time situational awareness

🏗️ **Modular Architecture (v3.5):**
- **Separated MQTT Management**: Dedicated MQTTManager class for better code organisation
- **Improved Maintainability**: Clear separation of concerns between visualisation and networking
- **Enhanced Debugging**: Easier to trace MQTT-specific issues
- **Better Code Quality**: Individual components can be developed and maintained independently
- **Code Reusability**: MQTT functionality can be reused in other projects

## 🚑 Getting Started

### **Quick Demo (Touch & Desktop)**
1. Visit the [live demo](https://dynamicdevices.github.io/inst-visualiser/)
2. **On Tablet**: Tap "Connect" to see the field-optimised interface
3. **Desktop Command Centre**: Click to see advanced physics positioning
4. **Tactical Display**: Use the ⛶ button for full-screen positioning view
5. **System Assessment**: Tap section headers to access detailed operational controls

### **Operations Workflow**
1. **Connect to Network**: Tap "📡 MQTT Connection" → Configure for operational systems → "Connect"
2. **Monitor Positions**: Tracked items appear with status indicators
3. **Tactical View**: Tap ⛶ for full-screen situational awareness optimised for operational command
4. **Rapid Response**: Access essential functions via "⚡ Quick Actions" section
5. **Live Operations**: Real-time statistics show tracking count, coverage, and system health

## 🚨 Operations Control Panel

### **📊 Live System Statistics** (Always Visible)
- **Nodes**: Active positioning devices
- **Connections**: Position measurements between devices
- **Updates**: Total position updates received from field
- **Coverage Area**: Physical operational zone dimensions in metres
- **Last Update**: Timestamp of latest position data

### **📡 Network Connection** (Touch-Optimised)
- **System Broker**: Pre-configured network (touch-friendly input)
- **Network Port**: WebSocket port for system communications (typically 8083 for secure)
- **Position Data Topic**: MQTT topic for real-time positioning
- **Auto-collapse**: Panel auto-hides after successful connection to network

### **⚡ Quick Actions** (Priority Controls)
- **Centre Display**: Re-centre display for optimal operational overview
- **Clear All Data**: Remove all positioning data (system reset)
- **Reset Physics**: Zero all velocities for fresh positioning calculations
- **Show Distance Accuracy**: Toggle ✓/⚠/❌ symbols for distance accuracy indicators
- **Enable Physics Simulation**: Toggle high-performance positioning for dynamic situations

### **⚙️ Display Settings** (Collapsible)
- **Node Stale Timeout**: Mark devices as offline after N seconds without updates
- **Remove Timeout**: Remove offline devices after additional time
- **Distance Scale**: Adjust metres-to-pixels ratio for operational zone size (50-250px/m)

### **🔬 Physics Tuning** (System Optimised)
- **Spring Strength**: 0.5-10.0 (default: 2.0 for responsive positioning)
- **Damping Factor**: 0.3-0.9 (default: 0.6 for maximum motion tracking)
- **Node Mass**: 0.05-1.0 (default: 0.2 for responsive position updates)

### **🚨 Debug Tools** (Operational Command)
- **System Logging**: Detailed network connection messages
- **Coverage Boundaries**: Visual outline with operational zone dimensions

## 📊 Positioning Data Format

The visualiser expects JSON arrays containing positioning measurements:

```json
[
  ["NODE-001", "ANCHOR-A", 1.5],
  ["NODE-002", "ANCHOR-A", 2.1], 
  ["NODE-003", "ANCHOR-B", 2.8]
]
```

**Positioning Data Format Details:**
- **Array of arrays**: Each sub-array = one position measurement
- **Three elements**: `[device_id, anchor_id, distance_in_metres]`
- **String device IDs**: System device codes (e.g., "NODE-001", "ANCHOR-A")
- **Numeric distances**: Positive numbers in metres for precise positioning
- **Gateway detection**: Device "B5A4" automatically styled as system gateway (red)

## 📱 Touch Device Usage

### **Portrait Mode (Tablets)**
- Compact title bar preserves screen space for positioning display
- Controls panel limited to essential functions, positioning view gets majority of screen
- Use maximise button (⛶) for full-screen tactical situational awareness
- Swipe up in controls to access advanced system settings
- Essential statistics remain visible for rapid situation assessment

### **Landscape Mode (Command Centre Tablets)**
- Controls appear on left, positioning takes majority of screen
- Better for detailed operational management and coordination
- All system sections accessible without scrolling
- Ideal for operational command briefings and coordination

### **Touch Interactions**
- **Tap**: Activate essential controls and toggle important settings
- **Tap & Hold**: Important buttons provide haptic feedback for field use
- **Tap Section Headers**: Expand/collapse system control groups
- **Tap ⛶**: Toggle full-screen positioning tracking mode

### **Field Performance on Touch Devices**
- **System Optimisation**: Physics adjusts for tablet performance
- **Battery Efficient**: Reduced animation when on battery power for extended operations
- **Touch Responsiveness**: 60fps interactions maintained for essential operations
- **Memory Management**: Automatic cleanup optimised for long operational sessions

## 🛰️ System Architecture

```
Satellite Network ←→ Ground Station ←→ MQTT Broker ←→ UWB Visualiser
       ↑                                                    ↓
   INST Devices ←→ UWB Positioning Network ←→ Operational Teams
```

### Data Flow in Scenarios

1. **INST devices** track positions via UWB
2. **UWB anchor networks** triangulate precise positions  
3. **Satellite uplinks** relay data when terrestrial networks are unavailable
4. **MQTT message broker** (`mqtt.dynamicdevices.co.uk`) distributes real-time updates
5. **Visualisation interface** provides live tactical picture to operational commanders

### Modular Architecture (v3.5)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UWBVisualizer │◄──►│   MQTTManager   │◄──►│ SpringMassSystem │
│                 │    │                 │    │                 │
│ • Node Display  │    │ • Connection    │    │ • Physics Sim   │
│ • UI Controls   │    │ • Message Parse │    │ • Force Calc    │
│ • Touch Events  │    │ • Auto-retry    │    │ • Position Upd  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Benefits of Modular Design:**
- **Maintainability**: Easier to update MQTT functionality without affecting visualisation
- **Debugging**: Clear boundaries between networking and rendering issues
- **Testing**: Each component can be unit tested independently
- **Reusability**: MQTTManager can be used in other INST project components

## 🔧 Technical Configuration

### **System-Specific Settings**
```javascript
// Configure via URL parameters
// https://your-site.com/?mode=operational&priority=high

// Or programmatically via browser console:
if (window.visualizer) {
    // Enable operational optimisations
    visualizer.isOperationalMode = true;
    visualizer.optimizeLayout();
    
    // Maximise for tactical display
    visualizer.toggleMaximizeVisualization();
    
    // Auto-collapse non-essential sections
    visualizer.autoCollapseControls();
}
```

### **Touch Event Optimisation**
```javascript
// Enhanced touch handling for operations
if (window.systemUtils) {
    // Check if running on tablet device
    console.log('Tablet device:', systemUtils.isTabletDevice());
    
    // Get current system statistics
    console.log('System Stats:', systemUtils.getSystemStats());
    
    // Quick actions
    systemUtils.maximiseDisplay();        // Full-screen positioning tracking
    systemUtils.centreNodes();           // Re-centre operational display
    systemUtils.toggleControls();        // Show/hide advanced controls
}
```

### **MQTT Manager Configuration**
```javascript
// Access separated MQTT functionality
if (window.visualizer && window.visualizer.mqttManager) {
    const mqtt = window.visualizer.mqttManager;
    
    // Connection status
    console.log('MQTT Connected:', mqtt.isConnected());
    
    // Manual connection control
    mqtt.connect();
    mqtt.disconnect();
    
    // Send rate limit commands
    mqtt.publishRateLimitCommand(10);
}
```

## 🌟 Features

### **Performance Optimised**
- **60 FPS physics simulation** optimised for tablet processors
- **Touch-responsive controls** with haptic feedback for field use
- **Automatic scaling** maintains optimal operational zone coverage
- **Battery-efficient rendering** with adaptive frame rates for extended operations
- **Memory management** with automatic cleanup for long operational sessions
- **Modular architecture** reduces memory footprint and improves performance

### **Device Compatibility**
| Device | Layout | Optimisations |
|--------|--------|---------------|
| Tablet Portrait | Stacked | Compact controls, maximise tactical mode |
| Tablet Landscape | Side-by-side | Full controls, wide positioning view |
| Command Centre Display | Hybrid | Best tactical awareness |
| Desktop Command | Traditional | Full management features |

### **Browser Compatibility**
| Browser | Touch | Desktop | Touch Support | Advanced Mode |
|---------|-------|---------|---------------|---------------|
| Chrome  | ✅    | ✅      | ✅           | ✅            |
| Safari  | ✅    | ✅      | ✅           | ✅            |
| Firefox | ✅    | ✅      | ✅           | ⚠️            |
| Edge    | ✅    | ✅      | ✅           | ✅            |

### **Accessibility Features**
- **High contrast mode** support for various lighting conditions
- **Large touch targets** meet accessibility guidelines
- **Voice control** compatibility on tablets
- **Screen reader** support for all controls
- **Reduced motion** preference respected during operations

## 📁 Project Structure

```
inst-visualiser/
├── index.html              # Responsive main application
├── css/
│   └── main.css            # Responsive CSS with touch-first design
├── js/
│   ├── physics.js          # Ultra-fast physics engine for real-time positioning tracking
│   ├── mqtt.js             # Separated MQTT management for better organisation
│   ├── visualizer.js       # Core visualisation functionality
│   └── app.js              # Touch-aware application init
├── resources/
│   └── demo-pic.png        # Interface screenshot
└── README.md               # This documentation
```

## 🚨 Troubleshooting

### **Common Issues**

**Touch Not Responsive During Operations**
- ✅ **Clear tablet cache** and reload application
- ✅ **Check network settings**: Ensure satellite/WiFi connectivity
- ✅ **Disable tablet sleep mode**: Essential for continuous operations
- ✅ **Check tablet battery**: Low power may affect touch sensitivity

**Network Connection Issues**
- ✅ **Test INST satellite connection**: Verify satellite link is operational
- ✅ **Check network settings**: Verify broker access
- ✅ **Verify WebSocket support**: Networks require WebSocket capability

**Performance Issues During Operations**
- ✅ **Close non-essential applications**: Free up tablet resources for positioning tracking
- ✅ **Use latest browser**: Update browser for optimal performance
- ✅ **Reduce position update frequency**: Lower MQTT rate if network is stressed
- ✅ **Disable debug mode**: Turn off debug logging for better performance

### **Essential MQTT Issues**
- ✅ **Test connection**: Try "Connect" button and check network console
- ✅ **Check broker settings**: Verify network configuration
- ✅ **Verify WebSocket support**: Networks require WebSocket capability
- ✅ **MQTT Manager debug**: Use `window.visualizer.mqttManager` to inspect connection state

## 🏆 System Recognition

### **Funding and Partnership:**
- **European Space Agency (ESA)** - Technology development funding
- **UK Space Agency (UKSA)** - National preparedness support  
- **Business Applications and Space Solutions Programme (BASS)** - System deployment

### **Evaluation Partners:**
- **Greater Manchester Local Resilience Forum** - Real-world validation
- **Technical organisations** - System optimisation consulting

## 🎯 Version History

- **v3.5**: Modular Architecture with separated MQTT management for better code organisation
- **v3.4**: Positioning with refined interface and terminology
- **v3.3**: Emergency Response Integration with correct INST project information
- **v3.2**: Touch-Optimised UX with compact controls, small title bar, prioritised positioning visualisation
- **v3.1**: High-Performance Physics Mode with 100x speed optimisation for real-time positioning response  
- **v3.0**: Advanced spring-mass physics system for positioning
- **v2.x**: Basic physics simulation for positioning scenarios
- **v1.x**: Simple positioning algorithms

## 📄 Licence & Copyright

**Copyright (C) Dynamic Devices Ltd 2025**

This program is free software: you can redistribute it and/or modify it under the terms of the **GNU General Public License as published by the Free Software Foundation, either version 3 of the Licence, or (at your option) any later version.**

This program is distributed in the hope that it will be useful, but **WITHOUT ANY WARRANTY**; without even the implied warranty of **MERCHANTABILITY** or **FITNESS FOR A PARTICULAR PURPOSE**. See the GNU General Public Licence for more details.

You should have received a copy of the GNU General Public Licence along with this program. If not, see **<https://www.gnu.org/licenses/>**.

### **Commercial Licensing**
For use cases requiring proprietary licensing or services support, contact Dynamic Devices Ltd:
- 📧 **Services Sales**: [services@dynamicdevices.co.uk](mailto:services@dynamicdevices.co.uk)
- 🌐 **Website**: [https://www.dynamicdevices.co.uk](https://www.dynamicdevices.co.uk)

### **Open Source Contributions**
We welcome contributions to the INST Positioning Project! All contributions must be licensed under GPLv3 to maintain system compatibility.

## 📞 Support & Contact

### **INST Project Support**
- 📧 **Technical Support**: [inst-support@dynamicdevices.co.uk](mailto:inst-support@dynamicdevices.co.uk)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/DynamicDevices/inst-visualiser/issues)
- 📖 **Documentation**: [INST Project Wiki](https://github.com/DynamicDevices/inst-visualiser/wiki)
- 🌐 **Company Website**: [Dynamic Devices Ltd](https://www.dynamicdevices.co.uk)

### **Services**
- **Custom Development**: Bespoke positioning solutions
- **Integration Services**: System integration and deployment
- **Training & Consulting**: Technology training and implementation guidance  
- **Hardware Supply**: Complete UWB hardware kits and development systems

### **24/7 Operations Support**
- **Support Hotline**: Available during major operations
- **Remote Monitoring**: Proactive system monitoring and resolution
- **Rapid Deployment**: On-site technical assistance for major operational requirements

## 📄 Licence

GNU General Public Licence v3.0 - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

### **INST Project Team**
- **Dynamic Devices Ltd** for INST Project vision and UWB expertise
- **Advanced Engineering Team** for advanced physics optimisation and modular architecture design
- **Research Partners** for advancing UWB positioning algorithm development

### **Technology Partners**
- **European Space Agency (ESA)** for satellite communication funding
- **UK Space Agency (UKSA)** for national preparedness support
- **Community** for operational requirements and validation
- **Eclipse Paho** for robust MQTT JavaScript client implementation suitable for operations

### **Standards & Protocols**
- **Standards** for multi-agency coordination protocol compliance
- **Satellite Communication Protocols** for resilient data transmission
- **Device Standards** for positioning device certification
- **MQTT Protocol** for reliable IoT communication and real-time data streaming

---

⭐ **Star this repository if you find it helpful for positioning!**

*Made with ❤️ for positioning and the technology community by **Dynamic Devices Ltd***

🚨 *Now optimised for tablets - precise positioning anywhere, anytime!*  
🛰️ *Part of the INST Project - advancing positioning technology*  
🏗️ *v3.5: Modular architecture for better maintainability*

**Copyright (C) Dynamic Devices Ltd 2025 - Licensed under GPLv3**

---

*The INST UWB Position Visualiser - Technology serving precision positioning.*

**"Precision positioning made simple"**