# MQTT Live Publisher Example

## Overview

This example demonstrates how to publish simulated UWB positioning data to the INST Visualizer using MQTT. The publisher connects to the DynamicDevices MQTT broker and sends realistic distance measurements between UWB nodes for real-time visualization.

## Features

- ✅ **Official Broker Integration**: Uses `mqtt.dynamicdevices.co.uk` (matches web app defaults)
- ✅ **Realistic UWB Simulation**: Generates authentic distance measurements with noise
- ✅ **Command Line Options**: `--quiet` and `--verbose` modes for different use cases
- ✅ **Node Movement**: Simulates realistic tag/anchor positioning changes
- ✅ **Error Handling**: Robust connection management with helpful troubleshooting
- ✅ **Compatible Data Format**: Works seamlessly with the web visualizer

## What I Fixed

The original `mqtt-live-publisher.py` has been updated to match the **exact broker settings** used in the `index.html` file of the inst-visualiser project.

### Key Changes Made:

1. **Broker Settings**: Updated to use `mqtt.dynamicdevices.co.uk` (official demo broker)
2. **Port Configuration**: Set to use port 8083 (WebSocket port used by the web application)
3. **Topic Structure**: Changed to `uwb/positions` which matches the actual topic used by the visualizer
4. **Data Format**: Ensures JSON format matches what the visualizer expects: `[["node1","node2",distance], ...]`
5. **Client ID**: Added random client ID generation to avoid conflicts
6. **Error Handling**: Improved connection handling and error reporting
7. **Simulation**: Enhanced UWB node simulation with realistic movement and measurements

## Official INST Visualizer Settings

### Default Configuration (matches index.html exactly):
```python
BROKER_HOST = "mqtt.dynamicdevices.co.uk"  # Official DynamicDevices broker
BROKER_PORT = 8083                         # WebSocket port
TOPIC = "uwb/positions"                    # UWB positioning topic
USERNAME = None                            # No authentication required
PASSWORD = None
```

## Web Visualizer Settings

When using the [INST Visualizer web app](https://dynamicdevices.github.io/inst-visualiser/), the default settings are:

- **Broker Host**: `mqtt.dynamicdevices.co.uk`
- **Broker Port**: `8083` (WebSocket port)
- **Topic**: `uwb/positions`
- **SSL**: Enabled automatically for secure connections

These settings are pre-configured in the web application and match exactly what the Python publisher uses.

## Alternative Broker Options

### Option 1: Local Development
```python
BROKER_HOST = "localhost"       # Local Mosquitto broker
BROKER_PORT = 1883              # Standard MQTT port
BROKER_WEBSOCKET_PORT = 8083    # WebSocket port for browser
TOPIC = "uwb/positions"         # Keep same topic
USERNAME = None
PASSWORD = None
```

### Option 2: Free Public Broker (for testing)
```python
BROKER_HOST = "broker.emqx.io"
BROKER_PORT = 1883              # For direct MQTT connections
BROKER_WEBSOCKET_PORT = 8083    # For WebSocket connections
TOPIC = "uwb/positions"         # Keep same topic
USERNAME = None
PASSWORD = None
```

### Option 3: EMQX Cloud Service
```python
BROKER_HOST = "your-deployment.emqxsl.com"
BROKER_PORT = 8883              # SSL/TLS port
BROKER_WEBSOCKET_PORT = 8084    # WebSocket SSL port
TOPIC = "uwb/positions"         # Keep same topic
USERNAME = "your_username"
PASSWORD = "your_password"
```

## Data Format

The visualizer expects JSON arrays with distance measurements:

```json
[
  ["B5A4", "C7F2", 2.345],
  ["B5A4", "A3E8", 3.678], 
  ["C7F2", "A3E8", 1.234],
  ["A3E8", "D9B1", 2.890]
]
```

### Format Rules:
- Array of arrays, each containing `[node_id_1, node_id_2, distance_in_meters]`
- String node IDs (4-digit alphanumeric identifiers)
- Numeric distances in meters
- Node "B5A4" is automatically styled as a gateway (red color)

## Installation & Usage

1. **Install Dependencies**:
   ```bash
   pip install paho-mqtt
   ```

2. **Run the Publisher**:
   ```bash
   python mqtt-live-publisher.py
   ```

3. **Open the Visualizer**:
   - Go to https://dynamicdevices.github.io/inst-visualiser/
   - Configure broker settings as shown above
   - Click "Connect"
   - Watch real-time positioning data!

## Troubleshooting

### Connection Issues
- ✅ Check broker URL and port
- ✅ Verify internet connectivity
- ✅ Try "Start Simulation" in visualizer to test without MQTT
- ✅ Check firewall settings

### Data Not Appearing
- ✅ Verify topic names match between publisher and visualizer
- ✅ Check JSON format in console logs
- ✅ Ensure broker allows the topic structure
- ✅ Try subscribing with an MQTT client (like MQTTX) to verify messages

### Performance Issues
- ✅ Reduce update frequency (increase `UPDATE_INTERVAL`)
- ✅ Limit number of nodes in simulation
- ✅ Use QoS 0 for higher throughput
- ✅ Enable "Fast Message Mode" in visualizer

## Security Notes

⚠️ **Important**: The public broker `broker.emqx.io` is for testing only!
- Messages are visible to all connected clients
- No encryption for data in transit
- Not suitable for production use

For production deployments:
- Use private MQTT brokers
- Enable SSL/TLS encryption
- Implement proper authentication
- Use access control lists (ACLs)

## Advanced Configuration

### Custom Node Configuration
```python
# Modify the NODES list for your setup
NODES = ["B5A4", "C7F2", "A3E8", "D9B1", "F4C6", "E2G9"]

# Or load from configuration file
import json
with open('nodes.json', 'r') as f:
    NODES = json.load(f)
```

### Multiple Publisher Setup
```python
# Run multiple publishers with different client IDs
CLIENT_ID = f"uwb-publisher-zone-a-{random.randint(1000, 9999)}"
TOPIC = "uwb/zone-a/distances"
```

### Quality of Service (QoS)
```python
# In the publish_measurements method:
result = self.client.publish(self.topic, payload, qos=0)  # Fire and forget
result = self.client.publish(self.topic, payload, qos=1)  # At least once
result = self.client.publish(self.topic, payload, qos=2)  # Exactly once
```

Happy positioning! 🎯