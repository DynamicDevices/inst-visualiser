// Helper for Vector3
function Vector3(x, y, z) {
    return [x, y, z];
}

// Helper for Vector2
function Vector2(x, y) {
    return [x, y];
}

// Globals
let unitVectorNorth = Vector2(0, -1);
let rotAdjMatrix_ACW = null;
let rotAdjMatrix_CW = null;

let EARTH_A = 0;
let EARTH_B = 0;
let EARTH_F = 0;
let EARTH_Ecc = 0;
let EARTH_Esq = 0;

// WGS84 Constant Setting
function geodGBL() {
    let tstglobal = EARTH_A;
    if (tstglobal === 0) {
        wgs84();
    }
}

function SetAdjMatrix() {
    let cos_theta = unitVectorNorth[0];
    let sin_theta = unitVectorNorth[1];
    rotAdjMatrix_ACW = [
        [cos_theta, -sin_theta],
        [sin_theta, cos_theta]
    ];
    rotAdjMatrix_CW = [
        [cos_theta, sin_theta],
        [-sin_theta, cos_theta]
    ];
}

function wgs84() {
    let wgs84a = 6378.137;
    let wgs84f = 1.0 / 298.257223563;
    let wgs84b = wgs84a * (1.0 - wgs84f);
    earthcon(wgs84a, wgs84b);
}

function earthcon(a, b) {
    let f = 1 - b / a;
    let eccsq = 1 - b * b / (a * a);
    let ecc = Math.sqrt(eccsq);

    EARTH_A = a;
    EARTH_B = b;
    EARTH_F = f;
    EARTH_Ecc = ecc;
    EARTH_Esq = eccsq;
}

// Methods
function radcur(lat) {
    let rrnrm = [0, 0, 0];
    let dtr = Math.PI / 180.0;
    geodGBL();

    let a = EARTH_A;
    let b = EARTH_B;

    let asq = a * a;
    let bsq = b * b;
    let eccsq = 1 - bsq / asq;
    let ecc = Math.sqrt(eccsq);

    let clat = Math.cos(dtr * lat);
    let slat = Math.sin(dtr * lat);

    let dsq = 1.0 - eccsq * slat * slat;
    let d = Math.sqrt(dsq);

    let rn = a / d;
    let rm = rn * (1.0 - eccsq) / dsq;

    let rho = rn * clat;
    let z = (1.0 - eccsq) * rn * slat;
    let rsq = rho * rho + z * z;
    let r = Math.sqrt(rsq);

    rrnrm[0] = r;
    rrnrm[1] = rn;
    rrnrm[2] = rm;

    return rrnrm;
}

function rearth(lat) {
    let rrnrm = radcur(lat);
    let r = rrnrm[0];
    return r;
}

function gc2gd(flatgc, altkm) {
    let dtr = Math.PI / 180.0;
    let rtd = 1 / dtr;

    geodGBL();

    let ecc = EARTH_Ecc;
    let esq = ecc * ecc;

    let altnow = altkm;
    let rrnrm = radcur(flatgc);
    let rn = rrnrm[1];

    let ratio = 1 - esq * rn / (rn + altnow);

    let tlat = Math.tan(dtr * flatgc) / ratio;
    let flatgd = rtd * Math.atan(tlat);

    rrnrm = radcur(flatgd);
    rn = rrnrm[1];

    ratio = 1 - esq * rn / (rn + altnow);
    tlat = Math.tan(dtr * flatgc) / ratio;
    flatgd = rtd * Math.atan(tlat);

    return flatgd;
}

function gd2gc(flatgd, altkm) {
    let dtr = Math.PI / 180.0;
    let rtd = 1 / dtr;

    geodGBL();

    let ecc = EARTH_Ecc;
    let esq = ecc * ecc;

    let altnow = altkm;
    let rrnrm = radcur(flatgd);
    let rn = rrnrm[1];

    let ratio = 1 - esq * rn / (rn + altnow);

    let tlat = Math.tan(dtr * flatgd) * ratio;
    let flatgc = rtd * Math.atan(tlat);

    return flatgc;
}

function llenu(flat, flon) {
    let dtr = Math.PI / 180.0;

    let clat = Math.cos(dtr * flat);
    let slat = Math.sin(dtr * flat);
    let clon = Math.cos(dtr * flon);
    let slon = Math.sin(dtr * flon);

    let ee = [-slon, clon, 0.0];
    let en = [-clon * slat, -slon * slat, clat];
    let eu = [clon * clat, slon * clat, slat];

    return [ee, en, eu];
}

function llhxyz(flat, flon, altkm) {
    let dtr = Math.PI / 180.0;
    geodGBL();

    let clat = Math.cos(dtr * flat);
    let slat = Math.sin(dtr * flat);
    let clon = Math.cos(dtr * flon);
    let slon = Math.sin(dtr * flon);

    let rrnrm = radcur(flat);
    let rn = rrnrm[1];
    let re = rrnrm[0];

    let ecc = EARTH_Ecc;
    let esq = ecc * ecc;

    let xvec = [
        (rn + altkm) * clat * clon,
        (rn + altkm) * clat * slon,
        ((1 - esq) * rn + altkm) * slat
    ];

    return xvec;
}

function xyzllh(xvec) {
    let dtr = Math.PI / 180.0;
    geodGBL();

    let esq = EARTH_Esq;

    let x = xvec[0];
    let y = xvec[1];
    let z = xvec[2];

    let rp = Math.sqrt(x * x + y * y + z * z);

    let flatgc = Math.asin(z / rp) / dtr;

    let testval = Math.abs(x) + Math.abs(y);
    let flon = testval < 1.0e-10 ? 0.0 : Math.atan2(y, x) / dtr;
    if (flon < 0.0) flon += 360.0;

    let p = Math.sqrt(x * x + y * y);

    if (p < 1.0e-10) {
        let flat = z < 0.0 ? -90.0 : 90.0;
        let altkm = rp - rearth(flat);
        return [flat, flon, altkm];
    }

    let rnow = rearth(flatgc);
    let altkm = rp - rnow;
    let flat = gc2gd(flatgc, altkm);

    let rrnrm = radcur(flat);
    let rn = rrnrm[1];

    for (let kount = 0; kount < 5; kount++) {
        let slat = Math.sin(dtr * flat);
        let tangd = (z + rn * esq * slat) / p;
        let flatn = Math.atan(tangd) / dtr;

        let dlat = flatn - flat;
        flat = flatn;
        let clat = Math.cos(dtr * flat);

        rrnrm = radcur(flat);
        rn = rrnrm[1];

        altkm = (p / clat) - rn;

        if (Math.abs(dlat) < 1.0e-12) break;
    }

    return [flat, flon, altkm];
}

// All methods from this point added by Jen Laing 2020.

function LatLonAlt2ECEF(lat, lon, altkm) {
    let geodecticLat = gc2gd(lat, altkm);
    let ECEFxyz = llhxyz(geodecticLat, lon, altkm);
    return ECEFxyz;
}

function ECEF2LatLonAlt(xvec) {
    let geodeticLatLonAlt = xyzllh(xvec);
    let geocentricLatLonAlt = [
        gd2gc(geodeticLatLonAlt[0], geodeticLatLonAlt[2]),
        geodeticLatLonAlt[1],
        geodeticLatLonAlt[2]
    ];
    return geocentricLatLonAlt;
}

function LatLonAlt2ENUUnitVectors(lat, lon, altkm) {
    let geodeticLat = gc2gd(lat, altkm);
    let ENUUnitVectors = llenu(geodeticLat, lon);
    return ENUUnitVectors;
}

function ENUDist2ECEFPos(ECEFAtRefPoint, ENUUnitVectorsAtRefPoint, ENUDist) {
    let ECEFPosition = [
        ENUUnitVectorsAtRefPoint[0][0] * ENUDist[0] + ENUUnitVectorsAtRefPoint[1][0] * ENUDist[1] + ENUUnitVectorsAtRefPoint[2][0] * ENUDist[2] + ECEFAtRefPoint[0],
        ENUUnitVectorsAtRefPoint[0][1] * ENUDist[0] + ENUUnitVectorsAtRefPoint[1][1] * ENUDist[1] + ENUUnitVectorsAtRefPoint[2][1] * ENUDist[2] + ECEFAtRefPoint[1],
        ENUUnitVectorsAtRefPoint[0][2] * ENUDist[0] + ENUUnitVectorsAtRefPoint[1][2] * ENUDist[1] + ENUUnitVectorsAtRefPoint[2][2] * ENUDist[2] + ECEFAtRefPoint[2]
    ];
    return ECEFPosition;
}

function ECEFPos2ENUDist(ECEFAtRefPoint, ECEFAtCurrentPoint, ENUUnitVectorsAtRefPoint) {
    let ECEFDist = [
        ECEFAtCurrentPoint[0] - ECEFAtRefPoint[0],
        ECEFAtCurrentPoint[1] - ECEFAtRefPoint[1],
        ECEFAtCurrentPoint[2] - ECEFAtRefPoint[2]
    ];
    let ENUDist = [
        ENUUnitVectorsAtRefPoint[0][0] * ECEFDist[0] + ENUUnitVectorsAtRefPoint[0][1] * ECEFDist[1] + ENUUnitVectorsAtRefPoint[0][2] * ECEFDist[2],
        ENUUnitVectorsAtRefPoint[1][0] * ECEFDist[0] + ENUUnitVectorsAtRefPoint[1][1] * ECEFDist[1] + ENUUnitVectorsAtRefPoint[1][2] * ECEFDist[2],
        ENUUnitVectorsAtRefPoint[2][0] * ECEFDist[0] + ENUUnitVectorsAtRefPoint[2][1] * ECEFDist[1] + ENUUnitVectorsAtRefPoint[2][2] * ECEFDist[2]
    ];
    return ENUDist;
}

// Adjustments to correct for whatever north has been set to in scene
function ENU2Unity(enuVector) {
    if (!rotAdjMatrix_ACW) SetAdjMatrix();
    let standardUnity = [enuVector[1], enuVector[2], -enuVector[0]];
    let adjForNorthUnity = [
        rotAdjMatrix_ACW[0][0] * standardUnity[0] + rotAdjMatrix_ACW[0][1] * standardUnity[2],
        standardUnity[1],
        rotAdjMatrix_ACW[1][0] * standardUnity[0] + rotAdjMatrix_ACW[1][1] * standardUnity[2]
    ];
    return adjForNorthUnity;
}

function Unity2ENU(unityVector) {
    if (!rotAdjMatrix_ACW) SetAdjMatrix();
    let standardUnity = [
        rotAdjMatrix_CW[0][0] * unityVector[0] + rotAdjMatrix_CW[0][1] * unityVector[2],
        unityVector[1],
        rotAdjMatrix_CW[1][0] * unityVector[0] + rotAdjMatrix_CW[1][1] * unityVector[2]
    ];
    let enu = [-standardUnity[2], standardUnity[0], standardUnity[1]];
    return enu;
}

// Public Methods
function LatLonAltEstimate(latRefPoint, lonRefPoint, altRefPoint, refPointInUnity, currentPositionInSim) {
    let latLonAltEstimate = [0, 0, 0];
    let diff = Unity2ENU([
        currentPositionInSim[0] - refPointInUnity[0],
        currentPositionInSim[1] - refPointInUnity[1],
        currentPositionInSim[2] - refPointInUnity[2]
    ]);
    let diffInKm = [diff[0] / 1000, diff[1] / 1000, diff[2] / 1000];
    let altKm = altRefPoint / 1000;
    let ECEFRefPoint = LatLonAlt2ECEF(latRefPoint, lonRefPoint, altKm);
    let ENUUnitVectorsAtRefPoint = LatLonAlt2ENUUnitVectors(latRefPoint, lonRefPoint, altKm);
    let ECEFCurrentPos = ENUDist2ECEFPos(ECEFRefPoint, ENUUnitVectorsAtRefPoint, diffInKm);

    latLonAltEstimate = ECEF2LatLonAlt(ECEFCurrentPos);
    latLonAltEstimate[2] *= 1000;
    if (latLonAltEstimate[0] > 90) latLonAltEstimate[0] = 180 - latLonAltEstimate[0];
    if (latLonAltEstimate[0] < -90) latLonAltEstimate[0] = -180 - latLonAltEstimate[0];
    if (latLonAltEstimate[1] > 180) latLonAltEstimate[1] -= 360;
    if (latLonAltEstimate[1] < -180) latLonAltEstimate[1] += 360;

    return latLonAltEstimate;
}

function LatLonAltEstimate2(latRefPoint, lonRefPoint, altRefPoint, refPointInUnity, currentPositionInSim) {
    let latLonAltEstimate = [0, 0, 0];
    let diffInUnity = Unity2ENU([
        currentPositionInSim[0] - refPointInUnity[0],
        currentPositionInSim[1] - refPointInUnity[1],
        currentPositionInSim[2] - refPointInUnity[2]
    ]);

    latLonAltEstimate[0] = latRefPoint + diffInUnity[2] / LengthOneDegOfLatInMetresAtRefPoint(latRefPoint);
    latLonAltEstimate[1] = lonRefPoint + diffInUnity[0] / LengthOneDegOfLonInMetresAtRefPoint(latRefPoint);

    if (latLonAltEstimate[0] > 90) latLonAltEstimate[0] = 180 - latLonAltEstimate[0];
    if (latLonAltEstimate[0] < -90) latLonAltEstimate[0] = -180 - latLonAltEstimate[0];
    if (latLonAltEstimate[1] > 180) latLonAltEstimate[1] -= 360;
    if (latLonAltEstimate[1] < -180) latLonAltEstimate[1] += 360;

    return latLonAltEstimate;
}

function LengthOneDegOfLatInMetresAtRefPoint(latAtRefPoint) {
    let latAtRefPointInRads = latAtRefPoint * Math.PI / 180;
    let lengthInMetres = 111132.92 - 559.82 * Math.cos(2 * latAtRefPointInRads) + 1.175 * Math.cos(4 * latAtRefPointInRads) - 0.0023 * Math.cos(6 * latAtRefPointInRads);
    return lengthInMetres;
}

function LengthOneDegOfLonInMetresAtRefPoint(latAtRefPoint) {
    let latAtRefPointInRads = latAtRefPoint * Math.PI / 180;
    let lengthInMetres = 111412.84 * Math.cos(latAtRefPointInRads) - 93.5 * Math.cos(3 * latAtRefPointInRads) + 0.118 * Math.cos(5 * latAtRefPointInRads);
    return lengthInMetres;
}

function LatLonAltkm2UnityPos(lat_refPoint, lon_refPoint, alt_refPoint, lat_transformPoint, lon_transformPoint, alt_transformPoint, simPos_refPoint) {
    let ECEF_refPoint = LatLonAlt2ECEF(lat_refPoint, lon_refPoint, alt_refPoint);
    let ECEF_transformPoint = LatLonAlt2ECEF(lat_transformPoint, lon_transformPoint, alt_transformPoint);
    let enuUnitVectors = LatLonAlt2ENUUnitVectors(lat_refPoint, lon_refPoint, alt_refPoint);
    let distInKm = ECEFPos2ENUDist(ECEF_refPoint, ECEF_transformPoint, enuUnitVectors);
    let distInMetres = [1000 * distInKm[0], 1000 * distInKm[1], 1000 * distInKm[2]];
    let transformedDist = ENU2Unity(distInMetres);

    let transformedPoint = [
        simPos_refPoint[0] + transformedDist[0],
        simPos_refPoint[1] + transformedDist[1],
        simPos_refPoint[2] + transformedDist[2]
    ];

    return transformedPoint;
}

// Export functions as needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        LatLonAltEstimate,
        LatLonAltEstimate2,
        LengthOneDegOfLatInMetresAtRefPoint,
        LengthOneDegOfLonInMetresAtRefPoint,
        LatLonAltkm2UnityPos,
    };
} else if (typeof window !== 'undefined') {
    window.WGS84Converter = {
        LatLonAltEstimate,
        LatLonAltEstimate2,
        LengthOneDegOfLatInMetresAtRefPoint,
        LengthOneDegOfLonInMetresAtRefPoint,
        LatLonAltkm2UnityPos,
    };
}