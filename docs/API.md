# MQTT API Documentation

This document describes the MQTT API for the UWB Position Visualiser v3.0.

## Connection Configuration

### **Broker Settings**
- **Host**: Your MQTT broker hostname or IP address
- **Port**: WebSocket port (typically 8083 for SSL, 8080 for plain)
- **Protocol**: WebSocket (WS) or WebSocket Secure (WSS)
- **Client ID**: Automatically generated: `uwb_visualiser_[random]`

### **Auto-Detection Strategy**
The visualizer attempts connections in this order:
1. WSS with `/mqtt` path
2. WSS with root path
3. WS with `/mqtt` path (fallback)
4. WS with root path (fallback)

## Data Topics

### **Position Data Topic**
**Default**: `uwb/positions`

**Message Format**:
```json
[
  ["node_id_1", "node_id_2", distance_in_meters],
  ["node_id_1", "node_id_3", distance_in_meters],
  ["node_id_2", "node_id_3", distance_in_meters]
]
```

**Example**:
```json
[
  ["B5A4", "R001", 2.34],
  ["R001", "R002", 1.78],
  ["R002", "R003", 3.12],
  ["B5A4", "R003", 2.95]
]
```

### **Command Topic**
**Format**: `{base_topic}/cmd`
**Example**: `uwb/positions/cmd`

**Supported Commands**:
```bash
# Set device update rate (seconds)
set rate_limit 5

# Future commands (not yet implemented)
set power_level 10
get device_status
reset_calibration
```

## Message Properties

### **QoS Levels**
- **Subscription**: QoS 0 (default)
- **Commands**: QoS 1 (ensure delivery)

### **Retained Messages**
- Supported for persistent device state
- Last known positions retained on broker

### **Keep Alive**
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Auto-reconnect**: Enabled

## Data Validation

### **Node ID Format**
- **Type**: String
- **Length**: Any (displayed truncated if >4 characters)
- **Special**: "B5A4" automatically detected as gateway
- **Examples**: "A001", "R001", "A1B2", "B5A4"

### **Distance Format**
- **Type**: Number (float/integer)
- **Range**: 0.1 to 50.0 meters (recommended)
- **Precision**: Displayed to 1 decimal place
- **Units**: Meters only

### **Accuracy Classification**
- **Accurate** (✓): 0.5m ≤ distance ≤ 8.0m
- **Approximate** (⚠): distance > 8.0m or < 0.5m
- **Invalid** (❌): distance ≤ 0 or non-numeric

## Error Handling

### **Connection Errors**
```javascript
// Connection lost
{
  errorCode: 8,
  errorMessage: "Connection lost"
}

// Authentication failed
{
  errorCode: 4,
  errorMessage: "Bad username or password"
}

// Connection refused
{
  errorCode: 3,
  errorMessage: "Connection refused"
}
```

### **Message Errors**
```javascript
// Invalid JSON
{
  error: "Failed to parse message",
  payload: "invalid json string"
}

// Invalid format
{
  error: "Invalid message format - expected array",
  payload: {"not": "array"}
}
```

## Security

### **SSL/TLS Support**
- **WSS**: Preferred for production
- **Certificate validation**: Browser-based
- **Ports**: 8083 (common), 8084, 443, 9001

### **Authentication**
- **Username/Password**: Supported
- **Client certificates**: Browser-dependent
- **API keys**: Can be embedded in client ID

## Publishing Examples

### **Python Example**
```python
import paho.mqtt.client as mqtt
import json
import time

# UWB distance measurements
distances = [
    ["A001", "T001", 2.34],
    ["A001", "T002", 4.56],
    ["A002", "T001", 1.78],
    ["A002", "T002", 3.21]
]

# Connect and publish
client = mqtt.Client()
client.connect("your-broker.com", 1883)
client.publish("uwb/positions", json.dumps(distances))
client.disconnect()
```

### **Node.js Example**
```javascript
const mqtt = require('mqtt');

const client = mqtt.connect('mqtt://your-broker.com:1883');

client.on('connect', () => {
  const distances = [
    ["B5A4", "R001", 2.0],
    ["R001", "R002", 1.5],
    ["R002", "R003", 3.2]
  ];
  
  client.publish('uwb/positions', JSON.stringify(distances));
  client.end();
});
```

### **Arduino/ESP32 Example**
```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

WiFiClient espClient;
PubSubClient client(espClient);

void publishUWBData() {
  StaticJsonDocument<200> doc;
  JsonArray distances = doc.to<JsonArray>();
  
  JsonArray measurement1 = distances.createNestedArray();
  measurement1.add("E001");
  measurement1.add("A001");
  measurement1.add(2.34);
  
  JsonArray measurement2 = distances.createNestedArray();
  measurement2.add("E001");
  measurement2.add("A002");
  measurement2.add(1.78);
  
  String payload;
  serializeJson(doc, payload);
  
  client.publish("uwb/positions", payload.c_str());
}
```

## Testing & Debugging

### **MQTT Test Tools**
- **MQTT.fx**: GUI client for testing
- **mosquitto_pub**: Command line publishing
- **MQTT Explorer**: Real-time message monitoring

### **Browser Console**
Enable debug mode in visualizer to see:
```javascript
// Connection events
📡 Connected to MQTT broker successfully
📡 Subscribed to topic: uwb/positions

// Message processing
📨 MQTT message received: [["A","B",1.5]]
🔄 Processing message #1 with 1 distance measurements

// Physics events (debug mode)
📏 Spring connection A-B: 1.50m (ultra-fast physics)
⚡ Nodes move ~100x faster - near-instant equilibrium!
```

### **Common Issues**
1. **WebSocket not enabled**: Ensure broker supports WebSocket
2. **CORS errors**: Configure broker to allow web client origins
3. **SSL certificate issues**: Use valid certificates or plain WS for testing
4. **Topic permissions**: Verify client can subscribe to data topic
5. **Message format**: Ensure JSON array format is correct

## Integration Patterns

### **Real-time Streaming**
```python
# Continuous data streaming
while True:
    # Get UWB measurements from hardware
    distances = get_uwb_distances()  # Returns [["A001","T001",2.3],...]
    
    # Publish to MQTT
    client.publish("uwb/positions", json.dumps(distances))
    
    # Control update rate (recommended: 1-5Hz)
    time.sleep(1.0)
```

### **Batch Processing**
```python
# Collect multiple measurements
batch = []
for i in range(10):
    distances = get_uwb_distances()
    batch.extend(distances)

# Send as single message
client.publish("uwb/positions", json.dumps(batch))
```

### **Device Management**
```python
# Send rate limit command
client.publish("uwb/positions/cmd", "set rate_limit 2")

# Subscribe to device responses (future feature)
client.subscribe("uwb/positions/status")
```

## Performance Considerations

### **Message Frequency**
- **Recommended**: 1-5 Hz (1-5 messages per second)
- **Maximum**: 10 Hz (physics can handle higher, but network overhead)
- **Minimum**: 0.1 Hz (10 seconds between updates)

### **Message Size**
- **Typical**: 50-200 bytes per message
- **Maximum**: 1MB (MQTT limit)
- **Optimal**: <1KB for best performance

### **Network Optimization**
- Use retained messages for device state
- Implement QoS 1 for critical commands
- Consider message compression for large datasets
- Use WebSocket compression if supported by broker