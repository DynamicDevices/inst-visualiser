# UWB Position Visualiser v3.0

A real-time visualization tool for UWB (Ultra-Wideband) positioning data via MQTT featuring advanced spring-mass physics simulation for ultra-fast and accurate node positioning.

**🚀 Try it now: [GitHub Pages Demo](https://dynamicdevices.github.io/inst-visualiser/)**

## ⚡ ULTRA FAST Physics Mode (v3.0)

The visualizer creates an engaging real-time experience with **100x faster physics simulation**:

🎯 **Advanced Spring-Mass Physics System:**
- **Spring Constant**: 2.0 (100x stronger) for lightning-fast force response  
- **Minimal Damping**: 0.6 (allows maximum sustained motion)
- **Ultra-Light Mass**: 0.2 (near-instant acceleration)
- **Extreme Forces**: All boundary, repulsion, and centering forces increased 100x
- **Result**: Nodes move ~100x faster to equilibrium positions

🎮 **Simulation & Live Data Mode:**
- **Start Simulation**: Generate realistic test data with instant physics response
- **Live MQTT**: Connect to real UWB devices for real-time positioning
- **Advanced Controls**: Fine-tune physics parameters in real-time
- **Debug Mode**: Visualize bounding boxes and physics internals

📐 **Intelligent Positioning Algorithms:**
- **2 nodes**: Perfect linear spacing at exact distances
- **3 nodes**: Precise triangle geometry using law of cosines  
- **4+ nodes**: Ultra-fast spring-mass system optimizing all distances
- **Auto-scaling**: Maintains 80% screen usage with dynamic scaling
- **Boundary constraints**: Keeps nodes within visualization area

⚡ **Real-Time MQTT Integration:**
- **Eclipse Paho MQTT client** with SSL/TLS support
- **WebSocket connections** for browser compatibility
- **Auto-reconnection** and subscription management
- **QoS support** and retained message handling
- **Device control**: Send rate limiting commands to UWB devices
- **Comprehensive error handling** with helpful diagnostics

## 🎛️ Advanced Control Panel

### **📊 Real-Time Statistics**
- **Node count**: Active UWB devices
- **Connection count**: Distance measurements
- **Message count**: Total MQTT messages received
- **Bounding box**: Physical area dimensions in meters
- **Last message**: Timestamp of latest update

### **📡 MQTT Settings**
- **Broker host**: Your MQTT broker address
- **WebSocket port**: Typically 8083 (SSL) or 8080 (plain)
- **Topic**: MQTT topic for position data (default: `uwb/positions`)
- **Auto-detection**: Tries multiple connection strategies
- **SSL support**: Automatically detects and uses secure connections

### **🔬 Physics Settings (Advanced)**
- **Spring Strength**: 0.5-10.0 (default: 2.0 for ultra-fast mode)
- **Damping**: 0.3-0.9 (default: 0.6 for maximum motion)
- **Node Mass**: 0.05-1.0 (default: 0.2 for instant acceleration)
- **Distance Scale**: 50-250px/m (default: 120px/m)
- **Real-time adjustment**: Changes take effect immediately

### **⚙️ Display Settings**
- **Stale timeout**: Mark nodes as stale after N seconds
- **Removal timeout**: Remove stale nodes after additional N seconds  
- **Accuracy indicators**: Show ✓/⚠/❌ symbols on distance labels
- **Physics toggle**: Enable/disable spring-mass simulation
- **Node management**: Clear all nodes or center on screen

### **📱 Device Control**
- **Rate limit control**: Send commands to UWB devices to adjust update frequency
- **MQTT command topics**: Automatic command topic generation
- **Device feedback**: Real-time status from connected UWB hardware

### **🐛 Debug & Diagnostics**
- **Debug mode**: Detailed spring connection logging
- **Bounding box**: Visual outline with dimensions in meters
- **Physics monitoring**: Real-time energy calculations
- **Performance metrics**: Frame rate and simulation statistics

## 🚀 Quick Start

### **Immediate Demo**
1. Visit the [live demo](https://dynamicdevices.github.io/inst-visualiser/)
2. Click **"Start Simulation"** to see ultra-fast physics in action
3. Observe nodes appearing with smooth animations and instant positioning
4. Toggle **"Show Console"** to see detailed physics logging

### **Connect to Real UWB System**
1. **Configure MQTT Settings:**
   - Host: `your-mqtt-broker.com`
   - Port: `8083` (WebSocket SSL) or `8080` (WebSocket)
   - Topic: `uwb/positions` or your custom topic

2. **Click "Connect MQTT"** - system will auto-detect best connection method

3. **Publish UWB Data** in this JSON format:
   ```json
   [
     ["A001", "T001", 2.34],
     ["A002", "T001", 1.78],
     ["A003", "T001", 3.12]
   ]
   ```

### **Local Development**
```bash
# Clone the repository
git clone https://github.com/DynamicDevices/inst-visualiser.git
cd inst-visualiser

# Serve locally (choose one method)
python3 -m http.server 8080
# OR
npx http-server
# OR just open index.html in your browser
```

## 📊 Data Format

The visualizer expects JSON arrays containing distance measurements:

```json
[
  ["A001", "A002", 1.5],
  ["A002", "A003", 2.1],
  ["A003", "A001", 2.8]
]
```

**Format Details:**
- **Array of arrays**: Each sub-array = one distance measurement
- **Three elements**: `[node_id_1, node_id_2, distance_in_meters]`
- **String node IDs**: 4-digit alphanumeric codes (e.g., "A001", "R001", "B5A4")
- **Numeric distances**: Positive numbers in meters
- **Gateway detection**: Node "B5A4" automatically styled as gateway

## 🔧 Advanced Configuration

### **Physics Tuning**
For different use cases, adjust physics parameters:

**Ultra-Fast Mode (default v3.0):**
- Spring: 2.0, Damping: 0.6, Mass: 0.2
- Best for: Real-time demos, instant response

**Smooth Mode:**
- Spring: 0.5, Damping: 0.8, Mass: 0.5  
- Best for: Smooth animations, presentations

**High-Precision Mode:**
- Spring: 1.0, Damping: 0.9, Mass: 0.1
- Best for: Scientific visualization, accuracy

### **Device Integration**
Send rate limiting commands to UWB devices:
```bash
# MQTT command format (auto-generated topic)
Topic: uwb/positions/cmd
Payload: "set rate_limit 5"
```

### **Custom Styling**
- **Gateway nodes**: Red styling with "GW" label
- **Standard nodes**: Blue styling with node ID
- **Accuracy indicators**: ✓ (good), ⚠ (approximate), ❌ (poor)
- **Stale nodes**: Grayed out when no recent updates

## 🌟 Key Features

### **Performance Optimized**
- **60 FPS physics simulation** with requestAnimationFrame
- **Automatic scaling** maintains optimal screen usage
- **Efficient collision detection** and boundary constraints
- **Memory management** with automatic node cleanup

### **Browser Compatibility**
| Browser | Version | WebSocket | MQTT SSL | Physics |
|---------|---------|-----------|----------|---------|
| Chrome  | 60+     | ✅        | ✅       | ✅      |
| Firefox | 55+     | ✅        | ✅       | ✅      |
| Safari  | 11+     | ✅        | ✅       | ✅      |
| Edge    | 79+     | ✅        | ✅       | ✅      |

### **Accessibility Features**
- **High contrast mode** support
- **Reduced motion** preference respect  
- **Keyboard navigation** for all controls
- **Screen reader** compatible labels
- **Color-blind friendly** status indicators

## 📁 Project Structure

```
inst-visualiser/
├── index.html              # Main application (single-file)
├── resources/
│   └── dd.svg              # Dynamic Devices logo
├── README.md               # This documentation
└── LICENSE                 # MIT license
```

**Note**: This is a **single-file application** - all CSS, JavaScript, and HTML are contained in `index.html` for maximum portability and simplicity.

## 🔍 Troubleshooting

### **MQTT Connection Issues**
- ✅ **Auto-detection**: System tries multiple connection strategies
- ✅ **Check broker URL**: Ensure WebSocket port (usually 8083 for SSL)
- ✅ **Verify SSL certificate**: Use "Start Simulation" to test visualizer
- ✅ **CORS headers**: Ensure broker allows your domain

### **Node Positioning Issues**
- ✅ **Verify JSON format**: `[["node1","node2",1.5]]`
- ✅ **Check distance values**: Must be positive numbers
- ✅ **Adjust physics**: Try different spring/damping settings
- ✅ **Scale adjustment**: Use 50-250px/m range

### **Performance Issues**
- ✅ **Physics optimization**: System automatically optimizes for speed
- ✅ **Message frequency**: Recommended <2Hz for best performance
- ✅ **Browser acceleration**: Use modern browser with hardware acceleration
- ✅ **Debug console**: Check for error messages

## 🎯 Version History

- **v3.0**: Ultra-Fast Physics Mode with 100x speed optimization
- **v2.x**: Advanced spring-mass physics system
- **v1.x**: Basic positioning with simple algorithms

## 📞 Support & Contact

- 📧 **Email**: [ajlennon@dynamicdevices.co.uk](mailto:ajlennon@dynamicdevices.co.uk)
- 🐛 **Issues**: [GitHub Issues](https://github.com/DynamicDevices/inst-visualiser/issues)
- 🌐 **Website**: [Dynamic Devices](https://www.dynamicdevices.co.uk)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Eclipse Paho** for robust MQTT JavaScript client
- **UWB Community** for positioning algorithm insights  
- **Physics simulation** inspired by force-directed graph layouts
- **Dynamic Devices** team for ultra-fast optimization techniques

---

⭐ **Star this repository if you find it helpful!**

*Made with ❤️ for the IoT and positioning community by Dynamic Devices Ltd.*