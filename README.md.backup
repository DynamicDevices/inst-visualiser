# UWB Position Visualiser v3.0

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen)](https://dynamicdevices.github.io/inst-visualiser/)
[![GitHub release](https://img.shields.io/github/release/DynamicDevices/inst-visualiser.svg)](https://github.com/DynamicDevices/inst-visualiser/releases)

**Ultra-fast real-time UWB (Ultra-Wideband) positioning visualisation with advanced physics simulation and MQTT device control.**

Developed by [Dynamic Devices Ltd](https://www.dynamicdevices.co.uk) - specialists in embedded and IoT solutions for over 25 years.

## 🚀 Live Demo

**[Try it now →](https://dynamicdevices.github.io/inst-visualiser/)**

Connect to your UWB positioning system and see real-time node tracking with our advanced physics engine!

## ✨ Features

### 🔬 Ultra-Fast Physics Engine
- **100x faster** mass-spring physics simulation
- Real-time node positioning with natural movement
- Advanced damping and collision detection
- Automatic screen boundary management (80% coverage)
- Configurable physics parameters

### 📡 MQTT Integration
- **Real-time data streaming** from UWB devices
- **Device control** with rate limiting commands
- **Auto-discovery** connection strategies (WSS/WS)
- **Secure connections** with SSL/TLS support
- Compatible with Dynamic Devices MQTT infrastructure

### 📊 Live Statistics
- **Node count** - Active positioning nodes
- **Connection count** - Active distance measurements
- **Message count** - Total MQTT messages received
- **Bounding box** - Coverage area in metres (W×H)
- **Last message** - Timestamp of most recent data

### 🎛️ Professional Interface
- **Collapsible panels** for clean organization
- **Professional toggle switches** for settings
- **Debug mode** with detailed logging
- **Responsive design** for desktop and mobile
- **Dark theme** with modern styling

### 🔲 Debug Visualization
- **Bounding box overlay** with precise dimensions
- **Connection quality indicators** (accurate/approximate)
- **Node state visualization** (active/stale/removed)
- **Real-time physics debugging**

## 🏃 Quick Start

### 1. Basic Usage
```bash
# Clone the repository
git clone https://github.com/DynamicDevices/inst-visualiser.git
cd inst-visualiser

# Open in browser
open index.html
# or serve locally
python -m http.server 8080
```

### 2. MQTT Configuration
1. **Expand MQTT Settings** panel
2. **Configure connection**:
   - Host: `mqtt.dynamicdevices.co.uk` (default)
   - Port: `8083` (WebSocket) or `8084` (WebSocket Secure)
   - Topic: `uwb/positions` (default)
3. **Click "Connect MQTT"**
4. **Start receiving** real-time positioning data

### 3. Device Control
1. **Enable debug mode** (optional)
2. **Expand Device Control** panel
3. **Adjust update rate** (1-60 seconds)
4. **Commands sent** to `{topic}/cmd` automatically

## 🛠️ Technical Details

### Physics Engine Specifications
- **Spring Constants**: Configurable Hooke's law implementation
- **Mass Simulation**: Lightweight nodes with realistic inertia
- **Damping System**: Velocity-based damping for smooth settling
- **Boundary Forces**: Automatic containment within screen bounds
- **Auto-scaling**: Dynamic adjustment for optimal visualization

### MQTT Message Format
```json
[
  ["NodeA", "NodeB", 3.2],
  ["NodeA", "NodeC", 1.8],
  ["NodeB", "NodeC", 2.1]
]
```

### Device Commands
```
Topic: {base_topic}/cmd
Payload: "set rate_limit {seconds}"
Example: "set rate_limit 5"
```

### Browser Requirements
- **Modern browser** with ES6+ support
- **WebSocket support** for MQTT connectivity
- **SVG support** for graphics rendering
- **Responsive design** for mobile compatibility

## 📱 Supported Devices

### UWB Hardware
- **Dynamic Devices UWB modules**
- **DecaWave/Qorvo DWM series**
- **Custom UWB implementations**
- **Any MQTT-compatible positioning system**

### MQTT Brokers
- **Mosquitto** (recommended)
- **AWS IoT Core**
- **Azure IoT Hub**
- **Google Cloud IoT**
- **HiveMQ**

## ⚙️ Configuration

### Default Settings
```javascript
const config = {
  mqtt: {
    host: "mqtt.dynamicdevices.co.uk",
    port: 8083,
    topic: "uwb/positions"
  },
  physics: {
    springConstant: 2.0,    // Ultra-fast response
    damping: 0.6,           // Minimal resistance
    mass: 0.2,              // Light nodes
    distanceScale: 120      // px/meter
  },
  timeouts: {
    stale: 30000,           // 30s until stale
    removal: 30000          // +30s until removed
  }
};
```

### Customization
1. **Modify physics parameters** via control panel
2. **Adjust visualization settings** in display panel
3. **Configure MQTT connection** for your infrastructure
4. **Enable debug features** for development

## 🔧 Development

### Local Development
```bash
# Install development dependencies
npm install

# Start development server
npm run dev

# Validate HTML
npm run validate
```

### Building
No build process required - this is a pure HTML/CSS/JavaScript application.

### Testing
```bash
# Run basic tests
npm test

# Manual testing checklist:
# ✅ MQTT connection
# ✅ Physics simulation
# ✅ Node visualization
# ✅ Statistics updates
# ✅ Mobile responsiveness
```

## 📖 API Documentation

### Physics System
```javascript
// Access physics engine
const physics = visualizer.physics;

// Modify parameters
physics.springConstant = 1.5;
physics.damping = 0.8;
physics.mass = 0.3;

// Reset simulation
visualizer.resetPhysics();
```

### MQTT Interface
```javascript
// Programmatic MQTT control
visualizer.connectMQTT();
visualizer.disconnectMQTT();

// Send device commands
visualizer.publishRateLimitCommand(10); // 10 seconds
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

### Development Setup
1. **Fork** the repository
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Reporting Issues
- **Bug reports**: Use the [issue tracker](https://github.com/DynamicDevices/inst-visualiser/issues)
- **Feature requests**: Create an issue with the `enhancement` label
- **Documentation**: Help improve our docs

## 📄 License

This project is licensed under the **GNU General Public License v3.0**.

```
Copyright (C) Dynamic Devices Ltd 2025

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
```

See [LICENSE](LICENSE) for the full license text.

## 🏢 About Dynamic Devices Ltd

**Dynamic Devices Ltd** has been providing embedded and IoT solutions for over 25 years. We specialize in:

- **UWB positioning systems**
- **MQTT infrastructure**
- **Embedded Linux development**
- **Wireless sensor networks**
- **Custom IoT solutions**

### Contact
- **Website**: [dynamicdevices.co.uk](https://www.dynamicdevices.co.uk)
- **Email**: [info@dynamicdevices.co.uk](mailto:info@dynamicdevices.co.uk)
- **GitHub**: [@DynamicDevices](https://github.com/DynamicDevices)
- **Location**: Liverpool, UK

## 🙏 Acknowledgments

- **Eclipse Paho** for MQTT client library
- **Open source community** for inspiration and feedback
- **UWB technology** pioneers at DecaWave/Qorvo
- **Our clients** who drive innovation in positioning technology

---

**[⭐ Star this repository](https://github.com/DynamicDevices/inst-visualiser)** if you find it useful!

[![Dynamic Devices](https://img.shields.io/badge/Made%20by-Dynamic%20Devices-blue)](https://www.dynamicdevices.co.uk)