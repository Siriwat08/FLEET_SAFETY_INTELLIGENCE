/**
 * FLEET_SAFETY_INTELLIGENCE_V2
 * 12. FILE: ui/Menu.gs
 */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('🚦 Fleet Safety V2')
    .addItem('📊 ประมวลผลข้อมูลของวันนี้', 'runDailyNow')
    .addItem('▶ ประมวลผลข้อมูล (ระบุวันที่)', 'runManualDate')
    .addSeparator()
    .addItem('🗺️ อัปเดตพิกัด Geofence ลง Looker', 'runSyncGeodata')
    .addSeparator()
    .addItem('⚡ Full Monthly Pipeline (รวดเดียวจบ)', 'runFullMonthlyPipeline')
    .addSeparator()
    .addItem('⚙️ ตรวจสอบการตั้งค่าระบบ (Health Check)', 'checkSystemConfig')
    .addToUi();
}
