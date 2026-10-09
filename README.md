# BYD SEALION 7 — 3D scroll website

เว็บหน้าเดียวแบบ 3D scroll ที่เปิดด้วยหนังสือ pop-up (three.js) ดู spec เต็มได้ที่ [`docs/SPEC.md`](docs/SPEC.md)

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build → dist/
npm run assets     # ดึงรูปจาก source/BYD_SEALION_7.pdf ใหม่ (ต้องมี poppler-utils + ImageMagick)
```

| Path | หน้าที่ |
|---|---|
| `src/gl/book/Leaf.ts` | กระดาษหนึ่งแผ่น: พลิกหน้าแบบโค้ง และพาชิ้น pop-up ไปตามหน้ากระดาษ |
| `src/gl/book/PopUpPiece.ts` | ชิ้นกระดาษที่ตั้งขึ้นตามรอยพับ |
| `src/gl/book/spreads.ts` | เนื้อหาแต่ละหน้า (วาดด้วย canvas) และการวางชิ้น pop-up |
| `src/gl/book/Book.ts` | ฉาก, แสง/เงา, กล้อง และ timeline ตาม scroll |
| `src/main.ts` | Lenis + ScrollTrigger, snap, tabs, คลิก pop-up |
