# MQTT Live Publisher

A Python script for collecting UWB (Ultra-Wideband) positioning data from serial devices and publishing it to an MQTT broker with configurable logging modes.

## Features

- **UWB Positioning Data Collection**: Reads and parses UWB positioning data from serial devices
- **MQTT Publishing**: Publishes positioning data to configurable MQTT topics with SSL/TLS support
- **Configurable Logging Modes**: 
  - `--quiet`: Only display startup and shutdown messages
  - `--verbose`: Display detailed received data and debug information
  - Normal mode (default): Standard operational logging
- **Rate Limiting**: Configurable minimum interval between MQTT publishes
- **SSL/TLS Support**: Secure connections to MQTT brokers
- **Graceful Shutdown**: Clean disconnect and resource cleanup on exit

## Requirements

- Python 3.x
- `paho-mqtt` library
- `pyserial` library

Install dependencies:
```bash
pip install paho-mqtt pyserial
```

## Usage

### Basic Usage

```bash
# Default operation with standard logging
python mqtt-live-publisher.py /dev/ttyUSB0

# With node list parameter (optional)
python mqtt-live-publisher.py /dev/ttyUSB0 "[]"
```

### Logging Modes

#### Quiet Mode
Only displays startup and shutdown messages. All positioning data and normal operation logs are suppressed.

```bash
python mqtt-live-publisher.py /dev/ttyUSB0 --quiet
```

**Output example:**
```
[STARTUP] Starting MQTT Live Publisher
[STARTUP] Initializing MQTT client for mqtt.dynamicdevices.co.uk:8883
[STARTUP] Connected to MQTT broker mqtt.dynamicdevices.co.uk:8883
[STARTUP] Connecting to serial port /dev/ttyUSB0
[STARTUP] Serial connection established at 115200 baud
[STARTUP] Initializing UWB positioning system
[STARTUP] System initialized, starting data collection...
[STARTUP] Running in quiet mode - only startup messages will be displayed
```

#### Verbose Mode
Displays detailed received data, debug information, and all internal operations.

```bash
python mqtt-live-publisher.py /dev/ttyUSB0 --verbose
```

**Additional output includes:**
- MQTT SSL configuration details
- Serial communication byte-level information
- UWB packet parsing details
- Positioning data with full context
- Error traces and debugging information

#### Normal Mode (Default)
Standard operational logging showing connection status and positioning data without debug details.

```bash
python mqtt-live-publisher.py /dev/ttyUSB0
```

## Command Line Arguments

### Required Arguments
- `uart`: Serial port to use (e.g., `/dev/ttyUSB0`, `COM3`)
- `nodes`: Node lists (optional, defaults to `"[]"`)

### MQTT Configuration
- `--mqtt-broker`: MQTT broker hostname (default: `mqtt.dynamicdevices.co.uk`)
- `--mqtt-port`: MQTT broker port (default: `8883`)
- `--mqtt-topic`: MQTT topic to publish to (default: `uwb/positions`)
- `--mqtt-rate-limit`: Minimum seconds between MQTT publishes (default: `10.0`)
- `--disable-mqtt`: Disable MQTT publishing entirely

### Logging Options (Mutually Exclusive)
- `--quiet`: Quiet mode - only display startup messages
- `--verbose`: Verbose mode - display detailed received data and debug information

### Examples with MQTT Configuration

```bash
# Custom MQTT broker with verbose logging
python mqtt-live-publisher.py /dev/ttyUSB0 --verbose \
  --mqtt-broker your-broker.example.com \
  --mqtt-port 1883 \
  --mqtt-topic sensors/uwb/positioning

# Quiet mode with custom rate limiting
python mqtt-live-publisher.py /dev/ttyUSB0 --quiet \
  --mqtt-rate-limit 5.0

# Disable MQTT publishing completely
python mqtt-live-publisher.py /dev/ttyUSB0 --disable-mqtt --verbose
```

## Data Format

The script publishes UWB positioning data as JSON arrays containing distance measurements between nodes:

```json
[
  ["0A1B", "0C2D", 1.234],
  ["0A1B", "0E3F", 2.567],
  ["0C2D", "0E3F", 3.890]
]
```

Each entry contains:
- Source node ID (4-character hex)
- Target node ID (4-character hex) 
- Distance in meters (3 decimal places)

## Logging Behavior

### Startup Messages (Always Displayed)
These messages are shown regardless of logging mode:
- MQTT Live Publisher initialization
- MQTT broker connection status
- Serial port connection status
- System initialization completion
- Current logging mode indicator
- Shutdown and cleanup messages

### Quiet Mode Behavior
- ✅ Startup and shutdown messages
- ❌ Positioning data output
- ❌ MQTT publish confirmations
- ❌ Normal operational logs
- ✅ MQTT publishing still occurs (silently)

### Verbose Mode Behavior
- ✅ All startup messages
- ✅ Detailed MQTT connection info
- ✅ Serial communication details
- ✅ Raw packet data and parsing
- ✅ Positioning data with context
- ✅ Debug information and error traces
- ✅ MQTT publish confirmations with message IDs

### Normal Mode Behavior
- ✅ Startup messages
- ✅ Positioning data output
- ✅ MQTT publish confirmations
- ✅ Connection status updates
- ❌ Debug details and verbose information

## Configuration Notes

### SSL/TLS
The script uses SSL/TLS by default when connecting to MQTT brokers on port 8883. SSL certificate verification is disabled for compatibility with self-signed certificates.

### Serial Communication
- **Baud Rate**: 115200
- **Data Bits**: 8
- **Parity**: None
- **Stop Bits**: 1
- **Flow Control**: None

### UWB Protocol
The script communicates with UWB devices using a proprietary protocol that:
- Uses packet headers `0xDC 0xAC`
- Supports node assignment and time-of-flight measurements
- Handles multiple node groups and measurement modes
- Provides distance calculations with 0.004690384m resolution

## Error Handling

The script includes comprehensive error handling for:
- Serial port connection failures
- MQTT broker connection issues
- SSL/TLS configuration problems
- Data parsing errors
- Graceful shutdown on Ctrl+C

## Troubleshooting

### Common Issues

**Serial Port Access Denied**
```bash
sudo usermod -a -G dialout $USER
# Then logout and login again
```

**MQTT Connection Failed**
- Check broker hostname and port
- Verify network connectivity
- Use `--verbose` for detailed connection logs

**No Data Received**
- Verify correct serial port
- Check UWB device is powered and configured
- Use `--verbose` to see raw serial communication

### Debug Information

Use verbose mode to get detailed information about:
```bash
python mqtt-live-publisher.py /dev/ttyUSB0 --verbose
```

This will show:
- MQTT SSL handshake details
- Serial data byte-by-byte
- Packet parsing and validation
- Node assignment updates
- Distance calculation details

## License

Copyright (c) SynchronicIT B.V. 2022. All rights reserved.

This software is confidential and proprietary of SynchronicIT and is subject to the terms and conditions defined in file 'LICENSE.txt'.