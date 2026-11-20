"""Lámina PROVISIONAL de las comidas (docs/art/casa-comida-v1.md), dibujada por código sobre el cuenco vacío de la
bandeja, para montar y probar la comida favorita mientras llega el arte generado a mano. La sustituye
`casa-comida-recorte.py` en «Montar el arte de las comidas».

Salida: public/assets/sprites/casa-comidas-v1.webp, cuatro celdas de 128 × 128 (pescado, leche, galletas, pollo).

Uso: uv run --with pillow python prototypes/tools/casa-comidas-provisional.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

RAIZ = Path(__file__).resolve().parents[2]
OBJETOS = RAIZ / "public/assets/sprites/casa-objetos-v1.webp"
SALIDA = RAIZ / "public/assets/sprites/casa-comidas-v1.webp"
CELDA = 128
CONTORNO = (0x2F, 0x1D, 0x33, 255)
BORDE_DELANTERO = 58  # filas del cuenco desde aquí se pintan encima de la comida


def pescado(d):
    d.polygon([(86, 30), (110, 14), (106, 30), (110, 46)], fill=(244, 143, 177, 255), outline=CONTORNO, width=3)
    d.ellipse([22, 16, 94, 46], fill=(158, 188, 214, 255), outline=CONTORNO, width=3)
    d.ellipse([30, 22, 86, 34], fill=(196, 220, 236, 255))
    d.ellipse([32, 24, 40, 32], fill=CONTORNO)


def leche(d):
    d.ellipse([20, 34, 108, 62], fill=(255, 255, 255, 255), outline=CONTORNO, width=3)
    d.ellipse([34, 40, 70, 50], fill=(232, 240, 250, 255))
    d.ellipse([56, 4, 72, 22], fill=(255, 255, 255, 255), outline=CONTORNO, width=3)


def galletas(d):
    for x, y in ((24, 26), (64, 26), (44, 8)):
        d.ellipse([x, y, x + 40, y + 34], fill=(226, 172, 92, 255), outline=CONTORNO, width=3)
        for dx, dy in ((10, 10), (24, 8), (16, 20), (28, 20)):
            d.rectangle([x + dx, y + dy, x + dx + 3, y + dy + 3], fill=(110, 62, 30, 255))


def pollo(d):
    d.rounded_rectangle([82, 26, 106, 36], radius=4, fill=(255, 250, 240, 255), outline=CONTORNO, width=3)
    d.ellipse([98, 18, 114, 32], fill=(255, 250, 240, 255), outline=CONTORNO, width=3)
    d.ellipse([98, 30, 114, 44], fill=(255, 250, 240, 255), outline=CONTORNO, width=3)
    d.ellipse([18, 10, 90, 54], fill=(196, 120, 48, 255), outline=CONTORNO, width=3)
    d.ellipse([28, 16, 66, 32], fill=(226, 160, 80, 255))


def main():
    objetos = Image.open(OBJETOS).convert("RGBA")
    ancho = objetos.width // 7
    vacio = objetos.crop((ancho, 0, 2 * ancho, objetos.height)).resize((CELDA, CELDA), Image.NEAREST)
    delante = vacio.copy()
    delante.putalpha(Image.eval(vacio.getchannel("A"), lambda a: a))
    hoja = Image.new("RGBA", (CELDA * 4, CELDA), (0, 0, 0, 0))
    for i, dibujar in enumerate((pescado, leche, galletas, pollo)):
        celda = vacio.copy()
        dibujar(ImageDraw.Draw(celda))
        frente = delante.crop((0, BORDE_DELANTERO, CELDA, CELDA))
        celda.alpha_composite(frente, (0, BORDE_DELANTERO))
        hoja.alpha_composite(celda, (i * CELDA, 0))
    hoja.save(SALIDA, "WEBP", lossless=True)
    print(f"escrita {SALIDA.relative_to(RAIZ)} (provisional)")


if __name__ == "__main__":
    main()
