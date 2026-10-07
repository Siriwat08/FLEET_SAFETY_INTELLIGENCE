/**
 * FLEET_SAFETY_INTELLIGENCE_V2
 * 1. FILE: core/Config.gs
 * จัดการค่าคอนฟิกูเรชันทั้งหมด
 */


const scriptProps = PropertiesService.getScriptProperties();


const CONFIG = {
  // ---- API Integration ----
  API_KEY:  scriptProps.getProperty('API_KEY'),
  API_URL:  'https://gps.abzolute.biz/abzolute/api/service.php',


  // ---- Camera API Integration ----
  CAMERA_ACCOUNT:  scriptProps.getProperty('CAMERA_ACCOUNT'),         // Account จากเอกสาร
  CAMERA_PASSWORD: scriptProps.getProperty('CAMERA_PASSWORD'),       // Password จากเอกสาร
  CAMERA_LOGIN_URL: 'http://ttwli.net/StandardApiAction_login.action',
  CAMERA_BASE_URL:  'http://ttwli.net/808gps/open/player',


  // 🚩 [สำคัญ] วางลิงก์ Web App ล่าสุดที่นี่เพื่อให้แผนที่รวมทำงานได้
  WEB_APP_URL: '', 


  // ---- Telegram Notification (ระบบแจ้งเตือนหลัก) ----
  TELEGRAM_TOKEN:   scriptProps.getProperty('TELEGRAM_TOKEN'),
  TELEGRAM_CHAT_ID: scriptProps.getProperty('TELEGRAM_CHAT_ID'), 
  
  // ---- LINE Notification ----
  LINE_CHANNEL_TOKEN: scriptProps.getProperty('LINE_CHANNEL_TOKEN'), 
  LINE_TARGET_ID: scriptProps.getProperty('LINE_TARGET_ID'), 


  // ---- External Reporting ----
  LOOKER_URL: 'https://lookerstudio.google.com/reporting/REDACTED_LOOKER_REPORT_ID',


  // ---- Fleet Behavior Rules ----
  SPEED_THRESHOLD:  90,     
  COMMUNITY_SPEED:  30,     
  MIN_DURATION_SEC: 120,    
  TIME_START: '03:00:00',   
  TIME_END:   '22:00:00',   
  TIMEZONE:   'GMT+7',      


  // ---- Google Sheet Names ----
  SHEETS: {
    VEHICLE_LIST:      'Vehicle_List',
    SPEEDING_LOG:      'Speeding_Log',
    COMMUNITY_ZONES:   'Community_Zones',  
    COMMUNITY_LOG:     'Community_Alerts', 
    DRIVER_MASTER:     'Driver_Master',
    DRIVER_ASSIGNMENT: 'Driver_Assignment',
    DRIVER_SCORE:      'Driver_Monthly_Score',
    DRIVER_KPI:        'Driver_Safety_KPI',
    DRIVER_RISK:       'Driver_Risk_Flag',
    DRIVER_COACHING:   'Driver_Coaching_Plan',
  },


  // ---- KPI Scoring Levels ----
  KPI_LEVELS: [
    { min: 95, label: 'Platinum', status: 'Role Model'       },
    { min: 90, label: 'Gold',     status: 'Excellent'        },
    { min: 85, label: 'Silver',   status: 'Acceptable'       },
    { min: 75, label: 'Bronze',   status: 'Warning'          },
    { min: 0,  label: 'Critical', status: 'Improvement Plan' },
  ],
};
