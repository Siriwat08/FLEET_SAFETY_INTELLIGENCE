/**
 * FLEET_SAFETY_INTELLIGENCE_V2
 * 5. FILE: services/GpsService.gs
 * จัดการการเชื่อมต่อกับ GPS API (Abzolute API)
 * รองรับการดึงข้อมูลทั้งแบบทีละคัน และแบบกลุ่ม (Batch) เพื่อประสิทธิภาพสูงสุด
 */


const GpsService = {


  /**
   * ดึงข้อมูลประวัติ GPS จาก API (แบบดั้งเดิม - ทีละคัน)
   * @param {string} imei - หมายเลข IMEI รถ
   * @param {string} start - เวลาเริ่มต้น (YYYY-MM-DD HH:mm:ss)
   * @param {string} end - เวลาสิ้นสุด (YYYY-MM-DD HH:mm:ss)
   */
  fetchGpsHistory(imei, start, end) {
    const payload = {
      "method":      "GetHistoryPosition",
      "method_name": "GetHistoryPosition",
      "api_key":     CONFIG.API_KEY,
      "imei":        imei,
      "start_time":  start,
      "end_time":    end
    };


    const options = {
      "method":             "post",
      "payload":            payload,
      "muteHttpExceptions": true,
      "followRedirects":    true
    };


    try {
      const res  = UrlFetchApp.fetch(CONFIG.API_URL, options);
      const text = res.getContentText();


      // Fallback Logic: หากส่งแบบ Form Data ไม่สำเร็จ ให้ลองส่งแบบ JSON Body
      if (!text || text.trim() === "") {
        console.warn(`[GpsService] Retrying ${imei} with JSON body...`);
        options.contentType = "application/json";
        options.payload     = JSON.stringify(payload);
        const retryRes = UrlFetchApp.fetch(CONFIG.API_URL, options);
        return this.parseResponse(retryRes.getContentText());
      }


      return this.parseResponse(text);
    } catch (e) {
      console.error(`[GpsService] Fetch Error for ${imei}: ${e.message}`);
      return null;
    }
  },


  /**
   * 🚀 (Performance) ดึงข้อมูลประวัติ GPS พร้อมกันหลายคัน (Parallel Batch Fetch)
   * @param {Array} vehicles - รายชื่อรถ (รองรับทั้ง Array of Objects หรือ Array 2D)
   * @param {string} start - เวลาเริ่มต้น
   * @param {string} end - เวลาสิ้นสุด
   * @returns {Object} - { "imei": [data_points], ... }
   */
  fetchGpsHistoryBatch(vehicles, start, end) {
    if (!vehicles || vehicles.length === 0) return {};


    const requests = [];
    const results = {};
    const retryRequests = [];


    // 1. เตรียมชุดคำสั่ง Request (Batch Request Preparation)
    vehicles.forEach(v => {
      // ตรวจสอบว่า IMEI อยู่ที่ Column ไหน (รองรับ Object Key 'IMEI' หรือ Array Index 1)
      const imeiRaw = v['IMEI'] || v[1];
      if (!imeiRaw) return;
      
      const imei = imeiRaw.toString().trim();
      const payload = {
        "method":      "GetHistoryPosition",
        "method_name": "GetHistoryPosition",
        "api_key":     CONFIG.API_KEY,
        "imei":        imei,
        "start_time":  start,
        "end_time":    end
      };


      requests.push({
        url: CONFIG.API_URL,
        method: "post",
        payload: payload,
        muteHttpExceptions: true,
        followRedirects: true,
        imeiRef: imei // เก็บไว้ใช้จับคู่ตอนได้ Response
      });
    });


    if (requests.length === 0) return {};


    try {
      // 2. ยิง API แบบขนาน (Parallel Execution)
      const responses = UrlFetchApp.fetchAll(requests);
      
      // 3. วิเคราะห์ผลลัพธ์รอบแรก
      responses.forEach((res, index) => {
        const req = requests[index];
        const text = res.getContentText();
        
        if (!text || text.trim() === "") {
          // เก็บเข้าลิสต์เพื่อรอยิง Retry รอบ 2 แบบ JSON
          retryRequests.push({
            url: CONFIG.API_URL,
            method: "post",
            contentType: "application/json",
            payload: JSON.stringify(req.payload),
            muteHttpExceptions: true,
            followRedirects: true,
            imeiRef: req.imeiRef
          });
        } else {
          results[req.imeiRef] = this.parseResponse(text) || [];
        }
      });


      // 4. จัดการ Retry สำหรับคันที่ไม่มีข้อมูลกลับมา (Parallel Retry)
      if (retryRequests.length > 0) {
        console.warn(`[GpsService] Batch Retry for ${retryRequests.length} vehicles...`);
        const retryResponses = UrlFetchApp.fetchAll(retryRequests);
        retryResponses.forEach((res, index) => {
          const req = retryRequests[index];
          results[req.imeiRef] = this.parseResponse(res.getContentText()) || [];
        });
      }


    } catch (err) {
      console.error(`[GpsService] Batch Error: ${err.message}`);
    }


    return results;
  },


  /**
   * ตัวช่วยแปลงข้อความ JSON จาก API ให้เป็นรูปแบบที่ใช้งานได้
   * @param {string} text - ข้อความที่ได้รับจาก API
   */
  parseResponse(text) {
    if (!text) return null;
    try {
      const responses = UrlFetchApp.fetchAll(requests);
      responses.forEach((res, index) => {
        const text = res.getContentText();
        if (!text || text.trim() === "") {
          retryRequests.push({
            url: CONFIG.API_URL, method: "post", contentType: "application/json",
            payload: JSON.stringify(requests[index].payload), muteHttpExceptions: true, followRedirects: true, imeiRef: requests[index].imeiRef
          });
        } else {
          // ปรับโครงสร้างเพื่อรองรับทั้งพิกัด และกิโลรวม
          results[requests[index].imeiRef] = this.parseResponse(text) || { list: [], distance: 0 };
        }
      });


      if (retryRequests.length > 0) {
        const retryResponses = UrlFetchApp.fetchAll(retryRequests);
        retryResponses.forEach((res, index) => {
          results[retryRequests[index].imeiRef] = this.parseResponse(res.getContentText()) || { list: [], distance: 0 };
        });
      }
    } catch (err) { console.error(`[GpsService] Batch Error: ${err.message}`); }
    return results;
  },


  parseResponse(text) {
    if (!text) return null;
    try {
      const json = JSON.parse(text);
      if (json.error_code === 0 && json.data) {
        let list = [];
        let distance = 0;


        // 1. ตรวจสอบข้อมูลพิกัด (list) 
        if (Array.isArray(json.data)) {
          list = json.data;
        } else if (json.data.list && Array.isArray(json.data.list)) {
          list = json.data.list;
          // พยายามดึงกิโลรวมที่ API อาจแนบมาให้
          distance = parseFloat(json.data.distance || json.data.mileage || json.data.total_distance || 0);
        }


        // 2. ถ้า API ไม่ได้แนบกิโลรวมมา ลองหาจากเลขไมล์ (Odometer) ของพิกัดจุดแรกและจุดสุดท้าย
        if (distance === 0 && list.length > 0) {
          const firstOdo = parseFloat(list[0].odometer || list[0].mileage || 0);
          const lastOdo = parseFloat(list[list.length - 1].odometer || list[list.length - 1].mileage || 0);
          if (lastOdo > firstOdo) distance = lastOdo - firstOdo;
        }


        return { list: list, distance: distance };
      }
    } catch (e) { console.error(`[GpsService] Parse Error: ${e.message}`); }
    return null;
  }
};
