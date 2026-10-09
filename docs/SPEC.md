# BYD SEALION 7 — 3D Scroll Website · Spec v0.1

> สถานะ: **Draft** · วันที่ 2026-10-09
> แหล่งข้อมูลเดียว: brochure `BYD_SEALION_7.pdf` (4 หน้า, REVER AUTOMOTIVE) — ไม่ใช้ข้อมูลจากเว็บอื่น ไม่เติมตัวเลขที่ไม่มีใน brochure

---

## 1. สรุปโปรเจกต์

เว็บไซต์หน้าเดียว (single page) แนะนำ BYD SEALION 7 ที่เล่าเรื่องด้วย 3D และเปลี่ยนตามการ scroll
- **ด้านบนสุด:** หนังสือ pop-up 3D ที่พลิกหน้าตามการ scroll โดยแต่ละหน้าแทนหนึ่ง section ของเว็บ (ใช้เป็นสารบัญ/ตัวอย่างเนื้อหา)
- **ถัดลงมา:** เนื้อหาแต่ละ section มี effect 3D ที่ขับด้วย scroll
- **โทน:** ขาวสะอาดตา ใช้ม่วงลาเวนเดอร์ (Pulse Purple) กับน้ำเงินกรมท่าจาก brochure เป็นสีเน้น

### ข้อตกลงที่ยืนยันแล้ว

| หัวข้อ | สิ่งที่ตกลง |
|---|---|
| แหล่งข้อมูล | brochure PDF อย่างเดียว |
| 3D engine | **three.js** |
| หนังสือ pop-up | scroll แล้วพลิกทีละหน้า แต่ละหน้ามี pop-up ของ section นั้น คลิกหน้า/แถบ tab แล้วกระโดดไปที่ section ได้ |
| วัตถุรถ | **รูปไดคัท (มี alpha mask) จาก PDF** วางเป็นชั้นกระดาษ pop-up ใน three.js ไม่ใช้โมเดล .glb |
| ภาษา | ไทย (หัวข้อใหญ่เป็นอังกฤษตาม brochure) |
| CTA | ข้อมูลติดต่อ Rever (โทร / อีเมล / ที่อยู่) ไม่มีฟอร์ม |
| เอกสาร | Markdown ใน repo (`docs/SPEC.md`) |

---

## 2. โครงหน้าเว็บ (Information Architecture)

```
[0] Pop-up Book Hero        (pinned, ~800vh scroll)
[1] Performance in Motion   #performance
[2] Exterior                #exterior
[3] Design in Motion        #interior
[4] Super Intelligent Assist #adas
[5] Specifications          #specs
[6] Exterior Color          #colors
[7] Contact / Footer        #contact
```

**Navigation:** แถบ nav ด้านบนแบบบาง (โลโก้ BYD ทางซ้าย และ link 6 section ทางขวา) แสดงหลังจากออกจากช่วงหนังสือแล้ว พร้อม progress bar บาง ๆ ใต้ nav บนมือถือเป็น menu แบบ sheet

---

## 3. Hero: หนังสือ Pop-up

### 3.1 แนวคิด
หนังสือปกแข็งสีขาวมุก วางบนพื้นขาวที่มีเงานุ่ม ๆ มองเฉียงจากด้านบนประมาณ 35° เมื่อ scroll ปกจะเปิด และแต่ละ spread (หน้าซ้าย+ขวา) จะมีกระดาษที่ "ตั้งขึ้น" (pop-up) ตามมุมการเปิดหน้า เหมือนหนังสือ pop-up จริง

### 3.2 Scroll choreography
ทั้ง hero ถูก pin ไว้ โดยใช้ scroll ราว 100vh ต่อ 1 step

| Step | Scroll | สิ่งที่เกิดขึ้น |
|---|---|---|
| 0 | 0–100vh | หนังสือปิด ปกเป็นรูป hero (`cover-sky` + รถไดคัท) และ wordmark "BYD SEALION 7 / LIFE IN MOTION" กล้องค่อย ๆ dolly เข้าใกล้ |
| 1 | 100–200vh | ปกเปิด แล้ว **Spread 1 Performance** ปรากฏ |
| 2–6 | ทีละ 100vh | พลิกไป Spread 2–6 |
| 7 | 700–800vh | Spread สุดท้าย (Contact) แล้วกล้อง **dive** ลงไปในหน้ากระดาษ fade เป็นสีขาว แล้วต่อเข้า section #performance แบบไร้รอยต่อ |

- **การพลิกหน้า:** หน้ากระดาษเป็น `PlaneGeometry` แบ่ง segment ตามแนวนอน (ประมาณ 32) ใช้ vertex shader ดัดหน้าให้โค้งระหว่างพลิก (curl ตาม `progress`)
- **pop-up:** ชิ้นกระดาษแต่ละชิ้นผูกกับ hinge ที่รอยพับ มุมตั้ง = `f(openAngle)` โดยหน้าเปิด 180° = ชิ้นตั้ง 90° และหน้าปิด = ชิ้นแบนราบ มีการหน่วงเวลา (stagger) ระหว่างชั้น เพื่อให้ชิ้นหน้าตั้งขึ้นหลังชิ้นหลังเล็กน้อย
- **snap:** เมื่อหยุด scroll ให้ snap ไปที่หน้าที่ใกล้ที่สุด (ScrollTrigger `snap`) เพื่อไม่ให้ค้างกลางการพลิก

### 3.3 เนื้อหาแต่ละ Spread

| Spread | หน้าซ้าย (กระดาษเรียบ) | หน้าขวา / ชิ้น pop-up |
|---|---|---|
| ปก | BYD logo, "BYD SEALION 7", "LIFE IN MOTION" | รูปรถมุมเฉียง (`hero`) |
| 1 Performance | หัวข้อ "PERFORMANCE IN MOTION" + 600 KM | รถด้านข้างไดคัทตั้งขึ้น + การ์ดตัวเลข 3 ใบ (390 kW / 690 N·m / 4.5 s) ตั้งเป็นขั้นบันได |
| 2 Exterior | "EXTERIOR" + "Ocean-X Face" | รถด้านหน้าไดคัท 2 ชั้น (ตัวรถ + เงา) และป้าย callout ไฟหน้า Double-U Floating |
| 3 Interior | "DESIGN IN MOTION" | แผงหน้าปัดแบบ V-fold 2 ชั้น โดยจอ 15.6" ตั้งเด่นเป็นชั้นหน้า |
| 4 ADAS | "SUPER INTELLIGENT ASSIST" | ถนน (พื้นราบ) + รถ 3 คันตั้งเป็นแถวลึก และวงคลื่น sensor เป็นกระดาษโค้ง |
| 5 Specs | ตารางย่อ 3 รุ่น | blueprint ด้านข้างพร้อมเส้นบอกขนาด (4,830 / 2,930 / 1,620 มม.) ตั้งขึ้น |
| 6 Colors | "EXTERIOR COLOR" | รถเรียง 6 คัน 6 สี แบบ tab กระดาษ ยื่นออกเป็นพัด |
| ปกหลัง | ข้อมูลติดต่อ Rever | BYD logo |

### 3.4 Interaction ในหนังสือ
- **Bookmark tabs:** แถบผ้า/กระดาษที่ขอบหนังสือ แต่ละแถบมีชื่อ section อยู่ เมื่อ hover แถบจะยื่นออก ถ้าคลิกจะ scroll ไปที่ step ของหน้านั้นในหนังสือ
- **คลิกที่ pop-up ของหน้าที่เปิดอยู่:** กระโดดไปที่ section จริง (`#performance` ฯลฯ) ข้ามช่วงหนังสือที่เหลือ
- **ปุ่ม "ข้ามหนังสือ ↓"** มุมล่างขวา กดแล้วไปที่ #performance
- เมาส์ขยับแล้วหนังสือเอียงตามเล็กน้อย (±3° parallax) ส่วนบนมือถือปิด effect นี้

---

## 4. Sections หลัก (เนื้อหา + 3D effect)

ใช้ **canvas three.js ตัวเดียว** แบบ `position: fixed` อยู่หลัง DOM โดยแต่ละ section มี "scene state" ของตัวเอง และใช้ scroll progress ของ section นั้นขับ ข้อความเป็น HTML จริง (เพื่อ SEO/accessibility) วางทับ canvas

### [1] Performance in Motion — `#performance`
**เนื้อหา**
- หัวข้อรอง: พลิกนิยามการขับเคลื่อนยุคใหม่
- ข้อความ: BYD SEALION 7 รถ SUV เพื่อไลฟ์สไตล์ของคนสมาร์ท โดยนักออกแบบระดับโลก Wolfgang Egger ที่ได้แรงบันดาลใจจากความงามของท้องทะเล สู่เส้นสายที่โฉบเฉี่ยวรอบคัน พร้อมสมรรถนะที่ชาญฉลาด ตอบทุกความต้องการของชีวิตยุคใหม่
- ตัวเลข (รุ่นท็อป):

| Driven Range (NEDC) | Max Power | Max Torque | Battery | 0–100 km/h | DC Charging CCS2 |
|---|---|---|---|---|---|
| 600 km | 390 kW | 690 N·m | 91.3 kWh | 4.5 s | 230 kW |

**3D / Scroll**
- รถด้านข้างไดคัทวิ่งเข้าจากขวาไปหยุดกลางจอ ด้วย parallax 3 ชั้น (พื้นหลังฟ้าหมอก, รถ, เส้นแสงความเร็ว `speed-lines`)
- ระหว่าง scroll ล้อหมุน (เป็น sprite ล้อแยกที่หมุนด้วย shader) และเส้นแสงพุ่งผ่าน
- ตัวเลขแต่ละตัว count-up เมื่อเข้าจอ แล้วการ์ดลอยขึ้นจากระนาบ z
- footnote: "ระยะทางวิ่ง…เป็นเพียงตัวเลขประมาณการณ์" (ตาม §8)

### [2] Exterior — `#exterior`
**เนื้อหา (5 จุด)**
1. โฉบเฉี่ยวทุกมุมมอง กับการออกแบบภายใต้แนวคิด **Ocean-X Face** โดยตัว "X" ที่ทำให้หน้ารถโดดเด่น
2. สปอร์ตอีกขั้น กับไฟหน้าแบบ **Double-U Floating**
3. ไฟท้ายแนวยาว รับเข้ากับดีไซน์รูปทรงหยดน้ำ
4. ล้ออัลลอยใหญ่ **20 นิ้ว** พร้อมคาลิปเปอร์เบรกสีแดง 4 ล้อ
5. ประตูท้ายไฟฟ้าแบบ **แฮนด์ฟรี**

**3D / Scroll**
- section ถูก pin และ scroll เปลี่ยน "มุมมอง" รถจากหน้า → ข้าง → หลัง โดยใช้ cutout 3 มุม (front / side / rear) ทำ crossfade พร้อมหมุนระนาบ ±25° รอบแกน Y ให้รู้สึกเหมือนหมุนรอบรถ
- **Hotspot:** จุดวงกลมบนรถ 5 จุด จุดที่ตรงกับข้อความที่ active จะขยายออก แล้วภาพ detail (crop) ลอยขึ้นเป็นการ์ดกระดาษ
- ตัว "X" ที่หน้ารถวาดเส้นแสง (SVG stroke animation ทับบน canvas)

### [3] Design in Motion (Interior) — `#interior`
**เนื้อหา**
- หัวข้อ: ดื่มด่ำสุนทรียะแห่งการเดินทางขั้นสุด
- ข้อความ: พบกับภายในห้องโดยสาร BYD SEALION 7 ที่ออกแบบภายใต้แนวคิด **Floating Design** เชื่อมต่อความสะดวกสบายและเทคโนโลยีขั้นสุดได้อย่างลงตัว
- Feature 7 ข้อ: Head-Up Display ครบทุกข้อมูลการขับขี่โดยไม่ต้องละสายตา · หน้าจอมัลติมีเดียขนาด 15.6 นิ้ว · แสงไฟในห้องโดยสาร 128 เฉดสีที่ปรับตามจังหวะเสียงดนตรี · Crystal Shifter พร้อมที่ชาร์จโทรศัพท์ไร้สาย · Driver Monitoring System · DYNAUDIO Premium Sound System · Panoramic Glass Roof · ภายในห้องโดยสารสีใหม่สีฟ้า

**3D / Scroll**
- รูป interior หลัก (`interior-wide`) map ลงบน **พื้นผิวโค้ง (cylinder segment)** ให้รู้สึกเหมือนนั่งอยู่ในรถ แล้ว scroll pan ซ้าย → ขวา
- **Mood light 128 สี:** แถบแสง (emissive strip) ใต้ภาพ ไล่ hue ตาม scroll และมีปุ่ม ▶ "ลองฟังจังหวะ" ที่ pulse ตาม beat แบบ procedural (ไม่มีเสียงจริง เพื่อไม่ต้องขอ autoplay)
- รูป detail (HUD, จอ, Crystal Shifter, DMS, ลำโพง, หลังคา) เป็นการ์ดกระดาษลอยแบบ masonry ที่ลึกต่างกันตามแกน z

### [4] Super Intelligent Assist — `#adas`
**เนื้อหา**
- หัวข้อ: Advanced Driver Assistance System (ADAS) — มั่นใจทุกสถานการณ์ กับเทคโนโลยีความปลอดภัยขั้นสูง
- 11 ระบบ:

| Code | ชื่อ | คำอธิบาย |
|---|---|---|
| 360° | Surround Vision View Camera | กล้องมองภาพรอบคัน 360 องศา |
| ICC | Intelligent Cruise Control | ระบบช่วยควบคุมความเร็วอัตโนมัติแบบแปรผันอัจฉริยะ |
| AEB | Automatic Emergency Braking | ระบบช่วยเบรกฉุกเฉินอัตโนมัติ |
| FCW | Front Collision Warning | ระบบช่วยเตือนการชนด้านหน้า |
| RCW | Rear Collision Warning | ระบบช่วยเตือนการชนด้านหลัง |
| BSD | Blind Spot Detection | ระบบช่วยเตือนจุดอับสายตา |
| DOW | Door Open Warning | ระบบช่วยเตือนวัตถุเคลื่อนผ่านขณะเปิดประตู |
| LDA | Lane Departure Assist | ระบบช่วยรักษารถให้อยู่ในช่องทางเดินรถ |
| FCTA & FCTB | — | ระบบช่วยเตือนและช่วยเบรก เมื่อมีรถเคลื่อนผ่านในจุดอับสายตาด้านหน้า |
| RCTA & RCTB | — | ระบบช่วยเตือนและช่วยเบรก เมื่อมีรถผ่านจุดอับสายตาขณะถอยหลัง |
| HMA | High Beam Assist | ระบบช่วยเปิดไฟสูงอัตโนมัติ |

**3D / Scroll**
- **ฉาก 3D จริง:** ถนนเป็น `PlaneGeometry` สีเทาอ่อน มีเส้นเลนเป็น shader เลื่อนตามเวลา กล้องมองจากด้านบนเฉียง 55° และรถผู้ใช้เป็น billboard cutout มุมบน/หลัง
- scroll แล้ว highlight ทีละระบบ ด้วย sensor visualization แบบ procedural:
  - 360° → วงแหวนรอบรถ
  - ICC/AEB/FCW → กรวยแสงด้านหน้า และรถคันหน้าเข้าใกล้
  - RCW/RCTA → กรวยด้านหลัง
  - BSD/DOW → โซนสีข้างรถ
  - LDA → เส้นเลนเรืองแสง
  - HMA → ไฟหน้าสลับสูง/ต่ำ
- ด้านข้างเป็นรายการ 11 ไอคอน โดยระบบที่ active จะเน้นสี และคลิกเพื่อกระโดดไปที่ระบบนั้นได้
- disclaimer: "ระบบช่วยขับขี่ไม่สามารถทดแทนความรับผิดชอบของผู้ขับขี่ต่อยานพาหนะได้"

### [5] Specifications — `#specs`
**เนื้อหา:** ตารางเต็มจาก brochure หน้า 4 (ดู §7 `content/specs.ts`) แบ่งเป็นหมวด ดังนี้
- ขนาดและน้ำหนัก
- ระบบส่งกำลังและสมรรถนะ
- ระบบกันสะเทือนและระบบเบรก
- ล้อและยาง
- แบตเตอรี่ขับเคลื่อน
- อุปกรณ์มาตรฐานภายนอก
- อุปกรณ์มาตรฐานภายใน
- ระบบมัลติมีเดียและความสะดวกสบาย
- ระบบความปลอดภัย
- สีภายนอก
- สีภายใน

**UI**
- **การ์ดเปรียบเทียบ 3 รุ่น** ด้านบน (Premium / AWD Performance / AWD Ultimate) แสดงค่าเด่น: ระบบขับเคลื่อน, กำลัง, แรงบิด, 0–100, แบต, ระยะทาง, ล้อ, DC charge
- ตารางเต็มด้านล่างเป็น accordion ตามหมวด ค่าที่ต่างกันระหว่างรุ่นจะเน้นสี และมีสวิตช์ "แสดงเฉพาะที่ต่างกัน"
- บนมือถือเลือกรุ่นเปรียบเทียบได้ทีละ 2 รุ่น

**3D / Scroll:** blueprint รถด้านข้าง/หน้าเป็นเส้น (edge detection จาก cutout หรือ SVG trace) เส้นบอกขนาดวาดตาม scroll เช่น ความยาว 4,830 · ฐานล้อ 2,930 · สูง 1,620 · กว้าง 1,925 · ระยะล้อ 1,660/1,660 มม.

### [6] Exterior Color — `#colors`
**เนื้อหา:** 6 สี โดยมีข้อจำกัดตามรุ่น

| สี | Premium | AWD Performance | AWD Ultimate |
|---|---|---|---|
| Horizon White | ● | ● | ● |
| Quantum Black | ● | ● | ● |
| Space Grey | ● | ● | ● |
| Shark Grey | – | ● | ● |
| Solar Red | – | – | ● |
| Pulse Purple | – | – | ● |

สีภายใน: ดำ (ทุกรุ่น) · ฟ้า (AWD Ultimate)

**3D / Scroll**
- รถไดคัทกลางจอวางบนแท่นวงกลมสีขาว (เงา contact shadow) เมื่อเลือก swatch แล้ว crossfade ภาพรถสีนั้น พร้อมไล่สีพื้นหลังจางตามสีรถ (tint ≤ 8% เพื่อคงโทนขาว)
- scroll แล้วเลื่อนผ่านทั้ง 6 สีอัตโนมัติ (ถ้าผู้ใช้ไม่ได้คลิก)
- badge บอกว่าสีนี้มีในรุ่นไหน
- หมายเหตุ: "สีที่แสดงเป็นเพียงแนวทางเท่านั้น และอาจแตกต่างจากสีจริง"

### [7] Contact / Footer — `#contact`
- REVER AUTOMOTIVE CO., LTD. (HEAD OFFICE)
- 865 Siam at Siam Hotel Bldg. 9th Fl., Rama 1 Road, Wangmai, Pathumwan, Bangkok 10330
- โทร 02 766 8880 (`tel:027668880`) · อีเมล contact@reverautomotive.com (`mailto:`)
- reverautomotive.com · Facebook: BYD REVER THAILAND
- หมายเหตุทางกฎหมายครบตาม §8
- 3D: รถด้านหลัง (rear cutout) ค่อย ๆ ถอยออกไปในหมอกขาว เป็นตอนจบ "LIFE IN MOTION"

---

## 5. Visual Design

### 5.1 Color tokens
| Token | Light | ที่มา / การใช้ |
|---|---|---|
| `--bg` | `#FFFFFF` | พื้นหลังหลัก |
| `--surface` | `#F5F6FA` | การ์ด, ตาราง |
| `--paper` | `#FBFAF7` | กระดาษในหนังสือ pop-up (ขาวอุ่นเล็กน้อย) |
| `--line` | `#E4E6EE` | เส้นแบ่ง |
| `--text` | `#0E1330` | ตัวอักษรหลัก |
| `--text-muted` | `#5B6178` | คำอธิบาย |
| `--brand-navy` | `#1C3A7A` | หัวข้อ (ตาม "PERFORMANCE IN MOTION" ใน brochure) |
| `--accent` | `#8B84C6` | ม่วงลาเวนเดอร์ (Pulse Purple) ใช้กับ active state, ตัวเลข, hotspot |
| `--accent-soft` | `#ECEAF7` | พื้นหลัง highlight |
| `--glow` | `#5AA9FF` | แสง sensor ADAS / mood light |

ค่าสีด้านบนเป็นค่าเริ่มต้นที่ดูดจาก brochure และจะ sample จาก PDF จริงอีกครั้งตอนทำ design QA

ทั้งเว็บเป็น light theme ตามโจทย์ ไม่ทำ dark mode

### 5.2 Typography
- **หัวข้อ EN (wide, geometric):** `Michroma` (Google Fonts) ใช้แทนฟอนต์ BYD ที่ไม่เปิดสาธารณะ เป็นตัวพิมพ์ใหญ่ และเพิ่ม letter-spacing 0.04em
- **เนื้อหาไทย/EN:** `IBM Plex Sans Thai` 400/500/600
- **ตัวเลข spec:** `Michroma` + หน่วยเป็น `IBM Plex Sans Thai` ตัวเล็ก
- Scale: 64 / 44 / 28 / 20 / 16 / 13 px (บนมือถือลดลงประมาณ 0.7×)

### 5.3 Layout & Motion
- container สูงสุด 1280px, gutter 24px (บนมือถือ 16px)
- easing หลัก `power3.out` / scrub ใช้ `scrub: 0.6`
- เงานุ่ม ๆ แบบกระดาษ: `0 20px 40px -20px rgba(14,19,48,.18)`
- ภาษาภาพ "กระดาษ" ต่อเนื่องทั้งเว็บ: การ์ดมีขอบบาง มี paper grain texture จาง ๆ (opacity 3%)

---

## 6. Technical Architecture

### 6.1 Stack
| ส่วน | เลือก | เหตุผล |
|---|---|---|
| Build | **Vite** + TypeScript | เบา, HMR เร็ว |
| 3D | **three.js** (vanilla, ไม่ใช้ R3F) | ตามโจทย์ ควบคุม render loop เองได้ |
| Scroll | **GSAP ScrollTrigger** + **Lenis** (smooth scroll) | pin / scrub / snap |
| UI | HTML + CSS (CSS variables) ไม่ใช้ framework | หน้าเดียว ไม่ซับซ้อน |
| Texture | KTX2 (Basis) + WebP fallback | ลด GPU memory |
| Deploy | static build (`dist/`) วางบน host ไหนก็ได้ ยังต้องตัดสินใจ (§10) | |

### 6.2 โครงไฟล์
```
/
├─ index.html
├─ src/
│  ├─ main.ts                 # bootstrap, Lenis, ScrollTrigger
│  ├─ gl/
│  │  ├─ Renderer.ts          # renderer, resize, DPR cap, render loop
│  │  ├─ SceneManager.ts      # สลับ/ผสม scene state ตาม section
│  │  ├─ book/
│  │  │  ├─ Book.ts           # ปก, สัน, stack หน้า
│  │  │  ├─ Page.ts           # page curl shader
│  │  │  ├─ PopUpPiece.ts     # ชิ้น pop-up ผูก hinge
│  │  │  └─ spreads.ts        # config ชิ้นของแต่ละ spread
│  │  ├─ scenes/
│  │  │  ├─ Performance.ts
│  │  │  ├─ Exterior.ts
│  │  │  ├─ Interior.ts
│  │  │  ├─ Adas.ts
│  │  │  ├─ Specs.ts
│  │  │  └─ Colors.ts
│  │  ├─ materials/
│  │  │  ├─ CutoutMaterial.ts # alpha cutout + paper edge + soft shadow
│  │  │  └─ PageCurl.glsl
│  │  └─ util/ (loaders, damp, contactShadow)
│  ├─ content/
│  │  ├─ copy.ts              # ข้อความทุก section (TH)
│  │  ├─ specs.ts             # ตาราง spec ทั้งหมด (structured)
│  │  └─ colors.ts
│  ├─ ui/ (nav, hotspots, specTable, colorPicker)
│  └─ styles/ (tokens.css, base.css, sections.css)
├─ public/assets/ (ภาพที่ process แล้ว)
├─ scripts/extract-pdf-assets.sh
└─ docs/SPEC.md
```

### 6.3 แนวทาง render
- **Canvas เดียว** (fixed) ทั้งเว็บ: หนังสือกับ section scenes อยู่ใน `Scene` เดียวกันแต่แยก `Group` โดยเปิด/ปิด `visible` ตาม section ที่อยู่ในจอ (± 1 section) เพื่อไม่ให้วาดเกินจำเป็น
- **CutoutMaterial:** `MeshBasicMaterial`-based โดยรับภาพ RGB + alpha mask (รวมเป็น RGBA ตอน build) มี option ขอบกระดาษขาวหนา 2–4px (dilate mask) ให้ดูเหมือนกระดาษที่ถูกตัด และมี drop shadow เป็น plane ด้านหลัง
- **Lighting:** หนังสือใช้ `MeshStandardMaterial` + environment แสงขาวนุ่ม (RoomEnvironment) และ `ContactShadows` แบบ baked ส่วน cutout ไม่รับแสง (unlit) เพื่อคงสีจาก brochure
- **DPR:** `min(devicePixelRatio, 2)` และลดเหลือ 1.5 เมื่อ FPS < 45 ต่อเนื่อง 2 วินาที
- ใช้ `renderer.setAnimationLoop` แต่ render เฉพาะเมื่อมี scroll/animation active (on-demand) เพื่อประหยัดแบต

### 6.4 Performance budget
| Metric | เป้าหมาย |
|---|---|
| JS (gzip) | ≤ 250 KB |
| Initial payload (ก่อนหนังสือเปิด) | ≤ 2.5 MB |
| Total assets | ≤ 12 MB (lazy load ราย section) |
| LCP (4G, mid-range Android) | ≤ 2.5 s |
| FPS | 60 desktop / ≥ 45 mobile |
| Draw calls ต่อเฟรม | ≤ 80 |

Preloader: ตัว wordmark "BYD SEALION 7" ที่ stroke วาดตาม % การโหลด เฉพาะ asset ของปก+spread 1 ส่วนที่เหลือโหลดใน background

### 6.5 Mobile / Fallback / A11y
- **Mobile (<768px):** หนังสือแสดงหน้าเดียวแทน spread (ซ้าย-ขวาสลับเป็นหน้าเดียว), ปิด mouse parallax, ลดจำนวนชั้น pop-up, ADAS scene ลด segment
- **`prefers-reduced-motion`:** ไม่ pin, ไม่ scrub โดยหนังสือแสดงเป็นภาพนิ่งเปิดหน้า 1 + สารบัญ ส่วน section ต่าง ๆ แสดงรูปนิ่ง + ข้อความ
- **ไม่มี WebGL:** fallback เป็นภาพนิ่ง (render ของแต่ละ spread ล่วงหน้าเป็น WebP) ทำงานด้วย CSS scroll-snap
- ข้อความทั้งหมดเป็น DOM จริง, มี heading hierarchy ถูกต้อง, canvas `aria-hidden="true"`, hotspot เป็น `<button>` ที่ focus ได้, contrast ≥ 4.5:1
- SEO: `<title>`, meta description, Open Graph image (`hero`), `lang="th"`, JSON-LD `Product` (เฉพาะข้อมูลที่มีใน brochure ไม่มีราคา)

---

## 7. Assets & Content Pipeline

### 7.1 การดึงภาพจาก PDF
`scripts/extract-pdf-assets.sh`:
1. `pdfimages -j -p` ดึงภาพทั้งหมด (ได้ RGB `.jpg` + soft mask `.ppm`)
2. รวม RGB + mask เป็น RGBA (ImageMagick `-compose CopyOpacity`) และ resize mask ให้เท่ากับ RGB
3. trim, export เป็น WebP (q85) + KTX2 แล้วตั้งชื่อตามตารางด้านล่าง
4. ภาพ detail ที่ไม่ได้ฝังแยกใน PDF (ไฟหน้า, ไฟท้าย, ล้อ, HUD ฯลฯ) ให้ render หน้า PDF ที่ 300 dpi (`pdftoppm -r 300`) แล้ว crop

### 7.2 รายการ asset (จากการสำรวจ PDF)
| ชื่อไฟล์ใน project | ที่มา (page-index) | ขนาดต้นฉบับ | ใช้ที่ |
|---|---|---|---|
| `hero.webp` | p1 `i-001-000` | 3452×2212 | ปกหนังสือ, OG image |
| `bg-sky-mist.webp` | p1 `i-001-002` | 2440×3264 | พื้นหลังหมอกฟ้า |
| `car-side.webp` (RGBA) | p2 `i-002-019` + mask `020` | 2283×1237 | Performance, Exterior |
| `car-front.webp` (RGBA) | p2 `i-002-021` + mask `022` | 1637×2190 | Exterior, spread 2 |
| `tailgate.webp` | p2 `i-002-026` (+mask `027`) | 1448×785 | Exterior #5 |
| `speed-lines.webp` | p3 `i-003-043` | 1376×1841 | Performance parallax |
| `adas-road.webp` | p3 `i-003-048` | 1242×468 | ADAS reference / fallback |
| `interior-wide.webp` | p3 (ภาพใหญ่หน้า 3) | ตรวจสอบตอน extract | Interior |
| `interior-*.webp` | p3 `i-003-050/051/054/058` ฯลฯ | 400–1300 px | Interior detail cards |
| `car-color-{6 สี}.webp` (RGBA) | p4 `i-004-072…083` (คู่ RGB+mask) | **~474×258** ⚠ | Colors, spread 6 |
| `ortho-front/side/rear.webp` | p4 `i-004-084…089` | 354–825 px | Specs blueprint |
| `swirl.webp` | p2 (ภาพ swirl ม่วง) | — | Decorative |

> ⚠ **ภาพรถ 6 สีใน PDF มีความละเอียดต่ำ (~474px)** พอใช้กับ pop-up ขนาดเล็กในหนังสือ แต่ไม่พอสำหรับ section Colors แบบเต็มจอ (ดู §10)

### 7.3 Content data
ข้อความและตาราง spec ทั้งหมดอยู่ใน `src/content/*.ts` (ไม่ hard-code ใน component) ตัวอย่าง schema:

```ts
type Variant = 'premium' | 'awdPerformance' | 'awdUltimate';
type SpecValue = string | boolean | null;          // true = ●, null = –
interface SpecRow { label: string; values: Record<Variant, SpecValue>; }
interface SpecGroup { id: string; title: string; rows: SpecRow[]; }
```

ค่าหลักที่ถอดจาก brochure (ใช้ตรวจตอน QA):

| รายการ | Premium | AWD Performance | AWD Ultimate |
|---|---|---|---|
| ระบบขับเคลื่อน | ล้อหลัง | สี่ล้อ | สี่ล้อ |
| มอเตอร์หน้า | – | อะซิงโครนัส 160 kW / 310 N·m | เหมือน Performance |
| มอเตอร์หลัง | PMS 230 kW / 380 N·m | PMS 230 kW / 380 N·m | PMS 230 kW / 380 N·m |
| กำลังรวม / แรงบิดรวม | 230 kW / 380 N·m | 390 kW / 690 N·m | 390 kW / 690 N·m |
| 0–100 km/h | 6.7 s | 4.5 s | 4.5 s |
| แบตเตอรี่ (BYD Blade) | 82.5 kWh | 82.5 kWh | 91.3 kWh |
| ระยะทาง NEDC | 567 km | 542 km | 600 km |
| DC CCS2 สูงสุด | 150 kW | 150 kW | 230 kW |
| AC Type 2 | 11 kW | 11 kW | 11 kW |
| ล้อ / ยาง | 19" · หน้า 235/50 R19, หลัง 255/45 R19 | 20" · 245/45 R20 | 20" · 245/45 R20 |
| คาลิปเปอร์สีแดง | – | ● | ● |
| ความสูงใต้ท้องรถ | 163 มม. | 157 มม. | 160 มม. |
| ที่เก็บของท้าย | 500 ล. | 520 ล. | 520 ล. |
| น้ำหนักรถเปล่า / รวมบรรทุก | 2,225 / 2,635 กก. | 2,340 / 2,750 กก. | 2,435 / 2,845 กก. |
| ITAC | – | ● | ● |
| ขนาด (ทุกรุ่น) | ยาว 4,830 · กว้าง 1,925 · สูง 1,620 · ฐานล้อ 2,930 · ระยะล้อ 1,660/1,660 มม. · วงเลี้ยว 5.85 ม. · ที่เก็บของหน้า 58 ล. | | |

> การแบ่งคอลัมน์บางแถวในตาราง PDF (เช่น แบตเตอรี่ 82.5 ที่ merge 2 คอลัมน์, ที่เก็บของ 500/520, ล้อ 19/20) เป็นการตีความจากการจัดวางตาราง **ต้องยืนยันอีกครั้งก่อน launch** (§10)

---

## 8. ข้อความทางกฎหมาย (ต้องแสดง)
ถอดจาก brochure และแสดงใน footer และตำแหน่งที่เกี่ยวข้อง
- ระยะทางวิ่งด้วยไฟฟ้าสูงสุด อาจปรับเปลี่ยนได้ตามปัจจัยต่าง ๆ เช่น พฤติกรรมการขับขี่ของแต่ละบุคคล น้ำหนักบรรทุก สภาพการจราจร และอื่น ๆ ระยะทางที่ระบุไว้เป็นเพียงตัวเลขประมาณการณ์สำหรับอ้างอิงเท่านั้น
- เครื่องหมายการค้า Bluetooth® / Apple CarPlay® / Android Auto™ / Google Pixel™ ตามข้อความใน brochure
- สีที่แสดงเป็นเพียงแนวทางเท่านั้น และอาจแตกต่างจากสีจริง
- ระบบช่วยขับขี่ไม่สามารถทดแทนความรับผิดชอบของผู้ขับขี่ต่อยานพาหนะได้
- BYD ขอสงวนสิทธิ์ในการเปลี่ยนแปลงข้อมูลคุณสมบัติของรถยนต์และอุปกรณ์มาตรฐานจากรายละเอียดในเอกสารนี้

---

## 9. Milestones

| # | งาน | ผลลัพธ์ |
|---|---|---|
| M0 | Setup Vite + three.js + GSAP/Lenis, asset extraction script, content data | repo รันได้, assets พร้อม |
| M1 | **Pop-up book prototype**: ปก + 2 spreads, page curl, hinge pop-up, scroll/snap | ใช้ตัดสินใจเรื่อง feel ก่อนทำต่อ |
| M2 | Book ครบ 6 spreads + tabs + transition เข้า section | Hero เสร็จ |
| M3 | Section 1–3 (Performance, Exterior, Interior) | |
| M4 | Section 4–7 (ADAS scene, Specs table, Colors, Contact) | |
| M5 | Mobile, reduced-motion, no-WebGL fallback, performance tuning | |
| M6 | QA เนื้อหาเทียบ brochure, cross-browser (Chrome/Safari iOS/Android), deploy | |

---

## 10. คำถามค้าง / ความเสี่ยง

1. **ภาพรถ 6 สีความละเอียดต่ำ** (~474px) → ขอไฟล์ต้นฉบับจาก BYD/Rever ถ้าไม่ได้ จะทำ section Colors ให้รถมีขนาดกลาง (ไม่เต็มจอ) และวางบนแท่น
2. **การจับคู่ชื่อสีกับรูป:** ใน PDF ภาพ 6 สีเรียงเป็น ขาว, ฟ้าอมเทา, ดำ, ม่วง, แดง, เทา แต่ legend เรียง Horizon White, Quantum Black, Space Grey / Shark Grey, Pulse Purple, Solar Red → ต้องยืนยันว่าภาพสีฟ้าอมเทากับเทาคือ Space Grey หรือ Shark Grey
3. **ตาราง spec บางแถว** ที่ merge คอลัมน์ (ดู §7.3) ต้องยืนยัน
4. **ราคา/รุ่นย่อย:** brochure ไม่มีราคา จึงไม่แสดงราคาในเว็บ
5. **สิทธิ์ใช้ภาพ/โลโก้ BYD และ Rever:** ต้องยืนยันว่าเว็บนี้ทำในนาม Rever หรือได้รับอนุญาตให้ใช้ brand asset
6. **Hosting/domain** ยังไม่ได้ตัดสินใจ (spec รองรับ static host ทุกแบบ)
7. **ภาพ detail exterior** (ไฟหน้า, ไฟท้าย, ล้อ) ต้อง crop จากหน้า PDF ที่ render 300 dpi ซึ่งอาจคมไม่พอ ถ้ามีภาพต้นฉบับจะดีกว่า
