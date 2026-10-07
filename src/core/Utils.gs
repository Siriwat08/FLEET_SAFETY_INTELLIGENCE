/**
 * FLEET_SAFETY_INTELLIGENCE_V2
 * 2. FILE: core/Utils.gs
 * รวมฟังก์ชันอรรถประโยชน์ส่วนกลาง (Common Utilities)
 * รองรับการจัดการข้อมูลแบบปลอดภัย (Safe Write), การแปลงวันที่รูปแบบ UK
 * และลอจิกตรวจสอบพื้นที่ทางภูมิศาสตร์ (Geofence Logic)
 */


const Utils = {


  /**
   * ดึงออบเจ็กต์ Sheet ตามชื่อที่ระบุ
   * @param {string} name - ชื่อของ Sheet
   */
  getSheet(name) {
    const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
    if (!s) throw new Error(`ไม่พบแผ่นงานชื่อ "${name}" ในระบบ`);
    return s;
  },


  /**
   * อ่านข้อมูลจาก Sheet และแปลงเป็น Array ของ Object (ใช้ Header เป็น Key)
   * @param {string} name - ชื่อของ Sheet
   */
  readSheet(name) {
    const s = this.getSheet(name);
    const data = s.getDataRange().getValues();
    if (data.length <= 1) return { headers: data[0] || [], rows: [] };
    
    const headers = data[0];
    const rows = data.slice(1).map(r => {
      const obj = {};
      headers.forEach((h, i) => { 
        obj[h] = r[i]; 
      });
      return obj;
    });
    return { headers, rows };
  },


  /**
   * 🚀 (Safe Write) เขียนข้อมูลทับโดยไม่ลบ Header
   * ป้องกันการพังของ Schema ใน AppSheet และรองรับการ Sync ที่เสถียร
   */
  writeSheet(name, headers, data2d) {
    const s = this.getSheet(name);
    const lastRow = s.getLastRow();
    
    // 1. เขียนหรืออัปเดต Header เสมอ (แถวที่ 1)
    s.getRange(1, 1, 1, headers.length).setValues([headers]);


    // 2. ล้างข้อมูลเก่า (เฉพาะแถว 2 ลงไป) โดยไม่แตะต้อง Row 1
    if (lastRow > 1) {
      const maxCol = Math.max(headers.length, s.getLastColumn() || 1);
      s.getRange(2, 1, lastRow - 1, maxCol).clearContent();
    }


    // 3. เขียนข้อมูลชุดใหม่ (เริ่มที่แถว 2)
    if (data2d && data2d.length > 0) {
      s.getRange(2, 1, data2d.length, headers.length).setValues(data2d);
    }
  },


  /**
   * 🚀 (Append Mode) เขียนข้อมูลต่อท้ายแผ่นงาน
   * เหมาะสำหรับ Speeding_Log ที่มีปริมาณข้อมูลมหาศาล
   */
  appendData(name, data2d) {
    if (!data2d || data2d.length === 0) return;
    const s = this.getSheet(name);
    const lastRow = s.getLastRow();
    // เริ่มเขียนที่แถวถัดไป (อย่างน้อยแถว 2)
    const targetRow = lastRow < 1 ? 2 : lastRow + 1; 
    s.getRange(targetRow, 1, data2d.length, data2d[0].length).setValues(data2d);
  },


  /**
   * 🛡️ (Geofence Logic) ตรวจสอบว่าพิกัด (Lat, Lng) อยู่ในพื้นที่ Polygon หรือไม่
   * ใช้ Ray Casting Algorithm เพื่อความแม่นยำสูง
   * @param {number} lat - พิกัดละติจูดของรถ
   * @param {number} lng - พิกัดลองจิจูดของรถ
   * @param {Array} polygon - รายการพิกัดมุม [{lat: x, lng: y}, ...]
   */
  isPointInPolygon(lat, lng, polygon) {
    let isInside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat, yi = polygon[i].lng;
      const xj = polygon[j].lat, yj = polygon[j].lng;
      
      const intersect = ((yi > lng) !== (yj > lng)) && 
                        (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
      if (intersect) isInside = !isInside;
    }
    return isInside;
  },


  /**
   * 🛡️ (UK Date Standardizer) แปลงวันที่ทุกรูปแบบให้เป็นมาตรฐานระบบ (YYYY-MM)
   * รองรับทั้ง Date Object, รูปแบบ UK (DD/MM/YYYY) และ ISO (YYYY-MM-DD)
   * @param {any} val - ค่าวันที่ที่ต้องการแปลง
   * @param {boolean} returnFullDate - คืนค่าเป็น YYYY-MM-DD หรือไม่ (เริ่มต้น false)
   */
  standardizeDate(val, returnFullDate = false) {
    if (!val) return '';
    
    // กรณีเป็น Date Object (Google Sheets มองเป็นวันที่อัตโนมัติ)
    if (val instanceof Date) {
      return Utilities.formatDate(val, CONFIG.TIMEZONE, returnFullDate ? 'yyyy-MM-dd' : 'yyyy-MM');
    }
    
    const str = val.toString().trim();
    
    // กรณี UK/Thai Format: DD/MM/YYYY
    const matchDMY = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
    // กรณี ISO Format: YYYY-MM-DD
    const matchYMD = str.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    // กรณี Month Format: YYYY-MM
    const matchYM  = str.match(/^(\d{4})[-\/](\d{1,2})/);


    if (matchDMY) {
      const y = matchDMY[3];
      const m = matchDMY[2].padStart(2, '0');
      const d = matchDMY[1].padStart(2, '0');
      return returnFullDate ? `${y}-${m}-${d}` : `${y}-${m}`;
    } else if (matchYMD) {
      const y = matchYMD[1];
      const m = matchYMD[2].padStart(2, '0');
      const d = matchYMD[3].padStart(2, '0');
      return returnFullDate ? `${y}-${m}-${d}` : `${y}-${m}`;
    } else if (matchYM) {
      return `${matchYM[1]}-${matchYM[2].padStart(2, '0')}`;
    }
    
    return str.substring(0, returnFullDate ? 10 : 7);
  },


  /**
   * จัดรูปแบบวันที่สำหรับการแสดงผลทั่วไป
   */
  formatDate(d, fmt) {
    if (!(d instanceof Date)) d = new Date(d);
    return Utilities.formatDate(d, CONFIG.TIMEZONE, fmt || 'yyyy-MM-dd');
  },


  getKPILevel(score) {
    return CONFIG.KPI_LEVELS.find(l => (parseFloat(score) || 0) >= l.min);
  },


  /**
   * คำนวณระยะทางระหว่าง 2 พิกัด (กิโลเมตร) ด้วย Haversine Formula
   * (ใช้เป็นแผนสำรอง กรณีที่ API ไม่ได้ส่งเลขกิโลรวมมาให้ใน Request เดียวกัน)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // รัศมีโลก (กิโลเมตร)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
};
