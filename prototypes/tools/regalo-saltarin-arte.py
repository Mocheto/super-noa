"""Arte v0 del regalo saltarín (plataforma `gift-spring`) como hoja de 4 fotogramas de 192 × 144 px.

Fotogramas: 0 reposo, 1 el lazo se inclina a la izquierda, 2 a la derecha, 3 aplastado (al pisarlo).
La caja descansa abajo: en reposo su tapa queda a 60 px del borde superior (el juego dibuja a la mitad
y alinea esa tapa con la superficie de la plataforma). Es un v0 por código; el arte final se sustituye
por una hoja con el mismo formato (ver docs/art/regalo-saltarin-v1.md).

Uso: python3 prototypes/tools/regalo-saltarin-arte.py   (requiere Pillow y cwebp)
"""
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
SALIDA = ROOT / "public/assets/sprites/gift-spring-v1.webp"
W, H, N, S = 192, 144, 4, 4  # tamaño del fotograma, fotogramas, sobremuestreo

CONTORNO = (74, 20, 40, 255)
ROJO, ROJO_SOMBRA, ROJO_LUZ = (214, 44, 72, 255), (160, 28, 56, 255), (255, 120, 132, 255)
ORO, ORO_SOMBRA, ORO_LUZ = (255, 214, 92, 255), (214, 150, 40, 255), (255, 246, 190, 255)
NIEVE = (255, 255, 255, 255)


def fotograma(i):
    im = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    r = lambda x0, y0, x1, y1, c, rad=0, o=None: d.rounded_rectangle(
        [x0 * S, y0 * S, x1 * S, y1 * S], radius=rad * S, fill=c, outline=o, width=3 * S if o else 0)
    aplastado = i == 3
    ancho = 176 if aplastado else 164          # el aplastado se ensancha
    alto_tapa = 18 if aplastado else 22
    top = 84 if aplastado else 60                # y de la tapa
    x0 = (W - ancho) // 2
    x1 = x0 + ancho
    # caja
    r(x0 + 6, top + alto_tapa - 4, x1 - 6, H - 2, ROJO, 8, CONTORNO)
    r(x0 + 6, H - 22, x1 - 6, H - 2, ROJO_SOMBRA, 8)
    r(x0 + 14, top + alto_tapa + 6, x0 + 26, H - 12, ROJO_LUZ, 4)
    # cinta vertical
    cx = W // 2
    r(cx - 15, top + alto_tapa - 4, cx + 15, H - 2, ORO, 0, CONTORNO)
    r(cx - 9, top + alto_tapa + 2, cx - 4, H - 8, ORO_LUZ, 2)
    # tapa
    r(x0, top, x1, top + alto_tapa, ROJO, 8, CONTORNO)
    r(x0 + 4, top + alto_tapa - 7, x1 - 4, top + alto_tapa - 2, ROJO_SOMBRA, 3)
    r(cx - 17, top, cx + 17, top + alto_tapa, ORO, 0, CONTORNO)
    r(cx - 10, top + 3, cx - 5, top + alto_tapa - 3, ORO_LUZ, 2)
    # nieve sobre la tapa
    for nx, nw in ((x0 + 8, 36), (x1 - 52, 40), (cx + 22, 20)):
        r(nx, top - 5, nx + nw, top + 4, NIEVE, 4, (200, 216, 236, 255))
    # lazo
    inc = {0: 0, 1: -7, 2: 7, 3: 0}[i]
    base = top - 2
    alto = 8 if aplastado else 22
    for lado in (-1, 1):
        px = cx + lado * 4
        puntas = [(px, base), (px + lado * (38 + abs(inc) * 0), base - alto - 12 + (inc * lado) // 2),
                  (px + lado * 46, base - 4 + (inc * lado) // 2), (px + lado * 14, base + 2)]
        d.polygon([(a * S, b * S) for a, b in puntas], fill=ORO, outline=CONTORNO, width=3 * S)
        d.line([((px + lado * 6) * S, (base - 2) * S), ((px + lado * 32) * S, (base - alto // 2 - 4 + (inc * lado) // 2) * S)],
               fill=ORO_LUZ, width=3 * S)
    r(cx - 11, base - 8, cx + 11, base + 8, ORO_SOMBRA, 5, CONTORNO)
    r(cx - 6, base - 5, cx + 3, base + 1, ORO_LUZ, 2)
    # destello en el fotograma de la izquierda y el de la derecha
    if i in (1, 2):
        sx = x0 + 22 if i == 1 else x1 - 22
        sy = top + 40
        d.polygon([(sx * S, (sy - 9) * S), ((sx + 3) * S, (sy - 3) * S), ((sx + 9) * S, sy * S),
                   ((sx + 3) * S, (sy + 3) * S), (sx * S, (sy + 9) * S), ((sx - 3) * S, (sy + 3) * S),
                   ((sx - 9) * S, sy * S), ((sx - 3) * S, (sy - 3) * S)], fill=ORO_LUZ)
    return im.resize((W, H), Image.LANCZOS)


hoja = Image.new("RGBA", (W * N, H), (0, 0, 0, 0))
for i in range(N):
    hoja.paste(fotograma(i), (i * W, 0))
with tempfile.TemporaryDirectory() as tmp:
    png = Path(tmp) / "hoja.png"
    hoja.save(png)
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["cwebp", "-quiet", "-lossless", "-z", "9", str(png), "-o", str(SALIDA)], check=True)
print(SALIDA, SALIDA.stat().st_size, "bytes")
