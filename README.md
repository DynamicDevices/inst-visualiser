# INST UWB Positioning Visualizer

## 🚨 About the INST Project

**INST (Instantly Networked Smart Triage)** is a revolutionary emergency response system designed to save lives during Mass Casualty Incidents (MCIs). Developed with funding from the European Space Agency (ESA) and UK Space Agency (UKSA) through the Business Applications and Space Solutions Programme (BASS), INST addresses critical coordination failures that have cost lives in major emergencies.

### The Problem INST Solves

The 2017 Manchester Arena bombing tragically highlighted coordination failures between emergency services that cost precious lives. The public inquiry identified that **lack of real-time coordination between police, ambulance services, and fire departments significantly impacted response effectiveness**. INST was created to ensure such coordination failures never happen again.

### How INST Works

INST is a **satellite-enabled emergency response system** that provides real-time situational awareness through:

- **Low-cost, lightweight devices** that can be quickly attached to or placed on casualties
- **Satellite communication networks** enabling coverage even when terrestrial infrastructure fails
- **Real-time position tracking** showing exactly where each casualty is located
- **Medical urgency indicators** helping responders prioritize treatment
- **Live casualty counting** providing accurate incident scale assessment

> *"If INST can save just one life, then it will be worth it."* - Joseph Spear, Director of Communications

## 🎯 UWB Positioning: The Foundation of Real-Time Tracking

### What is Ultra-Wideband (UWB)?

Ultra-Wideband technology forms the **precision positioning backbone** of the INST system. UWB provides:

- **Centimeter-level accuracy** for indoor and outdoor positioning
- **Low power consumption** essential for emergency device longevity  
- **Penetration through obstacles** maintaining signal in debris/structural damage
- **Minimal interference** with other emergency communication systems
- **Real-time performance** with microsecond timing precision

### UWB in Emergency Response Context

In Mass Casualty Incidents, **knowing exactly where each casualty is located can mean the difference between life and death**. The UWB positioning system enables:

#### 🏥 **Triage Optimization**
- **Spatial triage mapping** - visualize casualty distribution across incident zones
- **Priority routing** - direct responders to most critical casualties first
- **Resource allocation** - deploy medical teams based on real casualty density

#### 🚑 **Coordinated Response** 
- **Unified situational picture** - all emergency services see the same real-time data
- **Avoid duplication** - prevent multiple teams responding to same casualty
- **Coverage gaps** - identify areas that may have been missed

#### 📍 **Precision in Chaos**
- **GPS-denied environments** - works inside collapsed buildings, underground
- **Debris navigation** - track casualties even when landmarks are destroyed
- **Night operations** - position tracking independent of visibility

## 🖥️ The UWB Visualizer Interface

This application provides a **real-time command center view** for emergency coordinators, displaying:

### Core Visualization Features

- **Live Node Tracking** - Real-time positions of all INST devices
- **Distance Measurements** - Precise spacing between casualties and responders  
- **Gateway Networks** - Infrastructure nodes maintaining communication
- **Physics-Based Layout** - Intuitive spatial relationships with configurable dynamics
- **Mobile Responsiveness** - Operates on tablets and smartphones in field conditions

### Emergency Operations Interface

- **MQTT Integration** - Real-time data streaming from satellite/terrestrial networks
- **Scalable Display** - From single casualties to 100+ victim scenarios
- **Status Monitoring** - Connection health and device battery levels
- **Console Logging** - Complete audit trail of all system events
- **Maximized Views** - Full-screen tactical displays for incident command

## 🛰️ System Architecture

```
Satellite Network ←→ Ground Station ←→ MQTT Broker ←→ UWB Visualizer
       ↑                                                    ↓
   INST Devices ←→ UWB Positioning Network ←→ Emergency Response Teams
```

### Data Flow in Emergency Scenarios

1. **INST devices** attached to casualties transmit position via UWB
2. **UWB anchor networks** triangulate precise positions  
3. **Satellite uplinks** relay data when terrestrial networks are damaged
4. **MQTT message broker** (`mqtt.dynamicdevices.co.uk`) distributes real-time updates
5. **Visualization interface** provides live tactical picture to incident commanders

## 🚀 Quick Start Guide

### For Emergency Response Coordinators

1. **Open the visualizer** - Load `index.html` in any modern web browser
2. **Connect to INST network** - Click "Connect MQTT" (pre-configured for INST systems)
3. **Monitor live positions** - Casualties and responders appear as they come online
4. **Adjust view settings** - Use physics controls to optimize display for your scenario
5. **Full-screen when needed** - Click "Maximize" for incident command displays

### For Technical Operators

```bash
# Clone the repository
git clone https://github.com/DynamicDevices/inst-visualiser.git
cd inst-visualiser

# Open in browser (no build process required)
open index.html

# Or serve via web server for networked access
python -m http.server 8000
```

### Configuration

The system connects to the INST production network by default:

- **MQTT Broker**: `mqtt.dynamicdevices.co.uk:8083`
- **Data Topic**: `uwb/positions`
- **Protocol**: WebSocket-based MQTT for web browser compatibility

## 🔧 Technical Specifications

### Browser Requirements
- **Modern JavaScript support** (ES6+)
- **WebSocket capability** for real-time MQTT
- **Canvas/SVG rendering** for position visualization
- **Mobile touch support** for field tablet use

### Performance Characteristics
- **Zero external dependencies** - works offline after initial load
- **Real-time updates** - <100ms position update latency
- **Scalable to 1000+ nodes** - tested with large-scale incident simulations
- **Mobile optimized** - responsive design for field operations

### Data Formats

**Position Data (MQTT Topic: `uwb/positions`)**
```json
{
  "nodeId": "INST-001",
  "timestamp": "2024-06-07T14:30:00Z",
  "position": {
    "x": 23.456,
    "y": 67.890,
    "z": 1.200
  },
  "accuracy": 0.05,
  "batteryLevel": 85,
  "status": "active",
  "isGateway": false,
  "medicalPriority": "urgent"
}
```

## 🌟 Real-World Impact

### Deployment Scenarios

**Mass Casualty Incidents**
- Building collapses, explosions, transportation accidents
- Natural disasters with multiple casualties
- Large-scale emergencies where GPS may be impaired

**Training Exercises**  
- Multi-agency emergency response drills
- Incident command training scenarios
- Medical triage procedure validation

**Ongoing Operations**
- Large event medical coverage
- Search and rescue coordination
- Disaster relief operations

### Success Metrics

The INST system aims to improve emergency response through:

- **Reduced response times** to critical casualties
- **Improved resource allocation** efficiency  
- **Enhanced inter-agency coordination**
- **Complete accountability** - no casualties overlooked
- **Data-driven optimization** of response procedures

## 🏗️ Development Roadmap

### Current Version (v3.0)
- ✅ Real-time UWB position visualization
- ✅ MQTT integration with INST networks
- ✅ Mobile-responsive emergency operations interface
- ✅ Physics-based spatial layout engine
- ✅ Multi-device support for incident command

### Future Enhancements
- 🔄 **Historical playback** - review incident timelines for training
- 🔄 **3D visualization** - multi-floor/elevation awareness
- 🔄 **Predictive analytics** - resource need forecasting
- 🔄 **Integration APIs** - connect with existing emergency management systems

## 🤝 Contributing to Emergency Response Technology

This project is part of a broader mission to leverage technology for saving lives. We welcome contributions from:

- **Emergency services professionals** - operational requirements and feedback
- **Developers** - performance optimizations and new features
- **UWB specialists** - positioning accuracy improvements
- **UI/UX designers** - stress-tested emergency interface design

### Getting Involved

```bash
# Fork the repository
# Create feature branch
git checkout -b feature/emergency-enhancement

# Make improvements
# Test thoroughly (lives depend on reliability)
# Submit pull request with detailed emergency use case description
```

## 📞 Emergency Services Contact

**For INST system deployment inquiries:**
- **Dynamic Devices Ltd**: Primary development and deployment partner
- **Project website**: https://dynamicdevices.co.uk/
- **Emergency services partnerships**: Available through BASS programme coordination

**For technical support during emergency operations:**
- **24/7 technical hotline**: Available to authorised emergency services
- **Remote system monitoring** - Proactive issue detection and resolution
- **Rapid deployment support** - On-site technical assistance for major incidents

---

## 🏆 Recognition and Support

**Funding and Partnership:**
- **European Space Agency (ESA)** - Technology development funding
- **UK Space Agency (UKSA)** - National emergency preparedness support  
- **Business Applications and Space Solutions Programme (BASS)** - Commercial deployment pathway

**Evaluation Partners:**
- **Greater Manchester Local Resilience Forum** - Real-world validation
- **Emergency services organizations** - Operational requirements definition
- **Medical professionals** - Triage optimization consulting

---

*The INST UWB Positioning Visualizer - Technology serving humanity in our most critical moments.*

**"Every second counts. Every life matters. Every position is precisely known."**