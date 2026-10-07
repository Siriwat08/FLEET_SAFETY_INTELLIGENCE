/**
 * FLEET_SAFETY_INTELLIGENCE_V2
 * 8. FILE: services/DriverScoreService.gs
 */
const DriverScoreService = {
  calculate(yearMonth) {
    const { rows: logRows } = Utils.readSheet(CONFIG.SHEETS.SPEEDING_LOG);
    const { rows: communityRows } = Utils.readSheet(CONFIG.SHEETS.COMMUNITY_LOG);
    const { rows: vehicleRows } = Utils.readSheet(CONFIG.SHEETS.VEHICLE_LIST);
    let map = {};


    vehicleRows.forEach(v => {
      const vName = v['ชื่อรถ'] ? v['ชื่อรถ'].toString().trim() : '';
      if (vName) map[vName] = { count: 0, communityCount: 0, maxSpeed: 0, penalty: 0 };
    });


    logRows.forEach(r => {
      if (Utils.standardizeDate(r['วันที่']) !== yearMonth) return;
      const vName = r['ชื่อรถ'] ? r['ชื่อรถ'].toString().trim() : '';
      if (!vName) return;
      if (!map[vName]) map[vName] = { count: 0, communityCount: 0, maxSpeed: 0, penalty: 0 };


      const speed = parseFloat(r['ความเร็วสูงสุด']) || 0;
      const duration = parseFloat(r['ระยะเวลา(นาที)']) || 0;


      map[vName].count++;
      if (speed > map[vName].maxSpeed) map[vName].maxSpeed = speed;
      map[vName].penalty += 2; 
      if (speed > 110) map[vName].penalty += 5; 
      else if (speed > 100) map[vName].penalty += 3; 
      if (duration > 5) map[vName].penalty += 2; 
    });


    communityRows.forEach(r => {
      if (Utils.standardizeDate(r['วันที่']) !== yearMonth) return;
      const vName = r['ชื่อรถ'] ? r['ชื่อรถ'].toString().trim() : '';
      if (!vName) return;
      if (!map[vName]) map[vName] = { count: 0, communityCount: 0, maxSpeed: 0, penalty: 0 };


      const speed = parseFloat(r['ความเร็วที่ใช้']) || 0;
      map[vName].communityCount++;
      if (speed > map[vName].maxSpeed) map[vName].maxSpeed = speed;
      map[vName].penalty += 5;
    });


    const output = Object.keys(map).map(v => {
      const score = Math.max(0, 100 - map[v].penalty);
      const totalViolations = map[v].count + map[v].communityCount;
      const grade = score >= 85 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : 'D';
      return [ yearMonth, v, totalViolations, Math.round(map[v].maxSpeed), score, grade ];
    });


    Utils.writeSheet(CONFIG.SHEETS.DRIVER_SCORE, ['เดือน', 'ชื่อรถ', 'จำนวนครั้ง', 'MaxSpeed', 'Score', 'Grade'], output);
    return output;
  }
};
