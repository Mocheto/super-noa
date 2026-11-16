"""Sprites provisionales de Noa-abeja y del tarro de miel para el boceto de la abeja ninja.

Compone poses existentes de Noa (public/assets/sprites/noa-sprite-sheet.png) con un disfraz de abeja
(peto a rayas, antenas y alas) y la varita-aguijón sujeta en la mano de cada pose. Los añadidos se
dibujan a un cuarto de resolución y se escalan sin suavizado para que conserven el aspecto pixelado.

Uso: python3 prototypes/tools/abeja-ninja-sprites.py   (requiere Pillow)
"""
import colorsys
import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
SHEET = ROOT / "public/assets/sprites/noa-sprite-sheet.png"
OUT = ROOT / "prototypes/assets"

INK = (47, 29, 51, 255)
YELLOW = (246, 196, 52)
BROWN = (66, 40, 24)
STICK = (122, 74, 40, 255)
GOLD = (255, 214, 92, 255)
GLOW = (255, 247, 196, 255)
WING = (226, 244, 255, 215)

FRAME_W, FRAME_H = 480, 460
PAD_X, PAD_Y = 62, 100
PX = 4  # tamaño de un píxel de arte en los añadidos

# Pose de origen y anclajes en coordenadas de su celda (mirando a la derecha).
POSES = {
    "espera": dict(cell=(0, 0), hand=(212, 248), angle=-55, head=(168, 30), wing=(112, 196), overalls=(100, 172, 226, 276)),
    "alza": dict(cell=(0, 2), hand=(228, 122), angle=-105, head=(150, 30), wing=(70, 200), overalls=(55, 172, 196, 282)),
    "corta": dict(cell=(1, 2), hand=(222, 192), angle=8, head=(168, 34), wing=(96, 182), overalls=(70, 166, 216, 256), swoosh=True),
    "celebra": dict(cell=(2, 0), hand=(254, 74), angle=-52, head=(150, 14), wing=(136, 150), overalls=(128, 134, 228, 218), sparkle=True, keep=(0, 296)),
}


def is_purple(r, g, b, a):
    if a < 40:
        return False
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    return 0.68 <= h <= 0.86 and s >= 0.22 and v >= 0.25


def recolor(cell, box):
    px = cell.load()
    w, h = cell.size
    x0, y0, x1, y1 = box
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if not is_purple(r, g, b, a):
                continue
            v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)[2]
            shade = min(1.15, max(0.45, v / 0.82))
            inside = x0 <= x <= x1 and y0 <= y <= y1
            base = BROWN if inside and ((y - y0) // 22) % 2 == 1 else YELLOW
            if not inside:
                base = (232, 160, 40)  # zapatillas color miel, sin rayas
            px[x, y] = tuple(min(255, int(c * shade)) for c in base) + (a,)
    return cell


def low(size):
    return Image.new("RGBA", (size[0] // PX, size[1] // PX), (0, 0, 0, 0))


def up(img):
    return img.resize((img.width * PX, img.height * PX), Image.NEAREST)


def p(x, y):
    return (round(x / PX), round(y / PX))


def draw_wings(anchor):
    layer = low((FRAME_W, FRAME_H))
    d = ImageDraw.Draw(layer)
    ax, ay = anchor[0] + PAD_X, anchor[1] + PAD_Y
    big = [p(ax - 78, ay - 58), p(ax + 6, ay + 4)]
    small = [p(ax - 56, ay - 4), p(ax + 4, ay + 38)]
    for box in (big, small):
        d.ellipse(box, fill=WING, outline=INK, width=1)
    d.line([p(ax - 60, ay - 34), p(ax - 6, ay - 6)], fill=(160, 200, 230, 255), width=1)
    return up(layer)


def draw_antennae(head):
    layer = low((FRAME_W, FRAME_H))
    d = ImageDraw.Draw(layer)
    hx, hy = head[0] + PAD_X, head[1] + PAD_Y
    for side in (-1, 1):
        base = (hx + side * 22, hy + 14)
        tip = (hx + side * 46, hy - 34)
        mid = (hx + side * 30, hy - 14)
        d.line([p(*base), p(*mid), p(*tip)], fill=INK, width=2)
        tx, ty = p(*tip)
        d.ellipse([tx - 3, ty - 3, tx + 3, ty + 3], fill=GOLD, outline=INK)
        d.point((tx - 1, ty - 1), fill=GLOW)
    return up(layer)


def draw_wand(hand, angle, swoosh=False, sparkle=False):
    layer = low((FRAME_W, FRAME_H))
    d = ImageDraw.Draw(layer)
    hx, hy = hand[0] + PAD_X, hand[1] + PAD_Y
    rad = math.radians(angle)
    ux, uy = math.cos(rad), math.sin(rad)
    grip = (hx - ux * 18, hy - uy * 18)  # el mango asoma por detrás del puño
    tip = (hx + ux * 96, hy + uy * 96)
    d.line([p(*grip), p(*tip)], fill=INK, width=4)
    d.line([p(*grip), p(*tip)], fill=STICK, width=2)
    # aguijón: cono dorado con punta redonda (inofensivo) y anillo
    nx, ny = -uy, ux
    cone_base = (tip[0] - ux * 4, tip[1] - uy * 4)
    point = (tip[0] + ux * 58, tip[1] + uy * 58)
    cone = [p(cone_base[0] + nx * 22, cone_base[1] + ny * 22), p(*point), p(cone_base[0] - nx * 22, cone_base[1] - ny * 22)]
    d.polygon(cone, fill=GOLD, outline=INK)
    for k in (14, 32):
        a = (cone_base[0] + ux * k + nx * (22 - k * 0.38), cone_base[1] + uy * k + ny * (22 - k * 0.38))
        b = (cone_base[0] + ux * k - nx * (22 - k * 0.38), cone_base[1] + uy * k - ny * (22 - k * 0.38))
        d.line([p(*a), p(*b)], fill=BROWN + (255,), width=1)
    px_, py_ = p(*point)
    d.ellipse([px_ - 2, py_ - 2, px_ + 2, py_ + 2], fill=GLOW, outline=INK)
    if swoosh:
        cx, cy = hx - 10, hy + 10
        for r, col in ((150, (255, 255, 255, 230)), (138, (255, 226, 120, 220))):
            box = [p(cx - r, cy - r), p(cx + r, cy + r)]
            d.arc(box, start=angle - 70, end=angle + 6, fill=col, width=2)
    if sparkle:
        for sx, sy in ((point[0] + 18, point[1] - 10), (point[0] - 26, point[1] - 22), (point[0] + 4, point[1] + 24)):
            x, y = p(sx, sy)
            d.line([(x - 2, y), (x + 2, y)], fill=GLOW)
            d.line([(x, y - 2), (x, y + 2)], fill=GLOW)
    return up(layer)


def frame(sheet, spec):
    cw, ch = sheet.width / 4, sheet.height / 4
    r, c = spec["cell"]
    cell = sheet.crop((int(c * cw), int(r * ch), int(c * cw) + int(cw), int(r * ch) + int(ch)))
    top, bottom = spec.get("keep", (8, cell.height - 4))
    clean = Image.new("RGBA", cell.size, (0, 0, 0, 0))  # quita restos de las celdas vecinas
    clean.paste(cell.crop((0, top, cell.width, bottom)), (0, top))
    cell = recolor(clean, spec["overalls"])
    out = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    out.alpha_composite(draw_wings(spec["wing"]))
    out.alpha_composite(cell, (PAD_X, PAD_Y))
    out.alpha_composite(draw_antennae(spec["head"]))
    out.alpha_composite(draw_wand(spec["hand"], spec["angle"], spec.get("swoosh", False), spec.get("sparkle", False)))
    return out


def jar(level):
    """Tarro de miel pixelado. level 0..4 = de vacío a lleno."""
    w, h = 26, 30
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # tapa de tela con lazo
    d.rectangle([6, 1, 19, 5], fill=(214, 84, 96, 255), outline=INK)
    d.point([(8, 3), (12, 3), (16, 3)], fill=(255, 190, 196, 255))
    d.rectangle([8, 6, 17, 7], fill=(150, 104, 60, 255), outline=INK)
    # cristal
    body = [3, 8, 22, 28]
    d.rounded_rectangle(body, radius=5, fill=(236, 246, 250, 150), outline=INK)
    if level > 0:
        top = 27 - level * 4
        d.rounded_rectangle([4, top, 21, 27], radius=4, fill=(244, 169, 42, 255))
        d.line([(5, top), (20, top)], fill=(255, 214, 110, 255))
        d.point([(7, top + 2), (8, top + 3)], fill=(255, 226, 150, 255))
    d.line([(6, 11), (6, 16)], fill=(255, 255, 255, 220))  # brillo del cristal
    d.rounded_rectangle(body, radius=5, outline=INK)
    # etiqueta con una abejita
    d.rectangle([8, 15, 17, 21], fill=(255, 246, 227, 255), outline=INK)
    d.point([(12, 18), (13, 18)], fill=(246, 196, 52, 255))
    d.point([(12, 17), (13, 17)], fill=(200, 230, 255, 255))
    return img.resize((w * PX, h * PX), Image.NEAREST)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(SHEET).convert("RGBA")
    frames = [frame(sheet, spec) for spec in POSES.values()]
    strip = Image.new("RGBA", (FRAME_W * len(frames), FRAME_H), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        strip.alpha_composite(f, (i * FRAME_W, 0))
    strip.save(OUT / "noa-abeja-v0.png")
    jars = [jar(level) for level in range(5)]
    js = Image.new("RGBA", (jars[0].width * 5, jars[0].height), (0, 0, 0, 0))
    for i, j in enumerate(jars):
        js.alpha_composite(j, (i * j.width, 0))
    js.save(OUT / "tarro-miel-v0.png")
    print("poses:", ", ".join(POSES), "| frame", FRAME_W, "x", FRAME_H, "| tarro", jars[0].size)


if __name__ == "__main__":
    main()
