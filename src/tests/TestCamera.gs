/**
 * สคริปต์สำหรับทดสอบการสร้างลิงก์ดูวิดีโอย้อนหลัง (Playback)
 * ใช้สำหรับตรวจสอบว่า URL ที่เดาไว้ของระบบ CMSV6 สามารถใช้งานได้จริงหรือไม่
 */


function testCameraPlaybackLink() {
  // 1. กำหนดข้อมูลจำลองสำหรับการทดสอบ
  // 💡 แนะนำให้ใช้ทะเบียนรถที่วิ่งจริงในวันที่ทดสอบ เช่น 'บธ-5953'
  const testPlate = 'บธ-5953'; 
  const testStart = '2026-02-27 10:00:00';
  const testEnd   = '2026-02-27 10:05:00';


  Logger.log(`กำลังขอ Session และสร้างลิงก์สำหรับรถ: ${testPlate}...`);


  // 2. เรียกใช้ฟังก์ชันจาก CameraService
  const playbackUrl = CameraService.getPlaybackUrl(testPlate, testStart, testEnd);


  // 3. แสดงผลลัพธ์
  if (playbackUrl) {
    Logger.log('✅ สร้างลิงก์สำเร็จ! คัดลอกลิงก์ด้านล่างนี้ (ตั้งแต่ http...) ไปเปิดใน Browser ได้เลยครับ:');
    Logger.log('--------------------------------------------------');
    Logger.log(playbackUrl);
    Logger.log('--------------------------------------------------');
  } else {
    Logger.log('❌ ไม่สามารถสร้างลิงก์ได้ กรุณาตรวจสอบการตั้งค่า CAMERA_ACCOUNT และ PASSWORD ใน Config.gs ครับ');
  }
}
