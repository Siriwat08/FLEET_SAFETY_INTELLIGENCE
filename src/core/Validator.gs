/**
 * FLEET_SAFETY_INTELLIGENCE_V2
 * 3. FILE: core/Validator.gs
 */
const Validator = {
  requireDate(v) {
    if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v.toString().trim())) throw new Error(`รูปแบบวันที่ไม่ถูกต้อง: "${v}" (YYYY-MM-DD)`);
    return true;
  },
  requireYearMonth(v) {
    if (!v || !/^\d{4}-\d{2}$/.test(v.toString().trim())) throw new Error(`รูปแบบเดือนไม่ถูกต้อง: "${v}" (YYYY-MM)`);
    return true;
  },
  requireImei(v) {
    if (!/^\d{15}$/.test((v ? v.toString().trim() : ''))) throw new Error(`IMEI ไม่ถูกต้อง`);
    return true;
  },
  requireNonEmpty(v, fieldName = 'ข้อมูล') {
    if (v === null || v === undefined || v.toString().trim() === '') throw new Error(`กรุณาระบุ "${fieldName}"`);
    return true;
  }
};
