/**
 * FLEET_SAFETY_INTELLIGENCE_V2
 * FILE: services/CameraService.gs
 * โมดูลเชื่อมต่อระบบกล้อง MDVR (Video Telematics Integration)
 */


const CameraService = {
  
  /**
   * 1. ฟังก์ชันขอ Token (jsession) จากระบบกล้อง
   */
  getSession() {
    const url = `${CONFIG.CAMERA_LOGIN_URL}?account=${CONFIG.CAMERA_ACCOUNT}&password=${CONFIG.CAMERA_PASSWORD}`;
    
    try {
      const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      const json = JSON.parse(response.getContentText());
      
      if (json.result === 0 && json.jsession) {
        return json.jsession;
      } else {
        console.error(`[CameraService] Login Failed: ${response.getContentText()}`);
        return null;
      }
    } catch (e) {
      console.error(`[CameraService] Error fetching session: ${e.message}`);
      return null;
    }
  },


  /**
   * 2. ฟังก์ชันสร้าง URL สำหรับดูกล้องสด (Realtime)
   * @param {string} plateNum - ทะเบียนรถ (เช่น "2ฒล-6206")
   */
  getLiveVideoUrl(plateNum) {
    const session = this.getSession();
    if (!session) return "";


    // 🛡️ ต้อง Encode ทะเบียนรถเสมอ เพราะมีภาษาไทย
    const encodedPlate = encodeURIComponent(plateNum.trim());
    
    return `${CONFIG.CAMERA_BASE_URL}/RealPlayVideo.html?account=${CONFIG.CAMERA_ACCOUNT}&password=${CONFIG.CAMERA_PASSWORD}&jsession=${session}&PlateNum=${encodedPlate}&lang=en`;
  },


  /**
   * 3. [ระบบเดาทาง] ฟังก์ชันสร้าง URL สำหรับดูย้อนหลัง (Playback)
   * อ้างอิงจากโครงสร้างมาตรฐานของ CMSV6 Platform
   */
  getPlaybackUrl(plateNum, startTime, endTime) {
    const session = this.getSession();
    if (!session) return "";


    const encodedPlate = encodeURIComponent(plateNum.trim());
    const encStart = encodeURIComponent(startTime); // รูปแบบที่เดา: YYYY-MM-DD HH:mm:ss
    const encEnd = encodeURIComponent(endTime);
    
    // ⚠️ คาดเดาว่าไฟล์ชื่อ TrackPlayback.html 
    return `${CONFIG.CAMERA_BASE_URL}/TrackPlayback.html?account=${CONFIG.CAMERA_ACCOUNT}&password=${CONFIG.CAMERA_PASSWORD}&jsession=${session}&PlateNum=${encodedPlate}&startTime=${encStart}&endTime=${encEnd}&lang=en`;
  }
};
