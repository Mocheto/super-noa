"""Prepara el único dibujo que se adjunta al generar un traje de Noa (docs/art/trajes-v1.md).

El generador copia la forma de lo que se le adjunta: por eso va un solo dibujo, ampliado, sobre verde y en un lienzo con
el formato que se quiere de salida.

Uso: uv run --with pillow python prototypes/tools/trajes-referencia.py ENTRADA SALIDA ANCHOxALTO [CELDA]
CELDA es `x,y,ancho,alto` dentro de la entrada (para sacar una pose de una hoja). De una entrada sin transparencia (una
lámina ya generada) se quita antes el fondo verde.
"""
import sys

from PIL import Image

VERDE = (0, 255, 0, 255)

entrada, salida, medidas = sys.argv[1:4]
ancho, alto = (int(n) for n in medidas.split("x"))
dibujo = Image.open(entrada).convert("RGBA")
if len(sys.argv) > 4:
    x, y, w, h = (int(n) for n in sys.argv[4].split(","))
    dibujo = dibujo.crop((x, y, x + w, y + h))
if dibujo.getchannel("A").getextrema()[0] == 255:
    # Lámina ya generada, sobre verde: se separa del fondo para recomponerla en el formato pedido.
    dibujo.putdata([(r, g, b, 0 if g > 150 and r < 120 and b < 120 else 255) for r, g, b, _ in dibujo.getdata()])
alfa = dibujo.getchannel("A")
# El halo casi transparente que rodea las hojas se quita para que el contorno quede limpio sobre el verde.
dibujo.putalpha(alfa.point(lambda v: 255 if v > 160 else 0))
caja = dibujo.getbbox()
dibujo = dibujo.crop(caja)
escala = min(ancho * 0.8 / dibujo.width, alto * 0.86 / dibujo.height)
dibujo = dibujo.resize((round(dibujo.width * escala), round(dibujo.height * escala)), Image.NEAREST)
lienzo = Image.new("RGBA", (ancho, alto), VERDE)
lienzo.alpha_composite(dibujo, ((ancho - dibujo.width) // 2, (alto - dibujo.height) // 2))
lienzo.convert("RGB").save(salida)
print(salida, lienzo.size)
