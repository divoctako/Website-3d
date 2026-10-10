"""
Turns the images in pic/ (see pic/PROMPTS.md) into public/assets/*.webp:
removes the glow halo and stray specks from the cut-outs, crops them, and
writes previews on grey and white for checking the edges.

    pip install pillow numpy scipy
    python scripts/process-pic.py pic public/assets <preview-dir>
"""
import sys, os
from PIL import Image
import numpy as np
from scipy import ndimage

src, out, prev = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(prev, exist_ok=True)

def clean(a, lo, hi, erode):
    a = a.astype(np.float32)
    t = np.clip((a - lo) / (hi - lo), 0, 1)
    t = t * t * (3 - 2 * t)
    # keep only the biggest solid blob (drops floating specks / halo islands)
    lab, n = ndimage.label(t > 0.5)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(t), lab, range(1, n + 1))
        keep = 1 + int(np.argmax(sizes))
        mask = ndimage.binary_dilation(lab == keep, iterations=3)
        t = t * mask
    if erode:
        t = np.minimum(t, ndimage.grey_erosion(t, size=(3, 3)) * 0.6 + t * 0.4)
    return (t * 255).astype(np.uint8)

def crop(im, margin):
    a = np.array(im)[:, :, 3]
    ys, xs = np.where(a > 8)
    x0, y0 = max(xs.min() - margin, 0), max(ys.min() - margin, 0)
    x1, y1 = min(xs.max() + margin, im.width), min(ys.max() + margin, im.height)
    return im.crop((x0, y0, x1, y1))

def save(im, name, width=None, q=88):
    if width and im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(os.path.join(out, name + '.webp'), quality=q, alpha_quality=95, method=6)
    if im.mode == 'RGBA':
        for bg, tag in (((128, 132, 140), 'grey'), ((255, 255, 255), 'white')):
            b = Image.new('RGBA', im.size, bg + (255,))
            b.alpha_composite(im)
            b.convert('RGB').save(os.path.join(prev, f'{name}-{tag}.jpg'), quality=85)
    print(name, im.size)

def paint_out(px, x0, y0, x1, y1):
    """Fills a box with paint interpolated from the columns either side of it."""
    left = px[y0:y1, x0 - 1, :3].astype(np.float32)
    right = px[y0:y1, x1, :3].astype(np.float32)
    t = np.linspace(0, 1, x1 - x0)[None, :, None]
    fill = left[:, None, :] * (1 - t) + right[:, None, :] * t
    fill += np.random.default_rng(0).normal(0, 1.2, fill.shape)  # match the paint grain
    px[y0:y1, x0:x1, :3] = np.clip(fill, 0, 255).astype(np.uint8)

# text the generator added that the brochure does not print: (x0, y0, x1, y1) in the source png
RETOUCH = {
    'car-rear': [(1100, 492, 1158, 512)],  # "4.5S" under the SEALION 7 badge
}

def cutout(name, outname, lo, hi, erode, width, margin=12):
    im = Image.open(os.path.join(src, name + '.png')).convert('RGBA')
    px = np.array(im)
    for box in RETOUCH.get(name, []):
        paint_out(px, *box)
    px[:, :, 3] = clean(px[:, :, 3], lo, hi, erode)
    im = crop(Image.fromarray(px), margin)
    save(im, outname, width)

# colour cars: keep their soft contact shadow, and crop all six with one shared box
# so the crossfade between colours does not jump
ids = ['horizon-white', 'quantum-black', 'space-grey', 'shark-grey', 'solar-red', 'pulse-purple']
ims = [Image.open(os.path.join(src, f'car-color-{c}.png')).convert('RGBA') for c in ids]
boxes = np.array([np.r_[np.where(np.array(im)[:, :, 3] > 8)[1].min(), np.where(np.array(im)[:, :, 3] > 8)[0].min(),
                        np.where(np.array(im)[:, :, 3] > 8)[1].max(), np.where(np.array(im)[:, :, 3] > 8)[0].max()] for im in ims])
m = 12
box = (max(boxes[:, 0].min() - m, 0), max(boxes[:, 1].min() - m, 0),
       min(boxes[:, 2].max() + m, ims[0].width), min(boxes[:, 3].max() + m, ims[0].height))
for c, im in zip(ids, ims):
    save(im.crop(box), f'car-color-{c}-hd', 1600)
# views with a glow halo: hard-ish matte, 1px erode
cutout('car-rear', 'car-rear', 110, 200, True, 1400)
cutout('car-rear-34-top', 'car-rear-34-top', 110, 200, True, 1400)
cutout('lead-car-rear', 'lead-car-rear', 60, 160, True, 1200)
save(Image.open(os.path.join(src, 'contact-mist.png')).convert('RGB'), 'contact-mist', 2400, 82)
