# Favicon, Apple ikon és Open Graph kép generálása (egyszer kell futtatni, az eredmény a repóban van).
# python3 scripts/make-icons.py
from PIL import Image, ImageDraw, ImageFont
import os, json
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
site = json.load(open(os.path.join(root, "data", "site.json"), encoding="utf-8"))
INK = (15, 34, 56); FROST = (92, 200, 224); WHITE = (255, 255, 255); MUTED = (196, 211, 226)

def mark(size, radius_ratio=0.25):
    s = size * 4
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * radius_ratio), fill=INK)
    w = int(s * 0.081)
    for y, x2 in ((11, 24), (16, 19), (21, 14)):
        yy = int(s * y / 32); x1 = int(s * 8 / 32); xe = int(s * x2 / 32)
        d.line([(x1, yy), (xe, yy)], fill=FROST, width=w)
        for cx in (x1, xe):
            d.ellipse([cx - w // 2, yy - w // 2, cx + w // 2, yy + w // 2], fill=FROST)
    return im.resize((size, size), Image.LANCZOS)

mark(32).save(os.path.join(root, "public", "favicon-32.png"))
apple = Image.new("RGB", (180, 180), INK)
m = mark(180, 0.0); apple.paste(m, (0, 0), m)
apple.save(os.path.join(root, "public", "apple-touch-icon.png"))
for n in (192, 512):
    mark(n, 0.0).save(os.path.join(root, "public", f"icon-{n}.png"))

# Open Graph kép 1200x630
og = Image.new("RGB", (1200, 630), INK)
d = ImageDraw.Draw(og)
bold = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
reg = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
m = mark(96); og.paste(m, (80, 80), m)
d.text((196, 98), site["name"], font=ImageFont.truetype(bold, 46), fill=WHITE)
d.text((80, 250), "Klímaszerelés és", font=ImageFont.truetype(bold, 76), fill=WHITE)
d.text((80, 340), "klímatelepítés", font=ImageFont.truetype(bold, 76), fill=WHITE)
d.text((80, 470), "Gree és Syen klímák beszereléssel,", font=ImageFont.truetype(reg, 34), fill=MUTED)
d.text((80, 516), "vagy csak a telepítés a saját készülékedhez.", font=ImageFont.truetype(reg, 34), fill=MUTED)
d.rectangle([0, 618, 1200, 630], fill=FROST)
os.makedirs(os.path.join(root, "src", "assets"), exist_ok=True)
og.save(os.path.join(root, "src", "assets", "og-image.png"), optimize=True)
print("ikonok és OG kép kész")
