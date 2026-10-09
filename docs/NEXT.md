# งานที่เหลือ (handoff)

สถานะ ณ commit `314eb87` บน branch `claude/sealion7-spec` (เป็น default branch ของ repo ด้วย)
- เสร็จแล้ว: M0 setup, M1 prototype หนังสือ, M2 หนังสือครบ 6 spread + tabs + section เนื้อหาแบบ HTML
- เว็บจริง: https://divoctako.github.io/Website-3d/ ทุกครั้งที่ push ขึ้น `claude/sealion7-spec` workflow `.github/workflows/pages.yml` จะ build แล้ว deploy ขึ้น `gh-pages` ให้เอง
- Spec เต็มอยู่ที่ [`SPEC.md`](SPEC.md) (§4 = เนื้อหาและ 3D ของแต่ละ section, §9 = milestones, §10 = คำถามค้าง)

## เริ่มใน local

```bash
git clone https://github.com/divoctako/Website-3d.git
cd Website-3d
git checkout claude/sealion7-spec
npm install
npm run dev            # http://localhost:5173 (window.__book ใช้ debug ได้ในโหมด dev)
npm run build          # typecheck + build → dist/
npm run build:single   # ไฟล์เดียว dist-single/sealion7.html
npm run assets         # ดึงรูปจาก PDF ใหม่ (ต้องมี poppler-utils + ImageMagick)
```

ต้องใช้ Node 22

## โครงโค้ดที่ต้องรู้

| ไฟล์ | หน้าที่ |
|---|---|
| `src/content/brochure.ts` | ข้อมูลทั้งหมดจาก brochure (สเปก, สี, ADAS) ใช้ร่วมกันทั้งหนังสือและ section |
| `src/gl/book/Book.ts` | ฉากหนังสือ, กล้อง, timeline ตาม scroll (`SPREADS`, `STEPS`) |
| `src/gl/book/Leaf.ts` | กระดาษ 1 แผ่น (พลิกแบบโค้ง) และพาชิ้น pop-up ไปตามหน้า |
| `src/gl/book/PopUpPiece.ts` | ชิ้น pop-up (width, z, delay, lean, yaw, section) |
| `src/gl/book/spreads.ts` | วาดหน้ากระดาษด้วย canvas และวางชิ้น pop-up ของทุก spread |
| `src/gl/textures.ts` | helper วาด canvas (paper, statCard, photoCard, tag, paperCutout, wrap ภาษาไทย) |
| `src/ui/sections.ts` | เติมตาราง spec / ADAS / สี ใน section HTML จาก `brochure.ts` |
| `src/main.ts` | Lenis + ScrollTrigger, snap, tabs, คลิก pop-up, ปรับ DPR อัตโนมัติ |
| `scripts/extract-pdf-assets.sh` | ดึงรูปจาก `source/BYD_SEALION_7.pdf` → `public/assets/*.webp` |

## M3 — 3D effect ของ section Performance, Exterior, Interior

ตอนนี้ทั้ง 3 section เป็น HTML ธรรมดา (ใน `index.html`) ให้ทำตาม SPEC §4 [1]–[3]
- [ ] สร้าง canvas three.js ตัวที่สองแบบ `position: fixed` อยู่หลังเนื้อหา section (แยกจาก canvas หนังสือ) และ render เฉพาะตอน section อยู่ในจอ
- [ ] **Performance:** รถด้านข้าง (`car-side.webp`) วิ่งเข้าจากขวาแบบ parallax 3 ชั้น (หมอกฟ้า / รถ / `speed-lines.webp`) และตัวเลขใน `.stats` count-up ตอนเข้าจอ
- [ ] **Exterior:** pin section แล้ว scroll หมุนมุมมองหน้า → ข้าง → หลัง (crossfade + หมุนระนาบ ±25°), hotspot 5 จุดคู่กับรายการใน `.features`, ใช้รูป `detail-*.webp` เป็นการ์ด
- [ ] **Interior:** `interior-wide.webp` บนพื้นผิวโค้ง แล้ว scroll pan, แถบไฟ 128 เฉดสีไล่ตาม scroll, การ์ด `interior-*.webp` ลอยแบบ masonry
- [ ] ระวัง: รูปไดคัทจาก PDF ความละเอียดต่ำ (`car-side` ~900px, `car-front` ~530px) อย่าขยายเต็มจอ

## M4 — ADAS, Specs, Colors, Contact

- [ ] **ADAS:** ฉาก 3D ถนน (plane + เส้นเลนด้วย shader) และ scroll ไฮไลต์ทีละระบบตาม SPEC §4 [4] โดยรายการใน `[data-adas]` active ตาม
- [ ] **Specs:** ตารางเต็มทุกหมวดจาก brochure หน้า 4 (ตอนนี้มีแค่ `KEY_SPECS` 9 แถว) เป็น accordion พร้อมสวิตช์ "แสดงเฉพาะที่ต่างกัน" ต้องถอดตารางเต็มเพิ่มใน `brochure.ts` ก่อน (ใช้ `pdftotext -layout` กับ `source/BYD_SEALION_7.pdf`)
- [ ] **Colors:** ตัวเลือกสีที่สลับรูป `car-color-*.webp` และ tint พื้นหลัง ≤ 8% พร้อม badge บอกว่ามีในรุ่นไหน
- [ ] **Contact:** รถด้านหลังค่อย ๆ ถอยหายเข้าไปในหมอกขาว

## M5 — มือถือ, การเข้าถึง, ประสิทธิภาพ

- [ ] หนังสือบนมือถือ: แสดงทีละหน้าแทนทั้ง spread (ตอนนี้ย่อทั้ง spread ให้พอดีจอ ซึ่งยังเล็ก)
- [ ] `prefers-reduced-motion`: ไม่ pin / ไม่ scrub แสดงภาพนิ่ง
- [ ] Fallback เมื่อไม่มี WebGL: ใช้ภาพนิ่งของแต่ละ spread
- [ ] ลด bundle (ตอนนี้ JS ~190 KB gzip, three.js ตัวเดียวก็ใหญ่แล้ว), แปลง texture เป็น KTX2, lazy-load รูปราย section
- [ ] ทำ tab ของหนังสือให้เป็นแถบ 3D ติดกับตัวหนังสือ (ตอนนี้เป็นปุ่ม HTML)

## M6 — QA และ launch

- [ ] ทดสอบบนมือถือจริง: iPhone Safari และ Android Chrome (ที่ผ่านมาทดสอบแค่บน Chromium จำลอง)
- [ ] ตรวจทุกตัวเลขเทียบ brochure
- [ ] SEO: JSON-LD `Product`, รูป OG

## เรื่องที่ต้องตัดสินใจหรือขอข้อมูล (SPEC §10)

1. **ขอรูปความละเอียดสูง** จาก BYD/Rever: รถไดคัท 6 สี (ใน PDF กว้างแค่ ~170px), รถด้านข้าง/หน้า/หลัง และรูป detail
2. **ยืนยันชื่อสี:** ตอนนี้กำหนดรูปสีฟ้าอมเทา = Space Grey และรูปสีเทา = Shark Grey (`brochure.ts`, `extract-pdf-assets.sh`)
3. **ยืนยันตาราง spec** แถวที่ช่องถูก merge: แบต 82.5 kWh ของ Premium + AWD Performance, ที่เก็บของท้าย 500/520 ลิตร, ล้อ 19/20 นิ้ว
4. **สิทธิ์ใช้แบรนด์:** repo และเว็บเป็น public แล้ว มีรูป โลโก้ และ PDF brochure ของ BYD อยู่ ต้องยืนยันว่าได้รับอนุญาต
5. ราคาไม่มีใน brochure จึงยังไม่แสดงราคาในเว็บ

## หมายเหตุสำหรับ Claude ใน local session

- ทำงานบน `claude/sealion7-spec` push แล้ว Pages จะอัปเดตเอง
- ก่อน push ให้รัน `npm run build` (มี typecheck ในตัว)
- ตรวจหน้าตาด้วย Playwright + Chromium: ต้อง scroll ไปที่ step แล้วรอให้ค่า damping นิ่ง (~3–4 วินาที) ก่อนจับภาพ
- ห้ามรัน `pkill -f vite` ใน command เดียวกับคำสั่งอื่น เพราะจะ kill shell ตัวเองไปด้วย
- ข้อความทุกอย่างต้องมาจาก brochure เท่านั้น ห้ามเติมตัวเลขหรือชื่อระบบที่ brochure ไม่ได้พิมพ์
