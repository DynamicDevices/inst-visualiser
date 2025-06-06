# Troubleshooting Guide

This guide helps you diagnose and fix common issues with the INST Tag Visualizer.

## 🔧 Quick Diagnostics

### Health Check Steps
1. **Open Console** - Click "Show Console" in the visualizer
2. **Test Simulation** - Click "Start Simulation" to verify basic functionality
3. **Check Browser** - Ensure you're using a modern browser (Chrome 60+, Firefox 55+, Safari 11+, Edge 79+)
4. **Verify Network** - Check internet connection and firewall settings

### Console Error Patterns
Look for these patterns in the console to identify issues:

```
❌ Eclipse Paho MQTT connection failed: Error code: 7
→ SSL/WebSocket configuration issue

❌ Invalid JSON format: Unexpected token
→ MQTT payload format problem

⚠️ Connection timeout after 15 seconds  
→ Network connectivity issue

📏 Distance A-B: target=2.0m, actual=5.2m (needs adjustment)
→ Layout approximation (normal behavior)
```

## 🔌 MQTT Connection Issues

### Connection Fails Immediately
**Symptoms**: Red "Disconnected" status, error code 7 or 8

**Causes & Solutions**:

1. **Wrong Protocol/Port**:
   ```
   ❌ Trying: mqtt://broker.com:1883
   ✅ Use: wss://broker.com:8083 (WebSocket SSL)
   ```

2. **SSL Certificate Issues**:
   ```bash
   # Test SSL certificate
   openssl s_client -connect broker.com:8083 -servername broker.com
   
   # Check if certificate is valid
   curl -I https://broker.com:8083
   ```

3. **CORS Problems**:
   ```javascript
   // Broker must allow your domain
   Access-Control-Allow-Origin: https://yourdomain.com
   Access-Control-Allow-Methods: GET, POST, OPTIONS
   Access-Control-Allow-Headers: *
   ```

4. **Firewall Blocking**:
   ```bash
   # Test port connectivity
   telnet broker.com 8083
   
   # Test WebSocket specifically
   wscat -c wss://broker.com:8083/mqtt
   ```

### Connection Timeout
**Symptoms**: "Connection timeout after 15 seconds"

**Solutions**:
1. **Check Broker Status**:
   ```bash
   # Ping broker
   ping broker.com
   
   # Check if MQTT service is running
   nmap -p 8083 broker.com
   ```

2. **Try Alternative Ports**:
   - 8083 (common SSL WebSocket)
   - 8084 (alternative SSL)
   - 9001 (Mosquitto default)
   - 443 (HTTPS port)

3. **Network Issues**:
   - Corporate firewall blocking WebSocket
   - VPN interfering with connections
   - ISP blocking non-standard ports

### Subscription Fails
**Symptoms**: Connected but no data received, "subscription timeout"

**Solutions**:
1. **Check Topic Permissions**:
   ```bash
   # Test with mosquitto client
   mosquitto_sub -h broker.com -p 1883 -t "your/topic" -v
   ```

2. **Verify Topic Format**:
   ```
   ✅ uwb/positioning
   ✅ sensors/+/distance  
   ✅ data/#
   ❌ #/invalid (# must be at end)
   ```

3. **Authentication Issues**:
   ```javascript
   // Add credentials if required
   connectOptions.userName = "your-username";
   connectOptions.password = "your-password";
   ```

## 📡 Data Format Issues

### No Nodes Appear
**Symptoms**: Connected successfully but empty visualization

**Debug Steps**:
1. **Check Console Logs**:
   ```
   📨 Received message on topic "test"
   📦 Payload (X bytes): [your-data-here]
   ```

2. **Validate JSON Format**:
   ```javascript
   // Test your payload
   const testData = '[["A","B",1.5],["B","C",2.1]]';
   try {
       JSON.parse(testData);
       console.log('✅ Valid JSON');
   } catch (e) {
       console.error('❌ Invalid JSON:', e.message);
   }
   ```

3. **Check Required Structure**:
   ```json
   // ✅ Correct
   [["node1", "node2", 1.5]]
   
   // ❌ Wrong - missing array wrapper
   ["node1", "node2", 1.5]
   
   // ❌ Wrong - object instead of array
   {"node1": {"node2": 1.5}}
   ```

### Invalid Distance Errors
**Symptoms**: "Connection X: distance 'Y' is not a valid number"

**Common Causes**:
```json
[
  ["A", "B", "1.5"],     // ❌ String instead of number
  ["C", "D", null],      // ❌ Null value
  ["E", "F", -2.0],      // ❌ Negative distance
  ["G", "H", "invalid"], // ❌ Non-numeric string
  ["I", "J", NaN]        // ❌ NaN value
]
```

**Solutions**:
```javascript
// Ensure numeric distances
const distance = parseFloat(rawDistance);
if (isNaN(distance) || distance <= 0) {
    console.error('Invalid distance:', rawDistance);
    return;
}

measurements.push([node1, node2, distance]);
```

### Node ID Problems
**Symptoms**: "node_id_1 cannot be null/empty" or "cannot be the same"

**Fix Node ID Issues**:
```javascript
// ✅ Valid node IDs
["A", "B", 1.5]           // Short strings
["Room1", "Room2", 2.1]   // Descriptive names
["B5A4", "TAG001", 3.0]   // Mixed formats
[1, 2, 1.5]               // Numbers (converted to strings)

// ❌ Invalid node IDs  
["", "B", 1.5]            // Empty string
[null, "B", 1.5]          // Null value
["A", "A", 1.5]           // Same node twice
```

## 🎨 Visualization Problems

### Nodes Don't Move/Position Correctly
**Symptoms**: Nodes appear but don't arrange properly

**Solutions**:
1. **Check Scale Setting**:
   ```
   Display Scale: 1x = very small distances
   Display Scale: 5x = normal (default)  
   Display Scale: 20x = very large distances
   ```

2. **Verify Distance Values**:
   ```javascript
   // Ensure realistic distances
   if (distance > 100) {
       console.warn('Very large distance:', distance, 'meters');
   }
   if (distance < 0.1) {
       console.warn('Very small distance:', distance, 'meters');
   }
   ```

3. **Layout Algorithm Issues**:
   ```
   2 nodes: Linear positioning
   3 nodes: Triangle geometry (requires valid triangle)
   4+ nodes: Force-directed layout (may approximate)
   ```

### Connections Missing/Wrong
**Symptoms**: Nodes visible but no connecting lines

**Debug Steps**:
1. **Check Console for Connection Logs**:
   ```
   ✅ Connections updated: [A↔B(1.5m), B↔C(2.1m)]
   🔍 DOM verification: 2 nodes, 2 connections in DOM
   ```

2. **Verify Distance Data**:
   ```javascript
   // Connections require valid distance measurements
   state.currentDistances.forEach((dist, key) => {
       console.log(`Connection ${key}: ${dist}m`);
   });
   ```

3. **CSS/DOM Issues**:
   ```javascript
   // Check if connection elements exist
   const connections = document.querySelectorAll('.connection');
   console.log(`Found ${connections.length} connection elements`);
   ```

### Animation Performance Issues
**Symptoms**: Slow/jerky animations, browser lag

**Solutions**:
1. **Fast Message Mode**:
   ```
   ⚡ Fast message mode enabled - animations disabled for performance
   → Reduce message frequency to <0.5 Hz
   ```

2. **Browser Performance**:
   ```javascript
   // Check performance
   console.log('Nodes:', state.nodes.size);
   console.log('Connections:', state.currentDistances.size);
   
   // Recommended limits:
   // Nodes: <50 for smooth performance
   // Connections: <200 for optimal experience
   ```

3. **Reduce Complexity**:
   - Decrease message frequency
   - Filter unnecessary distance measurements
   - Use lower display scale
   - Close other browser tabs

## 🌐 Browser-Specific Issues

### Chrome Issues
**Problem**: CORS errors with localhost
**Solution**:
```bash
# Start Chrome with disabled security (development only)
chrome --disable-web-security --user-data-dir=/tmp/chrome-dev
```

### Firefox Issues  
**Problem**: WebSocket connections fail
**Solution**:
1. Check `about:config` → `network.websocket.enabled`
2. Disable ad blockers temporarily
3. Clear browser cache and cookies

### Safari Issues
**Problem**: Console logs not appearing
**Solution**:
1. Enable Developer menu: Safari → Preferences → Advanced
2. Show Web Inspector: Develop → Show Web Inspector
3. Check Console tab for error messages

### Mobile Browser Issues
**Problem**: Touch interactions not working
**Solution**:
```css
/* Add to CSS */
.node {
    touch-action: manipulation;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
}
```

## 🚨 Common Error Messages

### "WebSocket connection failed"
```
Error: WebSocket connection to 'wss://broker.com:8083/mqtt' failed
```
**Causes**: SSL certificate issues, wrong port, broker down
**Fix**: Verify broker URL, check SSL certificate, try alternative ports

### "Topic may not exist on the broker"
```
⏰ Subscription timeout for topic: your/topic
• Topic may not exist on the broker
```
**Causes**: Wrong topic name, no publisher, ACL restrictions
**Fix**: Verify topic spelling, check if anyone is publishing, review broker ACL

### "Invalid triangle distances"
```
⚠️ Invalid triangle distances (triangle inequality violated)
```
**Causes**: Distance measurements don't form valid triangle
**Fix**: Check UWB calibration, verify distance accuracy, expect layout approximation

### "Node count mismatch"
```
⚠️ Node count mismatch! Expected: 3, Found: 2
```
**Causes**: DOM rendering issue, JavaScript error during node creation
**Fix**: Refresh page, check browser console for errors, clear browser cache

## 🔍 Advanced Debugging

### Enable Verbose Logging
```javascript
// Add to browser console for detailed debugging
window.DEBUG = true;

// Or add to visualizer.js
const DEBUG = window.location.search.includes('debug=true');
if (DEBUG) {
    console.log('Debug mode enabled');
    // Enable additional logging
}
```

### Network Analysis
```bash
# Monitor WebSocket traffic
# Chrome DevTools → Network → WS filter

# Check MQTT broker logs
tail -f /var/log/mosquitto/mosquitto.log

# Test MQTT directly
mosquitto_pub -h broker.com -t test/topic -m '{"test": true}'
mosquitto_sub -h broker.com -t test/topic -v
```

### Performance Profiling
```javascript
// Add performance monitoring
performance.mark('visualization-start');
// ... visualization code ...
performance.mark('visualization-end');
performance.measure('visualization-time', 'visualization-start', 'visualization-end');

const measures = performance.getEntriesByType('measure');
console.log('Visualization time:', measures[0].duration, 'ms');
```

### Memory Usage Monitoring
```javascript
// Check memory usage (Chrome only)
if ('memory' in performance) {
    setInterval(() => {
        const memory = performance.memory;
        console.log('Memory usage:', {
            used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + ' MB',
            total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + ' MB',
            limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
        });
    }, 10000);
}
```

## 🛠️ Development Debugging

### Local MQTT Broker Setup
```bash
# Install Mosquitto
sudo apt-get install mosquitto mosquitto-clients

# Create config for WebSocket
echo "listener 8083
protocol websockets
allow_anonymous true" | sudo tee /etc/mosquitto/conf.d/websockets.conf

# Restart Mosquitto
sudo systemctl restart mosquitto

# Test locally
mosquitto_pub -h localhost -t test/topic -m '[["A","B",1.5]]'
```

### Mock Data Generator
```javascript
// Add to visualizer for testing
function generateMockData() {
    const nodes = ['A', 'B', 'C', 'D', 'E'];
    const connections = [];
    
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            if (Math.random() > 0.5) {
                connections.push([
                    nodes[i], 
                    nodes[j], 
                    parseFloat((Math.random() * 5 + 1).toFixed(2))
                ]);
            }
        }
    }
    
    return JSON.stringify(connections);
}

// Use for testing
dataProcessor.process(generateMockData());
```

### Validation Test Suite
```javascript
// Comprehensive payload validation
function runValidationTests() {
    const tests = [
        // Valid cases
        { data: '[["A","B",1.5]]', valid: true },
        { data: '[["A","B",1.5],["B","C",2.1]]', valid: true },
        
        // Invalid cases
        { data: '{"A":"B"}', valid: false },           // Object instead of array
        { data: '[["A","A",1.5]]', valid: false },     // Same node IDs
        { data: '[["A","B",-1.5]]', valid: false },    // Negative distance
        { data: '[["A","B","invalid"]]', valid: false }, // Non-numeric distance
    ];
    
    tests.forEach((test, i) => {
        try {
            dataProcessor.process(test.data);
            console.log(`Test ${i+1}: ${test.valid ? '✅' : '❌'} PASS`);
        } catch (e) {
            console.log(`Test ${i+1}: ${test.valid ? '❌' : '✅'} FAIL - ${e.message}`);
        }
    });
}
```

## 📞 Getting Help

### Before Asking for Help
1. **Check this troubleshooting guide**
2. **Enable console logging** and copy relevant error messages
3. **Test with simulation data** to isolate MQTT vs visualization issues
4. **Note your browser version** and operating system
5. **Try with different MQTT brokers** if possible

### Information to Include in Bug Reports
```
Browser: Chrome 120.0.6099.109 (64-bit)
OS: Windows 11 / macOS 13.1 / Ubuntu 22.04
Visualizer Version: 1.4.0
MQTT Broker: mosquitto.example.com:8083
Error Message: [exact error from console]
Steps to Reproduce: [numbered list]
Expected Behavior: [what should happen]
Actual Behavior: [what actually happens]
Sample Data: [MQTT payload that causes issue]
```

### Community Resources
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/yourusername/inst-visualiser/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/inst-visualiser/discussions)
- 📧 **Email Support**: your.email@example.com
- 📖 **Documentation**: [docs/](docs/) folder

### Professional Support
For enterprise deployments requiring professional support:
- Custom MQTT integration assistance
- Performance optimization consulting  
- Security audit and hardening
- Training and implementation support

Contact: enterprise-support@example.com

---

**Still having issues?** Open a [GitHub issue](https://github.com/yourusername/inst-visualiser/issues/new) with the debugging information above.
