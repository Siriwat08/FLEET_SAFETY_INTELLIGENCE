/**
 * FLEET_SAFETY_INTELLIGENCE_V2
 * 16. FILE: services/CommunitySpeedService.gs
 * VERSION: V2.9 (State Machine, No Delay, lat,lng,speed,time)
 */
const CommunitySpeedService = {
  analyze(gpsData, vName, zonesRows) {
    const violations = [];
    if (!zonesRows || zonesRows.length === 0 || !gpsData || gpsData.length === 0) return [];


    const preparedZones = zonesRows.map(z => {
      const type = (z["ประเภท"] || "").toString().toLowerCase();
      const limit = parseFloat(z["จำกัดความเร็ว"] || 30);
      const name = z["ชื่อสถานที่"] || "Unknown Zone";
      const rawPath = z["พิกัดมุม"] || "";
      if (type === "polygon" && rawPath) {
        const coords = rawPath.split('|').map(p => {
          const pts = p.trim().split(',');
          return { lat: parseFloat(pts[0]), lng: parseFloat(pts[1]) };
        }).filter(c => !isNaN(c.lat) && !isNaN(c.lng));
        return { name, path: coords, limit };
      }
      return null;
    }).filter(z => z !== null);


    if (preparedZones.length === 0) return [];
    const activeViolations = {};


    gpsData.forEach((p, index) => {
      const speed = parseFloat(p.speed || p.Speed || 0);
      const lat = parseFloat(p.latitude || p.lat);
      const lng = parseFloat(p.longitude || p.lng);
      const timeStr = p.position_timestamp || p.Position_Timestamp || p.time;
      if (!timeStr) return;


      const tMatch = timeStr.match(/\d{2}:\d{2}:\d{2}/);
      const shortTime = tMatch ? tMatch[0] : (timeStr.split(' ')[1] || '-');
      const pointDataStr = `${lat},${lng},${Math.round(speed)},${shortTime}`;


      preparedZones.forEach(zone => {
        const zName = zone.name;
        const isInside = Utils.isPointInPolygon(lat, lng, zone.path);


        if (isInside) {
          if (speed > zone.limit) {
            if (!activeViolations[zName]) {
              activeViolations[zName] = { startStr: timeStr, maxSpeed: speed, points: [pointDataStr] };
            } else {
              if (speed > activeViolations[zName].maxSpeed) activeViolations[zName].maxSpeed = speed;
              activeViolations[zName].points.push(pointDataStr);
            }
          } else {
            if (activeViolations[zName]) this._closeViolation(violations, activeViolations, zName, vName, zone.limit);
          }
        } else {
          if (activeViolations[zName]) this._closeViolation(violations, activeViolations, zName, vName, zone.limit);
        }
      });
    });


    Object.keys(activeViolations).forEach(zName => {
      const zone = preparedZones.find(z => z.name === zName);
      this._closeViolation(violations, activeViolations, zName, vName, zone.limit);
    });


    return violations;
  },


  _closeViolation(violationsArray, activeMap, zName, vName, limit) {
    const v = activeMap[zName];
    let finalPts = v.points;
    if (finalPts.length > 20) {
      const step = (finalPts.length - 1) / 19;
      finalPts = Array.from({length: 20}, (_, i) => v.points[Math.round(i * step)]);
    }


    violationsArray.push([
      v.startStr.split(' ')[0], vName, zName, v.startStr, Math.round(v.maxSpeed), limit, finalPts.join('|'), ""
    ]);
    delete activeMap[zName]; 
  }
};
