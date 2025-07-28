/**
 * GPS Utilities for UWB Position Visualiser
 * Handles GPS coordinate conversion and distance calculations
 */

class GPSUtils {
    constructor() {
        // Earth's radius in meters
        this.EARTH_RADIUS = 6371000;
    }

    /**
     * Convert GPS coordinates to local Cartesian coordinates
     * @param {number} lat - Latitude in degrees
     * @param {number} lng - Longitude in degrees
     * @param {number} refLat - Reference latitude in degrees
     * @param {number} refLng - Reference longitude in degrees
     * @returns {Object} {x, y} coordinates in meters
     */
    gpsToLocal(lat, lng, refLat, refLng) {
        const latRad = this.toRadians(lat);
        const lngRad = this.toRadians(lng);
        const refLatRad = this.toRadians(refLat);
        const refLngRad = this.toRadians(refLng);

        // Calculate differences
        const deltaLat = latRad - refLatRad;
        const deltaLng = lngRad - refLngRad;

        // Convert to local coordinates (meters)
        const x = deltaLng * this.EARTH_RADIUS * Math.cos(refLatRad);
        const y = deltaLat * this.EARTH_RADIUS;

        return { x, y };
    }

    /**
     * Convert local Cartesian coordinates to GPS coordinates
     * @param {number} x - X coordinate in meters
     * @param {number} y - Y coordinate in meters
     * @param {number} refLat - Reference latitude in degrees
     * @param {number} refLng - Reference longitude in degrees
     * @returns {Object} {lat, lng} GPS coordinates in degrees
     */
    localToGPS(x, y, refLat, refLng) {
        const refLatRad = this.toRadians(refLat);
        const refLngRad = this.toRadians(refLng);

        // Convert from local coordinates to GPS
        const deltaLat = y / this.EARTH_RADIUS;
        const deltaLng = x / (this.EARTH_RADIUS * Math.cos(refLatRad));

        const lat = this.toDegrees(refLatRad + deltaLat);
        const lng = this.toDegrees(refLngRad + deltaLng);

        return { lat, lng };
    }

    /**
     * Offset GPS coordinates by X,Y meters (assuming local coordinate system)
     * @param {number} lat - Original latitude
     * @param {number} lng - Original longitude
     * @param {number} deltaX - X offset in meters (East positive)
     * @param {number} deltaY - Y offset in meters (North positive)
     * @returns {object} - New GPS coordinates {lat, lng}
     */
    offsetGPS(lat, lng, deltaX, deltaY) {
        // Use the existing localToGPS method with the reference point as the original coordinates
        return this.localToGPS(deltaX, deltaY, lat, lng);
    }

    /**
     * Calculate distance between two GPS coordinates
     * @param {number} lat1 - First latitude
     * @param {number} lng1 - First longitude
     * @param {number} lat2 - Second latitude
     * @param {number} lng2 - Second longitude
     * @returns {number} Distance in meters
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        const lat1Rad = this.toRadians(lat1);
        const lng1Rad = this.toRadians(lng1);
        const lat2Rad = this.toRadians(lat2);
        const lng2Rad = this.toRadians(lng2);

        const deltaLat = lat2Rad - lat1Rad;
        const deltaLng = lng2Rad - lng1Rad;

        const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
            + Math.cos(lat1Rad) * Math.cos(lat2Rad)
            * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return this.EARTH_RADIUS * c;
    }

    /**
     * Convert degrees to radians
     * @param {number} degrees
     * @returns {number} radians
     */
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Convert radians to degrees
     * @param {number} radians
     * @returns {number} degrees
     */
    toDegrees(radians) {
        return radians * (180 / Math.PI);
    }

    /**
     * Validate GPS coordinates
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {boolean} True if valid
     */
    isValidGPS(lat, lng) {
        return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }
}

// Export for use in other modules
window.GPSUtils = GPSUtils;
