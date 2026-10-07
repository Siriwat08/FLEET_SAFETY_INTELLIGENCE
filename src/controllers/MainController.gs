/**
 * FLEET_SAFETY_INTELLIGENCE_V2
 * 13. FILE: controllers/MainController.gs
 */
function runDailyNow() {
  const ui = SpreadsheetApp.getUi();
  const confirm = ui.alert('ยืนยันการรัน', 'ระบบจะดึงข้อมูล GPS และส่งแจ้งเตือน ต้องการดำเนินการต่อหรือไม่?', ui.ButtonSet.YES_NO);
  if (confirm === ui.Button.YES) {
    try {
      const count = mainProcess(new Date(), true);
      ui.alert(`✅ สำเร็จ: พบเหตุการณ์ขับเร็วรวม ${count} รายการ`);
    } catch (e) { ui.alert('❌ ผิดพลาด: ' + e.message); }
  }
}


function runManualDate() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt('ประมวลผลย้อนหลัง', 'กรุณาระบุวันที่ (YYYY-MM-DD):', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() === ui.Button.OK) {
    try {
      Validator.requireDate(res.getResponseText());
      const d = new Date(res.getResponseText());
      const count = mainProcess(d, true);
      ui.alert(`✅ สำเร็จ: ประมวลผลของวันที่ ${res.getResponseText()} เรียบร้อย (${count} รายการ)`);
    } catch (e) { ui.alert('❌ ผิดพลาด: ' + e.message); }
  }
}


function runSyncGeodata() { GeospatialService.syncLookerData(); }


function checkSystemConfig() {
  const ui = SpreadsheetApp.getUi();
  const issues = [];
  if (!CONFIG.API_KEY) issues.push("- ไม่พบ API_KEY ใน Script Properties");
  if (!CONFIG.TELEGRAM_TOKEN && !CONFIG.LINE_CHANNEL_TOKEN) issues.push("- ไม่พบ Token แจ้งเตือนเลย");
  if (issues.length > 0) ui.alert('⚠️ ตรวจพบปัญหาการตั้งค่า:\n' + issues.join('\n'));
  else ui.alert('✅ ระบบพร้อมใช้งาน');
}
