"""Dibujos PROVISIONALES del jardín de la casa (docs/art/casa-jardin-v1.md), hechos por código para montar y probar el
jardín mientras llega el arte generado a mano. Los sustituye `casa-jardin-recorte.py` en «Montar el arte del jardín».

Salida: public/assets/worlds/casa-jardin-v1.webp (1280 × 540): la pared de la casa con la misma puerta del corazón de
la habitación (recortada de la habitación vacía), hierba, árbol y valla. Se amplía con la colchoneta, los maceteros, la
regadera y la mariposa en sus tickets.

Uso: uv run --with pillow python prototypes/tools/casa-jardin-provisional.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

RAIZ = Path(__file__).resolve().parents[2]
HABITACION = RAIZ / "public/assets/worlds/casa-habitacion-vacia-v1.webp"
SPRITES = RAIZ / "public/assets/sprites"
CONTORNO = (0x2F, 0x1D, 0x33, 255)
ANCHO, ALTO, SUELO = 1280, 540, 395


def jardin():
    hab = Image.open(HABITACION).convert("RGBA")
    img = Image.new("RGBA", (ANCHO, ALTO), (168, 218, 246, 255))
    d = ImageDraw.Draw(img)
    for x, y in ((420, 70), (760, 40), (1040, 90)):
        d.ellipse([x, y, x + 110, y + 40], fill=(255, 255, 255, 255))
        d.ellipse([x + 30, y - 20, x + 90, y + 30], fill=(255, 255, 255, 255))
    # Arbustos lejanos.
    for x in range(260, ANCHO, 140):
        d.ellipse([x, SUELO - 50, x + 160, SUELO + 30], fill=(120, 190, 110, 255), outline=CONTORNO, width=3)
    # Árbol al fondo.
    d.rectangle([860, 200, 900, SUELO + 10], fill=(150, 98, 56, 255), outline=CONTORNO, width=4)
    d.ellipse([760, 60, 1000, 260], fill=(98, 176, 90, 255), outline=CONTORNO, width=4)
    d.ellipse([800, 90, 900, 160], fill=(130, 200, 112, 255))
    # Valla blanca a la derecha.
    for x in range(930, 1250, 36):
        d.polygon([(x, 300), (x + 13, 286), (x + 26, 300), (x + 26, SUELO + 6), (x, SUELO + 6)], fill=(255, 250, 240, 255), outline=CONTORNO)
    d.rectangle([920, 320, 1260, 332], fill=(255, 250, 240, 255), outline=CONTORNO, width=3)
    d.rectangle([920, 360, 1260, 372], fill=(255, 250, 240, 255), outline=CONTORNO, width=3)
    # Hierba.
    d.rectangle([0, SUELO, ANCHO, ALTO], fill=(134, 204, 98, 255))
    d.line([0, SUELO, ANCHO, SUELO], fill=CONTORNO, width=4)
    for y in range(SUELO + 30, ALTO, 34):
        for x in range((y * 7) % 90, ANCHO, 90):
            d.line([x, y, x + 6, y - 8], fill=(104, 176, 78, 255), width=3)
    for x, y in ((330, 470), (520, 505), (720, 455), (980, 500), (1150, 470)):
        d.ellipse([x, y, x + 10, y + 10], fill=(255, 255, 255, 255))
        d.ellipse([x + 3, y + 3, x + 7, y + 7], fill=(255, 210, 80, 255))
    # Pared de la casa a la izquierda, con la puerta del corazón de la habitación.
    pared = hab.crop((0, 0, 270, SUELO))
    img.alpha_composite(pared, (0, 0))
    d.line([270, 0, 270, SUELO], fill=CONTORNO, width=4)
    img.convert("RGB").save(RAIZ / "public/assets/worlds/casa-jardin-v1.webp", "WEBP", quality=90)


def colchoneta():
    """La colchoneta: 200 × 90, un cojín redondo y gordito, coral con rayas crema y una huella encima."""
    img = Image.new("RGBA", (200, 90), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([6, 26, 194, 84], radius=26, fill=(232, 120, 110, 255), outline=CONTORNO, width=4)
    for x in range(30, 180, 30):
        d.line([x, 52, x, 80], fill=(255, 236, 214, 255), width=4)
    d.ellipse([6, 6, 194, 56], fill=(250, 150, 136, 255), outline=CONTORNO, width=4)
    d.ellipse([30, 14, 120, 34], fill=(255, 186, 170, 255))
    d.ellipse([90, 24, 110, 40], fill=(255, 236, 214, 255))
    for dx in (-14, -5, 5, 14):
        d.ellipse([96 + dx, 14, 104 + dx, 22], fill=(255, 236, 214, 255))
    img.save(SPRITES / "casa-colchoneta-v1.webp", "WEBP", lossless=True)


def mariposa():
    """La mariposa: cuatro cuadros de 64 × 64 (abiertas, medio, casi cerradas, medio), azul cielo con lunares lila."""
    hoja = Image.new("RGBA", (64 * 4, 64), (0, 0, 0, 0))
    for cuadro, abierta in enumerate((1.0, 0.6, 0.25, 0.6)):
        img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        ancho = round(26 * abierta) + 3
        for lado in (-1, 1):
            x0, x1 = sorted((32, 32 + lado * ancho))
            d.ellipse([x0, 12, x1, 34], fill=(150, 210, 245, 255), outline=CONTORNO, width=3)
            d.ellipse([x0 + 2, 30, x1 - 2, 48], fill=(150, 210, 245, 255), outline=CONTORNO, width=3)
            if ancho > 12:
                cx = 32 + lado * ancho // 2
                d.ellipse([cx - 4, 19, cx + 4, 27], fill=(196, 160, 232, 255))
        d.rounded_rectangle([29, 16, 35, 48], radius=3, fill=(70, 50, 80, 255), outline=CONTORNO, width=2)
        d.line([31, 16, 26, 6], fill=CONTORNO, width=2)
        d.line([33, 16, 38, 6], fill=CONTORNO, width=2)
        hoja.alpha_composite(img, (cuadro * 64, 0))
    hoja.save(SPRITES / "casa-mariposa-v1.webp", "WEBP", lossless=True)


if __name__ == "__main__":
    jardin()
    colchoneta()
    mariposa()
    print("escrito el jardín provisional")
