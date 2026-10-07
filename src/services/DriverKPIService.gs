/**
 * FLEET_SAFETY_INTELLIGENCE_V2
 * 11. FILE: services/DriverKPIService.gs
 */
const DriverKPIService = {
  calculate(yearMonth) {
    const { rows: scoreRows }  = Utils.readSheet(CONFIG.SHEETS.DRIVER_SCORE);
    const { rows: assignRows } = Utils.readSheet(CONFIG.SHEETS.DRIVER_ASSIGNMENT);
    if (scoreRows.length === 0) return [];


    let assignmentMap = {};
    assignRows.forEach(a => {
      const stdMonth = Utils.standardizeDate(a['เดือน']);
      const vName = a['ชื่อรถ'] ? a['ชื่อรถ'].toString().trim() : '';
      if (stdMonth === yearMonth && vName) assignmentMap[`${stdMonth}|${vName}`] = a;
    });


    const output = scoreRows.filter(s => Utils.standardizeDate(s['เดือน']) === yearMonth).map(s => {
        const vName = s['ชื่อรถ'] ? s['ชื่อรถ'].toString().trim() : '';
        const score = parseFloat(s['Score']) || 0;
        const assignment = assignmentMap[`${yearMonth}|${vName}`];
        
        const driverId   = assignment ? assignment['Driver_ID'] || '-' : 'N/A';
        const driverName = assignment ? assignment['ชื่อ-นามสกุล'] || 'Unassigned' : 'ยังไม่ได้ระบุคนขับ';
        const kpi = Utils.getKPILevel(score);


        return [ yearMonth, driverId, driverName, vName, score, s['Grade'] || '-', kpi.label, kpi.status ];
      });


    Utils.writeSheet(CONFIG.SHEETS.DRIVER_KPI, ['เดือน', 'Driver_ID', 'ชื่อคนขับ', 'ชื่อรถ', 'Score', 'Grade', 'KPI_Level', 'KPI_Status'], output);
    return output;
  }
};
