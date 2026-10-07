/**
 * FLEET_SAFETY_INTELLIGENCE_V2
 * 4. FILE: core/MainProcess.gs
 * อัปเดต: ถอดระบบการแจ้งเตือนผ่าน LINE ออก (เหลือเฉพาะ Telegram)
 */


function mainProcess(targetDate = new Date(), sendNoti = true) {
  const lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (e) { return 0; }


  try {
    const { rows: vehicles } = Utils.readSheet(CONFIG.SHEETS.VEHICLE_LIST);
    const { rows: zones }    = Utils.readSheet(CONFIG.SHEETS.COMMUNITY_ZONES);
    const dateStr = Utilities.formatDate(targetDate, CONFIG.TIMEZONE, "yyyy-MM-dd");
    const displayDate = Utilities.formatDate(targetDate, CONFIG.TIMEZONE, "dd-MM-yyyy");
    const startTimeStr = `${dateStr} ${CONFIG.TIME_START}`;
    const endTimeStr   = `${dateStr} ${CONFIG.TIME_END}`;


    const allGpsDataMap = GpsService.fetchGpsHistoryBatch(vehicles, startTimeStr, endTimeStr);
    const baseWebUrl = (CONFIG.WEB_APP_URL && CONFIG.WEB_APP_URL.length > 10) ? CONFIG.WEB_APP_URL : ScriptApp.getService().getUrl();


    // ชุดอิโมจิสำหรับสุ่ม
    const VEHICLE_EMOJIS = ['🚗','🚕','🚙','🚌','🚎','🚓','🚜','🚛','🏎','🚚','🛻','🚐','🚒','🚑','🚘','🚍','🚔','🚖'];
    const ZONE_EMOJIS = ['🏗','🏭','🏢','🏬','🏫','🏪','🏨','🏦','🏥','🏤','🏣','🏩','🏛','⛪️','🕌','🕍','🛕','🕋','⛩'];
    const getEmoji = (arr) => arr[Math.floor(Math.random() * arr.length)];


    const downsamplePoints = (ptsArray, max = 15) => {
      if (ptsArray.length <= max) return ptsArray;
      const result = [];
      const step = (ptsArray.length - 1) / (max - 1);
      for (let i = 0; i < max; i++) result.push(ptsArray[Math.round(i * step)]);
      return result;
    };


    let allSessions = [];
    let communityLogs = [];
    let summary90 = ""; 
    let communitySummary = "";
    
    // 🌟 ตัวแปรเก็บระยะทางรายวัน
    let vehicleKmMap = {};


    vehicles.forEach(vehicle => {
      const vName = vehicle['ชื่อรถ'] ? vehicle['ชื่อรถ'].toString().trim() : 'Unknown';
      const vImei = vehicle['IMEI'] ? vehicle['IMEI'].toString().trim() : '';
      if (!vImei) return;


      const gpsResult = allGpsDataMap[vImei];
      // แกะกล่องเอาข้อมูลพิกัด (list) และ ระยะทาง (distance) ออกมาใช้
      if (gpsResult && gpsResult.list && gpsResult.list.length > 0) {
        
        const gpsData = gpsResult.list;
        let dailyKm = gpsResult.distance || 0;


        // 🌟 แผนสำรอง: ถ้า API ไม่ได้ส่งเลขกิโลมา ให้ใช้สูตรคณิตศาสตร์คำนวณจากพิกัด (ใช้เวลาเสี้ยววินาที)
        if (dailyKm === 0) {
          for (let i = 1; i < gpsData.length; i++) {
            const lat1 = parseFloat(gpsData[i-1].latitude || gpsData[i-1].lat);
            const lon1 = parseFloat(gpsData[i-1].longitude || gpsData[i-1].lng);
            const lat2 = parseFloat(gpsData[i].latitude || gpsData[i].lat);
            const lon2 = parseFloat(gpsData[i].longitude || gpsData[i].lng);
            if (!isNaN(lat1) && !isNaN(lon1) && !isNaN(lat2) && !isNaN(lon2)) {
              const dist = Utils.calculateDistance(lat1, lon1, lat2, lon2);
              if (dist < 50) dailyKm += dist; // ตัดกรณีพิกัดกระโดด
            }
          }
        }
        vehicleKmMap[vName] = dailyKm > 0 ? dailyKm.toFixed(1) : "0.0";


        // --- 1. วิเคราะห์ถนนปกติ (เกิน 90 กม./ชม.) ---
        const sessions = SpeedAnalyzer.analyze(vehicle, gpsData);
        if (sessions.length > 0) {
          let allRawPts = [];
          sessions.forEach(s => { if (s[8]) allRawPts.push(...s[8].split('|')); });
          
          const sampledPts = downsamplePoints(allRawPts, 15); 
          const maxSpeed = Math.max(...sessions.map(s => s[6]));
          
          const params = [`pts=${encodeURIComponent(sampledPts.join('|'))}`, `v=${encodeURIComponent(vName)}`, `z=${encodeURIComponent("ถนนทั่วไป")}`, `s=${maxSpeed}`, `l=${CONFIG.SPEED_THRESHOLD}`].join('&');
          const combinedUrl = `${baseWebUrl}?${params}`;
          const combinedFormula = `=HYPERLINK("${combinedUrl}", "🗺️ ดูแผนที่รวม")`;


          sessions.forEach((s, idx) => {
            s[8] = (idx === 0) ? combinedFormula : "";
          });


          allSessions.push(...sessions);
          const vEmoji = getEmoji(VEHICLE_EMOJIS);
          
          // 🌟 แนบเลขกิโลรวมเข้าไปในข้อความสรุป
          summary90 += `\n${vEmoji} ${vName}: ${sessions.length} ครั้ง (วิ่ง ${vehicleKmMap[vName]} กม.) <a href="${combinedUrl}">[ดูแผนที่รวม]</a>`;
        }


        // --- 2. วิเคราะห์เขตชุมชน ---
        if (typeof CommunitySpeedService !== 'undefined') {
          const cLogs = CommunitySpeedService.analyze(gpsData, vName, zones);
          if (cLogs.length > 0) communityLogs.push(...cLogs);
        }
      }
    });


    // 🌟 จัดกลุ่มเขตชุมชน
    if (communityLogs.length > 0) {
      let zoneGroups = {};
      communityLogs.forEach(log => {
        const zone = log[2]; const car = log[1];
        if (!zoneGroups[zone]) zoneGroups[zone] = {};
        if (!zoneGroups[zone][car]) zoneGroups[zone][car] = { pts: [], max: 0, lim: log[5], rowsRef: [] };
        zoneGroups[zone][car].pts.push(log[6]);
        if (log[4] > zoneGroups[zone][car].max) zoneGroups[zone][car].max = log[4];
        zoneGroups[zone][car].rowsRef.push(log);
      });


      Object.keys(zoneGroups).forEach(zoneName => {
        communitySummary += `\n\n${getEmoji(ZONE_EMOJIS)} ${zoneName}`;
        Object.keys(zoneGroups[zoneName]).forEach(carName => {
          const g = zoneGroups[zoneName][carName];
          const sampledPts = downsamplePoints(g.pts, 15);
          const p = [`pts=${encodeURIComponent(sampledPts.join('|'))}`, `v=${encodeURIComponent(carName)}`, `z=${encodeURIComponent(zoneName)}`, `s=${g.max}`, `l=${g.lim}`].join('&');
          const combinedUrl = `${baseWebUrl}?${p}`;
          const combinedFormula = `=HYPERLINK("${combinedUrl}", "🗺️ ดูแผนที่รวม")`;


          g.rowsRef.forEach((row, idx) => {
            row[8] = (idx === 0) ? combinedFormula : "";
          });


          const vEmoji = getEmoji(VEHICLE_EMOJIS);
          
          // 🌟 แนบเลขกิโลรวมเข้าไปในข้อความสรุปของเขตชุมชน
          const kmText = vehicleKmMap[carName] ? ` (วิ่ง ${vehicleKmMap[carName]} กม.)` : "";
          communitySummary += `\n${vEmoji} ${carName}: ${g.pts.length} ครั้ง${kmText} <a href="${combinedUrl}">[ดูแผนที่รวม]</a>`;
        });
      });
    }


    if (allSessions.length > 0) Utils.appendData(CONFIG.SHEETS.SPEEDING_LOG, allSessions);
    if (communityLogs.length > 0) Utils.appendData(CONFIG.SHEETS.COMMUNITY_LOG, communityLogs);


    if (sendNoti) {
      let msg = `📊 <b>รายงานขับขี่ความปลอดภัยประจำวัน🚨</b>\n📅 วันที่: ${displayDate}\n`;
      if (allSessions.length === 0 && communityLogs.length === 0) {
        msg += `\n✅ วันนี้ขับขี่ปลอดภัย ไม่พบรถขับเร็วเกินกำหนด`;
      } else {
        if (allSessions.length > 0) {
          msg += `\n📈 <b>รายงานใช้ความเร็วเกิน ${CONFIG.SPEED_THRESHOLD} km/h 🚀</b>\n`;
          msg += `⏱️ เกณฑ์แจ้งเตือน: ใช้ความเร็วต่อเนื่องเกิน ${Math.round(CONFIG.MIN_DURATION_SEC/60)} นาที\n`;
          msg += `🚗 ตรวจพบทั้งหมด: ${allSessions.length} ครั้ง`;
          msg += summary90 + `\n`;
        }
        if (communityLogs.length > 0) {
          msg += `\n📉 <b>รายงานใช้ความเร็วในเขตชุมชน 👶🏻</b>\n`;
          msg += `⚠️ ตรวจพบทั้งหมด: ${communityLogs.length} ครั้ง`;
          msg += communitySummary;
        }
      }
      NotificationService.broadcast(msg);
    }
    return allSessions.length + communityLogs.length;
  } catch (err) { throw err; } finally { lock.releaseLock(); }
}
