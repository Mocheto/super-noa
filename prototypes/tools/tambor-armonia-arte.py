"""Arte v0 del tambor de Armonía: Noa tamborilera, los dos tambores, el atril y el fondo del teatro.

Como el v0 de la abeja ninja, compone poses existentes de Noa (public/assets/sprites/noa-sprite-sheet.png)
con un disfraz de banda de música (chaqueta turquesa con cordones dorados, gorro alto con pompón y dos
baquetas). Los añadidos, los tambores, el atril y el teatro se dibujan a un cuarto de resolución y se
escalan sin suavizado para conservar el aspecto pixelado con contorno marcado. Todo es original.

Noa tamborilera definitiva del v0: sprites/noa-tambor-v0.png es la ilustración que aportó la persona
usuaria (4 poses sobre fondo negro), recortada a transparente en celdas de 520×521 con el pompón del
gorro centrado. Este script no la sobrescribe salvo con --noa, que vuelve a la composición por código.

Uso: python3 prototypes/tools/tambor-armonia-arte.py [--noa]   (requiere Pillow)
Salida en public/assets/: sprites/noa-tambor-v0.png (solo con --noa; 4 poses mirando a la izquierda:
espera, golpe, escucha, celebra), sprites/tambor-armonia-v0.png, sprites/tambor-noa-v0.png,
sprites/atril-armonia-v0.png (atril y, a la derecha, nota vacía y nota dorada) y
worlds/teatro-armonia-v0.png (960×540).
"""
import colorsys
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
SHEET = ROOT / "public/assets/sprites/noa-sprite-sheet.png"
OUT = ROOT / "public/assets"
PREVIEW = len(sys.argv) > 1 and sys.argv[1] == "--preview"
WITH_NOA = "--noa" in sys.argv

INK = (47, 29, 51, 255)
TEAL = (38, 160, 150)
TEAL_DARK = (24, 104, 104)
WHITE = (250, 246, 236)
GOLD = (255, 214, 92, 255)
GOLD_DARK = (214, 150, 40, 255)
GLOW = (255, 247, 196, 255)
STICK = (226, 182, 118, 255)
TIP = (255, 243, 220, 255)

FRAME_W, FRAME_H = 440, 460
PAD_X, PAD_Y = 72, 110
PX = 4

# Pose de origen (fila, columna) y anclajes en coordenadas de su celda de 295×332, mirando a la derecha.
# hands: (x, y, ángulo en grados) de cada baqueta; 0° apunta a la derecha y -90° hacia arriba.
POSES = {
    "espera": dict(cell=(0, 0), head=(150, 62), hands=[(102, 248, -128, 84), (214, 242, -52, 84)]),
    "golpe": dict(cell=(2, 1), head=(146, 62), hands=[(150, 196, 30, 96), (226, 178, 40, 96)], motion=True, keep=(0, 300)),
    "escucha": dict(cell=(0, 1), head=(150, 62), hands=[(84, 248, 150, 64), (196, 242, 130, 64)], notes=True),
    "celebra": dict(cell=(2, 0), head=(152, 30), hands=[(72, 92, -120, 96), (250, 92, -55, 96)], sparkle=True, keep=(0, 300)),
}


def hsv(r, g, b):
    return colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)


def torso_box(cell):
    """Caja del peto morado entre la cintura y el pecho (filas 150-280 de la celda)."""
    px = cell.load()
    xs, ys = [], []
    for y in range(150, min(280, cell.height)):
        for x in range(cell.width):
            r, g, b, a = px[x, y]
            hh, s, v = hsv(r, g, b)
            if a > 200 and 0.66 <= hh <= 0.9 and s >= 0.4 and v >= 0.6:
                xs.append(x); ys.append(y)
    xs.sort(); ys.sort()
    k = len(xs) // 10
    return (xs[k], ys[k], xs[-k - 1], ys[-k - 1])


def recolor(cell, box):
    """Chaqueta turquesa dentro del torso, botas turquesa oscuro fuera; mangas lilas claras a blanco."""
    px = cell.load()
    w, h = cell.size
    x0, y0, x1, y1 = box
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 40:
                continue
            hh, s, v = hsv(r, g, b)
            if not (0.66 <= hh <= 0.9):
                continue
            inside = x0 <= x <= x1 and y0 <= y <= y1
            if 0.12 <= s < 0.34 and v >= 0.82:
                shade = min(1.0, v)
                px[x, y] = tuple(int(c * shade) for c in WHITE) + (a,)
            elif s >= 0.34 and v >= 0.38:
                shade = min(1.15, max(0.5, v / 0.85))
                base = TEAL if inside else TEAL_DARK
                px[x, y] = tuple(min(255, int(c * shade)) for c in base) + (a,)
    return cell


def low(size=(FRAME_W, FRAME_H)):
    return Image.new("RGBA", (size[0] // PX, size[1] // PX), (0, 0, 0, 0))


def up(img):
    return img.resize((img.width * PX, img.height * PX), Image.NEAREST)


def p(x, y):
    return (round(x / PX), round(y / PX))


def draw_cords(box):
    layer = low()
    d = ImageDraw.Draw(layer)
    x0, y0, x1, y1 = (box[0] + PAD_X, box[1] + PAD_Y, box[2] + PAD_X, box[3] + PAD_Y)
    cx = (x0 + x1) / 2
    span = (x1 - x0) * 0.32
    for k, yy in enumerate((y0 + 12, y0 + 28, y0 + 44)):
        d.line([p(cx - span + k * 4, yy), p(cx + span - k * 4, yy)], fill=GOLD, width=1)
        d.point(p(cx, yy), fill=GOLD_DARK)
    return up(layer)


def draw_hat(head):
    layer = low()
    d = ImageDraw.Draw(layer)
    hx, hy = head[0] + PAD_X, head[1] + PAD_Y
    # gorro alto (shako): copa blanca, cuerpo turquesa, visera oscura, chapa y pompón dorados
    top = [p(hx - 40, hy - 74), p(hx + 40, hy + 12)]
    d.rectangle(top, fill=TEAL + (255,), outline=INK)
    d.rectangle([p(hx - 40, hy - 74), p(hx + 40, hy - 54)], fill=WHITE + (255,), outline=INK)
    d.rectangle([p(hx - 46, hy + 8), p(hx + 46, hy + 16)], fill=(30, 40, 50, 255), outline=INK)
    bx, by = p(hx, hy - 22)
    d.polygon([(bx, by - 3), (bx + 3, by), (bx, by + 3), (bx - 3, by)], fill=GOLD, outline=INK)
    tx, ty = p(hx, hy - 88)
    d.ellipse([tx - 4, ty - 4, tx + 4, ty + 3], fill=GOLD, outline=INK)
    d.point((tx - 1, ty - 2), fill=GLOW)
    return up(layer)


def draw_stick(d, hand, motion=False):
    hx, hy, ang, length = hand
    hx, hy = hx + PAD_X, hy + PAD_Y
    ux, uy = math.cos(math.radians(ang)), math.sin(math.radians(ang))
    grip = (hx - ux * 14, hy - uy * 14)
    end = (hx + ux * length, hy + uy * length)
    d.line([p(*grip), p(*end)], fill=INK, width=3)
    d.line([p(*grip), p(*end)], fill=STICK, width=1)
    ex, ey = p(*end)
    d.ellipse([ex - 3, ey - 3, ex + 3, ey + 3], fill=TIP, outline=INK)
    if motion:
        nx, ny = -uy, ux
        for k in (-1, 1):
            a = (end[0] - ux * 30 + nx * 22 * k, end[1] - uy * 30 + ny * 22 * k)
            b = (end[0] - ux * 70 + nx * 34 * k, end[1] - uy * 70 + ny * 34 * k)
            d.line([p(*a), p(*b)], fill=(255, 255, 255, 220), width=1)


def draw_extras(spec):
    layer = low()
    d = ImageDraw.Draw(layer)
    for hand in spec["hands"]:
        draw_stick(d, hand, spec.get("motion", False))
    hx, hy = spec["head"][0] + PAD_X, spec["head"][1] + PAD_Y
    if spec.get("notes"):  # escucha: notitas que llegan a la oreja
        for (nx, ny) in ((hx - 150, hy + 60), (hx - 118, hy + 10)):
            x, y = p(nx, ny)
            d.ellipse([x - 5, y + 3, x + 1, y + 8], fill=GOLD, outline=INK)
            d.line([(x + 1, y + 5), (x + 1, y - 8)], fill=INK, width=1)
            d.line([(x + 1, y - 8), (x + 5, y - 5)], fill=INK, width=1)
    if spec.get("sparkle"):
        for sx, sy in ((hx - 140, hy - 40), (hx + 150, hy - 50), (hx + 120, hy + 40), (hx - 120, hy + 60)):
            x, y = p(sx, sy)
            d.line([(x - 2, y), (x + 2, y)], fill=GLOW)
            d.line([(x, y - 2), (x, y + 2)], fill=GLOW)
    return up(layer)


def frame(sheet, spec):
    cw, ch = sheet.width / 4, sheet.height / 4
    r, c = spec["cell"]
    cell = sheet.crop((int(c * cw), int(r * ch), int(c * cw) + int(cw), int(r * ch) + int(ch)))
    top, bottom = spec.get("keep", (0, cell.height))
    clean = Image.new("RGBA", cell.size, (0, 0, 0, 0))  # quita restos de las celdas vecinas
    clean.paste(cell.crop((0, top, cell.width, bottom)), (0, top))
    box = torso_box(clean)
    cell = recolor(clean, box)
    out = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    out.alpha_composite(cell, (PAD_X, PAD_Y))
    out.alpha_composite(draw_cords(box))
    out.alpha_composite(draw_hat(spec["head"]))
    out.alpha_composite(draw_extras(spec))
    return out.transpose(Image.FLIP_LEFT_RIGHT)  # Noa mira a Armonía, a su izquierda


def noa():
    sheet = Image.open(SHEET).convert("RGBA")
    frames = [frame(sheet, spec) for spec in POSES.values()]
    strip = Image.new("RGBA", (FRAME_W * len(frames), FRAME_H), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        strip.alpha_composite(f, (i * FRAME_W, 0))
    return strip


def drum(kind):
    """Tambor visto de frente y algo desde arriba; el parche ocupa la franja superior para las huellas."""
    w, h = 64, 46
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if kind == "armonia":
        shell, shell_dark, trim = (107, 61, 154, 255), (72, 38, 108, 255), GOLD
    else:
        shell, shell_dark, trim = (238, 236, 228, 255), (190, 184, 170, 255), (38, 160, 150, 255)
    d.rectangle([3, 12, w - 4, 38], fill=shell, outline=INK)
    d.ellipse([3, 30, w - 4, 44], fill=shell_dark, outline=INK)
    d.rectangle([4, 12, w - 5, 37], fill=shell)
    d.line([(4, 37), (4, 13)], fill=INK)
    d.line([(w - 5, 37), (w - 5, 13)], fill=INK)
    # aros
    d.rectangle([3, 13, w - 4, 15], fill=trim, outline=INK)
    d.rectangle([3, 34, w - 4, 36], fill=trim, outline=INK)
    # cuerdas en zigzag con tensores
    pts = [(4 + i * (w - 9) / 6, 16 if i % 2 == 0 else 33) for i in range(7)]
    d.line(pts, fill=trim if kind == "armonia" else (255, 214, 92, 255), width=1)
    for x, y in pts[1::2]:
        d.ellipse([x - 1, y - 1, x + 1, y + 1], fill=GOLD, outline=INK)
    if kind == "noa":  # banda de música: franja turquesa central
        d.rectangle([5, 22, w - 6, 26], fill=(38, 160, 150, 255))
        d.line(pts, fill=(255, 214, 92, 255), width=1)
    # parche
    d.ellipse([3, 4, w - 4, 20], fill=(247, 231, 198, 255), outline=INK)
    d.arc([10, 6, w - 11, 16], start=200, end=320, fill=(255, 250, 236, 255))
    d.ellipse([3, 4, w - 4, 20], outline=INK)
    return img.resize((w * PX, h * PX), Image.NEAREST)


def stand():
    """Atril de madera con pentagrama; a la derecha, nota vacía y nota dorada (16×16 cada una)."""
    w, h = 72, 30
    img = Image.new("RGBA", (w + 32, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w - 1, h - 6], fill=(184, 120, 66, 255), outline=INK)
    d.rectangle([2, 2, w - 3, h - 8], fill=(255, 246, 227, 255), outline=(120, 76, 40, 255))
    for k in range(5):
        y = 6 + k * 3
        d.line([(5, y), (w - 6, y)], fill=(155, 138, 168, 255))
    d.rectangle([3, h - 6, w - 4, h - 4], fill=(150, 96, 52, 255), outline=INK)  # repisa
    d.line([(w // 2, h - 4), (w // 2, h - 1)], fill=INK, width=2)
    # notas
    for i, (fill, edge) in enumerate((((228, 216, 236, 255), (201, 184, 214, 255)), (GOLD, INK))):
        ox = w + 2 + i * 15
        d.ellipse([ox + 1, 16, ox + 8, 22], fill=fill, outline=edge)
        d.line([(ox + 8, 19), (ox + 8, 6)], fill=edge)
        d.line([(ox + 8, 6), (ox + 12, 9)], fill=edge)
        if i:
            d.point((ox + 3, 17), fill=GLOW)
    return img.resize((img.width * PX, img.height * PX), Image.NEAREST)


def theatre():
    w, h = 240, 135
    img = Image.new("RGBA", (w, h), (42, 21, 52, 255))
    d = ImageDraw.Draw(img)
    # pared del fondo con degradado por bandas y notas decorativas
    for y in range(0, 110):
        t = y / 110
        col = (int(90 - 40 * t), int(47 - 22 * t), int(110 - 50 * t), 255)
        d.line([(0, y), (w, y)], fill=col)
    for i, x in enumerate(range(70, 180, 22)):
        y = 34 + (i % 2) * 6
        d.ellipse([x, y + 4, x + 4, y + 7], fill=(132, 92, 120, 255))
        d.line([(x + 4, y + 5), (x + 4, y - 3)], fill=(132, 92, 120, 255))
        d.line([(x + 4, y - 3), (x + 7, y - 1)], fill=(132, 92, 120, 255))
    # tablas del escenario
    d.rectangle([0, 110, w, h], fill=(138, 90, 50, 255))
    d.line([(0, 110), (w, 110)], fill=(196, 138, 76, 255), width=2)
    for x in range(0, w, 16):
        d.line([(x, 112), (x, h)], fill=(118, 76, 42, 255))
    for x in range(8, w, 30):  # candilejas
        d.rectangle([x, 106, x + 6, 109], fill=(80, 60, 50, 255), outline=INK)
        d.point((x + 3, 106), fill=GLOW)
    # telones laterales con pliegues
    for side in (0, 1):
        for x in range(0, 38):
            fold = (x // 5) % 3
            col = ((163, 32, 58, 255), (125, 21, 48, 255), (184, 42, 68, 255))[fold]
            xx = x if side == 0 else w - 1 - x
            bottom = 110 - max(0, (x - 18)) * 2 if side == 0 else 110 - max(0, (x - 18)) * 2
            d.line([(xx, 0), (xx, bottom)], fill=col)
        d.line([(38 if side == 0 else w - 39, 0), (38 if side == 0 else w - 39, 74)], fill=INK)
    # bambalina superior con borde dorado y borlas
    for x in range(0, w):
        col = (184, 42, 68, 255) if (x // 10) % 2 == 0 else (141, 26, 52, 255)
        dip = int(3 * math.sin(math.pi * ((x % 20) / 20)))
        d.line([(x, 0), (x, 10 + dip)], fill=col)
        d.point((x, 11 + dip), fill=GOLD)
        d.point((x, 12 + dip), fill=GOLD_DARK)
    for x in range(10, w, 20):
        d.rectangle([x - 1, 13, x + 1, 17], fill=GOLD, outline=INK)
    return img.resize((w * PX, h * PX), Image.NEAREST)


def main():
    out = {
        "sprites/tambor-armonia-v0.png": drum("armonia"),
        "sprites/tambor-noa-v0.png": drum("noa"),
        "sprites/atril-armonia-v0.png": stand(),
        "worlds/teatro-armonia-v0.png": theatre(),
    }
    if WITH_NOA or PREVIEW:
        out["sprites/noa-tambor-v0.png"] = noa()
    base = Path(sys.argv[2]) if PREVIEW else OUT
    for name, img in out.items():
        path = base / name
        path.parent.mkdir(parents=True, exist_ok=True)
        img.save(path, optimize=True)
        print(name, img.size)


if __name__ == "__main__":
    main()
