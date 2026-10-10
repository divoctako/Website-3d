# งานที่เหลือ (handoff)

สถานะ ณ commit `314eb87` บน branch `claude/sealion7-spec` (เป็น default branch ของ repo ด้วย)
- เสร็จแล้ว: M0 setup, M1 prototype หนังสือ, M2 หนังสือครบ 6 spread + tabs + section เนื้อหาแบบ HTML, M3 ฉาก 3D ของ Performance / Exterior / Interior, M4 ADAS / Specs / Colors / Contact, M5 มือถือ / การเข้าถึง / ประสิทธิภาพ
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
| `src/gl/fx/FxStage.ts` | canvas three.js ตัวที่สอง (fixed หลังเนื้อหา) วาดแต่ละฉากเฉพาะในกรอบ `[data-fx]` ที่อยู่ในจอ (scissor) |
| `src/gl/fx/PerformanceScene.ts` · `ExteriorScene.ts` · `InteriorScene.ts` | ฉาก 3D ของแต่ละ section |
| `src/ui/fx.ts` | โหลดรูป, ผูก scroll กับฉาก, count-up, hotspot, ปุ่มจังหวะ, รายการ ADAS (`window.__fx`, `window.__lenis` ใช้ debug ในโหมด dev) |
| `src/gl/fx/AdasScene.ts` | ฉากถนน ADAS (shader เลน + โซนเซนเซอร์ 11 ระบบ) |
| `src/ui/staticBook.ts` | หนังสือแบบภาพนิ่ง (ไม่มี WebGL หรือ reduced motion) วาด spread แบนจาก canvas ของหน้าเดียวกับหนังสือ 3D |
| `src/content/specTable.ts` | ตารางสเปกเต็มจาก brochure หน้า 4 (11 หมวด) + เชิงอรรถ ①–⑤ |
| `src/ui/colors.ts` · `src/ui/contact.ts` · `src/ui/pin.ts` | Colors และ Contact (HTML/CSS ไม่ใช้ WebGL) และ helper ของ section ที่ pin |
| `pic/` · `scripts/process-pic.py` | รูปที่ generate เพิ่ม (prompt ใน `pic/PROMPTS.md`) และสคริปต์ไดคัท/แปลงเป็น webp ลง `public/assets/` |
| `scripts/extract-pdf-assets.sh` | ดึงรูปจาก `source/BYD_SEALION_7.pdf` → `public/assets/*.webp` |

## M3 — 3D effect ของ section Performance, Exterior, Interior ✅

- [x] canvas three.js ตัวที่สอง `position: fixed` หลังเนื้อหา (`.fx-canvas`) section ที่มีฉากใช้พื้นหลังโปร่ง (`.fx-section`) และ render เฉพาะตอนกรอบของฉากอยู่ในจอ
- [x] **Performance:** รถ `car-side` วิ่งเข้าจากขวาไปหยุดกลางจอ parallax 3 ชั้น (`bg-sky-mist` / แถบ `speed-lines` / รถ) ล้อเป็น sprite แยกหมุนด้วย shader ตามระยะที่รถเคลื่อน ตัวเลขใน `.stats` count-up และลอยขึ้นจากแกน z ตอนเข้าจอ
- [x] **Exterior:** pin 520vh แล้ว scroll ไล่ 5 จุด มุมมองหน้า → ข้าง → หันท้าย (crossfade + หมุน ±25°) hotspot 5 จุด (ปุ่ม HTML ที่ project ตำแหน่งจาก 3D คลิกแล้วเลื่อนไปจุดนั้น) การ์ด detail พับขึ้นแบบ pop-up บนมือถือแสดงเฉพาะข้อที่ active
- [x] **Interior:** pin 340vh `interior-wide` บน cylinder segment (กล้องอยู่ข้างใน) scroll pan ซ้าย → ขวา แถบไฟไล่ 128 เฉดตาม scroll ปุ่ม "ลองฟังจังหวะ" pulse แบบ procedural (ไม่มีเสียง) ครึ่งหลังการ์ด 7 ใบลอยขึ้นแบบ masonry ความลึกต่างกัน
- ยังไม่ได้ทำ / ข้อจำกัด:
  - PDF **ไม่มีรูปไดคัทด้านหลัง** มุม "หลัง" ของ Exterior จึงใช้รูปด้านข้างหมุนให้ท้ายรถหันเข้าหากล้อง และ section Contact (M4) ก็ต้องใช้รูปนี้ ควรขอเพิ่มตาม §10 ข้อ 1
  - เส้นแสงวาดตัว "X" ที่หน้ารถ (SVG stroke) ตาม SPEC §4 [2] ยังไม่ได้ทำ
  - ตรวจแล้วบน Chromium ที่ 1280×720 และ 375×812 ยังไม่ได้ลองบนเครื่องจริง
  - `prefers-reduced-motion` ตอนนี้แค่ตัด damping/count-up/การลอย ยังคง pin อยู่ (ทำต่อใน M5)

## M4 — ADAS, Specs, Colors, Contact ✅

- [x] **ADAS:** pin 640vh ถนนเป็น plane + shader เส้นเลน (เลื่อนตามความเร็วรถ) กล้องมองจากหลังเฉียงบน รถเป็น billboard `car-rear-34-top` แต่ละระบบมีโซนเซนเซอร์ของตัวเอง (วงแหวน 360°, กรวยหน้า/หลัง, กล่อง BSD/DOW, พัด FCTA/RCTA, เส้นเลนเรืองแสง LDA, ไฟหน้าสลับสูง/ต่ำ HMA) รถคันหน้า (`lead-car-rear`) โผล่ใน ICC / AEB / FCW / BSD รายการชิปคลิกแล้วเลื่อนไปที่ระบบนั้น
- [x] **Specs:** ถอดตารางหน้า 4 ครบ 11 หมวดลง `specTable.ts` (เทียบกับภาพหน้า PDF ทีละแถวเพราะ `pdftotext` ทำสระไทยเพี้ยน) แสดงเป็น `<details>` ช่องที่ brochure merge ก็ merge ตาม แถวที่ต่างกันเน้นสี สวิตช์ "แสดงเฉพาะที่ต่างกัน" และเชิงอรรถ ①–⑤
  - แก้ `KEY_SPECS`: ที่เก็บของท้ายของ AWD Performance คือ **500** ลิตร (เดิมใส่ 520) ใน brochure ช่องนี้ merge กับ Premium
- [x] **Colors:** pin 360vh scroll ไล่ 6 สี (หยุดไล่เมื่อผู้ใช้กดเลือกเอง จนกว่าจะ scroll ออกจาก section) สลับรูป `car-color-*-hd.webp` แบบ crossfade บนแท่นขาว พื้นหลัง tint 8% และ badge รุ่นที่มีสีนั้น
- [x] **Contact:** pin 240vh รถด้านหลัง (`car-rear.webp`) ขับถอยเข้าไปในหมอก (`contact-mist.webp`) แล้วขึ้น "LIFE IN MOTION" ตามด้วยที่อยู่ Rever + reverautomotive.com + Facebook ตามที่ brochure พิมพ์
- ข้อจำกัด / ยังไม่ได้ทำ:
  - **รูปที่ AI generate** (สีรถ 6 สี, ด้านหลัง, หลังเฉียงบน, มุมบน, รถคันหน้า, หมอก) เป็นของชั่วคราว ต้องเปลี่ยนเป็นรูปจริงจาก BYD/Rever ก่อนใช้งานจริง (SPEC §10 ข้อ 1, 4) ลบป้าย "4.5S" ที่ AI เติมมาออกแล้วใน `process-pic.py`
  - รูปด้านหลังของจริงมีใน PDF หน้า 4 (ช่อง DIMENSION) แต่กว้างแค่ 334 px ใช้เทียบดีไซน์ได้อย่างเดียว
  - `pic/car-top.png` (มุมบน) ยังไม่ได้ใช้และไม่ได้ deploy ถ้าจะใช้กับ ADAS ให้เพิ่มบรรทัด `cutout(...)` ใน `process-pic.py`
  - บนมือถือ รถคันหน้าของ ICC / AEB อยู่นอกจอ เพราะจอแคบ
  - Specs ยังไม่มี blueprint เส้นวาดตาม scroll และการเลือกเปรียบเทียบทีละ 2 รุ่นบนมือถือ (SPEC §4 [5])

## M5 — มือถือ, การเข้าถึง, ประสิทธิภาพ ✅

- [x] **หนังสือบนมือถือ** (จอแนวตั้ง กว้าง/สูง < 0.8): กล้องดูทีละหน้า scroll ทีละ 13 step (หน้าซ้าย → หน้าขวา → พลิก) ดู `bookState()` ใน `Book.ts` ความละเอียดหน้าบนมือถือเพิ่มจาก 0.7 เป็น 0.85
- [x] **แถบ tab 3D** ติดขอบกระดาษแต่ละแผ่น (00 ปก … 06 Colors) พลิกไปกับหน้า คลิกแล้วไปที่ spread นั้น tab ที่ active เป็นสีกรมท่า บนจอแนวนอน tab HTML ซ่อนไว้ แต่ยังกด Tab บนคีย์บอร์ดถึงได้ ส่วนในโหมดดูทีละหน้ายังใช้แถบ tab HTML
- [x] **`prefers-reduced-motion`:** หนังสือเป็นภาพนิ่ง ทุก section ไม่ pin (สูง 1 จอ) ฉาก 3D ไม่ scrub แต่เปลี่ยนตามการคลิกรายการ/hotspot/ชิป ADAS แทน รถใน Performance จอดนิ่งกลางจอ
- [x] **ไม่มี WebGL:** หนังสือวาด spread แบนด้วย canvas 2D (หน้า + ชิ้น pop-up ตั้งบนเส้นพับ) และสลับด้วย tab ส่วน Performance / Exterior / Interior / ADAS ใช้ภาพนิ่ง (CSS background) รายการ Exterior และชิป ADAS ยังกดได้
- [x] ฉากของ section แยกเป็น chunk `fx-*.js` (~10 KB gzip) โหลดหลังหนังสือ และไม่โหลดเลยถ้าไม่มี WebGL ส่วน DPR ของทั้งสอง canvas ตอนเครื่องช้าจะไม่ลดต่ำกว่า 1.5 บนจอ ≥ 2×
- ทดสอบโหมดสำรองในโหมด dev ได้ด้วย `?reduced` และ `?nowebgl`
- ไม่ได้ทำ:
  - **KTX2:** ต้องโหลดตัวถอดรหัส Basis (wasm ราว 200 KB) ซึ่งใหญ่กว่ารูป webp ที่ใช้อยู่รวมกัน หน้ากระดาษก็วาดด้วย canvas ตอนรันอยู่แล้ว เลยไม่คุ้ม
  - **bundle หลัก** ยัง ~200 KB gzip เพราะ three.js (~150 KB) ต้องใช้ตั้งแต่จอแรก (หนังสือ) ทางที่ลดได้ต่อคือแยกโค้ดหนังสือเป็น chunk แล้วโหลดคู่กับรูป ซึ่งได้ไม่มาก
  - รูปของ ADAS/Interior ยังโหลดพร้อมกันตอนเริ่มฉาก ยังไม่ได้แยกโหลดราย section

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
