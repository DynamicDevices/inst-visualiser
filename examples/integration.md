# Integration Examples

This document provides practical examples for integrating the INST Tag Visualizer with various UWB systems, IoT platforms, and data sources.

## 🏭 Hardware Integration Examples

### DWM1001 Development Board
```python
"""
Integration with Decawave DWM1001 UWB modules
Reads UART data and publishes to MQTT
"""
import serial
import json
import time
import paho.mqtt.client as mqtt

class DWM1001Reader:
    def __init__(self, port='/dev/ttyACM0', baudrate=115200):
        self.serial = serial.Serial(port, baudrate, timeout=1)
        self.mqtt_client = mqtt.Client()
        
    def parse_dwm_data(self, line):
        """Parse DWM1001 positioning data"""
        try:
            # Example DWM1001 format: "POS,1.23,2.45,0.12,95"
            if line.startswith('POS,'):
                parts = line.strip().split(',')
                x, y, z, quality = map(float, parts[1:5])
                return {'x': x, 'y': y, 'z': z, 'quality': quality}
        except:
            pass
        return None
    
    def distances_from_positions(self, positions):
        """Calculate distances from position data"""
        measurements = []
        node_ids = list(positions.keys())
        
        for i, node1 in enumerate(node_ids):
            for node2 in node_ids[i+1:]:
                pos1, pos2 = positions[node1], positions[node2]
                distance = ((pos1['x'] - pos2['x'])**2 + 
                           (pos1['y'] - pos2['y'])**2)**0.5
                measurements.append([node1, node2, round(distance, 2)])
        
        return measurements
    
    def run(self):
        """Main reading loop"""
        positions = {}
        
        while True:
            line = self.serial.readline().decode('utf-8', errors='ignore')
            if line:
                pos_data = self.parse_dwm_data(line)
                if pos_data:
                    node_id = f"DWM_{int(time.time()) % 1000}"  # Simple ID
                    positions[node_id] = pos_data
                    
                    if len(positions) >= 2:
                        measurements = self.distances_from_positions(positions)
                        payload = json.dumps(measurements)
                        self.mqtt_client.publish('uwb/dwm1001', payload)
                        positions.clear()  # Reset for next batch

# Usage
reader = DWM1001Reader('/dev/ttyUSB0')
reader.run()
```

### Pozyx UWB System
```python
"""
Integration with Pozyx Creator UWB system
Uses Pozyx Python library to get ranging data
"""
import pypozyx
import json
import time
import paho.mqtt.client as mqtt

class PozyxMQTTBridge:
    def __init__(self, port='/dev/ttyACM0'):
        self.pozyx = pypozyx.PozyxSerial(port)
        self.mqtt_client = mqtt.Client()
        self.mqtt_client.connect('localhost', 1883)
        
        # Get list of discovered devices
        self.device_list = pypozyx.DeviceList()
        self.pozyx.doDiscovery(self.device_list)
        
    def get_distance_measurements(self):
        """Get ranging measurements from all device pairs"""
        measurements = []
        devices = [0x0000]  # Local device ID
        
        # Add discovered remote devices  
        for i in range(self.device_list.size()):
            device_id = self.device_list[i]
            devices.append(device_id)
        
        # Get ranges between all pairs
        for i, device1 in enumerate(devices):
            for device2 in devices[i+1:]:
                try:
                    distance = pypozyx.Distance()
                    status = self.pozyx.doRanging(device2, distance, device1)
                    
                    if status == pypozyx.POZYX_SUCCESS:
                        dist_mm = distance.distance
                        dist_m = dist_mm / 1000.0  # Convert to meters
                        
                        # Create readable node IDs
                        node1 = f"PZX_{device1:04X}"
                        node2 = f"PZX_{device2:04X}"
                        
                        measurements.append([node1, node2, round(dist_m, 2)])
                        
                except Exception as e:
                    print(f"Ranging error {device1}->{device2}: {e}")
        
        return measurements
    
    def publish_loop(self, interval=1.0):
        """Continuously publish ranging data"""
        while True:
            measurements = self.get_distance_measurements()
            if measurements:
                payload = json.dumps(measurements)
                self.mqtt_client.publish('uwb/pozyx', payload)
                print(f"Published {len(measurements)} measurements")
            
            time.sleep(interval)

# Usage
bridge = PozyxMQTTBridge()
bridge.publish_loop(interval=2.0)
```

### Custom UWB Module (Arduino/ESP32)
```cpp
// Arduino/ESP32 integration example
// Reads UWB distance data and publishes via WiFi/MQTT

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <SPI.h>

// UWB module communication (example for DW1000)
#include "DW1000Ranging.h"

WiFiClient espClient;
PubSubClient client(espClient);

struct DistanceMeasurement {
    String node1;
    String node2;
    float distance;
    unsigned long timestamp;
};

std::vector<DistanceMeasurement> measurements;
const int MAX_MEASUREMENTS = 20;
const unsigned long PUBLISH_INTERVAL = 2000; // 2 seconds

void setup() {
    Serial.begin(115200);
    
    // Initialize WiFi
    WiFi.begin("YOUR_WIFI_SSID", "YOUR_WIFI_PASSWORD");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    
    // Initialize MQTT
    client.setServer("mqtt.example.com", 1883);
    
    // Initialize UWB ranging
    DW1000Ranging.initCommunication(PIN_RST, PIN_SS, PIN_IRQ);
    DW1000Ranging.attachNewRange(newRange);
    DW1000Ranging.startAsAnchor("82:17:5B:D5:A9:9A:E2:9C", DW1000.MODE_LONGDATA_RANGE_LOWPOWER);
}

void newRange() {
    // Callback when new range measurement is available
    float distance = DW1000Ranging.getDistantDevice()->getRange();
    String remoteAddress = DW1000Ranging.getDistantDevice()->getShortAddress();
    String localAddress = "ESP32_" + String(ESP.getChipId(), HEX);
    
    // Store measurement
    DistanceMeasurement measurement;
    measurement.node1 = localAddress;
    measurement.node2 = "UWB_" + remoteAddress;
    measurement.distance = distance;
    measurement.timestamp = millis();
    
    measurements.push_back(measurement);
    
    // Limit buffer size
    if (measurements.size() > MAX_MEASUREMENTS) {
        measurements.erase(measurements.begin());
    }
}

void publishMeasurements() {
    if (measurements.empty()) return;
    
    DynamicJsonDocument doc(2048);
    JsonArray array = doc.to<JsonArray>();
    
    // Add all measurements to JSON array
    for (const auto& measurement : measurements) {
        JsonArray entry = array.createNestedArray();
        entry.add(measurement.node1);
        entry.add(measurement.node2);
        entry.add(measurement.distance);
    }
    
    String payload;
    serializeJson(doc, payload);
    
    if (client.publish("uwb/esp32/ranging", payload.c_str())) {
        Serial.println("Published " + String(measurements.size()) + " measurements");
        measurements.clear(); // Clear after successful publish
    } else {
        Serial.println("Failed to publish measurements");
    }
}

void loop() {
    static unsigned long lastPublish = 0;
    
    if (!client.connected()) {
        reconnectMQTT();
    }
    
    client.loop();
    DW1000Ranging.loop();
    
    // Publish measurements periodically
    if (millis() - lastPublish > PUBLISH_INTERVAL) {
        publishMeasurements();
        lastPublish = millis();
    }
}

void reconnectMQTT() {
    while (!client.connected()) {
        if (client.connect("ESP32_UWB_" + String(ESP.getChipId(), HEX))) {
            Serial.println("MQTT connected");
        } else {
            delay(5000);
        }
    }
}
```

## 🌐 IoT Platform Integration

### AWS IoT Core Integration
```python
"""
AWS IoT Core integration with device shadows and rules
"""
import json
import boto3
from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient

class AWSIoTUWBBridge:
    def __init__(self, endpoint, cert_path, key_path, ca_path):
        self.mqtt_client = AWSIoTMQTTClient("UWB_Visualizer_Bridge")
        self.mqtt_client.configureEndpoint(endpoint, 8883)
        self.mqtt_client.configureCredentials(ca_path, key_path, cert_path)
        
        # Configure connection
        self.mqtt_client.configureAutoReconnectBackoffTime(1, 32, 20)
        self.mqtt_client.configureOfflinePublishQueueing(-1)
        self.mqtt_client.configureDrainingFrequency(2)
        self.mqtt_client.configureConnectDisconnectTimeout(10)
        self.mqtt_client.configureMQTTOperationTimeout(5)
        
        # Connect
        self.mqtt_client.connect()
        
        # Subscribe to UWB device updates
        self.mqtt_client.subscribe("uwb/+/position", 1, self.on_position_update)
        
        self.device_positions = {}
        
    def on_position_update(self, client, userdata, message):
        """Handle position updates from UWB devices"""
        try:
            topic_parts = message.topic.split('/')
            device_id = topic_parts[1]
            
            payload = json.loads(message.payload.decode())
            self.device_positions[device_id] = {
                'x': payload['x'],
                'y': payload['y'],
                'timestamp': payload.get('timestamp', time.time())
            }
            
            # Calculate distances and publish to visualizer
            measurements = self.calculate_distances()
            if measurements:
                visualizer_payload = json.dumps(measurements)
                self.mqtt_client.publish("visualizer/uwb/data", visualizer_payload, 1)
                
        except Exception as e:
            print(f"Error processing position update: {e}")
    
    def calculate_distances(self):
        """Calculate distances between all device pairs"""
        if len(self.device_positions) < 2:
            return []
            
        measurements = []
        devices = list(self.device_positions.keys())
        
        for i, device1 in enumerate(devices):
            for device2 in devices[i+1:]:
                pos1 = self.device_positions[device1]
                pos2 = self.device_positions[device2]
                
                distance = ((pos1['x'] - pos2['x'])**2 + 
                           (pos1['y'] - pos2['y'])**2)**0.5
                
                measurements.append([device1, device2, round(distance, 2)])
        
        return measurements
    
    def update_device_shadow(self, device_id, position_data):
        """Update AWS IoT device shadow with position"""
        shadow_client = boto3.client('iot-data')
        
        shadow_payload = {
            "state": {
                "reported": {
                    "position": position_data,
                    "lastUpdate": int(time.time())
                }
            }
        }
        
        try:
            shadow_client.update_thing_shadow(
                thingName=device_id,
                payload=json.dumps(shadow_payload)
            )
        except Exception as e:
            print(f"Failed to update shadow for {device_id}: {e}")

# Usage
bridge = AWSIoTUWBBridge(
    endpoint="your-endpoint.iot.region.amazonaws.com",
    cert_path="certificates/device.pem.crt",
    key_path="certificates/private.pem.key", 
    ca_path="certificates/Amazon-root-CA-1.pem"
)
```

### Azure IoT Hub Integration
```python
"""
Azure IoT Hub integration with device twins and telemetry
"""
import json
import asyncio
from azure.iot.device.aio import IoTHubDeviceClient
from azure.iot.device import Message

class AzureIoTUWBBridge:
    def __init__(self, connection_string):
        self.device_client = IoTHubDeviceClient.create_from_connection_string(connection_string)
        self.device_positions = {}
        
    async def connect(self):
        """Connect to Azure IoT Hub"""
        await self.device_client.connect()
        
        # Set up message handler for C2D messages
        self.device_client.on_message_received = self.message_handler
        
    async def message_handler(self, message):
        """Handle cloud-to-device messages"""
        try:
            payload = json.loads(message.data.decode())
            
            if payload.get('type') == 'position_update':
                device_id = payload['device_id']
                position = payload['position']
                
                self.device_positions[device_id] = position
                
                # Calculate and send distance measurements
                measurements = self.calculate_distances()
                if measurements:
                    await self.send_distance_telemetry(measurements)
                    
        except Exception as e:
            print(f"Error handling message: {e}")
    
    async def send_distance_telemetry(self, measurements):
        """Send distance measurements as telemetry"""
        telemetry_data = {
            "measurements": measurements,
            "timestamp": time.time(),
            "device_count": len(self.device_positions)
        }
        
        message = Message(json.dumps(telemetry_data))
        message.content_encoding = "utf-8"
        message.content_type = "application/json"
        message.custom_properties["messageType"] = "distanceTelemetry"
        
        await self.device_client.send_message(message)
        print(f"Sent {len(measurements)} distance measurements to Azure")
    
    async def update_device_twin(self, position_data):
        """Update device twin with current positions"""
        twin_patch = {
            "positions": self.device_positions,
            "lastUpdate": time.time()
        }
        
        await self.device_client.patch_twin_reported_properties(twin_patch)
    
    def calculate_distances(self):
        """Calculate distances between devices"""
        if len(self.device_positions) < 2:
            return []
            
        measurements = []
        devices = list(self.device_positions.keys())
        
        for i, device1 in enumerate(devices):
            for device2 in devices[i+1:]:
                pos1 = self.device_positions[device1]
                pos2 = self.device_positions[device2]
                
                distance = ((pos1['x'] - pos2['x'])**2 + 
                           (pos1['y'] - pos2['y'])**2)**0.5
                
                measurements.append([device1, device2, round(distance, 2)])
        
        return measurements

# Usage
async def main():
    connection_string = "HostName=your-hub.azure-devices.net;DeviceId=uwb-bridge;SharedAccessKey=..."
    bridge = AzureIoTUWBBridge(connection_string)
    await bridge.connect()
    
    # Keep running
    while True:
        await asyncio.sleep(1)

asyncio.run(main())
```

## 📊 Database Integration

### InfluxDB Time Series Storage
```python
"""
Store UWB measurements in InfluxDB for historical analysis
"""
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
import json
import paho.mqtt.client as mqtt

class InfluxDBLogger:
    def __init__(self, url, token, org, bucket):
        self.client = InfluxDBClient(url=url, token=token, org=org)
        self.write_api = self.client.write_api(write_options=SYNCHRONOUS)
        self.query_api = self.client.query_api()
        self.bucket = bucket
        self.org = org
        
    def store_measurements(self, measurements):
        """Store distance measurements in InfluxDB"""
        points = []
        
        for measurement in measurements:
            node1, node2, distance = measurement
            
            point = Point("uwb_distance") \
                .tag("node1", node1) \
                .tag("node2", node2) \
                .tag("pair", f"{min(node1, node2)}-{max(node1, node2)}") \
                .field("distance", float(distance)) \
                .time(time.time_ns())
            
            points.append(point)
        
        self.write_api.write(bucket=self.bucket, org=self.org, record=points)
        
    def get_recent_measurements(self, minutes=5):
        """Get recent measurements for visualization"""
        query = f'''
        from(bucket: "{self.bucket}")
        |> range(start: -{minutes}m)
        |> filter(fn: (r) => r._measurement == "uwb_distance")
        |> last()
        '''
        
        result = self.query_api.query(query)
        measurements = []
        
        for table in result:
            for record in table.records:
                measurements.append([
                    record.values["node1"],
                    record.values["node2"], 
                    record.values["_value"]
                ])
        
        return measurements

class MQTTInfluxBridge:
    def __init__(self, mqtt_broker, influx_config):
        self.mqtt_client = mqtt.Client()
        self.mqtt_client.on_message = self.on_mqtt_message
        self.mqtt_client.connect(mqtt_broker, 1883)
        self.mqtt_client.subscribe("uwb/+")
        
        self.influx = InfluxDBLogger(**influx_config)
        
    def on_mqtt_message(self, client, userdata, message):
        """Handle incoming MQTT messages"""
        try:
            payload = json.loads(message.payload.decode())
            
            # Store in InfluxDB
            self.influx.store_measurements(payload)
            
            # Forward to visualizer (could add filtering/processing here)
            client.publish("visualizer/uwb/data", message.payload)
            
        except Exception as e:
            print(f"Error processing MQTT message: {e}")
    
    def run(self):
        """Start the bridge"""
        self.mqtt_client.loop_forever()

# Usage
influx_config = {
    "url": "http://localhost:8086",
    "token": "your-influx-token", 
    "org": "your-org",
    "bucket": "uwb-data"
}

bridge = MQTTInfluxBridge("localhost", influx_config)
bridge.run()
```

### PostgreSQL Integration
```python
"""
Store UWB data in PostgreSQL with spatial extensions (PostGIS)
"""
import psycopg2
import json
import time
from psycopg2.extras import execute_values

class PostgreSQLUWBStorage:
    def __init__(self, connection_params):
        self.conn = psycopg2.connect(**connection_params)
        self.setup_database()
        
    def setup_database(self):
        """Create tables for UWB data storage"""
        with self.conn.cursor() as cur:
            # Create measurements table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS uwb_measurements (
                    id SERIAL PRIMARY KEY,
                    node1 VARCHAR(50) NOT NULL,
                    node2 VARCHAR(50) NOT NULL,
                    distance FLOAT NOT NULL,
                    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    session_id VARCHAR(50),
                    INDEX (node1, node2, timestamp)
                )
            """)
            
            # Create nodes table for position tracking
            cur.execute("""
                CREATE TABLE IF NOT EXISTS uwb_nodes (
                    id SERIAL PRIMARY KEY,
                    node_id VARCHAR(50) UNIQUE NOT NULL,
                    x_position FLOAT,
                    y_position FLOAT,
                    z_position FLOAT,
                    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    node_type VARCHAR(20) DEFAULT 'tag'
                )
            """)
            
            self.conn.commit()
    
    def store_measurements(self, measurements, session_id=None):
        """Store distance measurements"""
        with self.conn.cursor() as cur:
            data = [(m[0], m[1], m[2], session_id) for m in measurements]
            
            execute_values(
                cur,
                "INSERT INTO uwb_measurements (node1, node2, distance, session_id) VALUES %s",
                data
            )
            
            self.conn.commit()
    
    def update_node_position(self, node_id, x, y, z=None):
        """Update calculated node position"""
        with self.conn.cursor() as cur:
            cur.execute("""
                INSERT INTO uwb_nodes (node_id, x_position, y_position, z_position)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (node_id) 
                DO UPDATE SET 
                    x_position = EXCLUDED.x_position,
                    y_position = EXCLUDED.y_position,
                    z_position = EXCLUDED.z_position,
                    last_seen = NOW()
            """, (node_id, x, y, z))
            
            self.conn.commit()
    
    def get_recent_measurements(self, minutes=5):
        """Get recent measurements for visualization"""
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT DISTINCT ON (LEAST(node1, node2), GREATEST(node1, node2))
                    node1, node2, distance
                FROM uwb_measurements 
                WHERE timestamp > NOW() - INTERVAL '%s minutes'
                ORDER BY LEAST(node1, node2), GREATEST(node1, node2), timestamp DESC
            """, (minutes,))
            
            return cur.fetchall()
    
    def get_node_positions(self):
        """Get current node positions"""
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT node_id, x_position, y_position, z_position
                FROM uwb_nodes 
                WHERE last_seen > NOW() - INTERVAL '1 hour'
            """)
            
            return {row[0]: {'x': row[1], 'y': row[2], 'z': row[3]} 
                    for row in cur.fetchall()}

# Usage
db_config = {
    "host": "localhost",
    "database": "uwb_tracking", 
    "user": "uwb_user",
    "password": "password"
}

storage = PostgreSQLUWBStorage(db_config)

# Store sample measurements
measurements = [["A", "B", 1.5], ["B", "C", 2.1]]
storage.store_measurements(measurements, session_id="test_session_1")
```

## 🔄 Real-time Processing Examples

### Apache Kafka Integration
```python
"""
Use Kafka for high-throughput UWB data streaming
"""
from kafka import KafkaProducer, KafkaConsumer
import json
import time

class KafkaUWBProducer:
    def __init__(self, bootstrap_servers):
        self.producer = KafkaProducer(
            bootstrap_servers=bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            key_serializer=lambda k: k.encode('utf-8') if k else None
        )
        
    def send_measurements(self, measurements, source_id="unknown"):
        """Send measurements to Kafka topic"""
        message = {
            "timestamp": time.time(),
            "source": source_id,
            "measurements": measurements
        }
        
        # Send to partitioned topic for scaling
        self.producer.send('uwb-measurements', value=message, key=source_id)
        self.producer.flush()

class KafkaUWBConsumer:
    def __init__(self, bootstrap_servers, group_id):
        self.consumer = KafkaConsumer(
            'uwb-measurements',
            bootstrap_servers=bootstrap_servers,
            group_id=group_id,
            value_deserializer=lambda m: json.loads(m.decode('utf-8'))
        )
        
    def process_stream(self, callback):
        """Process UWB measurement stream"""
        for message in self.consumer:
            try:
                data = message.value
                measurements = data['measurements']
                source = data['source']
                
                # Process measurements
                callback(measurements, source)
                
            except Exception as e:
                print(f"Error processing message: {e}")

# Usage
producer = KafkaUWBProducer(['localhost:9092'])
consumer = KafkaUWBConsumer(['localhost:9092'], 'visualizer-group')

def forward_to_visualizer(measurements, source):
    """Forward processed measurements to visualizer MQTT"""
    mqtt_client.publish('visualizer/uwb/data', json.dumps(measurements))

consumer.process_stream(forward_to_visualizer)
```

These integration examples provide starting points for connecting the INST Tag Visualizer to various UWB hardware, IoT platforms, and data systems. Each example can be adapted to your specific requirements and infrastructure.