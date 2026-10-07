/**
 * FLEET_SAFETY_INTELLIGENCE_V2
 * 15. FILE: services/GeospatialService.gs
 */
const GeospatialService = {
  syncLookerData() {
    const ui = SpreadsheetApp.getUi();
    try {
      const { headers, rows } = Utils.readSheet(CONFIG.SHEETS.COMMUNITY_ZONES);
      const sheet = Utils.getSheet(CONFIG.SHEETS.COMMUNITY_ZONES);
      const colIdxWKT  = headers.indexOf("Looker_Geodata");


      if (colIdxWKT === -1) throw new Error("ไม่พบคอลัมน์ 'Looker_Geodata'");


      const updates = [];
      rows.forEach(row => {
        const type = row["ประเภท"] ? row["ประเภท"].toString().toLowerCase() : "";
        const rawPath = row["พิกัดมุม"] ? row["พิกัดมุม"].toString() : "";
        let wktString = "";


        if (type === "polygon" && rawPath) {
          const points = rawPath.split('|').map(p => {
            const parts = p.trim().split(',');
            return parts.length === 2 ? `${parts[1].trim()} ${parts[0].trim()}` : null;
          }).filter(p => p !== null);


          if (points.length >= 3) {
            if (points[0] !== points[points.length - 1]) points.push(points[0]);
            wktString = `POLYGON(( ${points.join(', ')} ))`;
          }
        }
        updates.push([wktString]);
      });
      if (updates.length > 0) sheet.getRange(2, colIdxWKT + 1, updates.length, 1).setValues(updates);
      ui.alert("✅ อัปเดตพิกัด WKT สำหรับ Looker Studio เรียบร้อยแล้ว!");
    } catch (e) { ui.alert("❌ ผิดพลาด: " + e.message); }
  }
};
