# รูปที่ต้องใช้สำหรับ M4 (+ เติม M3)

วางไฟล์ที่ได้ไว้ในโฟลเดอร์นี้ (`pic/`) โดยใช้ชื่อไฟล์ตามตาราง แล้วผมจะแปลงเป็น `.webp` ลง `public/assets/` เอง

**กติการ่วมของทุกรูปรถ BYD**
- แนบรูปอ้างอิงจาก `public/assets/` ตามที่ระบุไปกับ prompt ด้วย (image-to-image / reference) ถ้าไม่แนบ รถที่ได้จะไม่ใช่ SEALION 7
- PNG พื้นหลังโปร่งใส ถ้าทำไม่ได้ให้ใช้พื้นขาวล้วน `#FFFFFF` (ผมไดคัทเอง) ขนาดกว้างอย่างน้อย 2400 px
- ไม่มีตัวหนังสือ ลายน้ำ หรือโลโก้อื่นเพิ่มเข้ามา
- ก่อนส่งต้องเช็กเทียบ brochure ว่าไฟหน้า ไฟท้ายแนวยาว ล้อ 20 นิ้ว และคาลิปเปอร์แดงตรงกับรถจริง ถ้าเพี้ยนอย่าใช้

---

## 1. `car-rear.png` — ด้านหลังตรง ⭐ จำเป็นที่สุด
ใช้กับ Exterior (มุม "หลัง") และ Contact (รถถอยหายเข้าไปในหมอก) · อ้างอิง: `detail-taillight.webp`, `detail-tailgate.webp`, `adas-road.webp`

```
Studio product photo of the BYD SEALION 7 electric SUV seen exactly from the rear,
straight-on orthographic-like view at bumper height, centred and symmetrical.
Pulse Purple (soft lavender metallic) paint, full-width slim light-bar taillight,
coupe-style sloping rear window with roof spoiler, black lower diffuser.
Match the reference images exactly for the taillight shape and tailgate.
Soft even white studio lighting, subtle ground contact shadow only,
isolated on a transparent background, no text, no watermark, 2400px wide, photorealistic.
```

## 2. `car-rear-34-top.png` — มุมหลังเฉียงจากด้านบน (ประมาณ 55°)
ใช้เป็นรถผู้ใช้ในฉาก ADAS · อ้างอิง: `adas-road.webp` (คันหน้าสุดในรูป)

```
The BYD SEALION 7 electric SUV in Pulse Purple, seen from behind and above at about
55 degrees, rear three-quarter view from the left, same angle as the closest car in the
reference image. Wheels straight, no motion blur, no road, no lane markings, no light cones.
Soft overcast lighting, gentle shadow directly beneath the car,
isolated on a transparent background, no text, no watermark, 2400px wide, photorealistic.
```

## 3. `car-top.png` — มองจากบนลงล่างตรง ๆ
ใช้กับ ADAS (วงแหวน 360°, โซน BSD/DOW ข้างรถ) · อ้างอิง: `adas-road.webp`, `car-side.webp`

```
Top-down orthographic view of the BYD SEALION 7 electric SUV in Pulse Purple,
nose pointing up, perfectly centred, black panoramic glass roof, side mirrors visible.
Even soft lighting, very light shadow, isolated on a transparent background,
no text, no watermark, 2400px tall, photorealistic.
```

## 4. `lead-car-rear.png` — รถคันหน้า (ไม่ใช่ BYD)
ใช้ใน ICC / AEB / FCW ตอนรถคันหน้าเข้าใกล้ · ไม่ต้องแนบรูปอ้างอิง

```
Generic unbranded modern compact SUV in neutral light grey, seen from behind and above at
about 55 degrees, rear three-quarter view. No logos, no badges, no readable licence plate.
Soft overcast lighting, gentle shadow beneath, isolated on a transparent background,
no text, no watermark, 1600px wide, photorealistic.
```

## 5. `car-color-*.png` — รถ 6 สี มุมเดียวกัน ⭐ จำเป็น
ใช้กับ Colors (รูปเดิมจาก PDF กว้างแค่ประมาณ 170 px) · อ้างอิง: `car-color-horizon-white.webp` (มุมกล้อง) และ `car-front.webp`, `car-side.webp` (รายละเอียด)

**ทำทีละขั้น:** สร้างคันสีขาวคันเดียวก่อน แล้วสั่ง *แก้สี* จากรูปนั้นอีก 5 ครั้ง เพื่อให้มุม เงา และรูปทรงตรงกันทุกสี (ถ้า generate แยก 6 ครั้ง รถจะไม่เหมือนกัน)

ขั้นที่ 1 → `car-color-horizon-white.png`
```
Studio product photo of the BYD SEALION 7 electric SUV, front three-quarter view from the
front-left, camera at headlight height, exactly the same angle as the reference image.
Horizon White solid paint, 20-inch alloy wheels with red brake callipers,
Double-U floating headlights, Ocean-X front face. Soft white studio light,
subtle contact shadow, isolated on a transparent background,
no text, no watermark, 2400px wide, photorealistic.
```

ขั้นที่ 2 (แก้สีจากรูปขั้นที่ 1 ห้ามเปลี่ยนอย่างอื่น)
```
Keep everything identical (car shape, angle, wheels, lights, shadow, background);
change only the body paint to <COLOUR>.
```

| ไฟล์ | `<COLOUR>` |
|---|---|
| `car-color-quantum-black.png` | Quantum Black, deep glossy black metallic (#1f2024) |
| `car-color-space-grey.png` | Space Grey, blue-grey metallic (#5b7ea8) |
| `car-color-shark-grey.png` | Shark Grey, mid grey matte-metallic (#8d969c) |
| `car-color-solar-red.png` | Solar Red, bright glossy red metallic (#c8322f) |
| `car-color-pulse-purple.png` | Pulse Purple, soft lavender metallic (#a39bc9) |

ค่า hex เป็นค่าประมาณจาก brochure เทียบกับรูปสีใน `car-color-*.webp` เดิมอีกครั้งก่อนใช้

## 6. `contact-mist.png` — หมอกขาว (ไม่มีรถ)
ฉากหลังของ Contact · ไม่ต้องแนบรูปอ้างอิง

```
Wide empty landscape fading into soft white fog, pale lavender-grey haze, flat salt-flat
ground disappearing into mist at the horizon, very low contrast, calm and minimal,
no objects, no people, no text, 3200x1800, photorealistic.
```

---

## ไม่ต้องหารูปเพิ่ม
- **Specs** · blueprint เส้นวาดจาก `car-side` / `car-front` ที่มีอยู่
- **ADAS ถนน / เส้นเลน** · ทำด้วย shader
- **ถ้าเหลือแรง:** `car-side.png` และ `car-front.png` ความละเอียดสูง (มุมเดียวกับรูปเดิม) จะช่วยให้ Performance และ Exterior คมขึ้นบนมือถือ
