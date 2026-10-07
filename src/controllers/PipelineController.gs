/**
 * FLEET_SAFETY_INTELLIGENCE_V2
 * 14. FILE: controllers/PipelineController.gs
 */
function runFullMonthlyPipeline() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt('Full Monthly Pipeline V2', 'กรุณาระบุเดือนที่ต้องการประมวลผล (รูปแบบ YYYY-MM เช่น 2026-02):', ui.ButtonSet.OK_CANCEL);
  
  if (res.getSelectedButton() !== ui.Button.OK) return;
  const month = res.getResponseText().trim();
  
  try {
    Validator.requireYearMonth(month);
    const scores = DriverScoreService.calculate(month);
    const risks = DriverRiskService.detect();
    const plans = CoachingService.generate();
    const kpis = DriverKPIService.calculate(month);


    let msg = `📊 <b>Monthly Pipeline V2 Complete</b>\n`;
        msg += `📆 ประจำเดือน: ${month}\n\n`;
        msg += `✅ คำนวณคะแนนรถ: ${scores.length} คัน\n`;
        msg += `🚨 ตรวจพบกลุ่มเสี่ยง: ${risks.length} รายการ\n`;
        msg += `🎓 สร้างแผน Coaching: ${plans.length} แผน\n`;
        msg += `🏆 สรุป KPI รายบุคคล: ${kpis.length} คน`;


    NotificationService.broadcast(msg);
    ui.alert(`✅ Pipeline เสร็จสิ้นสมบูรณ์ (V2 Ready)\n\n- คำนวณคะแนนแล้ว ${scores.length} คัน\n- สรุป KPI แล้ว ${kpis.length} รายการ\n- แจ้งเตือนส่งออกเรียบร้อยแล้ว`);
  } catch (e) {
    ui.alert(`❌ Pipeline Error (${month}): ${e.message}`);
  }
}
