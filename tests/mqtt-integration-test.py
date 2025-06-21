#!/usr/bin/env python3
"""
MQTT Integration Tests - UWB Visualiser v4.0
Tests MQTT connectivity and data publishing functionality
"""

import pytest
import json
import time
import threading
import paho.mqtt.client as mqtt
from unittest.mock import Mock, patch
import numpy as np

class TestMQTTIntegration:
    """Test MQTT integration functionality"""
    
    @pytest.fixture
    def mqtt_client(self):
        """Create a test MQTT client"""
        client = mqtt.Client()
        client.connect("localhost", 1883, 60)
        yield client
        client.disconnect()
    
    @pytest.fixture
    def sample_casualty_data(self):
        """Sample emergency response positioning data"""
        return [
            ["B5A4", "R001", 2.5],    # Command post to room 1
            ["B5A4", "R002", 4.2],    # Command post to room 2  
            ["B5A4", "R003", 3.8],    # Command post to room 3
            ["R001", "R002", 3.1],    # Between rooms
            ["R001", "R003", 2.9],    # Between rooms
            ["R002", "R003", 5.7]     # Between rooms
        ]
    
    @pytest.fixture
    def triangle_test_data(self):
        """Perfect triangle data for geometry validation"""
        return [
            ["A001", "A002", 3.0],
            ["A002", "A003", 4.0],
            ["A001", "A003", 5.0]
        ]

    def test_mqtt_connection(self, mqtt_client):
        """Test basic MQTT connection"""
        assert mqtt_client.is_connected()
    
    def test_publish_casualty_data(self, mqtt_client, sample_casualty_data):
        """Test publishing casualty positioning data"""
        topic = "uwb/positions"
        payload = json.dumps(sample_casualty_data)
        
        # Publish message
        result = mqtt_client.publish(topic, payload)
        assert result.rc == mqtt.MQTT_ERR_SUCCESS
        
        # Wait for message to be sent
        result.wait_for_publish()
        assert result.is_published()
    
    def test_data_format_validation(self, triangle_test_data):
        """Test data format validation"""
        # Valid data should serialize without errors
        payload = json.dumps(triangle_test_data)
        parsed = json.loads(payload)
        
        assert len(parsed) == 3
        assert all(len(measurement) == 3 for measurement in parsed)
        assert all(isinstance(measurement[2], (int, float)) for measurement in parsed)
    
    def test_invalid_data_handling(self, mqtt_client):
        """Test handling of invalid data formats"""
        topic = "uwb/positions"
        
        # Test invalid JSON
        invalid_payloads = [
            "invalid json",
            '{"not": "array"}',
            '[["A001", "A002"]]',  # Missing distance
            '[["A001", "A002", "invalid"]]',  # Invalid distance
            '[]',  # Empty array
        ]
        
        for payload in invalid_payloads:
            result = mqtt_client.publish(topic, payload)
            # Should publish without MQTT errors (validation happens client-side)
            assert result.rc == mqtt.MQTT_ERR_SUCCESS
    
    def test_message_subscription(self, mqtt_client):
        """Test MQTT message subscription"""
        received_messages = []
        
        def on_message(client, userdata, message):
            received_messages.append({
                'topic': message.topic,
                'payload': message.payload.decode(),
                'timestamp': time.time()
            })
        
        mqtt_client.on_message = on_message
        
        # Subscribe to test topic
        topic = "uwb/test"
        mqtt_client.subscribe(topic)
        
        # Start loop in background
        mqtt_client.loop_start()
        
        # Publish test message
        test_data = [["TEST1", "TEST2", 1.5]]
        mqtt_client.publish(topic, json.dumps(test_data))
        
        # Wait for message
        time.sleep(1)
        mqtt_client.loop_stop()
        
        assert len(received_messages) > 0
        assert received_messages[0]['topic'] == topic
    
    def test_high_frequency_publishing(self, mqtt_client, triangle_test_data):
        """Test publishing at high frequency (stress test)"""
        topic = "uwb/stress_test"
        message_count = 50
        
        start_time = time.time()
        
        for i in range(message_count):
            # Add some variation to the data
            data = [
                ["A001", "A002", 3.0 + np.random.normal(0, 0.05)],
                ["A002", "A003", 4.0 + np.random.normal(0, 0.05)],
                ["A001", "A003", 5.0 + np.random.normal(0, 0.05)]
            ]
            
            result = mqtt_client.publish(topic, json.dumps(data))
            assert result.rc == mqtt.MQTT_ERR_SUCCESS
            
            # Small delay to simulate realistic update rate
            time.sleep(0.01)  # 100Hz update rate
        
        elapsed_time = time.time() - start_time
        messages_per_second = message_count / elapsed_time
        
        # Should handle at least 50 messages per second
        assert messages_per_second > 50
    
    def test_gateway_node_detection(self, mqtt_client):
        """Test special handling of B5A4 gateway node"""
        gateway_data = [
            ["B5A4", "R001", 5.2],
            ["B5A4", "R002", 8.1],
            ["B5A4", "R003", 12.3]
        ]
        
        payload = json.dumps(gateway_data)
        parsed = json.loads(payload)
        
        # Check that B5A4 appears in the data
        gateway_references = sum(1 for measurement in parsed 
                               if "B5A4" in measurement[:2])
        
        assert gateway_references >= 3
    
    def test_distance_accuracy_categories(self, mqtt_client):
        """Test different distance accuracy categories"""
        accuracy_test_data = [
            ["A001", "A002", 1.2],    # Accurate (0.5-8.0m)
            ["A001", "A003", 0.3],    # Too close (<0.5m)
            ["A002", "A003", 12.5],   # Too far (>8.0m)
            ["A001", "A004", 0.0],    # Invalid (0m)
            ["A002", "A004", -1.0],   # Invalid (negative)
        ]
        
        topic = "uwb/accuracy_test"
        payload = json.dumps(accuracy_test_data)
        
        result = mqtt_client.publish(topic, payload)
        assert result.rc == mqtt.MQTT_ERR_SUCCESS
        
        # Validate distance ranges
        parsed = json.loads(payload)
        distances = [measurement[2] for measurement in parsed]
        
        assert any(0.5 <= d <= 8.0 for d in distances)  # At least one accurate
        assert any(d < 0.5 for d in distances if d > 0)  # At least one too close
        assert any(d > 8.0 for d in distances)  # At least one too far
    
    def test_mqtt_qos_levels(self, mqtt_client, triangle_test_data):
        """Test different MQTT QoS levels"""
        topic = "uwb/qos_test"
        payload = json.dumps(triangle_test_data)
        
        # Test QoS 0 (at most once)
        result_qos0 = mqtt_client.publish(topic, payload, qos=0)
        assert result_qos0.rc == mqtt.MQTT_ERR_SUCCESS
        
        # Test QoS 1 (at least once)
        result_qos1 = mqtt_client.publish(topic, payload, qos=1)
        assert result_qos1.rc == mqtt.MQTT_ERR_SUCCESS
        result_qos1.wait_for_publish()
        
        # Test QoS 2 (exactly once)
        result_qos2 = mqtt_client.publish(topic, payload, qos=2)
        assert result_qos2.rc == mqtt.MQTT_ERR_SUCCESS
        result_qos2.wait_for_publish()
    
    def test_retained_messages(self, mqtt_client, sample_casualty_data):
        """Test MQTT retained messages"""
        topic = "uwb/retained_test"
        payload = json.dumps(sample_casualty_data)
        
        # Publish retained message
        result = mqtt_client.publish(topic, payload, retain=True)
        assert result.rc == mqtt.MQTT_ERR_SUCCESS
        result.wait_for_publish()
        
        # Create new client to test retained message delivery
        new_client = mqtt.Client()
        new_client.connect("localhost", 1883, 60)
        
        received_retained = []
        
        def on_message(client, userdata, message):
            if message.retain:
                received_retained.append(message)
        
        new_client.on_message = on_message
        new_client.subscribe(topic)
        new_client.loop_start()
        
        time.sleep(1)
        new_client.loop_stop()
        new_client.disconnect()
        
        assert len(received_retained) > 0
    
    def test_emergency_scenario_simulation(self, mqtt_client):
        """Test realistic emergency response scenario"""
        # Simulate mass casualty incident with multiple casualties and responders
        emergency_scenario = [
            # Command post positions
            ["B5A4", "TRIAGE_AREA", 10.0],
            ["B5A4", "AMBULANCE_STAGING", 25.0],
            ["B5A4", "POLICE_CORDON", 50.0],
            
            # Casualty positions relative to triage
            ["CASUALTY_001", "TRIAGE_AREA", 2.0],
            ["CASUALTY_002", "TRIAGE_AREA", 3.5],
            ["CASUALTY_003", "TRIAGE_AREA", 1.8],
            
            # Responder positions
            ["MEDIC_001", "TRIAGE_AREA", 0.5],
            ["MEDIC_002", "AMBULANCE_STAGING", 1.0],
            ["POLICE_001", "POLICE_CORDON", 2.0],
        ]
        
        topic = "uwb/emergency_scenario"
        payload = json.dumps(emergency_scenario)
        
        result = mqtt_client.publish(topic, payload)
        assert result.rc == mqtt.MQTT_ERR_SUCCESS
        
        # Validate emergency scenario data
        parsed = json.loads(payload)
        
        # Should have command post reference
        has_command_post = any("B5A4" in measurement[:2] for measurement in parsed)
        assert has_command_post
        
        # Should have casualties
        has_casualties = any("CASUALTY" in str(measurement) for measurement in parsed)
        assert has_casualties
        
        # Should have responders
        has_responders = any("MEDIC" in str(measurement) or "POLICE" in str(measurement) 
                           for measurement in parsed)
        assert has_responders

# Test runner configuration
if __name__ == "__main__":
    # Run with pytest: python -m pytest test_mqtt_integration.py -v
    pytest.main([__file__, "-v", "--tb=short"])