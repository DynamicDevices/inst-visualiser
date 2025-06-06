# MQTT API Documentation

## Overview

The INST Tag Visualizer receives positioning data via MQTT using a simple JSON array format. This document describes the API specification, data validation, and integration examples.

## Message Format

### Basic Structure
```json
[
  ["node_id_1", "node_id_2", distance_meters],
  ["node_id_3", "node_id_4", distance_meters],
  ...
]
```

### Example Message
```json
[
  ["B5A4", "Room1", 2.34],
  ["B5A4", "Room2", 3.67],
  ["Room1", "Room2", 1.89],
  ["Room1", "Room3", 4.12]
]
```

## Data Validation

### Required Fields
- **Array Structure**: Top-level must be JSON array
- **Sub-arrays**: Each element must be array with exactly 3 elements
- **Node IDs**: First two elements must be non-empty strings/numbers
- **Distance**: Third element must be positive number (meters)

### Validation Rules
1. **Node ID Validation**:
   - Cannot be null, undefined, or empty string
   - Converted to strings for internal processing
   - Must be different from each other in same measurement

2. **Distance Validation**:
   - Must be valid number (not NaN)
   - Must be positive (> 0)
   - Precision: Supports decimal places (e.g., 2.34)

3. **Array Validation**:
   - Minimum 1 connection required
   - Maximum: No limit (performance may degrade >100 connections)
   - Duplicate connections: Later measurement overwrites earlier

### Error Handling
Invalid connections are logged but don't stop processing of valid ones:

```javascript
// Valid + Invalid example
[
  ["A", "B", 1.5],     // ✓ Valid
  ["A", "A", 2.0],     // ✗ Same node IDs
  ["C", "D", -1.0],    // ✗ Negative distance  
  ["E", "F", "invalid"] // ✗ Non-numeric distance
]
// Result: Only A↔B connection displayed
```

## MQTT Configuration

### Connection Settings
- **Protocol**: MQTT over WebSocket (WSS for SSL)
- **QoS**: 0 (fire and forget) recommended for real-time data
- **Retained**: Optional (visualizer handles both retained and non-retained)
- **Clean Session**: True (recommended)

### Broker Requirements
- **WebSocket Support**: Must support MQTT over WebSocket
- **SSL/TLS**: Recommended for production
- **CORS**: Must allow browser connections from your domain

### Common Ports
- **8083**: MQTT over WebSocket with SSL
- **8080**: MQTT over WebSocket without SSL  
- **8084**: Alternative SSL WebSocket port
- **9001**: Mosquitto default WebSocket port

## Integration Examples

### Python Publisher
```python
import paho.mqtt.client as mqtt
import json
import time

def publish_uwb_data():
    client = mqtt.Client()
    client.connect("your-broker.com", 1883, 60)
    
    # Sample UWB measurements
    measurements = [
        ["Anchor1", "Tag1", 2.34],
        ["Anchor1", "Tag2", 4.56],
        ["Anchor2", "Tag1", 1.78],
        ["Anchor2", "Tag2", 3.21]
    ]
    
    payload = json.dumps(measurements)
    client.publish("uwb/positioning", payload, qos=0, retain=False)
    client.disconnect()

# Publish every 2 seconds
while True:
    publish_uwb_data()
    time.sleep(2)
```

### Node.js Publisher
```javascript
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://your-broker.com');

function publishPositionData() {
    const measurements = [
        ["GW001", "TAG001", Math.random() * 5 + 1],
        ["GW001", "TAG002", Math.random() * 5 + 1],
        ["TAG001", "TAG002", Math.random() * 3 + 0.5]
    ];
    
    client.publish('indoor/positioning', JSON.stringify(measurements));
}

client.on('connect', () => {
    console.log('Connected to MQTT broker');
    setInterval(publishPositionData, 1000); // 1 Hz
});
```

### Arduino/ESP32 Example
```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

WiFiClient espClient;
PubSubClient client(espClient);

void publishUWBData() {
    DynamicJsonDocument doc(1024);
    JsonArray measurements = doc.to<JsonArray>();
    
    // Add measurements from your UWB system
    JsonArray measurement1 = measurements.createNestedArray();
    measurement1.add("ESP32_001");
    measurement1.add("TAG_001"); 
    measurement1.add(getUWBDistance()); // Your UWB distance function
    
    String payload;
    serializeJson(doc, payload);
    
    client.publish("uwb/esp32/data", payload.c_str());
}

void loop() {
    if (client.connected()) {
        publishUWBData();
        delay(2000); // 0.5 Hz
    }
    client.loop();
}
```

## Special Node Types

### Gateway Nodes
Node ID `"B5A4"` receives special styling:
- Red color scheme instead of blue
- "GW" text instead of full node ID
- Enhanced pulse animation
- Larger hover effects

### Custom Gateway Detection
To add more gateway nodes, modify the JavaScript:
```javascript
// In nodeManager.create() function
const gatewayNodes = ['B5A4', 'GATEWAY_01', 'ANCHOR_MAIN'];
const isGateway = gatewayNodes.includes(nodeId);
```

## Performance Considerations

### Message Frequency
- **Optimal**: 0.5-1 Hz (every 1-2 seconds)
- **Maximum**: 2 Hz (fast message mode auto-enables)
- **Burst handling**: Visualizer buffers and processes sequentially

### Payload Size
- **Recommended**: <50 connections per message
- **Maximum tested**: 200 connections  
- **Large payloads**: May cause temporary UI lag during processing

### Browser Limits
- **WebSocket connections**: 1 per visualizer instance
- **DOM elements**: Tested up to 100 nodes + 500 connections
- **Memory usage**: ~10MB for typical usage

## Debugging

### Console Logging
Enable console to see detailed processing:
```
[14:32:15] 📨 Received message on topic "uwb/test"
[14:32:15] 📦 Payload (45 bytes): [["A","B",1.5],["B","C",2.1]]
[14:32:15] ✅ JSON parsed successfully
[14:32:15] 📊 Found 2 connection(s) to process
[14:32:15] ✅ Connection 1: "A" ↔ "B" (1.50m)
[14:32:15] ✅ Connection 2: "B" ↔ "C" (2.10m)
```

### Common Error Messages
```
❌ Invalid JSON format: Unexpected token...
💡 Expected: [["node1","node2",1.5], ["node2","node3",2.1]]

❌ Connection 1: distance "invalid" is not a valid number
💡 Distances must be positive numbers

⚠️ Distance change: A-B = 1.5m → 2.1m  
📏 New distance measurement: C-D = 3.2m
```

### Testing Tools
```bash
# Test with mosquitto_pub
mosquitto_pub -h broker.com -p 1883 -t "test/positioning" \
  -m '[["A","B",1.5],["B","C",2.1],["A","C",2.8]]'

# Test with curl (if broker has HTTP bridge)
curl -X POST http://broker.com/api/publish \
  -H "Content-Type: application/json" \
  -d '{"topic":"test/pos","payload":"[[\"A\",\"B\",1.5]]"}'
```

## Data Flow

```
UWB Hardware → Your Code → MQTT Broker → WebSocket → Visualizer
     ↓              ↓           ↓            ↓          ↓
  Distance      JSON Array   Publish    Subscribe   Display
 Measurement    Formatting   Message    & Parse     Nodes
```

### Processing Pipeline
1. **MQTT Message** received via WebSocket
2. **JSON Parsing** with error handling
3. **Data Validation** per connection
4. **Node Creation** for new IDs
5. **Distance Storage** in internal map
6. **Layout Calculation** (triangle/force-directed)
7. **Animation Trigger** with connection updates
8. **DOM Rendering** of nodes and connections

## Rate Limiting

The visualizer automatically adapts to message frequency:

- **< 0.5 Hz**: Full animations enabled
- **0.5-2 Hz**: Normal operation  
- **> 2 Hz**: Fast message mode (animations disabled)
- **> 5 Hz**: Warning logged, may drop messages

## Security Considerations

### MQTT Security
- Use SSL/TLS for production deployments
- Implement proper authentication/authorization
- Consider VPN for sensitive positioning data
- Validate data server-side before publishing

### Browser Security
- HTTPS required for SSL MQTT connections
- Cross-origin restrictions apply to MQTT brokers
- No sensitive data stored in browser
- All processing happens client-side

## Troubleshooting API Issues

### Connection Problems
```javascript
// Check broker WebSocket endpoint
const testWS = new WebSocket('wss://your-broker.com:8083/mqtt');
testWS.onopen = () => console.log('WebSocket OK');
testWS.onerror = (e) => console.error('WebSocket failed:', e);
```

### Data Format Issues
```javascript
// Validate your payload locally
function validatePayload(payload) {
    try {
        const data = JSON.parse(payload);
        if (!Array.isArray(data)) throw new Error('Must be array');
        
        data.forEach((conn, i) => {
            if (!Array.isArray(conn) || conn.length !== 3) {
                throw new Error(`Connection ${i+1}: invalid format`);
            }
            if (typeof conn[2] !== 'number' || conn[2] <= 0) {
                throw new Error(`Connection ${i+1}: invalid distance`);
            }
        });
        
        console.log('✅ Payload valid');
        return true;
    } catch (e) {
        console.error('❌ Payload invalid:', e.message);
        return false;
    }
}

// Test your data
validatePayload('[["A","B",1.5],["B","C",2.1]]');
```