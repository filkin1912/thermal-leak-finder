from PIL import Image
import glob
import os

assets = r"C:\Users\BEAVER\.cursor\projects\c-Users-BEAVER-OneDrive-Desktop-CV-work-thermal-leak-finder\assets"
out_dir = r"c:\Users\BEAVER\OneDrive\Desktop\CV_work\thermal-leak-finder\images"
logo_path = os.path.join(out_dir, "hidroinspect-logo.png")

img_paths = []
for pattern in ("*ceiling_thermal*", "*maxresdefault*"):
    matches = glob.glob(os.path.join(assets, pattern))
    if not matches:
        raise SystemExit(f"missing {pattern}")
    img_paths.append(matches[0])

logo = Image.open(logo_path).convert("RGBA")
pixels = logo.getdata()
new_pixels = []
for r, g, b, a in pixels:
    if r > 245 and g > 245 and b > 245:
        new_pixels.append((r, g, b, 0))
    else:
        new_pixels.append((r, g, b, a))
logo.putdata(new_pixels)

bbox = logo.getbbox()
if bbox:
    logo = logo.crop(bbox)

outputs = [
    (img_paths[0], os.path.join(out_dir, "gbp-thermal-ceiling-logo.png")),
    (img_paths[1], os.path.join(out_dir, "gbp-thermal-camera-logo.png")),
]

for src, dest in outputs:
    base = Image.open(src).convert("RGBA")
    w, h = base.size
    target_w = max(120, int(w * 0.18))
    ratio = target_w / logo.width
    target_h = int(logo.height * ratio)
    logo_resized = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
    pad = max(16, int(w * 0.035))
    base.alpha_composite(logo_resized, (pad, pad))
    base.convert("RGB").save(dest, "PNG", optimize=True)
    print(f"saved {dest} ({w}x{h}, logo {target_w}x{target_h}, pad {pad})")
