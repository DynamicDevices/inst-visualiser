#!/usr/bin/env python

#
# Copyright (c) SynchronicIT B.V. 2022. All rights reserved.                           09/08/2022
#             _____                  _               ______         _             
#            / ____|                | |             |  ____|       (_)             TM
#           | (___  _   _ _ __   ___| |__  _ __ ___ | |__ _   _ ___ _  ___  _ __  
#            \___ \| | | | '_ \ / __| '_ \| '__/ _ \|  __| | | / __| |/ _ \| '_ \ 
#            ____) | |_| | | | | (__| | | | | | (_) | |  | |_| \__ \ | (_) | | | |
#           |_____/ \__, |_| |_|\___|_| |_|_|  \___/|_|   \__,_|___/_|\___/|_| |_|
#                    __/ |                                                        
#                   |___/                                 http://www.synchronicit.nl/ 
#
#  This software is confidential and proprietary of SynchronicIT and is subject to the terms and 
#  conditions defined in file 'LICENSE.txt', which is part of this source code package. You shall 
#  not disclose such Confidential Information and shall use it only in accordance with the terms 
#  of the license agreement.
#

import struct
import serial
import argparse
import time
import math
import json
import ssl
import sys

# MQTT imports
try:
    import paho.mqtt.client as mqtt
except ImportError as e:
    print("Error: paho-mqtt library not found. Install with: pip install paho-mqtt")
    sys.exit(1)

parser = argparse.ArgumentParser(description='Sketch flash loader with MQTT publishing')
parser.add_argument("uart", help="uart port to use", type=str, default="/dev/ttyUSB0", nargs='?')
parser.add_argument("nodes", help="node lists",type=str, default="[]", nargs='?')
parser.add_argument("--mqtt-broker", help="MQTT broker hostname", type=str, default="mqtt.dynamicdevices.co.uk")
parser.add_argument("--mqtt-port", help="MQTT broker port", type=int, default=8883)
parser.add_argument("--mqtt-topic", help="MQTT topic to publish to", type=str, default="uwb/positions")
parser.add_argument("--mqtt-rate-limit", help="Minimum seconds between MQTT publishes", type=float, default=10.0)
parser.add_argument("--disable-mqtt", help="Disable MQTT publishing", action="store_true")

# Logging mode options (mutually exclusive)
logging_group = parser.add_mutually_exclusive_group()
logging_group.add_argument("--quiet", help="Quiet mode: only display startup messages", action="store_true")
logging_group.add_argument("--verbose", help="Verbose mode: display detailed received data and debug information", action="store_true")

args = parser.parse_args()

# MQTT globals
mqtt_client = None
last_publish_time = 0

def log_startup(message):
    """Always display startup messages regardless of mode"""
    print(f"[STARTUP] {message}")

def log_verbose(message):
    """Display verbose messages only in verbose mode"""
    if args.verbose:
        print(f"[VERBOSE] {message}")

def log_normal(message):
    """Display normal messages unless in quiet mode"""
    if not args.quiet:
        print(message)

def log_data(message):
    """Display received data only in verbose mode"""
    if args.verbose:
        print(f"[DATA] {message}")

def on_mqtt_connect(client, userdata, flags, rc):
    log_verbose(f"MQTT connect callback: flags={flags}, rc={rc}")
    if rc == 0:
        log_startup(f"Connected to MQTT broker {args.mqtt_broker}:{args.mqtt_port}")
        log_verbose("MQTT connection successful")
    else:
        error_messages = {
            1: "Connection refused - incorrect protocol version",
            2: "Connection refused - invalid client identifier",
            3: "Connection refused - server unavailable",
            4: "Connection refused - bad username or password",
            5: "Connection refused - not authorised"
        }
        error_msg = error_messages.get(rc, f"Unknown error code {rc}")
        log_startup(f"Failed to connect to MQTT broker: {error_msg}")
        log_verbose(f"MQTT connection failed with detailed error: {error_msg}")

def on_mqtt_disconnect(client, userdata, rc):
    log_verbose(f"MQTT disconnect callback: rc={rc}")
    if rc != 0:
        log_normal("Unexpected disconnection from MQTT broker")
        log_verbose("MQTT unexpected disconnection")
    else:
        log_normal("Disconnected from MQTT broker")
        log_verbose("MQTT clean disconnection")

def on_mqtt_publish(client, userdata, mid):
    log_verbose(f"Message {mid} published to MQTT successfully")

def on_mqtt_log(client, userdata, level, buf):
    if args.verbose:
        print(f"[MQTT LOG] {buf}")

def setup_mqtt():
    global mqtt_client
    
    if args.disable_mqtt:
        log_startup("MQTT publishing disabled via command line argument")
        log_verbose("MQTT disabled via command line argument")
        return None
        
    try:
        log_startup(f"Initializing MQTT client for {args.mqtt_broker}:{args.mqtt_port}")
        log_verbose("Creating MQTT client instance")
        mqtt_client = mqtt.Client()
        
        # Set up callbacks
        mqtt_client.on_connect = on_mqtt_connect
        mqtt_client.on_disconnect = on_mqtt_disconnect
        mqtt_client.on_publish = on_mqtt_publish
        mqtt_client.on_log = on_mqtt_log
        
        log_verbose(f"Configuring SSL for broker {args.mqtt_broker}:{args.mqtt_port}")
        
        # Configure SSL
        context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH)
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        
        log_verbose(f"SSL context created - check_hostname={context.check_hostname}, verify_mode={context.verify_mode}")
        
        mqtt_client.tls_set_context(context)
        log_verbose("SSL context applied to MQTT client")
        
        # Connect to broker
        log_verbose(f"Attempting to connect to {args.mqtt_broker}:{args.mqtt_port}")
        connect_result = mqtt_client.connect(args.mqtt_broker, args.mqtt_port, 60)
        log_verbose(f"Connect call returned: {connect_result}")
        
        log_verbose("Starting MQTT client loop")
        mqtt_client.loop_start()
        
        # Wait a moment for connection to establish
        time.sleep(2)
        
        if mqtt_client.is_connected():
            log_verbose("MQTT client reports connected status")
        else:
            log_verbose("MQTT client reports disconnected status after 2 seconds")
        
        log_startup(f"MQTT client configured for topic '{args.mqtt_topic}'")
        return mqtt_client
        
    except Exception as e:
        log_startup(f"Failed to setup MQTT: {e}")
        log_verbose(f"MQTT setup exception details: {type(e).__name__}: {str(e)}")
        import traceback
        if args.verbose:
            traceback.print_exc()
        return None

def publish_to_mqtt(data):
    global mqtt_client, last_publish_time
    
    if mqtt_client is None or args.disable_mqtt:
        log_verbose("MQTT publish skipped - client not available or disabled")
        return
        
    current_time = time.time()
    time_since_last = current_time - last_publish_time
    
    if time_since_last < args.mqtt_rate_limit:
        log_verbose(f"MQTT publish rate limited - {time_since_last:.1f}s < {args.mqtt_rate_limit}s")
        return
        
    if not mqtt_client.is_connected():
        log_verbose("MQTT client not connected, skipping publish")
        return
        
    try:
        # Convert data to JSON string with proper formatting
        json_data = json.dumps(data)
        log_verbose(f"Publishing to topic '{args.mqtt_topic}': {json_data}")
        
        result = mqtt_client.publish(args.mqtt_topic, json_data, qos=1)
        log_verbose(f"Publish result: rc={result.rc}, mid={result.mid}")
        
        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            last_publish_time = current_time
            log_normal(f"Published to MQTT topic '{args.mqtt_topic}': {json_data}")
        else:
            error_messages = {
                mqtt.MQTT_ERR_NO_CONN: "No connection to broker",
                mqtt.MQTT_ERR_QUEUE_SIZE: "Message queue full",
                mqtt.MQTT_ERR_PAYLOAD_SIZE: "Payload too large"
            }
            error_msg = error_messages.get(result.rc, f"Unknown error {result.rc}")
            log_normal(f"Failed to publish to MQTT: {error_msg}")
            log_verbose(f"MQTT publish failed with detailed error: {error_msg}")
            
    except Exception as e:
        log_normal(f"Error publishing to MQTT: {e}")
        log_verbose(f"MQTT publish exception: {type(e).__name__}: {str(e)}")
        if args.verbose:
            import traceback
            traceback.print_exc()

def connect(uart):
    try:
        log_startup(f"Connecting to serial port {uart}")
        ser = serial.serial_for_url(uart, do_not_open=True)
        ser.baudrate = 115200
        ser.bytesize = 8
        ser.parity = 'N'
        ser.stopbits = 1
        ser.rtscts = False
        ser.xonxoff = False
        ser.open()
        ser.dtr = False
        
        log_startup(f"Serial connection established at 115200 baud")
        log_verbose(f"Serial port configured: baudrate={ser.baudrate}, bytesize={ser.bytesize}, parity={ser.parity}")
        
    except serial.SerialException as e:
        log_startup(f"Failed to connect to serial port: {e}")
        return 0
    
    time.sleep(0.5)
    initial_data = ser.read(ser.in_waiting)
    log_verbose(f"Initial serial data: {initial_data}")

    return ser

def disconnect(ser): 
    ser.rts = False  
    ser.close()
    ser.is_open = False
    log_verbose("Serial port disconnected")

def flush_rx(ser):
    try:
        n = ser.in_waiting
        msg = ser.read(n)
        log_verbose(f"Flushed {n} bytes from RX buffer")
        return msg
        
    except serial.SerialException as e:
        log_normal(f"Serial exception during flush: {e}")
        disconnect(ser)
        return b''

def reset(ser):
    log_verbose("Resetting device via DTR signal")
    ser.dtr = True
    time.sleep(0.1)
    ser.dtr = False

def write(d, data):
    s = str(bytearray(data)) if sys.version_info<(3,) else bytes(data)
    return d.write(s)

def read(d, nbytes):
    s = d.read(nbytes)
    return [ord(c) for c in s] if type(s) is str else list(s)

def twr_value_ok(value):
    return value > 0 and 0.004690384 * value < 300

def parse_final(assignments, final_payload, mode=0):
    results = []

    if len(final_payload) == 0:
        return
    
    idx = 0

    for i in range(0, len(assignments[0])):
        for j in range(0, len(assignments[1])):
            value = struct.unpack('<H', final_payload[idx:(idx+2)])[0]
            idx += 2
            if (twr_value_ok(value)):
                results.append([assignments[0][i], assignments[1][j], 0.004690384 * (value)])
    
    
    for i in range(0, len(assignments[0])):
        for j in range(0, len(assignments[2])):
            value = struct.unpack('<H', final_payload[idx:(idx+2)])[0]
            idx += 2
            if (twr_value_ok(value)):
                results.append([assignments[0][i], assignments[2][j], 0.004690384 * (value)])

    for i in range(0, len(assignments[1])):
        for j in range(0, len(assignments[2])):
            value = struct.unpack('<H', final_payload[idx:(idx+2)])[0]
            idx += 2
            if (twr_value_ok(value)):
                results.append([assignments[1][i], assignments[2][j], 0.004690384 * (value)])

    if mode & 1:
        for i in range(0, len(assignments[0])):
            for j in range(i+1, len(assignments[0])):
                value = struct.unpack('<H', final_payload[idx:(idx+2)])[0]
                idx += 2
                if (twr_value_ok(value)):
                    results.append([assignments[0][i], assignments[0][j], 0.004690384 * (value)])
    
    if mode & 2:
        for i in range(0, len(assignments[1])):
            for j in range(i+1, len(assignments[1])):
                value = struct.unpack('<H', final_payload[idx:(idx+2)])[0]
                idx += 2
                if (twr_value_ok(value)):
                    results.append([assignments[1][i], assignments[1][j], 0.004690384 * (value)])
                
    return results

def print_list(results):
    if len(results) == 0:
        return
        
    # Format data for both display and MQTT publishing
    formatted_data = []
    row = "[ "
    
    for item in results:
        # Create formatted entry for MQTT (with quoted node IDs)
        mqtt_entry = ["{:04X}".format(item[0]), "{:04X}".format(item[1]), round(item[2], 3)]
        formatted_data.append(mqtt_entry)
        
        # Create display string
        row += "[\"{:04X}\",".format( item[0] )
        row += "\"{:04X}\",".format( item[1] )
        row += "{: <3.3f}], ".format( item[2] )
        
    row = row[:-2]
    row += " ]"
    
    # Log the received data appropriately based on mode
    log_data(f"Received UWB positioning data: {row}")
    log_normal(row)
    
    # Publish to MQTT
    publish_to_mqtt(formatted_data)

def print_matrix(assignments, results):
    nodes = []
    for a in assignments:
        for node in a:
            nodes.append(node)
        
    result_matrix = []
    for i in range(0, len(nodes)):
        row = []
        for j in range(0, len(nodes)):
            row.append(-1)
        result_matrix.append(row)

        
    for result in results:
        i = nodes.index(result[0])
        j = nodes.index(result[1])
        # if j == 6: 
        #     print("{:04X}    ".format( result[1] ))
        result_matrix[i][j] = result[2]

    # print(result_matrix)

    row = "        "
    for node in nodes:
        row += "{:04X}    ".format( node )
    log_verbose(f"Matrix header: {row}")

    rowIdx = 0  
    for lst in result_matrix:
        row = "{:04X}    ".format( nodes[rowIdx] )
        rowIdx = rowIdx + 1
        for item in lst:
            if item == -1:
                row += "        "
            else:
                row += "{: <8.3f}".format( item )
        log_verbose(f"Matrix row: {row}")

# Initialize MQTT
log_startup("Starting MQTT Live Publisher")
mqtt_client = setup_mqtt()

ser = connect(args.uart)

log_startup("Initializing UWB positioning system")
reset(ser)
#time.sleep(0.1)
time.sleep(0.5)

ser.reset_input_buffer()
if False:
    ser.write([0xdc, 0xac, 1, 0, ord('w')])
    time.sleep(0.5)
    log_verbose(f"Command response: {flush_rx(ser)}")

ser.write([0xdc, 0xac, 1, 0, ord('s')])

if False:
    time.sleep(0.5)
    log_verbose(f"Start response: {flush_rx(ser)}")

log_startup("System initialized, starting data collection...")
if args.quiet:
    log_startup("Running in quiet mode - only startup messages will be displayed")
elif args.verbose:
    log_startup("Running in verbose mode - detailed debug information will be displayed")

s = []

assignments = []
tof_list = []
n = 3
mode = 0
g1 = 0
g2 = 0
g3 = 0
unassigned_count = 0

try:
    while(1):

        cnt = ser.in_waiting
        if cnt > 0:
            newS = read(ser, 1)
            
            log_verbose(f"Received {cnt} bytes from serial")
            
            s = s + newS
            
            while len(s) >= 4:
                if s[0] == 0xDC and  s[1] == 0xAC:
                    log_verbose(f"Packet header found: {' '.join('{:02x}'.format(x) for x in s[:4])}")
                    l = struct.unpack('<H', bytes(s[2:4]))[0]

                    log_verbose(f"Expecting {l} bytes payload")

                    payload = read(ser, l)
                    log_verbose(f"Payload received: {' '.join('{:02x}'.format(x) for x in payload)}")
                    s = []
                    idx = 0
                    [act_type, act_slot, timeframe] = struct.unpack('<BbH', bytes(payload[idx:(idx+4)]))
                    log_verbose(f"Action type: {hex(act_type)}, slot: {act_slot}, timeframe: {timeframe}")
                    idx = idx + 4

                    if (payload[0] == 2):
                        assignments = []
                        [tx_pwr, mode, g1, g2, g3] = struct.unpack('<BBBBB', bytes(payload[idx:(idx+5)]))

                        log_verbose(f"Assignment packet - mode: {hex(mode)}, groups: {g1}/{g2}/{g3}")

                        idx = idx + 5
                        group1 = []
                        for i in range(0, g1):
                            group1.append(struct.unpack('<H', bytes(payload[idx:(idx+2)]))[0])
                            idx = idx + 2
                        group2 = []
                        for i in range(0, g2):
                            group2.append(struct.unpack('<H', bytes(payload[idx:(idx+2)]))[0])
                            idx = idx + 2
                        group3 = []
                        
                        unassigned_count = 0
                        for i in range(0, g3):
                            id = struct.unpack('<H', bytes(payload[idx:(idx+2)]))[0]
                            if id == 0:
                                unassigned_count = unassigned_count + 1
                            group3.append(id)
                            idx = idx + 2
                        assignments = [group1, group2, group3]

                        log_verbose(f"Node assignments: {assignments}")

                    if (payload[0] == 4):
                        tof_list = []

                        tof_count = g1 * g2 + g1 * g3 + g2 * g3
                        if mode & 1:
                            tof_count = tof_count + g1 * (g1-1) / 2
                        if mode & 2:
                            tof_count = tof_count + g2 * (g2-1) / 2

                        tof_count = int(tof_count)

                        log_verbose(f"TOF packet - expected count: {tof_count}, unassigned: {unassigned_count}")

                        ii = (idx+tof_count*2)

                        new_assignments = []

                        for i in range(0, unassigned_count):
                            id = struct.unpack('<H', bytes(payload[ii:(ii+2)]))[0]
                            ii = ii + 2
                            new_assignments.append(id)

                            assignments[2][g3-unassigned_count+i] = id

                        log_verbose(f"Updated assignments: {assignments}")

                        results = parse_final(assignments, bytes(payload[idx:]), mode)

                        log_verbose(f"Parsed {len(results)} positioning results")

    #                    print_matrix(assignments, results)
                        print_list(results)

                        # for i in range(0, n):
                        #     id = payload[(i*2+4):(i*2+6)]
                        #     print(id)
                        #     tof_list.append(struct.unpack('<H', bytes(id))[0])
                        # print(tof_list)

                        # 1200 0400 cc98 4798 00bbbb39ef
           
                else:
                    # if hidePackets == False or (hidePackets == True and chr((s[0])) != '!'):
                    # not a start of packet, needs re-aligning
                    log_verbose(f"Packet misalignment - discarding byte: {hex(s[0])} ({chr(s[0]) if s[0] >= 32 and s[0] <= 126 else '?'})")
                    s = s[1:]

except KeyboardInterrupt:
    log_startup("\nShutting down...")
    log_verbose("Keyboard interrupt received, cleaning up...")
    if mqtt_client:
        log_verbose("Stopping MQTT client loop...")
        mqtt_client.loop_stop()
        log_verbose("Disconnecting from MQTT broker...")
        mqtt_client.disconnect()
    log_verbose("Disconnecting from serial port...")
    disconnect(ser)
    log_startup("Cleanup complete, exiting...")
    sys.exit(0)
