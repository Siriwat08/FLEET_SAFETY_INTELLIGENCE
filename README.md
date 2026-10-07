# Fleet Safety Intelligence V2

ระบบติดตามยานพาหนะและแจ้งเตือนการขับขี่เกณฑ์ความเร็ว (GPS Overspeed Alert & Driver Safety Analytics) พัฒนาบน **Google Apps Script (GAS)** โดยใช้ Google Sheets เป็นฐานข้อมูลหลัก ดึงข้อมูลตำแหน่ง/ความเร็วจาก **Abzolute GPS API** แจ้งเตือนผ่าน **Telegram** พร้อมโมดูลเชื่อมต่อกล้อง **MDVR (CMSV6)** และระบบวิเคราะห์พฤติกรรมคนขับรายเดือน (Scoring / Risk / Coaching / KPI)

> ที่มาของโค้ดทั้งหมด: เอกสาร Forensic Export ฉบับรวมของโปรเจกต์ (`docs/FORENSIC_EXPORT.md`) — รวม 18 โมดูลเวอร์ชันล่าสุดที่ได้รับการยืนยัน

## สถาปัตยกรรมภาพรวม

```
Abzolute GPS API ──┐
                   ├─> GAS Triggers ─> MainProcess (LockService) ─> SpeedAnalyzer + CommunitySpeedService
Google Sheets (10) ┘                          │
                                              ├─> Telegram Notification (ลิงก์แผนที่ WebApp.gs + Leaflet)
                                              ├─> Driver Score / Risk / Coaching / KPI
                                              └─> CameraService (MDVR: Live + Playback link)
```

แผนภาพสถาปัตยกรรมฉบับเต็ม: `assets/architecture_diagram_FleetSafety_V2.png`

## โครงสร้าง Repository

```
├── src/
│   ├── core/
│   │   ├── Config.gs                  ค่าคอนฟิกทั้งหมด (API, thresholds, ชื่อชีต, KPI levels)
│   │   ├── Utils.gs                   ยูทิลิตี้กลาง (Safe read, Date UK-normalize, Haversine, Geofence)
│   │   ├── Validator.gs               ตัวตรวจความถูกต้องของข้อมูลนำเข้า
│   │   └── MainProcess.gs             ตัวประมวลผลหลักรายวัน (LockService, สรุป, เขียนชีต, แจ้งเตือน)
│   ├── services/
│   │   ├── GpsService.gs              เชื่อมต่อ Abzolute API (ทีละคัน + Batch)
│   │   ├── SpeedAnalyzer.gs           ตรวจจับเหตุการณ์ขับเร็ว > 90 km/h
│   │   ├── CommunitySpeedService.gs   เขตชุมชน (Geofence polygon, > 30 km/h นับทันที)
│   │   ├── NotificationService.gs     การแจ้งเตือน (Telegram)
│   │   ├── DriverScoreService.gs      คำนวณคะแนนคนขับรายเดือน
│   │   ├── DriverRiskService.gs       จัดระดับความเสี่ยง (HIGH/MEDIUM/LOW)
│   │   ├── CoachingService.gs         แผนโค้ชชิ่งอัตโนมัติตามกฎ
│   │   ├── DriverKPIService.gs        สรุป KPI ความปลอดภัยรายเดือน
│   │   ├── GeospatialService.gs       แปลง WKT polygon สำหรับ Looker Studio
│   │   └── CameraService.gs           กล้อง MDVR: ขอ jsession, ลิงก์ดูสด + ดูย้อนหลัง (Playback)
│   ├── ui/
│   │   ├── Menu.gs                    เมนูแบบกดใน Spreadsheet
│   │   └── WebApp.gs                  หน้าแผนที่แสดงเส้นทางการแจ้งเตือน (Leaflet)
│   ├── controllers/
│   │   ├── MainController.gs          ตัวควบคุมงานหลัก (ยืนยันก่อนรัน)
│   │   └── PipelineController.gs      ควบคุม pipeline ประมวลผลหลายขั้น
│   └── tests/
│       └── TestCamera.gs              สคริปต์ทดสอบลิงก์ Playback ของ CMSV6
├── docs/
│   ├── FORENSIC_EXPORT.md             เอกสารต้นฉบับฉบับรวม (timeline, schema, กฎธุรกิจ, error log, โค้ด)
│   └── report/
│       └── Fleet_Safety_Intelligence_V2_Analysis_Report.pdf   รายงานวิเคราะห์เชิงลึก 22 หน้า
└── assets/
    └── architecture_diagram_FleetSafety_V2.png
```

## การติดตั้งและตั้งค่า

### 1. Script Properties (จำเป็น)

โค้ดใน repository นี้ถูก sanitized ให้ดึงค่าความลับจาก Script Properties ทั้งหมด ให้ไปที่ **Project Settings → Script Properties** แล้วเพิ่ม:

| Property | คำอธิบาย |
|---|---|
| `API_KEY` | คีย์ของ Abzolute GPS API |
| `TELEGRAM_TOKEN` | Token ของ Telegram Bot |
| `TELEGRAM_CHAT_ID` | Chat/Group ID ปลายทางแจ้งเตือน (เช่น `-100XXXXXXXXXX`) |
| `LINE_CHANNEL_TOKEN` | Token ของ LINE Messaging API (ถ้าใช้ LINE) |
| `LINE_TARGET_ID` | Group ID ปลายทาง LINE |
| `CAMERA_ACCOUNT` | Account ของระบบกล้อง MDVR (CMSV6) |
| `CAMERA_PASSWORD` | Password ของระบบกล้อง MDVR |

### 2. การ Deploy

1. สร้าง Google Sheet ให้ครบ 10 ตารางตาม `CONFIG.SHEETS` (โครงสร้างคอลัมน์ดูได้จาก `docs/FORENSIC_EXPORT.md`)
2. นำไฟล์ทั้งหมดใน `src/` ไปสร้างเป็นไฟล์ในโปรเจกต์ Apps Script (ชื่อไฟล์ไม่ต้องมีนามสกุล)
3. Deploy → New deployment → **Web app** แล้วคัดลอก URL ไปใส่ `CONFIG.WEB_APP_URL`
4. ตั้ง Time-driven Trigger เรียก `mainProcess()` รายวันตามช่วงเวลาที่ต้องการ

### 3. ทดสอบลิงก์กล้อง Playback

รัน `testCameraPlaybackLink()` จาก `src/tests/TestCamera.gs` แล้วนำลิงก์ที่ได้ไปเปิดในเบราว์เซอร์ — หากได้ที่หน้าเล่นวิดีโอย้อนหลังถือว่าโครงสร้าง URL ของ CMSV6 ที่สมมติไว้ใช้ได้จริง หาก 404 ต้องขอ API path ที่ถูกต้องจากผู้ให้บริการกล้อง

## สถานะปัจจุบันและประเด็นที่ต้องระวัง

- **เวอร์ชันล่าสุด**: V2.9 (WebApp UI) / MainProcess V2.8+ (แจ้งเตือนผ่าน Telegram เท่านั้น, คำนวณระยะทาง Haversine แทรกในข้อความสรุป)
- **Playback URL ยังเป็นข้อสันนิษฐาน**: `CameraService.getPlaybackUrl()` อ้างตามโครงสร้างมาตรฐาน CMSV6 (`TrackPlayback.html`) ต้องทดสอบก่อนใช้จริง — นี่คือหัวใจของ Incident Investigation ที่ต้องการภาพ "ณ วินาทีที่แจ้งเตือน" ไม่ใช่ภาพสด
- **ข้อจำกัดเชิงโครงสร้าง**: ระบบใช้ Google Sheets เป็นฐานข้อมูล + LockService ป้องกันการเขียนทับ มีเพดานด้านปริมาณข้อมูลและโควตา GAS/UrlFetch ที่ควรวางแผนดูแลเมื่อฟลีตโตขึ้น
- รายละเอียดจุดแข็ง/จุดอ่อน/แผนพัฒนาต่อ (P0–P2) อยู่ใน `docs/report/Fleet_Safety_Intelligence_V2_Analysis_Report.pdf`

## หมายเหตุด้านความปลอดภัยของ Repository นี้

เนื่องจาก repository เป็น **public** ค่าที่เดิม hardcoded ในเอกสารต้นฉบับ (บัญชี/รหัสกล้อง MDVR, Telegram Chat ID, LINE Target ID, Looker Report ID) ถูกแทนที่ด้วย `PropertiesService` หรือ `[REDACTED]` ทั้งหมด — พฤติกรรมของโค้ดเหมือนเดิมทุกประการเมื่อตั้งค่า Script Properties ครบตามตารางด้านบน
