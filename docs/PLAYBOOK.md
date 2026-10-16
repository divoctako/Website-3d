# Playbook: ทำเว็บ 3D Scroll จาก brochure PDF (BYD PI-R Motor)

คู่มือนี้สรุปวิธีที่ใช้ทำเว็บ **BYD SEALION 7** (repo นี้) ตั้งแต่ M0 ถึง M6 เพื่อใช้ทำหน้าแบบเดียวกันกับรุ่นอื่น เช่น SEAL, ATTO 3, DOLPHIN, M6, SEALION 6

- เว็บตัวอย่าง: https://divoctako.github.io/Website-3d/
- ไฟล์อ้างอิงใน repo: [`SPEC.md`](SPEC.md) (spec เต็ม) · [`NEXT.md`](NEXT.md) (สถานะและงานค้าง)

---

## 0. หลักการ 5 ข้อ

1. **brochure PDF คือแหล่งข้อมูลเดียวของเนื้อหารถ** ห้ามเติมตัวเลข ชื่อระบบ หรือคำโฆษณาที่ brochure ไม่ได้พิมพ์ ถ้าไม่แน่ใจให้จดเป็นคำถามค้างใน `NEXT.md`
2. **ส่วนของดีลเลอร์ใช้ชุดเดียวกันทุกรุ่น:** โลโก้ PI-R, Contact (สาขา), ปุ่ม Call to Action (LINE / Messenger / "ติดต่อเรา") ดูหัวข้อ 3
3. **ข้อความเป็น HTML จริงเสมอ** เพื่อ SEO, screen reader และความคมบนมือถือ ส่วน 3D เป็นภาพประกอบอยู่หลังข้อความ
4. **ทุกอย่างต้องมีทางสำรอง:** มือถือ, `prefers-reduced-motion` และเครื่องที่ไม่มี WebGL ต้องอ่านเนื้อหาครบ
5. **ตรวจด้วยตาเสมอ:** ทุก milestone ต้องเปิดเบราว์เซอร์ดูจริงทั้งจอ 1280×720 และ 375×812

---

## 1. Tech stack และโครงไฟล์

| ส่วน | เลือกใช้ |
|---|---|
| Build | Vite + TypeScript (`npm run build` = typecheck + build) |
| 3D | three.js (หนังสือ pop-up + ฉากของแต่ละ section) |
| Scroll | Lenis (smooth scroll) + GSAP ScrollTrigger (snap ของหนังสือ, progress) |
| Deploy | GitHub Pages ผ่าน `.github/workflows/pages.yml` (push แล้ว build/deploy เอง) |
| Node | 22 ขึ้นไป |

```
index.html                 โครงทุก section (ข้อความจริงอยู่ที่นี่)
src/content/brochure.ts    ข้อมูลจาก brochure: KEY_SPECS, DIMENSIONS, สี, ADAS
src/content/specTable.ts   ตารางสเปกเต็ม (หน้า spec ของ brochure) + เชิงอรรถ
src/content/branches.ts    ★ สาขา PI-R (ใช้ร่วมทุกรุ่น)
src/content/jsonld.ts      ★ schema.org (Car + AutoDealer) ใส่ตอน build
src/gl/book/*              หนังสือ pop-up 3D (Book, Leaf, PopUpPiece, spreads)
src/gl/fx/*                ฉาก 3D ของ section (FxStage + Performance/Exterior/Interior/Adas)
src/ui/*                   ผูก DOM: sections, fx, colors, contact, staticBook, ★ cta
scripts/extract-pdf-assets.sh   ดึงรูปจาก PDF → public/assets/*.webp
scripts/process-pic.py          ไดคัท/แปลงรูปที่ generate เพิ่ม (pic/) → webp
pic/PROMPTS.md                  prompt สำหรับ generate รูปที่ PDF ไม่มี
```
★ = ส่วนที่ copy ไปใช้กับรุ่นอื่นได้เลย ไม่ต้องแก้

---

## 2. Design guideline

### 2.1 สี (CSS tokens ใน `src/styles.css` `:root`)

| Token | ค่า | ใช้ทำอะไร | รุ่นอื่น |
|---|---|---|---|
| `--bg` | `#FFFFFF` | พื้นหลังหลัก (light theme เท่านั้น ไม่มี dark mode) | คงเดิม |
| `--surface` | `#F5F6FA` | พื้น section สลับ, การ์ด, ฉาก Exterior | คงเดิม |
| `--paper` | `#FBFAF7` | กระดาษในหนังสือ pop-up (ขาวอุ่น) | คงเดิม |
| `--line` | `#E4E6EE` | เส้นแบ่ง, ขอบการ์ด | คงเดิม |
| `--text` | `#0E1330` | ตัวอักษรหลัก | คงเดิม |
| `--text-muted` | `#5B6178` | คำอธิบาย, label | คงเดิม |
| `--brand-navy` | `#1C3A7A` | หัวข้อใหญ่, ตัวเลข, active state | คงเดิม (โทน BYD) |
| `--accent` | `#8B84C6` | สีเน้นประจำรุ่น (Pulse Purple ของ SEALION 7): eyebrow, หน่วย, hotspot | **เปลี่ยนตามสีเด่นของรุ่น** โดยดูดสีจาก brochure |
| `--accent-soft` | `#ECEAF7` | พื้นไฮไลต์ (แถวที่ต่างกันในตาราง) | สีอ่อนของ accent (ประมาณ 10%) |
| `--glow` | `#5AA9FF` | แสงเซนเซอร์ ADAS, mood light | คงเดิม |
| `--brand-pir` | `#590734` | ★ สีโลโก้ PI-R: ปุ่ม CTA, ชื่อสาขา | **ห้ามเปลี่ยน** |
| `--brand-pir-hover` | `#74104A` | ★ hover ของปุ่ม CTA | **ห้ามเปลี่ยน** |

กติกา:
- พื้นเป็นโทนขาวทั้งเว็บ ส่วน Colors ย้อมพื้นตามสีรถได้**ไม่เกิน 8%**
- สีแดง/ส้มใช้กับคำเตือนใน ADAS เท่านั้น (AEB `#FF5A4F`, warning `#FFAA33`)
- เงากระดาษ: `--shadow-paper: 0 20px 40px -20px rgba(14,19,48,.18)`
- shader ของ three.js รับสีเป็นค่า **linear** ถ้าเขียนสีเป็นตัวเลขใน GLSL ต้องแปลงจาก sRGB ก่อน (ดูข้อ 7)

### 2.2 ตัวอักษร

| บทบาท | ฟอนต์ | หมายเหตุ |
|---|---|---|
| หัวข้อ EN, ตัวเลขสเปก, ชิป ADAS | **Michroma** 400 (Google Fonts) | ตัวพิมพ์ใหญ่, `letter-spacing: 0.04em` ใช้แทนฟอนต์ BYD ที่ไม่เปิดสาธารณะ |
| เนื้อหาไทย/อังกฤษ | **IBM Plex Sans Thai** 400 / 500 / 600 | ใช้ทุกที่ที่เป็นประโยค |

```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600&family=Michroma&display=swap" rel="stylesheet" />
```

**ขนาดที่ใช้จริง**

| ส่วน | ขนาด |
|---|---|
| หัวข้อ section (`.title`) | `clamp(26px, 7.4vw, 64px)` uppercase, line-height 1.08 |
| หัวข้อใน section ที่ pin (Exterior/ADAS/Colors) | `clamp(24–26px, ~3.5vw, 44–52px)` |
| Eyebrow ("01 · Performance") | 12px Michroma, letter-spacing 0.16em, สี accent |
| Lead | 22px / 600 |
| Body | 17px / line-height 1.75, สี muted, กว้างไม่เกิน 680px |
| ตัวเลขสเปก | Michroma `clamp(28px, 3.6vw, 44px)` สี navy + หน่วย 15px สี accent |
| Label ของสเปก | 12px uppercase letter-spacing 0.06em |
| Feature list | 17px / 1.6 ใช้เลข "01" Michroma 11px นำหน้า |
| ตาราง | 15px (เต็มตาราง 11px padding), มือถือ 13px |
| Note / disclaimer | 12px / 1.7 สี muted |
| Nav | 14px, สูง 64px, โลโก้ PI-R สูง 28px |
| ปุ่ม CTA | 15px / 600, สูงอย่างน้อย 48px (มือถือ 14px) |
| มือถือ (< 768px) | ลดราว 0.7×, gutter 16px |

### 2.3 Layout

- container กว้างสูงสุด 1280px, gutter 24px (มือถือ 16px)
- breakpoint: 1100px (ซ่อนลิงก์ nav ส่วนใหญ่) · 900px (section ที่ pin เปลี่ยนเป็นแนวตั้ง) · 768px (มือถือ)
- จอแนวตั้ง (กว้าง/สูง < 0.8): หนังสือแสดงทีละหน้า
- section ที่ pin: wrapper สูง N×100vh + stage `position: sticky; height: 100svh`
- มุมโค้ง: การ์ด 14–16px, ปุ่ม/ชิป 999px (pill), dialog 20px

### 2.4 Motion

| อย่าง | ค่า |
|---|---|
| easing หลัก (CSS) | `cubic-bezier(0.2, 0.7, 0.2, 1)` |
| Lenis | `duration: 1.15` |
| snap หนังสือ | ทีละ step, `duration 0.35–0.9s`, `delay 0.12`, `power2.inOut` |
| damping ฉาก 3D | `THREE.MathUtils.damp(..., 5–7, dt)` |
| crossfade รูป | 0.5–0.8s |
| reduced motion | ตัดการเคลื่อนไหวทั้งหมด (ดู M5) |

### 2.5 ภาษาภาพ "กระดาษ pop-up"

- ทุกชิ้นใน 3D เหมือนกระดาษ: การ์ดขอบขาว, ไดคัทมีขอบขาวแบบตัดกรรไกร (`paperCutout`), เงานุ่ม
- การ์ดลอยขึ้นแบบพับจากเส้นพับ (hinge ที่ขอบล่าง) ไม่ใช่ fade เฉย ๆ
- รูปไดคัทความละเอียดต่ำ**ห้ามขยายเกินขนาดจริง** (จำกัดไว้ราว 1.05× ของความกว้างรูป)

---

## 3. ส่วนที่ต้องเหมือนกันทุกรุ่น (ดีลเลอร์ PI-R)

| ส่วน | ไฟล์ | รายละเอียด |
|---|---|---|
| **โลโก้ PI-R** | `public/assets/pir-logo.webp`, nav ใน `index.html` | อยู่ซ้ายของ nav สูง 28px `alt="BYD PI-R Motor (พายอาร์ มอเตอร์)"` nav โผล่หลังจบหนังสือ |
| **ข้อมูลสาขา** | `src/content/branches.ts` | `COMPANY`, `COMPANY_TH`, `BRANCHES[]` (ชื่อ, ที่อยู่, เบอร์, LINE, Messenger, Google Maps) **แก้ที่นี่ที่เดียว** ทุกจุดดึงไปใช้เอง |
| **Contact ด้านล่าง** | `index.html` `#contact` + `src/ui/cta.ts` | ฉากปิดท้าย "Life in Motion" (รถด้านหลังถอยเข้าหมอก) แล้วตามด้วยการ์ดสาขา: ที่อยู่ + Google Maps ↗, เบอร์ (`tel:`), ปุ่ม LINE / Messenger และ disclaimer ของ brochure |
| **Call to Action** | `src/ui/cta.ts`, CSS `.cta*` | ปุ่ม pill สี `--brand-pir` สูง 48px มีไอคอน "เพิ่มเพื่อน LINE" / "Messenger" ถ้ายังไม่มีลิงก์ ปุ่มจะเป็นสีเทาพร้อมคำว่า "เร็ว ๆ นี้" |
| **ปุ่มลอย "ติดต่อเรา"** | `.cta-fab` + `<dialog class="cta-sheet">` | เฉพาะจอ < 768px: มุมขวาล่าง (เผื่อ safe-area), pill สี `--brand-pir`, 15px/600, padding 14×22px โผล่หลังจบหนังสือ ซ่อนเมื่อถึง Contact กดแล้วเปิด sheet (กว้างสูงสุด 440px, มุม 20px) ที่มีปุ่ม LINE/Messenger ของทุกสาขา ปิดได้ด้วย ✕ หรือแตะพื้นหลัง |
| **SEO ของดีลเลอร์** | `src/content/jsonld.ts` | `AutoDealer` ต่อสาขา สร้างจาก `branches.ts` อัตโนมัติ |

> สิ่งที่**ไม่ได้มาจาก brochure** มีแค่หัวข้อ 3 นี้ (ข้อมูลดีลเลอร์) ส่วนอื่นทั้งหมดต้องมาจาก PDF

---

## 4. ขั้นตอน M0 → M6

### M0 — เตรียมโปรเจกต์ (½ วัน)

1. copy repo นี้เป็นโปรเจกต์ใหม่ (หรือสร้าง branch ใหม่) วาง PDF ที่ `source/<รุ่น>.pdf`
2. `npm install` แล้ว `npm run dev` (พอร์ตมาจาก env `PORT` ค่าเริ่มต้น 5173)
3. แก้ `<title>`, meta description, canonical/og:url ใน `index.html` และ `SITE_URL` ใน `jsonld.ts`
4. ตรวจ workflow Pages ว่าชี้ branch ที่ถูก

### M1 — อ่าน PDF และวาง spec (1 วัน)

1. **render ทุกหน้าเป็นรูป** แล้วอ่านด้วยตา (pdfium/Pillow หรือ Acrobat export):
   ```bash
   python -c "import pypdfium2 as p; d=p.PdfDocument('source/X.pdf'); [d[i].render(scale=3).to_pil().save(f'page{i+1}.png') for i in range(len(d))]"
   ```
2. **ข้อความ:** `pdftotext -layout` ได้ตัวอังกฤษและตัวเลข แต่**สระไทยมักเพี้ยน** ต้องเทียบกับภาพหน้าทุกบรรทัด
3. **ตารางสเปก:** ช่องที่ merge (ค่าเดียวกินหลายรุ่น) ต้องดูจากภาพ บทเรียนจาก SEALION 7: ที่เก็บของท้าย 500 ลิตรครอบ Premium + AWD Performance (เคยกรอกผิดเป็น 520)
4. จดลง `src/content/brochure.ts` (สเปกหลัก, ขนาด, สี + รุ่นที่มี, ADAS) และ `specTable.ts` (ตารางเต็มตามลำดับหมวด + เชิงอรรถ ①②③)
5. **ดึงรูปจาก PDF:** `npm run assets` (`scripts/extract-pdf-assets.sh` ต้องมี poppler-utils + ImageMagick) แก้ map ชื่อไฟล์ให้ตรงรุ่น ไดคัทที่มี mask จะได้ alpha
6. เขียน `SPEC.md` ของรุ่น: section ไหนมีเนื้อหาอะไร ใช้รูปไหน ทำ 3D แบบไหน และ**คำถามค้าง**
7. **ตรวจรูปทุกรูปเทียบตาราง 5.2** (ใน PDF รถไดคัทมักกว้างแค่ 170–900 px และมักไม่มีมุมหลัง/มุมบน) รูปที่ขาดหรือไม่ชัดให้**เขียน prompt ก่อน** ลง `pic/PROMPTS.md` ตาม 5.4 แล้ว generate และตรวจตาม 5.5 ให้เสร็จก่อนเริ่ม M2

### M2 — หนังสือ pop-up 3D (1–2 วัน)

1. หนังสือ = ปก + 1 spread ต่อ section + ฉาก dive ทั้งหมดอยู่ใน `src/gl/book/spreads.ts`:
   - หน้า (canvas 2D, `PX = 1024` px ต่อหน่วย, หน้า 1 × 1.4 หน่วย)
   - ชิ้น pop-up ผ่าน `add(leaf, side, x, canvas, { width, z, delay, lean, yaw, section })`
2. helper ใน `textures.ts`: `statCard`, `photoCard`, `paperCutout`, `backdropCard`, `tag`, `wrap` (ตัดคำไทยด้วย `Intl.Segmenter`)
3. scroll ทีละ spread (snap) แต่ละชิ้นคลิกแล้วไป section ของมัน
4. tab 00–06 เป็นแถบกระดาษ 3D ติดขอบหน้า และมีปุ่ม HTML สำรองไว้สำหรับคีย์บอร์ด/มือถือ
5. ถ้าจำนวน section ต่างไป ให้แก้ `SPREADS`, `TAB_LABELS`, `SPREAD_SECTIONS` และปุ่ม `data-step`

### M3 — 3D ของ Performance / Exterior / Interior (2 วัน)

canvas ตัวที่สอง (`FxStage`) `position: fixed` อยู่หลังเนื้อหา วาดแต่ละฉากเฉพาะในกรอบ `[data-fx]` ที่อยู่ในจอ (scissor) section ที่มีฉากใช้พื้นโปร่ง (`.fx-section`)

| Section | ฉาก | Asset |
|---|---|---|
| Performance | รถด้านข้างวิ่งเข้าจากขวา, parallax 3 ชั้น (ฟ้าหมอก / เส้นแสง / รถ), ล้อหมุนด้วย shader, ตัวเลข count-up | `car-side`, `bg-sky-mist`, `speed-lines` |
| Exterior | pin, scroll ไล่ feature ทีละข้อ, รถหมุนหน้า → ข้าง → ท้าย (±25°), hotspot (ปุ่ม HTML), การ์ด detail พับขึ้น | `car-front`, `car-side`, `detail-*` |
| Interior | pin, รูปห้องโดยสารบนผนังโค้ง (cylinder) แล้ว pan, แถบไฟ 128 เฉด + ปุ่มจังหวะ, การ์ด masonry | `interior-wide`, `interior-*` |

ปรับตามรุ่น: ตำแหน่ง hotspot (`u`, `v` บนรูป), ตำแหน่งล้อ (`WHEELS`, `WHEEL_Y`), รายการ feature/การ์ดให้ตรง brochure ถ้ารุ่นไหนไม่มี mood light หรือ feature นั้นก็ตัดออก

### M4 — ADAS / Specs / Colors / Contact (2 วัน)

| Section | วิธีทำ |
|---|---|
| ADAS | pin, ถนน shader (เส้นเลนวิ่ง), รถ billboard มุมหลังเฉียงบน, ภาพเซนเซอร์ต่อระบบ (วงแหวน / กรวย / กล่อง / พัด / เลนเรืองแสง / ไฟสูง-ต่ำ) และรถคันหน้า ชิปชื่อระบบคลิกได้ **ลิสต์ระบบตาม brochure รุ่นนั้นเท่านั้น** |
| Specs | ตารางหลักเปรียบเทียบรุ่น + ตารางเต็มแบบ `<details>` ต่อหมวด, merge ช่องที่เท่ากัน, เน้นแถวที่ต่างกัน, สวิตช์ "แสดงเฉพาะที่ต่างกัน", เชิงอรรถ |
| Colors | pin, scroll ไล่สี (หยุดไล่เมื่อผู้ใช้กดเลือก), รูปรถ HD ทุกสีครอปกรอบเดียวกัน, แท่นขาว, ย้อมพื้น ≤ 8%, badge รุ่นที่มีสีนั้น (HTML/CSS ไม่ใช้ WebGL) |
| Contact | ฉากรถด้านหลังถอยเข้าหมอก + "LIFE IN MOTION" แล้วต่อด้วย**ส่วน PI-R ตามหัวข้อ 3** |

### M5 — มือถือ, การเข้าถึง, ประสิทธิภาพ (1–2 วัน)

- **มือถือ:** หนังสือดูทีละหน้า (ซ้าย → ขวา → พลิก) ความละเอียดหน้า 0.85, DPR ไม่ต่ำกว่า 1.5, ฉาก ADAS ถอยกล้องตามสัดส่วนจอ
- **`prefers-reduced-motion`:** หนังสือเป็นภาพนิ่ง (`staticBook.ts`), ไม่ pin, ไม่ scrub, ฉากเปลี่ยนตามการคลิก
- **ไม่มี WebGL:** หนังสือวาด spread แบนด้วย canvas 2D, ฉาก section เปลี่ยนเป็นรูปนิ่ง (CSS background), ไม่โหลด chunk 3D
- **ประสิทธิภาพ:** ฉาก section แยกเป็น chunk โหลดหลังหนังสือ, รูปสี/Contact โหลดเมื่อใกล้ถึง, ลบรูปที่ไม่ใช้
- ทดสอบโหมดสำรองในโหมด dev: `?reduced` และ `?nowebgl`

### M6 — QA และ launch (1 วัน)

1. **ตรวจตัวเลขทุกตัวเทียบภาพ PDF** (หน้า highlight, หน้า feature, ตารางสเปก, สี/รุ่น)
2. **SEO:** canonical, Open Graph/Twitter แบบ URL เต็ม, `public/og.jpg` 1200×630 (ครอปจากรูปปก ไม่เติมข้อความ), JSON-LD `Car` + `AutoDealer` (สร้างตอน build)
3. **ทดสอบบนเครื่องจริง:** iPhone Safari + Android Chrome (หนังสือทีละหน้า, ความลื่นใน section ที่ pin, ความคม, ปุ่มลอย "ติดต่อเรา")
4. `npm run build` แล้วดูขนาด (เป้า: JS gzip ~200 KB, รวมทั้งเว็บ ~2.5 MB)
5. push → Pages deploy → เปิดเว็บจริงแล้วตรวจลิงก์พรีวิวใน LINE/Facebook

---

## 5. รูปที่ใช้ และการ generate รูปที่ไม่ชัดด้วย AI

### 5.1 ขั้นตอน (ทำใน M1 ก่อนเริ่มทำ 3D)

1. **ดึงรูปจาก PDF** (`npm run assets`) แล้วเทียบกับตาราง 5.2 ว่าแต่ละรูป**กว้างพอไหม**
   เกณฑ์ "ชัด" = ความกว้างจริงของรูป ≥ ขนาดที่แสดงบนจอ (CSS px) × 2 (จอมือถือ/Retina เป็น 2–3×)
2. ทำ**ลิสต์รูปที่ขาดหรือไม่ชัด** ลงตารางใน `pic/PROMPTS.md` (ชื่อไฟล์ · ใช้ที่ไหน · ทำไมต้องทำใหม่ · รูปอ้างอิงที่ต้องแนบ)
3. **ขอรูปจริงจาก BYD/ดีลเลอร์ก่อน** ถ้าไม่มีหรือรอไม่ได้ ค่อยเขียน prompt ตาม 5.4 แล้วให้ AI generate (ทำเป็นของชั่วคราว)
4. วางรูปที่ได้ใน `pic/` ตั้งชื่อตามตาราง แล้วรัน `python scripts/process-pic.py pic public/assets <preview-dir>`
5. **ตรวจทุกรูปตาม 5.5** ก่อนใช้ ถ้ารูปไหนไม่ผ่านให้ generate ใหม่ อย่าฝืนใช้
6. จดลง `pic/GENERATED.md` ว่ารูปไหนมาจาก AI (ต้องเปลี่ยนเป็นรูปจริงก่อน launch จริง)

### 5.2 รายการรูปทั้งหมด

ขนาดขั้นต่ำ = ความกว้างที่ควรมีให้คมบนจอ 2× · "SEALION 7" = ขนาดที่ได้จาก PDF/AI ในเว็บนี้ · ⚠ = ไม่ชัดพอ ควร generate หรือขอรูปใหม่

**รถ (ต้องไดคัท พื้นโปร่งใส)**

| ไฟล์ | ใช้ที่ | ขั้นต่ำ | SEALION 7 | หมายเหตุ |
|---|---|---|---|---|
| `car-side.webp` | Performance (วิ่งเข้า), Exterior (มุมข้าง), หนังสือ, blueprint | 1800 | 902 ⚠ | หันหน้าไปทางซ้าย ล้อตั้งตรง ใช้วัดตำแหน่งล้อ (`WHEELS`) |
| `car-front.webp` | Exterior (มุมหน้า), หนังสือ, blueprint | 900 | 529 ⚠ | หน้าตรง สมมาตร |
| `car-rear.webp` | Exterior (มุมท้าย), Contact | 1200 | 1190 (AI) | PDF ส่วนใหญ่ไม่มี หรือเล็กมาก (SEALION 7 มีแค่ 334 px) |
| `car-rear-34-top.webp` | ADAS (รถของเรา) | 1400 | 1400 (AI) | มองจากหลังเฉียงบน ~55° หัวรถชี้ขวาบน |
| `car-color-<id>-hd.webp` | Colors (1 ไฟล์ต่อสี) | 1600 | 1600 (AI) | ทุกสี**มุมเดียวกัน กรอบเดียวกัน** |
| `car-color-<id>.webp` | หนังสือหน้า Colors (การ์ดเล็ก) | 400 | 172 ⚠ | ใช้ไฟล์ `-hd` ย่อแทนได้ |
| `lead-car-rear.webp` | ADAS (รถคันหน้า/รถข้างเลน) | 1200 | 1200 (AI) | รถทั่วไปไม่มียี่ห้อ มุมเดียวกับรถเรา |

**รูปรายละเอียด (การ์ด)**

| ไฟล์ | ใช้ที่ | ขั้นต่ำ | SEALION 7 |
|---|---|---|---|
| `detail-headlight.webp` | Exterior การ์ด, หนังสือ | 600 | 328 ⚠ |
| `detail-taillight.webp` | Exterior การ์ด | 600 | 236 ⚠ |
| `detail-wheel.webp` | Exterior การ์ด, หนังสือ | 600 | 263 ⚠ |
| `detail-tailgate.webp` | Exterior การ์ด, หนังสือ | 600 | 482 ⚠ |
| `interior-hud.webp` | Interior การ์ด, หนังสือ | 600 | 408 ⚠ |
| `interior-dash.webp` | Interior การ์ด (จอ 15.6 นิ้ว), หนังสือ | 1100 | 1095 ✓ |
| `interior-shifter.webp` | Interior การ์ด, หนังสือ | 600 | 352 ⚠ |
| `interior-dms.webp` | Interior การ์ด | 600 | 386 ⚠ |
| `interior-audio.webp` | Interior การ์ด, หนังสือ | 600 | 288 ⚠ |
| `interior-roof.webp` | Interior การ์ด, หนังสือ | 600 | 343 ⚠ |
| `interior-blue.webp` | Interior การ์ด (สีภายในตัวเลือก) | 600 | 335 ⚠ |

**ภาพกว้าง / พื้นหลัง**

| ไฟล์ | ใช้ที่ | ขั้นต่ำ | SEALION 7 |
|---|---|---|---|
| `hero.webp` | ปกหนังสือ, ที่มาของ `og.jpg` | 2400 | 2400 ✓ |
| `interior-wide.webp` | Interior (ผนังโค้ง pan), fallback | 2000 | 1306 ⚠ |
| `bg-sky-mist.webp` | Performance (ฉากหลัง), หนังสือ | 1800 | 1800 ✓ |
| `speed-lines.webp` | Performance (เส้นแสง), หนังสือ | 1400 | 1376 ✓ |
| `adas-road.webp` | หนังสือหน้า ADAS, fallback ไม่มี WebGL | 1600 | 1242 ⚠ |
| `bg-swirl.webp` | หนังสือหน้า Exterior | 1600 | 1600 ✓ |
| `contact-mist.webp` | Contact (หมอกขาว) | 1600 | 1672 (AI) ✓ |
| `og.jpg` | ลิงก์พรีวิว (1200×630) | 1200 | ครอปจาก `hero` ✓ |
| `pir-logo.webp` ★ | nav ทุกรุ่น | — | ใช้ไฟล์เดิม |

### 5.3 กติการ่วมของทุก prompt

- **แนบรูปอ้างอิงจาก PDF ของรุ่นนั้นทุกครั้ง** (image-to-image / reference) และเขียนว่า "match the reference exactly" ถ้าไม่แนบ จะได้ SUV หน้าตาคล้าย ๆ แต่ไม่ใช่รุ่นนั้น
- ระบุ**ชื่อรุ่น + สีตาม brochure** (ชื่อสีภาษาอังกฤษ + hex โดยประมาณ)
- รถไดคัท: `isolated on a transparent background` ถ้าเครื่องมือทำ alpha ไม่ได้ให้ใช้ `pure white #FFFFFF background` แล้วให้สคริปต์ไดคัท
- ทุกรูป: `no text, no watermark, no added logos, no licence plate text` (ป้ายทะเบียนหน้า "BYD <รุ่น>" ตามรูปจริงใช้ได้ แต่ต้องตรงกับ PDF)
- ความกว้างตามคอลัมน์ "ขั้นต่ำ" (เครื่องมือหลายตัวทำได้แค่ ~1500 px **อย่า upscale เอง** ใช้ขนาดที่ได้แล้วจดไว้)
- รถหลายสี: generate **สีขาวคันเดียว** ก่อน แล้วสั่งแก้สีจากรูปนั้น (5.4 ข้อ D)
- รูปที่แค่ "ไม่ชัด" แต่มีอยู่แล้ว: ใช้ prompt แบบ **recreate** (5.4 ข้อ H) โดยแนบรูปเดิม ห้ามเปลี่ยนองค์ประกอบ

### 5.4 Prompt สำเร็จรูป

แทนค่าใน `<...>`: `<MODEL>` เช่น BYD SEAL, `<COLOR>` เช่น Arctic Blue (#9db7d6), `<REF>` = รูปจาก PDF ที่แนบ

**A. รถด้านข้าง** → `car-side.png`
```
Studio product photo of the <MODEL> electric car in exact side profile, facing LEFT,
camera at wheel-centre height, orthographic-like, no perspective distortion.
<COLOR> paint. Wheels straight, same wheel design and brake calliper colour as the reference.
Match the reference image exactly: body lines, windows, lights, door handles, mirrors.
Soft even white studio lighting, subtle contact shadow under the tyres only,
isolated on a transparent background, whole car visible with margin, no text, no watermark,
2400px wide, photorealistic.
```

**B. รถด้านหน้าตรง** → `car-front.png`
```
Studio product photo of the <MODEL> seen exactly from the FRONT, straight-on, symmetrical,
camera at headlight height. <COLOR> paint. Headlights, grille/intake, badge and number plate
exactly as in the reference. Soft white studio light, subtle contact shadow,
isolated on a transparent background, no text, no watermark, 1600px wide, photorealistic.
```

**C. รถด้านหลังตรง** → `car-rear.png`
```
Studio product photo of the <MODEL> seen exactly from the REAR, straight-on, symmetrical,
camera at bumper height. <COLOR> paint. Taillight shape and light pattern, badges and
bumper exactly as in the reference (tailgate CLOSED). Only the badges the reference shows,
no extra model or trim lettering. Soft white studio light, subtle contact shadow,
isolated on a transparent background, no text, no watermark, 2400px wide, photorealistic.
```

**D. รถทุกสี (Colors)** → `car-color-<id>.png`

ขั้น 1 สีขาว:
```
Studio product photo of the <MODEL>, front three-quarter view from the front-LEFT,
camera at headlight height, exactly the same angle as <REF colour photo>.
<WHITE COLOR NAME> paint, wheels and callipers as in the reference, lights on as in the reference.
Soft white studio light, subtle contact shadow, isolated on a transparent background,
no text, no watermark, 2400px wide, photorealistic.
```
ขั้น 2 ทีละสี (แนบรูปจากขั้น 1):
```
Edit this exact image. Keep the canvas size, framing, car shape, angle, wheels, callipers,
lights, glass, badges, shadow and transparent background identical; do not zoom or reframe.
Change ONLY the body paint to <COLOR>.
```

**E. หลังเฉียงจากด้านบน (ADAS)** → `car-rear-34-top.png`
```
The <MODEL> in <COLOR>, seen from behind and above at about 55 degrees, rear three-quarter
view from the RIGHT side of the car, nose pointing to the upper right of the frame.
Match the reference for taillights, roof, spoiler and wheels. Wheels straight, no road,
no lane markings, no light effects. Soft overcast light, gentle shadow directly beneath,
isolated on a transparent background, clean margins, no text, no watermark, 1600px wide, photorealistic.
```

**F. รถคันหน้า (ADAS)** → `lead-car-rear.png`
```
Generic unbranded modern compact SUV in neutral light grey, seen from behind and above at
about 55 degrees, rear three-quarter view, nose to the upper right — same angle as <REF E>.
No logos, no badges, no readable licence plate. Soft overcast light, gentle shadow beneath,
isolated on a transparent background, no text, no watermark, 1200px wide, photorealistic.
```

**G. ภาพระยะใกล้ (detail / interior card)** → `detail-*.png`, `interior-*.png`
```
Close-up product photo of the <MODEL> <PART: e.g. LED headlight / taillight / 20-inch wheel
with red calliper / powered tailgate open / head-up display / 15.6-inch touchscreen /
crystal gear shifter / driver monitoring camera / door speaker / panoramic glass roof>,
same framing and composition as the reference, <COLOR> paint where visible,
every detail exactly as in the reference. Natural soft light, no text overlays,
no watermark, 1200px wide, photorealistic.
```

**H. ทำรูปเดิมให้คมขึ้น (recreate)** → ชื่อเดิม
```
Recreate this exact photograph at higher resolution (<WIDTH>px wide). Keep the composition,
crop, perspective, colours, lighting and every object identical; do not add, remove or
restyle anything (screens, logos, stitching, buttons stay as they are). Sharper detail only.
No text, no watermark.
```
ใช้กับ `interior-wide`, `interior-*` และ `detail-*` ที่ ⚠ หลังได้รูปแล้ว**ต้องเทียบกับต้นฉบับทีละจุด** (หน้าจอ, โลโก้บนพวงมาลัย, ปุ่ม) เพราะ AI มักเปลี่ยนรายละเอียดเล็ก ๆ

**I. ฉากหลัง**
- `bg-sky-mist`: `Wide calm landscape, deep navy blue sky fading to soft white mist over a flat white salt plain, distant faint mountains on the horizon, minimal, no objects, no people, no text, 2400x1300, photorealistic.`
- `speed-lines`: `Abstract long-exposure light streaks, white, lavender and blue light trails on a deep blue background, motion blur, horizontal, no cars, no text, 1600x2000.`
- `contact-mist`: `Wide empty landscape fading into soft white fog, pale lavender-grey haze, flat salt-flat ground disappearing into mist at the horizon, very low contrast, no objects, no people, no text, 2400x1350, photorealistic.`
- `adas-road`: ถ้า PDF ไม่มี ใช้ภาพจาก E วางบนถนนก็พอ (ภาพนี้เป็นแค่ภาพสำรองและภาพในหนังสือ)

### 5.5 ตรวจรูปก่อนใช้

- [ ] รุ่นถูก: ไฟหน้า/ไฟท้าย, ล้อ (ลายก้าน + ขนาด), สีคาลิปเปอร์, กระจก/หลังคา ตรงกับ PDF
- [ ] **ไม่มีข้อความที่ PDF ไม่มี** (เช่นป้าย "4.5S" ที่ AI เติมเอง ให้ลบด้วย `RETOUCH` ใน `process-pic.py` หรือ generate ใหม่)
- [ ] มุมและทิศตามตาราง (รถด้านข้างหันซ้าย, ADAS หัวชี้ขวาบน, รถทุกสีมุมเดียวกัน)
- [ ] ไดคัทสะอาด: ไม่มีขอบเรืองแสง/จุดเศษ (ดู preview บนพื้นเทาที่สคริปต์ทำให้)
- [ ] ความกว้าง ≥ ขั้นต่ำ ถ้าไม่ถึงให้จดไว้ อย่า upscale เอง
- [ ] จดใน `pic/GENERATED.md` ว่าเป็นรูป AI และต้องเปลี่ยนเป็นรูปจริงก่อน launch

---

## 6. ข้อผิดพลาดที่เจอแล้ว (อย่าทำซ้ำ)

| ปัญหา | ทางแก้ |
|---|---|
| shader ไม่ขึ้นเลย | GLSL ES ไม่แปลง int → float ให้เอง ตัวเลขที่ใส่ใน template string ต้องเป็นทศนิยม (`toFixed`) |
| สีใน shader จางจนกลืนพื้น | ค่าใน GLSL เป็น linear ให้แปลงจาก sRGB ก่อน หรือส่งสีเป็น `THREE.Color` uniform |
| canvas ทาสีทับทั้งจอตอนกรอบเลื่อนเข้า | scissor ต้องตัดให้อยู่ในจอ (บางไดรเวอร์ปัด y ติดลบเป็น 0) |
| hotspot อยู่ผิดที่ | CSS `scale` คูณ `transform` ไปด้วย ให้วางตำแหน่งด้วย property `translate` |
| ถอยกลับจากเนื้อหาแล้วค้างที่จอขาว | snap ห้ามจอดที่ step "dive" ถ้าเลื่อนขึ้นให้กลับไป spread สุดท้าย ถ้าเลื่อนลงให้ไปต่อที่เนื้อหา และไม่ snap ถ้า scroll หยุดเลยหนังสือไปแล้ว |
| billboard ซ้อนกันผิดคัน | เรียงลำดับวาดตามระยะห่างจากกล้อง ไม่ใช่ตามตำแหน่ง z |
| ทดสอบแล้ว scroll เด้งกลับ | ใช้ `__lenis.scrollTo(y, { immediate: true })` ไม่ใช่ `window.scrollTo` |
| ตัวเลขผิดเพราะช่อง merge | อ่านตารางจากภาพ ไม่ใช่จาก text |

---

## 7. Checklist ต่อรุ่นใหม่

- [ ] `source/<รุ่น>.pdf` + render ทุกหน้า
- [ ] `brochure.ts`, `specTable.ts` ตรงกับภาพ PDF ทุกบรรทัด
- [ ] `--accent` / `--accent-soft` ตามสีเด่นของรุ่น
- [ ] รูปทุกไฟล์ในตาราง 5.2 ผ่านเกณฑ์ขั้นต่ำ ไม่งั้นมี prompt ใน `pic/PROMPTS.md` และรูปที่ generate แล้วผ่าน 5.5 (ผ่าน `process-pic.py`)
- [ ] spreads ของหนังสือ, `TAB_LABELS`, ข้อความ section ใน `index.html`
- [ ] hotspot/ล้อ/การ์ดใน `src/gl/fx/*` ตรงกับรูปใหม่
- [ ] รายการ ADAS / สี / รุ่นย่อย ตรง brochure
- [ ] ★ โลโก้ PI-R, `branches.ts`, ปุ่ม CTA, ปุ่มลอย "ติดต่อเรา" ทำงาน (ลิงก์ LINE/Messenger ถูกสาขา)
- [ ] `<title>`, description, canonical, og:url, `og.jpg`, `SITE_URL`
- [ ] ทดสอบ 1280×720, 375×812, `?reduced`, `?nowebgl`, เครื่องจริง
- [ ] `npm run build` ผ่าน → push → ตรวจเว็บจริง
