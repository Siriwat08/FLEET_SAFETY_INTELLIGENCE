/**
 * FLEET_SAFETY_INTELLIGENCE_V2
 * 7. FILE: services/NotificationService.gs
 * VERSION: V2.8 (Strip HTML for LINE)
 */
const NotificationService = {
  sendTelegram(message) {
    if (!CONFIG.TELEGRAM_TOKEN || CONFIG.TELEGRAM_TOKEN.includes('YOUR_')) return;
    try {
      const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_TOKEN}/sendMessage`;
      const payload = { "chat_id": CONFIG.TELEGRAM_CHAT_ID, "text": message, "parse_mode": "HTML", "disable_web_page_preview": true };
      UrlFetchApp.fetch(url, { "method": "post", "contentType": "application/json", "payload": JSON.stringify(payload), "muteHttpExceptions": true });
    } catch (e) { console.error(`[Telegram] Error: ${e.message}`); }
  },
  sendLine(message) {
    if (!CONFIG.LINE_CHANNEL_TOKEN || !CONFIG.LINE_TARGET_ID || CONFIG.LINE_TARGET_ID.includes('ใส่_')) return;
    let lineMsg = message.replace(/ <a href="[^"]*">\[ดูแผนที่รวม\]<\/a>/g, "");
    lineMsg = lineMsg.replace(/<[^>]*>?/gm, '').trim(); 
    if (lineMsg.length > 4900) {
      lineMsg = lineMsg.substring(0, 4800) + "\n\n... (ข้อมูลยาวเกินข้อจำกัดของ LINE กรุณาดูรายละเอียดแบบเต็มใน Telegram หรือ Google Sheets ครับ)";
    }
    try {
      const url = "https://api.line.me/v2/bot/message/push";
      const options = {
        "method": "post",
        "headers": { "Content-Type": "application/json", "Authorization": `Bearer ${CONFIG.LINE_CHANNEL_TOKEN}` },
        "payload": JSON.stringify({ "to": CONFIG.LINE_TARGET_ID, "messages": [{ "type": "text", "text": lineMsg }] }),
        "muteHttpExceptions": true
      };
      UrlFetchApp.fetch(url, options);
    } catch (e) { console.error(`[LINE] Error: ${e.message}`); }
  },
  broadcast(message) {
    this.sendTelegram(message);
    this.sendLine(message);
  }
};
function doPost(e) { return ContentService.createTextOutput("OK"); }
