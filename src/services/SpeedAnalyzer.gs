/**
 * FLEET_SAFETY_INTELLIGENCE_V2
 * 6. FILE: services/SpeedAnalyzer.gs
 * VERSION: V2.9 (lat,lng,speed,time)
 */
const SpeedAnalyzer = {
  analyze(vehicle, gpsData) {
    if (!gpsData || !Array.isArray(gpsData) || gpsData.length === 0) return [];
    const vName = vehicle['ชื่อรถ'] || 'Unknown';
    const vImei = (vehicle['IMEI'] || vehicle[1] || '').toString();
    const sessions = [];
    let current = null;


    gpsData.forEach((point, index) => {
      const speed = parseFloat(point.speed || point.Speed || 0);
      const timeStr = point.position_timestamp || point.Position_Timestamp || point.time;
      if (!timeStr) return;


      const lat = point.latitude || point.lat;
      const lng = point.longitude || point.lng;
      const tMatch = timeStr.match(/\d{2}:\d{2}:\d{2}/);
      const shortTime = tMatch ? tMatch[0] : (timeStr.split(' ')[1] || '-');


      if (speed > CONFIG.SPEED_THRESHOLD) {
        const timeObj = new Date(timeStr.replace(/-/g, '/'));
        if (!current) {
          current = { startStr: timeStr, startTime: timeObj, maxSpeed: speed, lat: lat, lng: lng, allPoints: [] };
        } else if (speed > current.maxSpeed) {
          current.maxSpeed = speed;
        }
        current.allPoints.push(`${lat},${lng},${Math.round(speed)},${shortTime}`);
      }


      const isLastPoint = (index === gpsData.length - 1);
      if (current && (speed <= CONFIG.SPEED_THRESHOLD || isLastPoint)) {
        const durationSec = (new Date(timeStr.replace(/-/g, '/')) - current.startTime) / 1000;
        if (durationSec >= CONFIG.MIN_DURATION_SEC) {
          sessions.push([
            current.startStr.split(' ')[0], vName, vImei, current.startStr, timeStr,
            Math.round((durationSec / 60) * 10) / 10, Math.round(current.maxSpeed),
            `https://maps.google.com/?q=${current.lat},${current.lng}`, current.allPoints.join('|')
          ]);
        }
        current = null;
      }
    });
    return sessions;
  }
};
function analyzeSpeedingSessions(data, name, imei) {
  return SpeedAnalyzer.analyze({ "ชื่อรถ": name, "IMEI": imei }, data);
}
