# งานที่เหลือ (handoff)

สถานะ ณ commit `314eb87` บน branch `claude/sealion7-spec` (เป็น default branch ของ repo ด้วย)
- เสร็จแล้ว: M0 setup, M1 prototype หนังสือ, M2 หนังสือครบ 6 spread + tabs + section เนื้อหาแบบ HTML, M3 ฉาก 3D ของ Performance / Exterior / Interior, M4 ADAS / Specs / Colors / Contact
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
  - `car-top.png` ยังไม่ได้ใช้ (เผื่อไว้สำหรับมุมมองจากบนใน ADAS)
  - บนมือถือ รถคันหน้าของ ICC / AEB อยู่นอกจอ เพราะจอแคบ
  - Specs ยังไม่มี blueprint เส้นวาดตาม scroll และการเลือกเปรียบเทียบทีละ 2 รุ่นบนมือถือ (SPEC §4 [5])

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
