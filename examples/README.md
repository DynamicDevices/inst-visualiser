# MQTT Live Publisher for UWB Positioning Data

A Python script that reads UWB (Ultra-Wideband) positioning data from serial UART devices and publishes formatted distance measurements to MQTT brokers for real-time visualization.

## Features

- **Serial Communication**: Reads UWB data from hardware devices via UART
- **MQTT Publishing**: Publishes formatted data to MQTT brokers with SSL/TLS support
- **Configurable Logging**: Three logging levels for different use cases
- **Error Recovery**: Automatic device reset after parsing errors
- **Rate Limiting**: Configurable publish intervals to prevent message flooding
- **Real-time Processing**: Converts binary UWB data to JSON format for web visualization

## Installation

```bash
# Install required dependencies
pip install paho-mqtt pyserial

# Clone the repository (if needed)
git clone https://github.com/DynamicDevices/inst-visualiser.git
cd inst-visualiser/examples
```

## Usage

### Basic Usage
```bash
# Connect to default serial port with standard logging
python mqtt-live-publisher.py /dev/ttyUSB0

# Windows example
python mqtt-live-publisher.py COM3

# Custom MQTT broker
python mqtt-live-publisher.py /dev/ttyUSB0 --mqtt-broker your-broker.com
```

### Logging Modes

#### Quiet Mode
Minimal output - only startup info and critical errors
```bash
python mqtt-live-publisher.py /dev/ttyUSB0 --quiet
```
**Output example:**
```
UWB MQTT Publisher Starting...
Serial port: /dev/ttyUSB0
MQTT broker: mqtt.dynamicdevices.co.uk:8883
Quiet mode enabled - minimal logging
Data processing started...
```

#### Normal Mode (Default)
Standard output with connection status and published data
```bash
python mqtt-live-publisher.py /dev/ttyUSB0
```
**Output example:**
```
UWB MQTT Publisher Starting...
Serial port: /dev/ttyUSB0
MQTT broker: mqtt.dynamicdevices.co.uk:8883
Connected to MQTT broker mqtt.dynamicdevices.co.uk:8883
Data processing started...
Published to MQTT topic 'uwb/positions': [["A001","A002",1.234]]
```

#### Verbose Mode
Detailed debugging with packet parsing and internal operations
```bash
python mqtt-live-publisher.py /dev/ttyUSB0 --verbose
```
**Output example:**
```
UWB MQTT Publisher Starting...
Serial port: /dev/ttyUSB0
MQTT broker: mqtt.dynamicdevices.co.uk:8883
Verbose mode enabled - detailed logging
[VERBOSE] Initializing MQTT client...
[VERBOSE] act_type: 0x2: 1/100
[VERBOSE] Assignments: [[4097, 4098], [4099], [0]]
[VERBOSE] Parsed data: [ ["A001","A002",1.234], ["A001","A003",2.156] ]
Published to MQTT topic 'uwb/positions': [["A001","A002",1.234], ["A001","A003",2.156]]
```

## Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `uart` | Serial port to connect to | `/dev/ttyUSB0` |
| `--mqtt-broker` | MQTT broker hostname | `mqtt.dynamicdevices.co.uk` |
| `--mqtt-port` | MQTT broker port | `8883` |
| `--mqtt-topic` | MQTT topic for publishing | `uwb/positions` |
| `--mqtt-rate-limit` | Minimum seconds between publishes | `10.0` |
| `--disable-mqtt` | Disable MQTT publishing | `False` |
| `--verbose` | Enable detailed logging | `False` |
| `--quiet` | Enable minimal logging | `False` |

## Error Handling

### Automatic Recovery
The script includes robust error handling with automatic recovery:

- **Parsing Error Tracking**: Monitors failed packet parsing attempts
- **Automatic Reset**: Resets the UWB device after 3 consecutive parsing errors
- **Error Counter Reset**: Clears error count after successful device reset
- **Boundary Checking**: Validates payload lengths before processing

### Warning Examples
```bash
[WARNING] Packet parsing error (1/3): Insufficient payload data
[WARNING] Packet parsing error (2/3): Group1 data incomplete  
[WARNING] Maximum parsing errors reached (3), resetting device...
Resetting device...
```

## Data Format

### Input (Serial)
Binary UWB positioning data from hardware devices

### Output (MQTT JSON)
```json
[
  ["A001", "A002", 1.234],
  ["A002", "A003", 2.156],
  ["A003", "A001", 1.897]
]
```

**Format Details:**
- Array of distance measurements
- Each measurement: `[node_id_1, node_id_2, distance_in_meters]`
- Node IDs: 4-character hex strings (e.g., "A001", "B5A4")
- Distances: Floating-point values in meters
- Gateway nodes: Node "B5A4" automatically styled as gateway in visualizer

## Integration with Visualizer

This script works with the [inst-visualiser](https://dynamicdevices.github.io/inst-visualiser/) web application:

1. **Start the publisher**: `python mqtt-live-publisher.py /dev/ttyUSB0`
2. **Open the visualizer**: Visit the GitHub Pages demo
3. **Configure MQTT settings**:
   - Broker: `mqtt.dynamicdevices.co.uk`
   - Port: `8083` (WebSocket SSL)
   - Topic: `uwb/positions`
4. **Click "Connect MQTT"** to see live positioning data

## Troubleshooting

### Serial Connection Issues
```bash
# Check available ports (Linux)
ls /dev/tty*

# Check permissions (Linux)
sudo usermod -a -G dialout $USER
# Then logout/login

# Windows - check Device Manager for COM port
```

### MQTT Connection Issues
```bash
# Test with verbose logging
python mqtt-live-publisher.py /dev/ttyUSB0 --verbose

# Disable MQTT to test serial only
python mqtt-live-publisher.py /dev/ttyUSB0 --disable-mqtt --verbose
```

### Common Error Messages

| Error | Cause | Solution |
|-------|--------|----------|
| `Permission denied: '/dev/ttyUSB0'` | User lacks serial permissions | Add user to `dialout` group |
| `Failed to connect to MQTT broker` | Network/broker issues | Check broker address and port |
| `Packet parsing error` | Corrupted serial data | Will auto-reset after 3 errors |
| `Serial connection failed` | Wrong port or hardware issue | Verify port and hardware connection |

## Development

### Testing Without Hardware
```bash
# Disable MQTT and use verbose logging to see what would be sent
python mqtt-live-publisher.py /dev/null --disable-mqtt --verbose
```

### Custom MQTT Broker
```bash
# Use local broker
python mqtt-live-publisher.py /dev/ttyUSB0 --mqtt-broker localhost --mqtt-port 1883

# Different topic
python mqtt-live-publisher.py /dev/ttyUSB0 --mqtt-topic "sensors/uwb/positions"
```

## License

This software is subject to the terms and conditions defined in the LICENSE.txt file.

Portions including MQTT publishing functionality and enhanced logging features are Copyright (c) Dynamic Devices Ltd. 2025. All rights reserved.

## Support

- **Issues**: [GitHub Issues](https://github.com/DynamicDevices/inst-visualiser/issues)
- **Email**: [ajlennon@dynamicdevices.co.uk](mailto:ajlennon@dynamicdevices.co.uk)
- **Website**: [Dynamic Devices](https://www.dynamicdevices.co.uk)