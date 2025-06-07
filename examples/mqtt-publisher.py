#!/usr/bin/env python3
"""
UWB Position Data MQTT Publisher
Dynamic Devices Ltd - Example code for inst-visualiser v3.0

This script demonstrates how to publish UWB positioning data to the 
UWB Position Visualiser via MQTT. It can generate both simulated data
and publish real UWB measurements.

Requirements:
    pip install paho-mqtt numpy

Usage:
    python mqtt-publisher.py --mode simulation
    python mqtt-publisher.py --mode real --device /dev/ttyUSB0
    python mqtt-publisher.py --broker mqtt.example.com --topic uwb/test
"""

import json
import time
import random
import math
import argparse
import logging
import signal
import sys
from typing import List, Tuple, Optional
import paho.mqtt.client as mqtt

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class UWBPublisher:
    """MQTT publisher for UWB positioning data"""
    
    def __init__(self, broker: str, port: int, topic: str, client_id: str = None):
        self.broker = broker
        self.port = port
        self.topic = topic
        self.client_id = client_id or f"uwb_publisher_{random.randint(1000, 9999)}"
        self.client = None
        self.connected = False
        self.running = False
        
    def on_connect(self, client, userdata, flags, rc):
        """Callback for MQTT connection"""
        if rc == 0:
            self.connected = True
            logger.info(f"Connected to MQTT broker {self.broker}:{self.port}")
            logger.info(f"Publishing to topic: {self.topic}")
        else:
            logger.error(f"Failed to connect to MQTT broker, return code {rc}")
            
    def on_disconnect(self, client, userdata, rc):
        """Callback for MQTT disconnection"""
        self.connected = False
        logger.info("Disconnected from MQTT broker")
        
    def on_publish(self, client, userdata, mid):
        """Callback for message publish"""
        logger.debug(f"Message {mid} published successfully")
        
    def connect(self) -> bool:
        """Connect to MQTT broker"""
        try:
            self.client = mqtt.Client(self.client_id)
            self.client.on_connect = self.on_connect
            self.client.on_disconnect = self.on_disconnect
            self.client.on_publish = self.on_publish
            
            logger.info(f"Connecting to MQTT broker {self.broker}:{self.port}...")
            self.client.connect(self.broker, self.port, 60)
            self.client.loop_start()
            
            # Wait for connection
            timeout = 10
            while not self.connected and timeout > 0:
                time.sleep(0.1)
                timeout -= 0.1
                
            if not self.connected:
                logger.error("Connection timeout")
                return False
                
            return True
            
        except Exception as e:
            logger.error(f"Connection error: {e}")
            return False
            
    def disconnect(self):
        """Disconnect from MQTT broker"""
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()
            
    def publish_distances(self, distances: List[Tuple[str, str, float]]) -> bool:
        """Publish distance measurements to MQTT topic"""
        if not self.connected:
            logger.error("Not connected to MQTT broker")
            return False
            
        try:
            # Convert to required format: [["node1", "node2", distance], ...]
            message_data = [[node1, node2, round(distance, 2)] for node1, node2, distance in distances]
            message = json.dumps(message_data)
            
            result = self.client.publish(self.topic, message, qos=1)
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.info(f"Published {len(distances)} distance measurements")
                logger.debug(f"Message: {message}")
                return True
            else:
                logger.error(f"Failed to publish message, return code {result.rc}")
                return False
                
        except Exception as e:
            logger.error(f"Publish error: {e}")
            return False

class SimulationGenerator:
    """Generate simulated UWB positioning data"""
    
    def __init__(self):
        # Define node positions in a coordinate system (meters)
        self.nodes = {
            "B5A4": (0.0, 0.0),      # Gateway at origin
            "R001": (3.0, 2.0),      # Room 1
            "R002": (1.5, 4.0),      # Room 2  
            "R003": (5.0, 3.5),      # Room 3
            "T001": (2.0, 2.5),      # Mobile tag 1
        }
        
        # Movement parameters for mobile tags
        self.mobile_tags = ["T001"]
        self.time_offset = 0.0
        
        # Add some realistic measurement noise
        self.noise_stddev = 0.05  # 5cm standard deviation
        
    def calculate_distance(self, pos1: Tuple[float, float], pos2: Tuple[float, float]) -> float:
        """Calculate distance between two positions"""
        dx = pos1[0] - pos2[0]
        dy = pos1[1] - pos2[1]
        distance = math.sqrt(dx*dx + dy*dy)
        
        # Add realistic measurement noise
        noise = random.gauss(0, self.noise_stddev)
        distance += noise
        
        # Ensure positive distance
        return max(0.1, distance)
        
    def update_mobile_positions(self):
        """Update positions of mobile tags"""
        self.time_offset += 0.1
        
        for tag in self.mobile_tags:
            if tag == "T001":
                # Move T001 in a circular pattern
                center_x, center_y = 2.5, 2.5
                radius = 1.5
                angle = self.time_offset * 0.3  # Slow circular movement
                
                new_x = center_x + radius * math.cos(angle)
                new_y = center_y + radius * math.sin(angle)
                
                self.nodes[tag] = (new_x, new_y)
                
    def generate_distances(self) -> List[Tuple[str, str, float]]:
        """Generate distance measurements between all node pairs"""
        self.update_mobile_positions()
        
        distances = []
        node_list = list(self.nodes.keys())
        
        # Generate distances between all pairs
        for i in range(len(node_list)):
            for j in range(i + 1, len(node_list)):
                node1 = node_list[i]
                node2 = node_list[j]
                
                pos1 = self.nodes[node1]
                pos2 = self.nodes[node2]
                
                distance = self.calculate_distance(pos1, pos2)
                distances.append((node1, node2, distance))
                
        return distances

class RealUWBReader:
    """Read real UWB data from hardware device"""
    
    def __init__(self, device_path: str):
        self.device_path = device_path
        self.serial_port = None
        
    def connect(self) -> bool:
        """Connect to UWB device"""
        try:
            import serial
            self.serial_port = serial.Serial(self.device_path, 115200, timeout=1)
            logger.info(f"Connected to UWB device at {self.device_path}")
            return True
        except ImportError:
            logger.error("pyserial not installed. Install with: pip install pyserial")
            return False
        except Exception as e:
            logger.error(f"Failed to connect to UWB device: {e}")
            return False
            
    def read_distances(self) -> Optional[List[Tuple[str, str, float]]]:
        """Read distance measurements from UWB device"""
        if not self.serial_port:
            return None
            
        try:
            # Read line from serial port
            line = self.serial_port.readline().decode('utf-8').strip()
            
            if not line:
                return None
                
            # Parse UWB data (example format: "A,B,1.234")
            # Modify this section based on your actual UWB device output format
            parts = line.split(',')
            if len(parts) == 3:
                node1, node2, distance_str = parts
                distance = float(distance_str)
                return [(node1, node2, distance)]
            else:
                logger.warning(f"Invalid data format: {line}")
                return None
                
        except Exception as e:
            logger.error(f"Error reading from UWB device: {e}")
            return None
            
    def disconnect(self):
        """Disconnect from UWB device"""
        if self.serial_port:
            self.serial_port.close()
            logger.info("Disconnected from UWB device")

def signal_handler(signum, frame):
    """Handle Ctrl+C gracefully"""
    logger.info("Received interrupt signal, shutting down...")
    global publisher
    if publisher:
        publisher.running = False

def main():
    global publisher
    
    parser = argparse.ArgumentParser(description='UWB Position Data MQTT Publisher')
    parser.add_argument('--broker', default='mqtt.dynamicdevices.co.uk', 
                       help='MQTT broker hostname')
    parser.add_argument('--port', type=int, default=1883,
                       help='MQTT broker port')
    parser.add_argument('--topic', default='uwb/positions',
                       help='MQTT topic for publishing')
    parser.add_argument('--mode', choices=['simulation', 'real'], default='simulation',
                       help='Data source mode')
    parser.add_argument('--device', default='/dev/ttyUSB0',
                       help='Serial device path for real UWB data')
    parser.add_argument('--rate', type=float, default=2.0,
                       help='Publishing rate in Hz')
    parser.add_argument('--debug', action='store_true',
                       help='Enable debug logging')
    
    args = parser.parse_args()
    
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
        
    # Set up signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    
    # Create MQTT publisher
    publisher = UWBPublisher(args.broker, args.port, args.topic)
    
    if not publisher.connect():
        logger.error("Failed to connect to MQTT broker")
        return 1
        
    # Set up data source
    data_source = None
    if args.mode == 'simulation':
        data_source = SimulationGenerator()
        logger.info("Using simulation mode - generating test data")
    else:
        data_source = RealUWBReader(args.device)
        if not data_source.connect():
            logger.error("Failed to connect to UWB device")
            publisher.disconnect()
            return 1
        logger.info(f"Using real UWB device at {args.device}")
        
    # Publishing loop
    publisher.running = True
    sleep_time = 1.0 / args.rate
    
    logger.info(f"Starting to publish at {args.rate}Hz (every {sleep_time:.2f}s)")
    logger.info("Press Ctrl+C to stop")
    
    try:
        while publisher.running:
            # Get distance measurements
            if args.mode == 'simulation':
                distances = data_source.generate_distances()
            else:
                distances = data_source.read_distances()
                
            if distances:
                # Publish to MQTT
                if not publisher.publish_distances(distances):
                    logger.warning("Failed to publish data")
                    
            time.sleep(sleep_time)
            
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        
    finally:
        # Cleanup
        publisher.disconnect()
        if hasattr(data_source, 'disconnect'):
            data_source.disconnect()
        logger.info("Publisher stopped")
        
    return 0

if __name__ == "__main__":
    sys.exit(main())