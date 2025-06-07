#!/usr/bin/env python3
"""
MQTT Publisher Example for INST Tag Visualizer (Simulation)
Publishes sample UWB positioning data to MQTT broker

This is a simulation example. For real hardware integration, 
see mqtt-uwb-publisher.py (SynchronicIT implementation).

Usage:
    python mqtt-publisher-sim.py --broker mqtt.example.com --topic uwb/positioning
    python mqtt-publisher-sim.py --simulate  # Use built-in simulation data
"""

import argparse
import json
import time
import random
import math
import sys
from typing import List, Tuple, Dict, Any
import logging

try:
    import paho.mqtt.client as mqtt
except ImportError:
    print("Error: paho-mqtt library not installed")
    print("Install with: pip install paho-mqtt")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class UWBSimulator:
    """Simulates UWB distance measurements with realistic noise and movement"""
    
    def __init__(self):
        self.nodes = {
            'B5A4': {'x': 0, 'y': 0, 'type': 'gateway'},      # Gateway at origin
            'Room1': {'x': 3, 'y': 2, 'type': 'anchor'},      # Fixed anchor
            'Room2': {'x': -2, 'y': 4, 'type': 'anchor'},     # Fixed anchor
            'TAG001': {'x': 1, 'y': 1, 'type': 'mobile'},     # Mobile tag
            'TAG002': {'x': -1, 'y': 2, 'type': 'mobile'},    # Mobile tag
        }
        self.time_step = 0
        self.noise_level = 0.1  # 10cm noise
        
    def update_positions(self):
        """Update mobile tag positions with simulated movement"""
        self.time_step += 1
        t = self.time_step * 0.1  # Time in arbitrary units
        
        # Move TAG001 in a circular pattern
        if 'TAG001' in self.nodes:
            self.nodes['TAG001']['x'] = 2 * math.cos(t) + 1
            self.nodes['TAG001']['y'] = 2 * math.sin(t) + 2
            
        # Move TAG002 in a figure-8 pattern
        if 'TAG002' in self.nodes:
            self.nodes['TAG002']['x'] = 1.5 * math.sin(t * 2)
            self.nodes['TAG002']['y'] = 1.5 * math.sin(t) + 3
    
    def calculate_distance(self, node1: str, node2: str) -> float:
        """Calculate distance between two nodes with realistic noise"""
        pos1 = self.nodes[node1]
        pos2 = self.nodes[node2]
        
        # True distance
        dx = pos1['x'] - pos2['x']
        dy = pos1['y'] - pos2['y']
        true_distance = math.sqrt(dx * dx + dy * dy)
        
        # Add realistic measurement noise
        noise = random.gauss(0, self.noise_level)
        measured_distance = max(0.1, true_distance + noise)  # Minimum 10cm
        
        return round(measured_distance, 2)
    
    def get_measurements(self, include_mobile: bool = True) -> List[List]:
        """Generate realistic distance measurements"""
        measurements = []
        node_ids = list(self.nodes.keys())
        
        # Update mobile positions
        self.update_positions()
        
        # Generate measurements between all node pairs
        for i, node1 in enumerate(node_ids):
            for j, node2 in enumerate(node_ids[i+1:], i+1):
                # Skip mobile-to-mobile measurements occasionally (realistic)
                if (self.nodes[node1]['type'] == 'mobile' and 
                    self.nodes[node2]['type'] == 'mobile' and 
                    random.random() < 0.3):
                    continue
                
                distance = self.calculate_distance(node1, node2)
                measurements.append([node1, node2, distance])
        
        # Sometimes miss measurements (realistic UWB behavior)
        if random.random() < 0.1:  # 10% chance to drop random measurement
            if measurements:
                measurements.pop(random.randint(0, len(measurements) - 1))
        
        return measurements


class MQTTPublisher:
    """MQTT Publisher for UWB positioning data"""
    
    def __init__(self, broker: str, port: int = 1883, username: str = None, password: str = None):
        self.broker = broker
        self.port = port
        self.username = username
        self.password = password
        self.client = None
        self.connected = False
        
    def on_connect(self, client, userdata, flags, rc):
        """Callback for successful connection"""
        if rc == 0:
            self.connected = True
            logger.info(f"Connected to MQTT broker {self.broker}:{self.port}")
        else:
            logger.error(f"Failed to connect to MQTT broker. Return code: {rc}")
            
    def on_disconnect(self, client, userdata, rc):
        """Callback for disconnection"""
        self.connected = False
        logger.info("Disconnected from MQTT broker")
        
    def on_publish(self, client, userdata, mid):
        """Callback for successful publish"""
        logger.debug(f"Message {mid} published successfully")
        
    def connect(self) -> bool:
        """Connect to MQTT broker"""
        try:
            self.client = mqtt.Client()
            self.client.on_connect = self.on_connect
            self.client.on_disconnect = self.on_disconnect
            self.client.on_publish = self.on_publish
            
            if self.username and self.password:
                self.client.username_pw_set(self.username, self.password)
                
            logger.info(f"Connecting to MQTT broker {self.broker}:{self.port}...")
            self.client.connect(self.broker, self.port, 60)
            self.client.loop_start()
            
            # Wait for connection
            timeout = 10
            while not self.connected and timeout > 0:
                time.sleep(0.1)
                timeout -= 0.1
                
            return self.connected
            
        except Exception as e:
            logger.error(f"Failed to connect to MQTT broker: {e}")
            return False
    
    def publish(self, topic: str, payload: List[List]) -> bool:
        """Publish positioning data to MQTT topic"""
        if not self.connected:
            logger.error("Not connected to MQTT broker")
            return False
            
        try:
            json_payload = json.dumps(payload)
            result = self.client.publish(topic, json_payload, qos=0, retain=False)
            
            if result.rc == 0:
                logger.info(f"Published to {topic}: {len(payload)} measurements")
                logger.debug(f"Payload: {json_payload}")
                return True
            else:
                logger.error(f"Failed to publish message. Return code: {result.rc}")
                return False
                
        except Exception as e:
            logger.error(f"Error publishing message: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from MQTT broker"""
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()


def load_sample_data(filename: str) -> List[Dict[str, Any]]:
    """Load sample data from JSON file"""
    try:
        with open(filename, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        logger.error(f"Sample data file not found: {filename}")
        return []
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in sample data file: {e}")
        return []


def create_sample_scenarios() -> Dict[str, List[List]]:
    """Create predefined sample scenarios for testing"""
    return {
        'simple_triangle': [
            ['B5A4', 'Room1', 2.0],
            ['B5A4', 'Room2', 3.0],
            ['Room1', 'Room2', 2.5]
        ],
        'square_layout': [
            ['A', 'B', 2.0],
            ['B', 'C', 2.0], 
            ['C', 'D', 2.0],
            ['D', 'A', 2.0],
            ['A', 'C', 2.83],  # Diagonal
            ['B', 'D', 2.83]   # Diagonal
        ],
        'star_topology': [
            ['Gateway', 'Node1', 1.5],
            ['Gateway', 'Node2', 2.0],
            ['Gateway', 'Node3', 2.5],
            ['Gateway', 'Node4', 1.8],
            ['Gateway', 'Node5', 2.2]
        ],
        'mixed_ranges': [
            ['B5A4', 'Close', 0.5],
            ['B5A4', 'Medium', 5.0],
            ['B5A4', 'Far', 10.0],
            ['Close', 'Medium', 4.8],
            ['Medium', 'Far', 6.2]
        ]
    }


def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='MQTT Publisher for INST Tag Visualizer (Simulation)')
    parser.add_argument('--broker', default='broker.hivemq.com', help='MQTT broker host')
    parser.add_argument('--port', type=int, default=1883, help='MQTT broker port')
    parser.add_argument('--topic', default='uwb/positions', help='MQTT topic')
    parser.add_argument('--username', help='MQTT username')
    parser.add_argument('--password', help='MQTT password')
    parser.add_argument('--interval', type=float, default=2.0, help='Publish interval in seconds')
    parser.add_argument('--count', type=int, default=0, help='Number of messages to send (0 = infinite)')
    parser.add_argument('--simulate', action='store_true', help='Use UWB simulator')
    parser.add_argument('--scenario', choices=['simple_triangle', 'square_layout', 'star_topology', 'mixed_ranges'], 
                       help='Use predefined scenario')
    parser.add_argument('--sample-file', help='Load sample data from JSON file')
    parser.add_argument('--verbose', action='store_true', help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Initialize publisher
    publisher = MQTTPublisher(args.broker, args.port, args.username, args.password)
    
    if not publisher.connect():
        logger.error("Failed to connect to MQTT broker")
        sys.exit(1)
    
    # Set up data source
    simulator = UWBSimulator() if args.simulate else None
    scenarios = create_sample_scenarios()
    sample_data = []
    
    if args.sample_file:
        sample_data = load_sample_data(args.sample_file)
        if not sample_data:
            sys.exit(1)
    
    try:
        message_count = 0
        logger.info(f"Starting to publish to topic '{args.topic}' every {args.interval}s")
        
        while True:
            # Generate data based on mode
            if args.simulate and simulator:
                measurements = simulator.get_measurements()
                logger.info(f"Generated {len(measurements)} simulated measurements")
                
            elif args.scenario:
                measurements = scenarios[args.scenario]
                logger.info(f"Using scenario '{args.scenario}' with {len(measurements)} measurements")
                
            elif sample_data:
                # Cycle through sample data
                data_index = message_count % len(sample_data)
                measurements = sample_data[data_index].get('measurements', [])
                logger.info(f"Using sample data {data_index + 1}/{len(sample_data)}")
                
            else:
                # Default simple triangle
                measurements = scenarios['simple_triangle']
                logger.info("Using default simple triangle scenario")
            
            # Publish data
            if measurements:
                success = publisher.publish(args.topic, measurements)
                if success:
                    message_count += 1
                    logger.info(f"Message {message_count} sent successfully")
                    
                    # Show sample of measurements
                    for i, measurement in enumerate(measurements[:3]):
                        logger.info(f"  {measurement[0]} ↔ {measurement[1]}: {measurement[2]}m")
                    if len(measurements) > 3:
                        logger.info(f"  ... and {len(measurements) - 3} more measurements")
                else:
                    logger.error("Failed to publish message")
            else:
                logger.warning("No measurements to publish")
            
            # Check if we should stop
            if args.count > 0 and message_count >= args.count:
                logger.info(f"Completed {message_count} messages")
                break
            
            # Wait for next interval
            time.sleep(args.interval)
            
    except KeyboardInterrupt:
        logger.info(f"Interrupted. Sent {message_count} messages.")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
    finally:
        publisher.disconnect()
        logger.info("Publisher stopped")


if __name__ == '__main__':
    main()
