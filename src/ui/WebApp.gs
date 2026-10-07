/**
 * FLEET_SAFETY_INTELLIGENCE_V2
 * 17. FILE: ui/WebApp.gs
 * VERSION: V2.9 (Modern UI, Multi-point with Popups parsing lat,lng,speed,time)
 */
function doGet(e) {
  const ptsRaw = e.parameter.pts || "";     
  const vName  = e.parameter.v || "ไม่ระบุ"; 
  const zone   = e.parameter.z || "พื้นที่ควบคุม"; 
  const speed  = e.parameter.s || 0;         
  const limit  = e.parameter.l || 0;         
  const time   = e.parameter.t || "-";       


  let finalPts = ptsRaw;
  if (!finalPts && e.parameter.lat && e.parameter.lng) {
    finalPts = `${e.parameter.lat},${e.parameter.lng}`;
  }


  if (!finalPts) {
    return HtmlService.createHtmlOutput(`
      <div style="font-family: 'Prompt', sans-serif; text-align: center; padding-top: 100px;">
        <h1 style="color: #d32f2f;">🚦 Fleet Safety Map Viewer</h1>
        <p style="color: #666;">ระบบพร้อมใช้งาน กรุณาคลิกลิงก์จากในระบบเพื่อดูแผนที่</p>
      </div>
    `).setTitle("Fleet Safety V2 - Viewer");
  }


  const pointsData = finalPts.split('|').map(p => {
    const parts = p.split(',');
    return { 
      lat: parseFloat(parts[0]), lng: parseFloat(parts[1]),
      spd: parts.length > 2 ? parts[2] : speed, 
      tm:  parts.length > 3 ? parts[3] : time 
    };
  }).filter(p => !isNaN(p.lat) && !isNaN(p.lng));


  let polyRaw = "";
  if (zone !== "ถนนทั่วไป") {
    try {
      const { rows: zones } = Utils.readSheet(CONFIG.SHEETS.COMMUNITY_ZONES);
      const target = zones.find(x => x['ชื่อสถานที่'] === zone);
      if (target) polyRaw = target['พิกัดมุม'] || "";
    } catch(err) {}
  }


  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>Violation Map - ${vName}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html { margin: 0; padding: 0; height: 100%; font-family: -apple-system, sans-serif; background: #f4f4f4; }
        #map { height: 100%; width: 100%; z-index: 1; }
        .info-panel {
          position: fixed; bottom: 25px; left: 15px; right: 15px;
          background: white; padding: 18px; z-index: 1000;
          border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.25);
          border-left: 6px solid #d32f2f;
        }
        .header { color: #d32f2f; font-weight: bold; font-size: 18px; margin-bottom: 8px; }
        .grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 10px; font-size: 14px; color: #333; }
        .label { color: #888; font-weight: normal; }
        .badge { background: #fee2e2; color: #b91c1c; padding: 2px 8px; border-radius: 6px; font-weight: bold; }
        .custom-popup { font-family: 'Prompt', sans-serif; font-size: 14px; line-height: 1.6; color: #333; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <div class="info-panel">
        <div class="header">📍 ตรวจพบพฤติกรรมขับเร็ว</div>
        <div class="grid">
          <div><span class="label">ทะเบียนรถ:</span><br><b>${vName}</b></div>
          <div><span class="label">สถานที่:</span><br><b>${zone}</b></div>
          <div><span class="label">ความเร็วสูงสุด:</span><br><span class="badge">${speed} km/h</span></div>
          <div><span class="label">เกณฑ์ที่กำหนด:</span><br><b>${limit} km/h</b></div>
        </div>
      </div>
      <script>
        const points = ${JSON.stringify(pointsData)};
        const vName = "${vName}";
        const map = L.map('map', { zoomControl: false }).setView([points[0].lat, points[0].lng], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);


        if("${polyRaw}") {
          const coords = "${polyRaw}".split('|').map(p => { 
            const pts = p.trim().split(','); return [parseFloat(pts[0]), parseFloat(pts[1])]; 
          });
          L.polygon(coords, {color: '#d32f2f', fillColor: '#ef4444', fillOpacity: 0.15, weight: 3, dashArray: '5, 10'}).addTo(map);
        }


        const markers = [];
        points.forEach((p, i) => {
          const popupContent = \`<div class="custom-popup">📍 \${i + 1}<br>🧭 \${p.tm}<br>🚚 \${vName}<br>⚠️ \${p.spd}</div>\`;
          markers.push(L.marker([p.lat, p.lng]).addTo(map).bindPopup(popupContent));
        });


        if (points.length > 1) map.fitBounds(new L.featureGroup(markers).getBounds().pad(0.2));
        L.control.zoom({ position: 'topright' }).addTo(map);
      </script>
    </body>
    </html>
  `;
  return HtmlService.createHtmlOutput(html).setTitle("Fleet Safety Map Viewer").setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL).addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
