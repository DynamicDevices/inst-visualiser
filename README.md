# UWB Position Visualiser v3.2 - Mobile Optimised

A real-time visualisation tool for UWB (Ultra-Wideband) positioning data via MQTT featuring advanced spring-mass physics simulation and mobile-optimised UX design for optimal touch interaction.

![UWB Position Visualiser Demo](resources/demo-pic.png)

**🚀 Try it now: [GitHub Pages Demo](https://dynamicdevices.github.io/inst-visualiser/)**

## 📱 Mobile-First Design (v3.2)

The visualiser is now optimised for mobile devices with a **touch-friendly, responsive interface**:

🎯 **Mobile-Optimised UX:**
- **Compact Controls**: Space-efficient control panels designed for mobile screens
- **Touch-Friendly**: Larger tap targets, touch gestures, and haptic feedback
- **Prioritised Visualisation**: Node display takes precedence with maximise mode
- **Collapsible Sections**: Organised, space-efficient controls that expand on demand
- **Responsive Layout**: Seamlessly adapts from mobile to desktop
- **Quick Actions**: Essential functions easily accessible on small screens

📱 **Mobile Features:**
- **Maximise Mode**: Full-screen visualisation for optimal node viewing (⛶ button)
- **Auto-Collapse**: Advanced settings collapse automatically on mobile to save space
- **Touch Gestures**: Pinch, zoom, and tap interactions for intuitive control
- **Orientation Support**: Adapts layout for portrait and landscape modes
- **Battery Optimisation**: Efficient rendering for extended mobile use

⚡ **Ultra-Fast Physics System (v3.1+):**
- **Spring Constant**: 2.0 (100x stronger) for lightning-fast force response  
- **Minimal Damping**: 0.6 (allows maximum sustained motion)
- **Ultra-Light Mass**: 0.2 (near-instant acceleration)
- **Extreme Forces**: All boundary, repulsion, and centring forces increased 100x
- **Result**: Nodes move ~100x faster to equilibrium positions

## 🎮 Getting Started

### **Quick Demo (Mobile & Desktop)**
1. Visit the [live demo](https://dynamicdevices.github.io/inst-visualiser/)
2. **On Mobile**: Tap "Connect" to see the touch-optimised interface
3. **Desktop**: Click "Start Simulation" to see ultra-fast physics in action
4. **Maximise**: Use the ⛶ button for full-screen node visualisation
5. **Explore**: Tap section headers to collapse/expand control groups

### **Mobile-Optimised Workflow**
1. **Connect MQTT**: Tap "📡 MQTT Connection" → Enter your broker details → "Connect"
2. **View Nodes**: Nodes appear with smooth touch-responsive animations  
3. **Maximise**: Tap ⛶ for full-screen visualisation optimised for mobile viewing
4. **Quick Actions**: Access essential controls via "⚡ Quick Actions" section
5. **Monitor**: Live statistics show nodes, links, and coverage area

### **Test with Python Simulation**
```bash
# Install dependencies
pip install paho-mqtt numpy

# Run UWB simulation publisher (generates realistic test data)
python examples/mqtt-simulated-publisher.py

# In the visualiser (mobile or desktop):
# - Broker: mqtt.dynamicdevices.co.uk (default)
# - Topic: uwb/positions (default)  
# - Tap/Click "Connect" to see simulated data
```

## 🎛️ Mobile-Optimised Control Panel

### **📊 Live Statistics** (Always Visible)
- **Nodes**: Active UWB devices
- **Links**: Distance measurements  
- **Messages**: Total MQTT messages received
- **Area**: Physical coverage area in metres
- **Last**: Timestamp of latest update

### **📡 MQTT Connection** (Touch-Optimised)
- **Broker**: Your MQTT broker address (touch-friendly input)
- **Port**: WebSocket port (typically 8083 for SSL)
- **Topic**: MQTT topic for position data
- **Auto-collapse**: Panel auto-hides after successful connection

### **⚡ Quick Actions** (Mobile Priority)
- **Centre Nodes**: Re-centre visualisation to optimal view
- **Clear All**: Remove all nodes and connections
- **Reset Physics**: Zero all velocities for fresh positioning
- **Show Distance Accuracy**: Toggle ✓/⚠/❌ symbols on distance labels
- **Enable Physics**: Toggle ultra-fast spring-mass simulation

### **⚙️ Display Settings** (Collapsible)
- **Stale Timeout**: Mark nodes as stale after N seconds
- **Remove Timeout**: Remove stale nodes after additional time
- **Distance Scale**: Adjust metres-to-pixels ratio (50-250px/m)

### **🔬 Physics Tuning** (Advanced)
- **Spring Force**: 0.5-10.0 (default: 2.0 for ultra-fast mode)
- **Damping**: 0.3-0.9 (default: 0.6 for maximum motion)
- **Node Mass**: 0.05-1.0 (default: 0.2 for instant acceleration)

### **🐛 Debug Tools** (Developer)
- **Debug Logging**: Detailed spring connection messages
- **Show Boundaries**: Visual outline with area dimensions

## 📊 Data Format

The visualiser expects JSON arrays containing distance measurements:

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
- **Numeric distances**: Positive numbers in metres
- **Gateway detection**: Node "B5A4" automatically styled as gateway (red)

## 📱 Mobile Usage Tips

### **Portrait Mode (Phones)**
- Controls appear at top, visualisation below
- Use maximise button (⛶) for full-screen node viewing
- Swipe down to access collapsed control sections
- Statistics remain visible for quick monitoring

### **Landscape Mode (Phones & Tablets)**
- Controls appear on left, visualisation takes majority of screen
- Better for detailed node manipulation and settings
- All sections accessible without scrolling
- Ideal for demo presentations

### **Touch Interactions**
- **Tap**: Activate buttons and toggle settings
- **Tap & Hold**: Some buttons provide visual feedback  
- **Tap Section Headers**: Expand/collapse control groups
- **Tap ⛶**: Toggle full-screen visualisation mode

### **Performance on Mobile**
- **Auto-optimisation**: Physics adjusts for mobile performance
- **Battery Efficient**: Reduced animation when on battery power
- **Touch Responsiveness**: 60fps interactions maintained
- **Memory Management**: Automatic cleanup of old nodes/connections

## 🔧 Advanced Configuration

### **Mobile-Specific Settings**
```javascript
// Configure for mobile via URL parameters
// https://your-site.com/?mobile=true&compact=true

// Or programmatically via browser console:
if (window.visualizer) {
    // Enable mobile optimisations
    visualizer.isMobileDevice = true;
    visualizer.optimizeMobileLayout();
    
    // Maximise visualisation for mobile viewing
    visualizer.toggleMaximizeVisualization();
    
    // Auto-collapse advanced sections
    visualizer.autoCollapseMobileControls();
}
```

### **Touch Event Optimisation**
```javascript
// Enhanced touch handling for mobile
if (window.mobileUtils) {
    // Check if running on mobile
    console.log('Mobile device:', mobileUtils.isMobile());
    
    // Get current statistics
    console.log('Stats:', mobileUtils.getStats());
    
    // Quick actions for mobile workflow
    mobileUtils.maximiseVisualization(); // Full-screen mode
    mobileUtils.centerNodes();           // Re-centre display
    mobileUtils.toggleControls();        // Show/hide controls
}
```

## 🌟 Key Features

### **Mobile Performance Optimised**
- **60 FPS physics simulation** optimised for mobile processors
- **Touch-responsive controls** with haptic feedback
- **Automatic scaling** maintains optimal screen usage
- **Battery-efficient rendering** with adaptive frame rates
- **Memory management** with automatic node cleanup

### **Responsive Design**
| Device | Layout | Optimisations |
|--------|--------|---------------|
| Mobile Portrait | Stacked | Compact controls, maximise mode |
| Mobile Landscape | Side-by-side | Full controls, wide visualisation |
| Tablet | Hybrid | Best of both worlds |
| Desktop | Traditional | Full feature set |

### **Browser Compatibility**
| Browser | Mobile | Desktop | Touch Support | Gestures |
|---------|--------|---------|---------------|----------|
| Chrome  | ✅     | ✅      | ✅           | ✅       |
| Safari  | ✅     | ✅      | ✅           | ✅       |
| Firefox | ✅     | ✅      | ✅           | ⚠️       |
| Edge    | ✅     | ✅      | ✅           | ✅       |

### **Accessibility Features**
- **High contrast mode** support for mobile devices
- **Large touch targets** meet accessibility guidelines
- **Voice control** compatibility on supported devices
- **Screen reader** support for all controls
- **Reduced motion** preference respected

## 📁 Project Structure

```
inst-visualiser/
├── index.html              # Mobile-optimised main application
├── css/
│   └── main.css            # Responsive CSS with mobile-first design
├── js/
│   ├── physics.js          # Ultra-fast physics engine (unchanged)
│   ├── visualizer.js       # Mobile-optimised core functionality
│   └── app.js              # Mobile-aware application init
├── examples/
│   ├── mqtt-simulated-publisher.py  # Test data generator
│   └── sample-data.json    # Sample UWB positioning data
├── resources/
│   └── demo-pic.png        # Demo screenshot
└── README.md               # This mobile-optimised documentation
```

## 🔍 Troubleshooting

### **Mobile-Specific Issues**

**Touch Not Responsive**
- ✅ **Clear browser cache** and reload page
- ✅ **Check iOS Safari settings**: Ensure JavaScript enabled
- ✅ **Disable iOS zoom**: May interfere with touch events
- ✅ **Check Android Chrome flags**: Disable experimental touch features

**Layout Issues on Mobile**
- ✅ **Rotate device**: Try landscape mode for better layout
- ✅ **Clear cookies**: Reset any stored layout preferences  
- ✅ **Force refresh**: Use Ctrl+F5 or Cmd+Shift+R
- ✅ **Check viewport settings**: Should be properly configured

**Performance Issues on Mobile**
- ✅ **Close other apps**: Free up device memory
- ✅ **Use latest browser**: Update Chrome/Safari to latest version
- ✅ **Reduce message frequency**: Lower MQTT update rate
- ✅ **Disable debug mode**: Turn off debug logging for better performance

### **General MQTT Issues**
- ✅ **Test connection**: Try "Connect" button and check console
- ✅ **Check broker settings**: Verify host, port, and topic
- ✅ **Use simulation mode**: Test with built-in sample data
- ✅ **Verify WebSocket support**: Some networks block WebSocket ports

## 🎯 Version History

- **v3.2**: Mobile-Optimised UX with touch-friendly controls and prioritised visualisation
- **v3.1**: Ultra-Fast Physics Mode with 100x speed optimisation  
- **v3.0**: Advanced spring-mass physics system
- **v2.x**: Basic physics simulation
- **v1.x**: Simple positioning algorithms

## 📞 Support & Contact

- 📧 **Email**: [ajlennon@dynamicdevices.co.uk](mailto:ajlennon@dynamicdevices.co.uk)
- 🐛 **Issues**: [GitHub Issues](https://github.com/DynamicDevices/inst-visualiser/issues)
- 🌐 **Website**: [Dynamic Devices](https://www.dynamicdevices.co.uk)

## 📄 Licence

GNU General Public License v3.0 - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Eclipse Paho** for robust MQTT JavaScript client
- **Mobile UX Community** for touch interaction design insights
- **UWB Positioning Community** for algorithm development  
- **Physics simulation** inspired by force-directed graph layouts
- **Dynamic Devices** team for mobile optimisation techniques

---

⭐ **Star this repository if you find it helpful!**

*Made with ❤️ for the IoT and positioning community by Dynamic Devices Ltd.*

📱 *Now optimised for mobile devices - position anywhere, anytime!*