# Integration Guide - UWB Position Visualiser v3.4

This guide explains how to integrate the UWB Position Visualiser with various systems and data sources.

## Quick Start Integration

### **1. Test with Sample Data**

```bash
# Clone repository
git clone https://github.com/DynamicDevices/inst-visualiser.git
cd inst-visualiser

# Start local web server
python3 -m http.server 8080

# Open browser to http://localhost:8080
# Click "Start Simulation" to see built-in test data
```

### **2. Test with Python Publisher**

```bash
# Install dependencies
pip install paho-mqtt numpy

# Run simulation publisher
python examples/mqtt-publisher.py --broker test.mosquitto.org --topic uwb/test

# In visualiser:
# - Set broker to: test.mosquitto.org
# - Set topic to: uwb/test  
# - Click Connect
```

## Integration Patterns

### **Pattern 1: Direct Hardware Integration**

```python
# Real-time UWB device integration
import serial
import json
import paho.mqtt.client as mqtt

# Connect to UWB device
uwb_device = serial.Serial('/dev/ttyUSB0', 115200)
mqtt_client = mqtt.Client()
mqtt_client.connect('your-broker.com', 1883)

while True:
    # Read UWB measurement
    line = uwb_device.readline().decode().strip()
    
    # Parse device-specific format
    # Example: "A001,A002,2.34" -> [["A001", "A002", 2.34]]
    parts = line.split(',')
    if len(parts) == 3:
        node1, node2, distance = parts[0], parts[1], float(parts[2])
        data = [[node1, node2, distance]]
        
        # Publish to visualiser
        mqtt_client.publish('uwb/positions', json.dumps(data))
```

### **Pattern 2: Data Processing Pipeline**

```python
# Batch processing with filtering and validation
import json
from typing import List, Tuple

class UWBDataProcessor:
    def __init__(self, min_distance=0.1, max_distance=50.0):
        self.min_distance = min_distance
        self.max_distance = max_distance
        
    def validate_measurement(self, distance: float) -> bool:
        """Validate distance measurement"""
        return self.min_distance <= distance <= self.max_distance
        
    def filter_data(self, raw_data: List[Tuple[str, str, float]]) -> List[Tuple[str, str, float]]:
        """Filter and clean measurement data"""
        filtered = []
        for node1, node2, distance in raw_data:
            if self.validate_measurement(distance):
                # Round to reasonable precision
                distance = round(distance, 2)
                filtered.append((node1, node2, distance))
        return filtered
        
    def process_batch(self, measurements: List[Tuple[str, str, float]]) -> str:
        """Process batch of measurements for MQTT"""
        filtered = self.filter_data(measurements)
        # Convert to visualiser format
        data = [[node1, node2, dist] for node1, node2, dist in filtered]
        return json.dumps(data)

# Usage
processor = UWBDataProcessor()
raw_measurements = [("A001", "A002", 2.34), ("A002", "A003", 1.78), ("A001", "A003", 3.12)]
mqtt_message = processor.process_batch(raw_measurements)
```

### **Pattern 3: Multi-Source Aggregation**

```python
# Combine data from multiple UWB systems
import asyncio
import json
from concurrent.futures import ThreadPoolExecutor

class MultiSourceAggregator:
    def __init__(self, mqtt_client):
        self.mqtt_client = mqtt_client
        self.sources = []
        self.aggregated_data = {}
        
    def add_source(self, source_id: str, reader_func):
        """Add a data source"""
        self.sources.append((source_id, reader_func))
        
    async def collect_data(self):
        """Collect data from all sources"""
        with ThreadPoolExecutor() as executor:
            tasks = []
            for source_id, reader_func in self.sources:
                task = asyncio.get_event_loop().run_in_executor(
                    executor, reader_func
                )
                tasks.append((source_id, task))
                
            # Wait for all sources
            for source_id, task in tasks:
                try:
                    data = await task
                    if data:
                        self.aggregated_data[source_id] = data
                except Exception as e:
                    print(f"Error from source {source_id}: {e}")
                    
    def publish_aggregated(self):
        """Publish combined data"""
        all_measurements = []
        for source_data in self.aggregated_data.values():
            all_measurements.extend(source_data)
            
        if all_measurements:
            message = json.dumps(all_measurements)
            self.mqtt_client.publish('uwb/positions', message)
            
# Usage
aggregator = MultiSourceAggregator(mqtt_client)
aggregator.add_source("building1", read_building1_uwb)
aggregator.add_source("building2", read_building2_uwb)

# Run collection loop
while True:
    await aggregator.collect_data()
    aggregator.publish_aggregated()
    await asyncio.sleep(1.0)
```

## Platform-Specific Integration

### **Arduino/ESP32 Integration**

```cpp
// Arduino UWB Publisher Example
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

WiFiClient espClient;
PubSubClient client(espClient);

// UWB measurement structure
struct UWBMeasurement {
    String node1;
    String node2;
    float distance;
};

void publishUWBData(UWBMeasurement measurements[], int count) {
    // Create JSON array
    DynamicJsonDocument doc(1024);
    JsonArray array = doc.to<JsonArray>();
    
    for (int i = 0; i < count; i++) {
        JsonArray measurement = array.createNestedArray();
        measurement.add(measurements[i].node1);
        measurement.add(measurements[i].node2);
        measurement.add(measurements[i].distance);
    }
    
    // Serialize and publish
    String payload;
    serializeJson(doc, payload);
    client.publish("uwb/positions", payload.c_str());
}

void loop() {
    // Read UWB measurements (device-specific)
    UWBMeasurement measurements[10];
    int count = readUWBDevice(measurements);
    
    if (count > 0) {
        publishUWBData(measurements, count);
    }
    
    delay(500); // 2Hz update rate
}
```

### **ROS Integration**

```python
#!/usr/bin/env python3
# ROS node for UWB visualization
import rospy
import json
import paho.mqtt.client as mqtt
from geometry_msgs.msg import PoseArray, Pose
from std_msgs.msg import String

class UWBVisualizerBridge:
    def __init__(self):
        rospy.init_node('uwb_visualizer_bridge')
        
        # ROS subscribers
        self.pose_sub = rospy.Subscriber('/uwb/poses', PoseArray, self.pose_callback)
        self.distance_sub = rospy.Subscriber('/uwb/distances', String, self.distance_callback)
        
        # MQTT client
        broker = rospy.get_param('~mqtt_broker', 'localhost')
        topic = rospy.get_param('~mqtt_topic', 'uwb/positions')
        
        self.mqtt_client = mqtt.Client()
        self.mqtt_client.connect(broker, 1883)
        self.topic = topic
        
    def pose_callback(self, msg):
        """Convert ROS poses to distance measurements"""
        # Calculate distances between all pose pairs
        distances = []
        for i, pose1 in enumerate(msg.poses):
            for j, pose2 in enumerate(msg.poses[i+1:], i+1):
                dist = self.calculate_distance(pose1, pose2)
                distances.append([f"R{i:03d}", f"R{j:03d}", dist])
        
        # Publish to visualizer
        if distances:
            self.mqtt_client.publish(self.topic, json.dumps(distances))
            
    def distance_callback(self, msg):
        """Forward distance data directly"""
        try:
            data = json.loads(msg.data)
            self.mqtt_client.publish(self.topic, msg.data)
        except json.JSONDecodeError:
            rospy.logwarn(f"Invalid JSON: {msg.data}")
            
    def calculate_distance(self, pose1, pose2):
        """Calculate distance between two poses"""
        dx = pose1.position.x - pose2.position.x
        dy = pose1.position.y - pose2.position.y
        dz = pose1.position.z - pose2.position.z
        return (dx*dx + dy*dy + dz*dz) ** 0.5

if __name__ == '__main__':
    bridge = UWBVisualizerBridge()
    rospy.spin()
```

### **InfluxDB Integration**

```python
# Store and replay UWB data from InfluxDB
from influxdb_client import InfluxDBClient
import json
import paho.mqtt.client as mqtt
from datetime import datetime, timedelta

class InfluxUWBReplay:
    def __init__(self, influx_url, token, org, bucket):
        self.client = InfluxDBClient(url=influx_url, token=token, org=org)
        self.query_api = self.client.query_api()
        self.bucket = bucket
        self.org = org
        
    def query_historical_data(self, start_time, end_time):
        """Query historical UWB data"""
        query = f'''
        from(bucket: "{self.bucket}")
        |> range(start: {start_time}, stop: {end_time})
        |> filter(fn: (r) => r._measurement == "uwb_distance")
        |> group(columns: ["_time"])
        '''
        
        result = self.query_api.query(query=query)
        
        # Group measurements by timestamp
        time_groups = {}
        for table in result:
            for record in table.records:
                timestamp = record.get_time()
                if timestamp not in time_groups:
                    time_groups[timestamp] = []
                    
                time_groups[timestamp].append([
                    record.values.get('node1'),
                    record.values.get('node2'),
                    record.values.get('_value')
                ])
                
        return time_groups
        
    def replay_data(self, mqtt_client, topic, speed_factor=1.0):
        """Replay historical data at specified speed"""
        # Get last hour of data
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=1)
        
        data = self.query_historical_data(start_time, end_time)
        
        # Replay in chronological order
        timestamps = sorted(data.keys())
        for i, timestamp in enumerate(timestamps):
            measurements = data[timestamp]
            
            # Publish to visualizer
            mqtt_client.publish(topic, json.dumps(measurements))
            
            # Calculate delay to next measurement
            if i < len(timestamps) - 1:
                next_timestamp = timestamps[i + 1]
                delay = (next_timestamp - timestamp).total_seconds()
                time.sleep(delay / speed_factor)

# Usage
replayer = InfluxUWBReplay(
    "http://localhost:8086", 
    "your-token", 
    "your-org", 
    "uwb-data"
)
mqtt_client = mqtt.Client()
mqtt_client.connect("localhost", 1883)
replayer.replay_data(mqtt_client, "uwb/positions", speed_factor=2.0)
```

## Advanced Configuration

### **Custom Physics Parameters**

```javascript
// Configure visualizer physics via URL parameters
// https://your-site.com/inst-visualiser/?spring=1.5&damping=0.7&mass=0.3

// Or programmatically via browser console:
if (window.visualizer) {
    // Advanced mode (default v3.4)
    visualizer.physics.springConstant = 2.0;
    visualizer.physics.damping = 0.6;
    visualizer.physics.mass = 0.2;
    
    // Smooth mode for presentations
    visualizer.physics.springConstant = 0.5;
    visualizer.physics.damping = 0.8;
    visualizer.physics.mass = 0.5;
    
    // High-precision mode
    visualizer.physics.springConstant = 1.0;
    visualizer.physics.damping = 0.9;
    visualizer.physics.mass = 0.1;
}
```

### **Custom Node Styling**

```javascript
// Add custom node detection and styling
if (window.visualizer) {
    // Override node creation
    const originalEnsureNode = visualizer.ensureNodeExists;
    visualizer.ensureNodeExists = function(nodeId) {
        originalEnsureNode.call(this, nodeId);
        
        const node = this.nodes.get(nodeId);
        
        // Custom gateway detection
        if (nodeId.startsWith('GW_') || nodeId.includes('GATEWAY')) {
            node.type = 'gateway';
        }
        
        // Custom mobile device detection
        if (nodeId.startsWith('MOBILE_') || nodeId.includes('TAG')) {
            node.type = 'mobile';
            // Add custom styling in CSS
        }
    };
}
```

### **Performance Optimization**

```python
# High-frequency data optimization
class HighFrequencyPublisher:
    def __init__(self, mqtt_client, topic, max_rate=10.0):
        self.mqtt_client = mqtt_client
        self.topic = topic
        self.max_rate = max_rate
        self.last_publish = 0.0
        self.buffer = []
        
    def add_measurement(self, node1, node2, distance):
        """Add measurement to buffer"""
        self.buffer.append([node1, node2, distance])
        
        # Publish if rate limit allows
        now = time.time()
        if now - self.last_publish >= (1.0 / self.max_rate):
            self.flush_buffer()
            
    def flush_buffer(self):
        """Publish buffered measurements"""
        if self.buffer:
            self.mqtt_client.publish(self.topic, json.dumps(self.buffer))
            self.buffer = []
            self.last_publish = time.time()

# Usage for different scenarios
low_power_publisher = HighFrequencyPublisher(mqtt_client, "uwb/positions", max_rate=0.1)  # Every 10s
demo_publisher = HighFrequencyPublisher(mqtt_client, "uwb/positions", max_rate=1.0)       # Every 1s  
realtime_publisher = HighFrequencyPublisher(mqtt_client, "uwb/positions", max_rate=5.0)   # Every 0.2s

# Add measurements as they arrive
while True:
    measurement = read_uwb_device()
    publisher.add_measurement(*measurement)
```

## Troubleshooting Integration

### **Common Issues**

1. **MQTT Connection Fails**
   ```bash
   # Test broker connectivity
   mosquitto_pub -h your-broker.com -p 1883 -t test -m "hello"
   
   # Check WebSocket support
   # Most brokers need WebSocket enabled on different port (8083/8084)
   ```

2. **Data Not Appearing**
   ```python
   # Verify message format
   import json
   data = [["A001", "A002", 1.5]]
   message = json.dumps(data)
   print(f"Message: {message}")  # Should be: [["A001","A002",1.5]]
   ```

3. **Performance Issues**
   ```python
   # Reduce message frequency
   time.sleep(0.5)  # 2Hz maximum recommended
   
   # Batch measurements
   measurements = collect_multiple_measurements()
   mqtt_client.publish(topic, json.dumps(measurements))
   ```

4. **Physics Not Working**
   - Check browser console for errors
   - Verify nodes have valid positions
   - Try "Reset Physics" button in visualizer
   - Ensure distance measurements are reasonable (0.1-50m)

### **Debug Tools**

```bash
# Monitor MQTT traffic
mosquitto_sub -h your-broker.com -v -t "uwb/#"

# Test visualizer with curl (if HTTP bridge available)
curl -X POST -H "Content-Type: application/json" \
  -d '[["A001","A002",1.5],["A002","A003",2.0]]' \
  http://your-broker.com/mqtt/publish/uwb/positions

# Browser console debugging
# Open visualizer, press F12, run:
window.debugVisualizer();  // Shows debug info
visualizer.logInfo("Custom debug message");
```

## Best Practices

1. **Data Quality**
   - Filter invalid distances (< 0.1m or > 50m)
   - Add realistic measurement noise for simulation
   - Handle missing or stale data gracefully

2. **Performance**
   - Limit update rate to 1-5Hz for best experience
   - Batch multiple measurements when possible
   - Use QoS 1 for critical commands

3. **Reliability**
   - Implement auto-reconnection for MQTT
   - Handle network interruptions gracefully
   - Validate data before publishing

4. **Security**
   - Use SSL/TLS for production deployments
   - Implement proper authentication
   - Validate all input data

5. **User Experience**
   - Provide clear error messages
   - Show connection status
   - Allow physics parameter adjustment
   - Include simulation mode for testing