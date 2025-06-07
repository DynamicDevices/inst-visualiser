#!/usr/bin/env python3
"""
MQTT Live Publisher for INST Visualizer
Publishes simulated UWB positioning data to DynamicDevices MQTT broker for real-time visualization
Compatible with: https://dynamicdevices.github.io/inst-visualiser/
"""

import json
import time
import random
import math
import argparse
import paho.mqtt.client as mqtt

# Live Demo Broker Settings (Matching index.html from inst-visualiser)
BROKER_HOST = "mqtt.dynamicdevices.co.uk"  # Official demo broker
BROKER_PORT = 8083              # MQTT port (also used for WebSocket in browser)
BROKER_WEBSOCKET_PORT = 8083    # WebSocket port for browser clients
TOPIC = "uwb/positions"         # Topic for UWB positioning data
CLIENT_ID = f"uwb-publisher-{random.randint(1000, 9999)}"

# Authentication (if required by broker)
USERNAME = None  # Set if broker requires authentication
PASSWORD = None  # Set if broker requires authentication

# Simulation parameters
UPDATE_INTERVAL = 1.0  # Seconds between updates
NODES = ["B5A4", "C7F2", "A3E8", "D9B1", "F4C6"]  # Node IDs (B5A4 is gateway)

# Global flags for logging control
QUIET_MODE = False
VERBOSE_MODE = False

class UWBSimulator:
    """Simulates UWB distance measurements between nodes"""
    
    def __init__(self, nodes):
        self.nodes = nodes
        self.positions = self._generate_initial_positions()
        
    def _generate_initial_positions(self):
        """Generate random initial positions for nodes"""
        positions = {}
        for i, node in enumerate(self.nodes):
            # Spread nodes in a rough circle
            angle = (2 * math.pi * i) / len(self.nodes)
            radius = random.uniform(2, 8)  # 2-8 meter radius
            x = radius * math.cos(angle)
            y = radius * math.sin(angle)
            positions[node] = [x, y]
        return positions
    
    def _calculate_distance(self, pos1, pos2):
        """Calculate Euclidean distance between two positions"""
        dx = pos1[0] - pos2[0]
        dy = pos1[1] - pos2[1]
        distance = math.sqrt(dx*dx + dy*dy)
        # Add some realistic noise (±5cm)
        noise = random.uniform(-0.05, 0.05)
        return max(0.1, distance + noise)  # Minimum 10cm distance
    
    def update_positions(self):
        """Slightly move nodes to simulate movement"""
        for node in self.nodes:
            # Small random movement (±10cm per update)
            dx = random.uniform(-0.1, 0.1)
            dy = random.uniform(-0.1, 0.1)
            self.positions[node][0] += dx
            self.positions[node][1] += dy
            
            # Keep nodes within reasonable bounds (0-10m area)
            self.positions[node][0] = max(-5, min(5, self.positions[node][0]))
            self.positions[node][1] = max(-5, min(5, self.positions[node][1]))
    
    def generate_distance_measurements(self):
        """Generate distance measurements between all node pairs"""
        measurements = []
        
        # Generate measurements between all node pairs
        for i in range(len(self.nodes)):
            for j in range(i + 1, len(self.nodes)):
                node1 = self.nodes[i]
                node2 = self.nodes[j]
                
                pos1 = self.positions[node1]
                pos2 = self.positions[node2]
                distance = self._calculate_distance(pos1, pos2)
                
                # Round to reasonable precision (mm)
                distance = round(distance, 3)
                
                measurements.append([node1, node2, distance])
        
        return measurements

class MQTTPublisher:
    """MQTT Publisher for UWB data"""
    
    def __init__(self, broker_host, broker_port, topic, client_id, username=None, password=None):
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.topic = topic
        self.client_id = client_id
        self.username = username
        self.password = password
        
        self.client = mqtt.Client(client_id)
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_publish = self._on_publish
        
        # Set authentication if provided
        if username and password:
            self.client.username_pw_set(username, password)
    
    def _on_connect(self, client, userdata, flags, rc):
        """Callback for successful connection"""
        if rc == 0:
            if not QUIET_MODE:
                print(f"✅ Connected to DynamicDevices MQTT broker {self.broker_host}:{self.broker_port}")
                print(f"📡 Publishing to topic: {self.topic}")
        else:
            if not QUIET_MODE:
                print(f"❌ Connection failed with code {rc}")
                print("💡 Check internet connection and broker availability")
    
    def _on_disconnect(self, client, userdata, rc):
        """Callback for disconnection"""
        if not QUIET_MODE:
            print(f"🔌 Disconnected from MQTT broker (code: {rc})")
    
    def _on_publish(self, client, userdata, mid):
        """Callback for successful publish"""
        if VERBOSE_MODE:
            print(f"📤 Message {mid} published successfully")
    
    def connect(self):
        """Connect to MQTT broker"""
        try:
            if not QUIET_MODE:
                print(f"🔄 Connecting to MQTT broker {self.broker_host}:{self.broker_port}...")
            self.client.connect(self.broker_host, self.broker_port, 60)
            self.client.loop_start()
            return True
        except Exception as e:
            if not QUIET_MODE:
                print(f"❌ Connection error: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from MQTT broker"""
        self.client.loop_stop()
        self.client.disconnect()
    
    def publish_measurements(self, measurements):
        """Publish UWB distance measurements"""
        try:
            # Convert to JSON format expected by visualizer
            payload = json.dumps(measurements)
            
            # Publish message
            result = self.client.publish(self.topic, payload, qos=1)
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                if VERBOSE_MODE:
                    print(f"📊 Published {len(measurements)} distance measurements")
                    for measurement in measurements:
                        node1, node2, distance = measurement
                        print(f"   📏 {node1} ↔ {node2}: {distance:.3f}m")
            else:
                if not QUIET_MODE:
                    print(f"❌ Publish failed with code {result.rc}")
                
        except Exception as e:
            if not QUIET_MODE:
                print(f"❌ Publish error: {e}")

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description="MQTT Live Publisher for INST Visualizer",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python mqtt-live-publisher.py                    # Normal operation with standard logging
  python mqtt-live-publisher.py --quiet            # Minimal logging, only errors and initial setup
  python mqtt-live-publisher.py --verbose          # Detailed logging including all published messages
  python mqtt-live-publisher.py --quiet --verbose  # Only show published messages, no other logs
        """
    )
    
    parser.add_argument(
        "--quiet", "-q",
        action="store_true",
        help="Suppress most log messages after initial setup"
    )
    
    parser.add_argument(
        "--verbose", "-v", 
        action="store_true",
        help="Enable verbose logging including all published messages"
    )
    
    return parser.parse_args()

def main():
    """Main application loop"""
    global QUIET_MODE, VERBOSE_MODE
    
    # Parse command line arguments
    args = parse_arguments()
    QUIET_MODE = args.quiet
    VERBOSE_MODE = args.verbose
    
    # Show initial banner (unless quiet mode)
    if not QUIET_MODE:
        print("🚀 INST Visualizer - MQTT Live Publisher")
        print("=" * 50)
        print(f"🌐 Broker: {BROKER_HOST}:{BROKER_PORT}")
        print(f"📡 Topic: {TOPIC}")
        print(f"🏷️  Client ID: {CLIENT_ID}")
        print(f"⏰ Update interval: {UPDATE_INTERVAL}s")
        print("💡 Note: Using DynamicDevices official demo broker")
        print("   Web UI: https://dynamicdevices.github.io/inst-visualiser/")
        if VERBOSE_MODE:
            print("🔊 Verbose mode: ON - showing all published messages")
        print("=" * 50)
    
    # Initialize simulator and publisher
    simulator = UWBSimulator(NODES)
    publisher = MQTTPublisher(
        BROKER_HOST, BROKER_PORT, TOPIC, CLIENT_ID, 
        USERNAME, PASSWORD
    )
    
    # Connect to broker
    if not publisher.connect():
        if not QUIET_MODE:
            print("❌ Failed to connect to DynamicDevices MQTT broker.")
            print("💡 Troubleshooting:")
            print("   1. Check your internet connection")
            print("   2. Verify broker is accessible: ping mqtt.dynamicdevices.co.uk")
            print("   3. Check if port 8083 is blocked by firewall")
            print("   4. Try the web visualizer to test broker availability")
        return
    
    try:
        if not QUIET_MODE:
            print("🔄 Starting live data simulation...")
            print("Press Ctrl+C to stop")
            print("-" * 50)
        
        message_count = 0
        
        while True:
            # Update node positions (simulate movement)
            simulator.update_positions()
            
            # Generate distance measurements
            measurements = simulator.generate_distance_measurements()
            
            # Publish to MQTT
            publisher.publish_measurements(measurements)
            
            message_count += 1
            if VERBOSE_MODE:
                print(f"📈 Total messages sent: {message_count}")
                print("-" * 30)
            
            # Wait for next update
            time.sleep(UPDATE_INTERVAL)
            
    except KeyboardInterrupt:
        if not QUIET_MODE:
            print("\n🛑 Stopping publisher...")
    except Exception as e:
        if not QUIET_MODE:
            print(f"❌ Unexpected error: {e}")
    finally:
        publisher.disconnect()
        if not QUIET_MODE:
            print("👋 Publisher stopped. Goodbye!")

if __name__ == "__main__":
    # Check if paho-mqtt is installed
    try:
        import paho.mqtt.client as mqtt
    except ImportError:
        print("❌ paho-mqtt library not found!")
        print("📦 Install it with: pip install paho-mqtt")
        exit(1)
    
    main()
