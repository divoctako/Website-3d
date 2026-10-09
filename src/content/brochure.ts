// Content transcribed from the BYD SEALION 7 brochure (source/BYD_SEALION_7.pdf).
// Keep values exactly as printed; anything uncertain is listed in docs/SPEC.md §10.

export const VARIANTS = ['Premium', 'AWD Performance', 'AWD Ultimate'] as const;

/** Headline comparison, one value per variant (same order as VARIANTS). */
export const KEY_SPECS: { label: string; values: [string, string, string] }[] = [
  { label: 'ระบบขับเคลื่อน', values: ['ล้อหลัง', 'สี่ล้อ', 'สี่ล้อ'] },
  { label: 'กำลังสูงสุด', values: ['230 kW', '390 kW', '390 kW'] },
  { label: 'แรงบิดสูงสุด', values: ['380 N·m', '690 N·m', '690 N·m'] },
  { label: '0–100 km/h', values: ['6.7 s', '4.5 s', '4.5 s'] },
  { label: 'แบตเตอรี่ BYD Blade', values: ['82.5 kWh', '82.5 kWh', '91.3 kWh'] },
  { label: 'ระยะทาง (NEDC)', values: ['567 km', '542 km', '600 km'] },
  { label: 'DC CCS2 สูงสุด', values: ['150 kW', '150 kW', '230 kW'] },
  { label: 'ล้ออัลลอย', values: ['19 นิ้ว', '20 นิ้ว', '20 นิ้ว'] },
  { label: 'ที่เก็บของท้าย', values: ['500 ล.', '520 ล.', '520 ล.'] },
];

export const DIMENSIONS = {
  length: 4830,
  width: 1925,
  height: 1620,
  wheelbase: 2930,
  track: 1660,
};

export interface CarColor {
  id: string;
  name: string;
  /** Approximate swatch for UI only; the photos are the reference. */
  swatch: string;
  /** Availability per variant (same order as VARIANTS). */
  availability: [boolean, boolean, boolean];
}

export const EXTERIOR_COLORS: CarColor[] = [
  { id: 'horizon-white', name: 'Horizon White', swatch: '#eeeeeb', availability: [true, true, true] },
  { id: 'quantum-black', name: 'Quantum Black', swatch: '#1f2024', availability: [true, true, true] },
  { id: 'space-grey', name: 'Space Grey', swatch: '#5b7ea8', availability: [true, true, true] },
  { id: 'shark-grey', name: 'Shark Grey', swatch: '#8d969c', availability: [false, true, true] },
  { id: 'solar-red', name: 'Solar Red', swatch: '#c8322f', availability: [false, false, true] },
  { id: 'pulse-purple', name: 'Pulse Purple', swatch: '#a39bc9', availability: [false, false, true] },
];

// English names only where the brochure prints them.
export const ADAS_SYSTEMS: { code: string; name: string; th: string }[] = [
  { code: '360°', name: 'Surround Vision View Camera', th: 'กล้องมองภาพรอบคัน 360 องศา' },
  { code: 'ICC', name: 'Intelligent Cruise Control', th: 'ระบบช่วยควบคุมความเร็วอัตโนมัติแบบแปรผันอัจฉริยะ' },
  { code: 'AEB', name: 'Automatic Emergency Braking', th: 'ระบบช่วยเบรกฉุกเฉินอัตโนมัติ' },
  { code: 'FCW', name: 'Front Collision Warning', th: 'ระบบช่วยเตือนการชนด้านหน้า' },
  { code: 'RCW', name: 'Rear Collision Warning', th: 'ระบบช่วยเตือนการชนด้านหลัง' },
  { code: 'BSD', name: 'Blind Spot Detection', th: 'ระบบช่วยเตือนจุดอับสายตา' },
  { code: 'DOW', name: '', th: 'ระบบช่วยเตือนวัตถุเคลื่อนผ่านขณะเปิดประตู' },
  { code: 'LDA', name: 'Lane Departure Assist', th: 'ระบบช่วยรักษารถให้อยู่ในช่องทางเดินรถ' },
  { code: 'FCTA & FCTB', name: '', th: 'ระบบช่วยเตือนและช่วยเบรก เมื่อมีรถเคลื่อนผ่านในจุดอับสายตาด้านหน้า' },
  { code: 'RCTA & RCTB', name: '', th: 'ระบบช่วยเตือนและช่วยเบรก เมื่อมีรถผ่านจุดอับสายตาขณะถอยหลัง' },
  { code: 'HMA', name: 'High Beam Assist', th: 'ระบบช่วยเปิดไฟสูงอัตโนมัติ' },
];
