/**
 * FLEET_SAFETY_INTELLIGENCE_V2
 * 9. FILE: services/DriverRiskService.gs
 */
const DriverRiskService = {
  detect() {
    const { rows } = Utils.readSheet(CONFIG.SHEETS.DRIVER_SCORE);
    if (rows.length === 0) return [];
    let map = {};


    rows.forEach(r => {
      const vName = r['ชื่อรถ'] ? r['ชื่อรถ'].toString().trim() : '';
      if (!vName) return;
      if (!map[vName]) map[vName] = [];
      map[vName].push({
        month: r['เดือน'], monthSort: Utils.standardizeDate(r['เดือน']),
        score: parseFloat(r['Score']) || 0, grade: r['Grade'] ? r['Grade'].toString().toUpperCase() : ''
      });
    });


    const output = [];
    Object.keys(map).forEach(vName => {
      const records = map[vName].sort((a, b) => b.monthSort.localeCompare(a.monthSort)).slice(0, 3);
      if (records.length === 0) return;


      const latest = records[0];
      const avgScore = records.reduce((sum, rec) => sum + rec.score, 0) / records.length;
      let riskLevel = 'NORMAL', remark = '';


      if (latest.grade === 'D') { riskLevel = 'HIGH'; remark = 'พบเกรด D ในเดือนล่าสุด'; } 
      else if (records.length >= 2 && ['C', 'D'].includes(records[0].grade) && ['C', 'D'].includes(records[1].grade)) { riskLevel = 'HIGH'; remark = 'เกรดต่ำ (C/D) ต่อเนื่อง 2 เดือน'; }
      else if (avgScore < 70) { riskLevel = 'MEDIUM'; remark = 'คะแนนเฉลี่ย 3 เดือนล่าสุดต่ำกว่าเกณฑ์'; }


      if (riskLevel !== 'NORMAL') {
        output.push([ vName, latest.month, latest.score, latest.grade, avgScore.toFixed(2), riskLevel, remark ]);
      }
    });


    Utils.writeSheet(CONFIG.SHEETS.DRIVER_RISK, ['ชื่อรถ', 'เดือนล่าสุด', 'Score', 'Grade', 'Avg3Month', 'RiskLevel', 'Remark'], output);
    return output;
  }
};
