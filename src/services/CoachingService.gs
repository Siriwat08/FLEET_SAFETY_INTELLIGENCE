/**
 * FLEET_SAFETY_INTELLIGENCE_V2
 * 10. FILE: services/CoachingService.gs
 */
const CoachingService = {
  RULES: [
    { test: (count, maxSpeed, risk) => risk === 'HIGH', behavior: 'Chronic Risk (ความเสี่ยงสะสมสูง)', recommendation: 'โค้ชตัวต่อตัวโดยหัวหน้างานและเจ้าหน้าที่ความปลอดภัย', action: 'Driving Assessment ภายใน 14 วัน' },
    { test: (count, maxSpeed) => maxSpeed > 110, behavior: 'Speed Burst (ใช้ความเร็วสูงรุนแรง)', recommendation: 'อบรมเทคนิคการควบคุมความเร็วและผลกระทบจากอุบัติเหตุ', action: 'Safety Training 1 วัน + ประเมินซ้ำใน 30 วัน' },
    { test: (count) => count > 5, behavior: 'Frequent Violator (ทำผิดซ้ำซาก)', recommendation: 'อบรมสร้างจิตสำนึกและวินัยการขับขี่ทางบก', action: 'จัดทำบันทึกตักเตือนและติดตามทุกสัปดาห์เป็นเวลา 1 เดือน' },
    { test: () => true, behavior: 'Speeding Behavior (พฤติกรรมขับเร็ว)', recommendation: 'อบรมการรักษาความเร็วคงที่ตามกฎหมายกำหนด', action: 'ทดสอบขับรถ (On-road Test) กับหัวหน้างาน' }
  ],
  generate() {
    const { rows: riskRows } = Utils.readSheet(CONFIG.SHEETS.DRIVER_RISK);
    const { rows: scoreRows } = Utils.readSheet(CONFIG.SHEETS.DRIVER_SCORE);
    if (riskRows.length === 0) return [];


    const nextMonth = new Date(); nextMonth.setDate(nextMonth.getDate() + 30);
    const followUpDate = Utils.formatDate(nextMonth, 'yyyy-MM-dd');


    const output = riskRows.map(risk => {
      const vName = risk['ชื่อรถ'] ? risk['ชื่อรถ'].toString().trim() : '';
      const stdRiskMonth = Utils.standardizeDate(risk['เดือนล่าสุด']);
      const scoreMatch = scoreRows.find(s => Utils.standardizeDate(s['เดือน']) === stdRiskMonth && s['ชื่อรถ'].toString().trim() === vName);


      if (!scoreMatch) return null;
      const count = parseFloat(scoreMatch['จำนวนครั้ง']) || 0;
      const maxSpeed = parseFloat(scoreMatch['MaxSpeed']) || 0;
      const riskLvl = risk['RiskLevel'];


      const rule = this.RULES.find(r => r.test(count, maxSpeed, riskLvl));
      return [ vName, risk['เดือนล่าสุด'], riskLvl, rule.behavior, rule.recommendation, rule.action, followUpDate ];
    }).filter(row => row !== null);


    Utils.writeSheet(CONFIG.SHEETS.DRIVER_COACHING, ['ชื่อรถ', 'เดือน', 'RiskLevel', 'พฤติกรรมหลัก', 'คำแนะนำ', 'Action Plan', 'ติดตามอีกครั้ง'], output);
    return output;
  }
};
