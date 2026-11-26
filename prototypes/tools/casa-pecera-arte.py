"""Pinta por código el arte de la pecera de la casa de los gatitos (docs/art/casa-pecera-v1.md).

No lleva imagen de origen: todo se dibuja en una rejilla pequeña (cada «píxel» son 4 px de escena, como el resto del
arte de la casa) y se amplía sin suavizar. Salidas:

- public/assets/worlds/casa-habitacion-vacia-v2.webp: la habitación vacía de siempre con 420 px más a la izquierda (la
  pared a rayas, el zócalo y el suelo siguen sin costura); su borde izquierdo es x = -420 de la escena.
- public/assets/sprites/casa-pecera-fondo-v1.webp: el mueble, la tapa con su luz, el agua, la arena, el castillo, las algas
  y el bote de comida, 324 × 352 px (va en la escena con la esquina arriba a la izquierda en x = -372, y = 58).
- public/assets/sprites/casa-pecera-cristal-v1.webp: lo que va por delante de los peces: el borde del cristal, sus
  brillos y la superficie del agua (mismas medidas).
- public/assets/sprites/casa-peces-v1.webp: cuatro peces (naranja, azul, payaso y globo) mirando a la derecha, en cinco
  cuadros de 96 × 72 px: nada A, nada B, ¡ñam! (boca abierta), susto (ojos grandes; el globo, inflado) y dormido.
- public/assets/sprites/casa-pecera-objetos-v1.webp: seis cuadros de 48 × 48 px: burbuja, corazón, copo de comida, brillo,
  zeta y gota.

Imprime las medidas que usa `src/game/casaPecera.ts` (el agua, la arena y las zonas de toque en px del dibujo).

Uso: uv run --with pillow --with numpy python prototypes/tools/casa-pecera-arte.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
ASSETS = RAIZ / "public" / "assets"
PX = 4  # lado de un «píxel» del arte, en px de escena

TRAZO = (54, 19, 35, 255)
MADERA = (171, 85, 64, 255)
MADERA_CLARA = (211, 131, 92, 255)
MADERA_OSCURA = (140, 66, 62, 255)
LATON = (255, 214, 107, 255)


# --- Habitación ampliada -------------------------------------------------------------------------------------------

AMPLIACION = 420
TRAMO = (272, 442)  # de un comienzo de raya clara al siguiente: seis rayas que se repiten


def habitacion_ampliada():
    vieja = Image.open(ASSETS / "worlds" / "casa-habitacion-vacia-v1.webp").convert("RGB")
    arr = np.asarray(vieja)
    desde, hasta = TRAMO
    largo = hasta - desde
    nueva = np.zeros((arr.shape[0], AMPLIACION + arr.shape[1], 3), dtype=np.uint8)
    nueva[:, AMPLIACION:] = arr
    # De derecha a izquierda desde la costura: acaba con el final de una raya oscura, justo antes de la clara del borde.
    for j in range(AMPLIACION):
        nueva[:, AMPLIACION - 1 - j] = arr[:, hasta - 1 - (j % largo)]
    return Image.fromarray(nueva, "RGB")


# --- Utilidades de pixel art ---------------------------------------------------------------------------------------

class Lienzo:
    """Rejilla de `ancho` × `alto` píxeles del arte (RGBA) que se amplía ×4 al guardar."""

    def __init__(self, ancho, alto):
        self.img = Image.new("RGBA", (ancho, alto), (0, 0, 0, 0))
        self.ancho, self.alto = ancho, alto

    def punto(self, x, y, color):
        if 0 <= x < self.ancho and 0 <= y < self.alto:
            self.img.putpixel((int(x), int(y)), color)

    def rect(self, x0, y0, x1, y1, color):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.punto(x, y, color)

    def marco(self, x0, y0, x1, y1, color):
        for x in range(x0, x1 + 1):
            self.punto(x, y0, color)
            self.punto(x, y1, color)
        for y in range(y0, y1 + 1):
            self.punto(x0, y, color)
            self.punto(x1, y, color)

    def elipse(self, cx, cy, rx, ry, color):
        for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
            for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
                if ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1:
                    self.punto(x, y, color)

    def poligono(self, puntos, color):
        xs = [p[0] for p in puntos]
        ys = [p[1] for p in puntos]
        for y in range(int(min(ys)), int(max(ys)) + 1):
            for x in range(int(min(xs)), int(max(xs)) + 1):
                if dentro(x + 0.5, y + 0.5, puntos):
                    self.punto(x, y, color)

    def contorno(self, color=TRAZO):
        """Borde de 1 píxel alrededor de lo pintado (solo hacia fuera)."""
        a = np.asarray(self.img)[..., 3] > 0
        borde = np.zeros_like(a)
        borde[1:, :] |= a[:-1, :]
        borde[:-1, :] |= a[1:, :]
        borde[:, 1:] |= a[:, :-1]
        borde[:, :-1] |= a[:, 1:]
        for y, x in zip(*np.nonzero(borde & ~a)):
            self.img.putpixel((int(x), int(y)), color)

    def ampliada(self):
        return self.img.resize((self.ancho * PX, self.alto * PX), Image.NEAREST)


def dentro(px, py, puntos):
    c = False
    j = len(puntos) - 1
    for i, (xi, yi) in enumerate(puntos):
        xj, yj = puntos[j]
        if (yi > py) != (yj > py) and px < (xj - xi) * (py - yi) / (yj - yi) + xi:
            c = not c
        j = i
    return c


def guardar(imagen, ruta):
    ruta.parent.mkdir(parents=True, exist_ok=True)
    imagen.save(ruta, "WEBP", lossless=True, quality=100, method=6)
    print("escrito", ruta.relative_to(RAIZ), imagen.size)


# --- La pecera -----------------------------------------------------------------------------------------------------

W, H = 81, 88  # rejilla del mueble completo: 324 × 352 px
HOOD = (2, 7, 78, 12)  # tapa con la luz
VIDRIO = (3, 13, 77, 58)  # caja de cristal (con sus bordes)
AGUA = (4, 16, 76, 57)  # el agua: de la superficie (fila 16) hasta la arena
ARENA_DESDE = 53
SLAB = (1, 58, 79, 60)
CUERPO = (2, 60, 78, 81)

AGUA_CLARA = (150, 220, 255, 255)
AGUA_MEDIA = (96, 190, 240, 255)
AGUA_FONDO = (58, 150, 215, 255)
ARENA = (244, 214, 150, 255)
ARENA_SOMBRA = (222, 184, 118, 255)


def fondo_pecera():
    c = Lienzo(W, H)
    # Patas y cuerpo del mueble.
    c.rect(3, 82, 8, 87, MADERA_OSCURA)
    c.rect(72, 82, 77, 87, MADERA_OSCURA)
    c.rect(*CUERPO, MADERA)
    c.rect(CUERPO[0], CUERPO[1], CUERPO[2], CUERPO[1] + 1, MADERA_CLARA)
    # Dos puertas con su marco, tirador y veta.
    for x0, x1 in ((5, 38), (41, 74)):
        c.rect(x0, 63, x1, 79, MADERA_CLARA)
        c.marco(x0, 63, x1, 79, MADERA_OSCURA)
        c.rect(x0 + 3, 66, x1 - 3, 76, MADERA)
        c.marco(x0 + 3, 66, x1 - 3, 76, MADERA_OSCURA)
        for y in (69, 72, 75):
            c.rect(x0 + 6, y, x1 - 6, y, (190, 100, 74, 255))
    c.rect(36, 70, 37, 72, LATON)
    c.rect(42, 70, 43, 72, LATON)
    c.contorno()
    # Losa de arriba, algo más ancha que la pecera.
    c.rect(*SLAB, MADERA_CLARA)
    c.rect(SLAB[0], SLAB[3], SLAB[2], SLAB[3], MADERA_OSCURA)
    c.marco(SLAB[0], SLAB[1], SLAB[2], SLAB[3], TRAZO)
    # Pecera: agua con degradado hacia el fondo.
    x0, y0, x1, y1 = AGUA
    for y in range(y0, y1 + 1):
        t = (y - y0) / (y1 - y0)
        color = AGUA_CLARA if t < 0.12 else AGUA_MEDIA if t < 0.55 else AGUA_FONDO
        c.rect(x0, y, x1, y, color)
    # Rayos de luz que bajan desde la tapa.
    for rx in (14, 30, 46, 62):
        for y in range(y0 + 1, y0 + 26):
            c.punto(rx + (y - y0) // 6, y, AGUA_CLARA)
    # Arena con granitos.
    c.rect(x0, ARENA_DESDE, x1, y1, ARENA)
    for gx, gy in ((9, 55), (15, 54), (24, 56), (33, 54), (41, 56), (50, 55), (58, 54), (66, 56), (72, 55), (20, 57), (47, 57)):
        c.punto(gx, gy, ARENA_SOMBRA)
    # Algas (dos ramos) y coral rosa.
    alga = (46, 190, 110, 255)
    alga_osc = (28, 140, 84, 255)
    for base, alto in ((8, 22), (11, 16), (30, 14), (33, 20), (36, 11)):
        for k in range(alto):
            c.punto(base + (1 if (k // 3) % 2 else 0), ARENA_DESDE - 1 - k, alga if k % 4 else alga_osc)
            c.punto(base + 1 + (1 if (k // 3) % 2 else 0), ARENA_DESDE - 1 - k, alga_osc)
    coral = (255, 120, 156, 255)
    coral_osc = (214, 78, 122, 255)
    for x, y in ((23, 51), (24, 50), (24, 49), (23, 48), (25, 49), (26, 48), (26, 47), (22, 47), (21, 46)):
        c.punto(x, y, coral)
    for x, y in ((24, 51), (25, 50), (26, 49), (23, 49)):
        c.punto(x, y, coral_osc)
    # Piedras.
    for cx, cy, rx, ry, col in ((17, 52, 4, 2.4, (150, 150, 170, 255)), (42, 52.5, 3.2, 1.8, (130, 132, 156, 255)), (71, 52.5, 3.5, 2, (150, 150, 170, 255))):
        c.elipse(cx, cy, rx, ry, col)
    # Castillo con su puerta oscura (el pez payaso se esconde ahí).
    pared = (200, 184, 214, 255)
    sombra = (160, 142, 182, 255)
    c.rect(52, 40, 68, 52, pared)
    c.rect(52, 40, 54, 52, sombra)
    c.rect(52, 36, 55, 40, pared)
    c.rect(65, 36, 68, 40, pared)
    for x in (52, 54, 65, 67):
        c.rect(x, 34, x, 35, pared)
    c.rect(58, 33, 62, 40, pared)
    c.rect(59, 31, 61, 32, (255, 120, 156, 255))
    c.rect(57, 44, 63, 52, (60, 40, 90, 255))
    c.rect(58, 43, 62, 43, (60, 40, 90, 255))
    c.rect(59, 42, 61, 42, (60, 40, 90, 255))
    c.rect(52, 44, 52, 44, TRAZO)
    # Marco del cristal por detrás (las esquinas) y contorno oscuro del conjunto del agua.
    c.marco(VIDRIO[0], VIDRIO[1], VIDRIO[2], VIDRIO[3], (150, 190, 215, 255))
    # Tapa con la luz.
    c.rect(*HOOD, (86, 70, 110, 255))
    c.rect(HOOD[0], HOOD[1], HOOD[2], HOOD[1] + 1, (122, 104, 146, 255))
    c.marco(*HOOD, TRAZO)
    c.rect(4, 13, 76, 13, (255, 245, 190, 255))
    c.rect(4, 14, 76, 14, (255, 232, 140, 110))
    # Interruptor en la tapa, a la derecha.
    c.rect(68, 9, 72, 10, (60, 200, 120, 255))
    # Bote de comida sobre la tapa, a la derecha.
    c.rect(62, 1, 72, 6, (232, 76, 76, 255))
    c.rect(62, 1, 72, 1, (252, 150, 150, 255))
    c.rect(62, 3, 72, 4, (255, 232, 140, 255))
    c.rect(64, 3, 65, 4, (232, 76, 76, 255))
    c.rect(68, 3, 69, 4, (80, 150, 220, 255))
    c.marco(62, 0, 72, 6, TRAZO)
    c.rect(61, 0, 73, 0, LATON)
    return c


def cristal_pecera():
    c = Lienzo(W, H)
    # Esquinas y borde delantero del cristal.
    borde = (210, 240, 255, 255)
    c.marco(VIDRIO[0], VIDRIO[1], VIDRIO[2], VIDRIO[3], borde)
    c.rect(VIDRIO[0], VIDRIO[1], VIDRIO[0], VIDRIO[3], (236, 250, 255, 255))
    c.rect(VIDRIO[2], VIDRIO[1], VIDRIO[2], VIDRIO[3], (170, 214, 240, 255))
    # Superficie del agua: línea clara.
    c.rect(AGUA[0], AGUA[1], AGUA[2], AGUA[1], (214, 244, 255, 255))
    # Brillos del cristal.
    for (bx, by, largo) in ((14, 22, 14), (20, 22, 6), (60, 28, 16), (66, 28, 5)):
        for k in range(largo):
            c.punto(bx - k // 3, by + k, (255, 255, 255, 140))
            c.punto(bx - k // 3 + 1, by + k, (255, 255, 255, 80))
    # Una burbuja pegada al cristal.
    c.punto(8, 50, (255, 255, 255, 180))
    return c


# --- Peces ---------------------------------------------------------------------------------------------------------

CW, CH = 24, 18  # cuadro de un pez en píxeles del arte: 96 × 72 px
COLUMNAS = 5     # nada A, nada B, ñam, susto, dormido


def pez(especie, cuadro):
    c = Lienzo(CW, CH)
    cx, cy = 12, 9
    cola_arriba = cuadro != 1
    if especie == 0:  # naranja
        cuerpo, vientre, aleta, aleta2 = (255, 150, 60, 255), (255, 210, 140, 255), (255, 104, 46, 255), (255, 180, 80, 255)
        rx, ry = 6.5, 4.6
        cola = [(cx - 5, cy), (cx - 11, cy - (5 if cola_arriba else 3)), (cx - 10, cy), (cx - 11, cy + (3 if cola_arriba else 5))]
    elif especie == 1:  # azul de cola amarilla
        cuerpo, vientre, aleta, aleta2 = (70, 160, 255, 255), (170, 220, 255, 255), (255, 214, 60, 255), (40, 100, 220, 255)
        rx, ry = 6.5, 5.2
        cola = [(cx - 5, cy), (cx - 11, cy - (5 if cola_arriba else 3)), (cx - 9, cy), (cx - 11, cy + (3 if cola_arriba else 5))]
    elif especie == 2:  # payaso
        cuerpo, vientre, aleta, aleta2 = (255, 128, 30, 255), (255, 190, 100, 255), (255, 100, 20, 255), (255, 170, 60, 255)
        rx, ry = 6.0, 4.4
        cola = [(cx - 5, cy), (cx - 10, cy - (4 if cola_arriba else 2)), (cx - 9, cy), (cx - 10, cy + (2 if cola_arriba else 4))]
    else:  # globo
        cuerpo, vientre, aleta, aleta2 = (255, 224, 122, 255), (255, 244, 200, 255), (255, 176, 90, 255), (246, 190, 100, 255)
        rx, ry = 5.4, 5.0
        cola = [(cx - 4, cy), (cx - 7, cy - (3 if cola_arriba else 1)), (cx - 6, cy), (cx - 7, cy + (1 if cola_arriba else 3))]
    inflado = especie == 3 and cuadro == 3
    if inflado:
        rx, ry = 8.4, 7.4
        cola = [(cx - 7, cy), (cx - 10, cy - 2), (cx - 9, cy), (cx - 10, cy + 2)]
    # Cola, aleta de arriba, cuerpo y vientre.
    c.poligono(cola, aleta)
    if not inflado:
        c.poligono([(cx - 2, cy - ry + 1), (cx, cy - ry - 2), (cx + 3, cy - ry + 1)], aleta)
    c.elipse(cx, cy, rx, ry, cuerpo)
    for y in range(int(cy + ry * 0.35), int(cy + ry) + 1):
        for x in range(int(cx - rx), int(cx + rx) + 1):
            if ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1:
                c.punto(x, y, vientre)
    # Aleta de al lado.
    c.poligono([(cx - 1, cy + 1), (cx + 2, cy + 2), (cx - 2, cy + 4)], aleta2)
    # Rayas del payaso y manchas.
    if especie == 2:
        for x0 in (int(cx - 1), int(cx + 3)):
            for y in range(int(cy - ry) + 1, int(cy + ry)):
                if ((x0 + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1:
                    c.punto(x0, y, (255, 255, 255, 255))
                    c.punto(x0 + 1, y, (255, 255, 255, 255))
    if especie == 1:
        for x in range(int(cx - 3), int(cx + 3)):
            c.punto(x, int(cy - 1), (30, 80, 190, 255))
    if especie == 3:
        for x, y in ((cx - 2, cy - 2), (cx + 1, cy - 3), (cx - 1, cy + 1), (cx + 3, cy + 1)):
            c.punto(x, y, (214, 150, 80, 255))
    if inflado:
        # Púas alrededor.
        for ang in range(0, 360, 36):
            import math
            ex = cx + math.cos(math.radians(ang)) * (rx + 1.2)
            ey = cy + math.sin(math.radians(ang)) * (ry + 1.2)
            c.punto(int(ex), int(ey), (214, 150, 80, 255))
    c.contorno()
    # Cara: ojo y boca.
    ox, oy = int(cx + rx * 0.45), int(cy - ry * 0.3)
    if cuadro == 4:  # dormido: ojo cerrado
        c.rect(ox - 1, oy + 1, ox + 1, oy + 1, TRAZO)
    elif cuadro == 3:  # susto: ojo grande
        c.rect(ox - 1, oy - 1, ox + 1, oy + 1, (255, 255, 255, 255))
        c.punto(ox + 1, oy, TRAZO)
        c.punto(ox + 1, oy + 1, TRAZO)
        c.marco(ox - 2, oy - 2, ox + 2, oy + 2, TRAZO) if not inflado else None
    else:
        c.rect(ox, oy, ox + 1, oy + 1, (255, 255, 255, 255))
        c.punto(ox + 1, oy + 1, TRAZO)
        c.punto(ox + 1, oy, TRAZO)
    mx, my = int(cx + rx) - (1 if especie != 3 else 2), int(cy + ry * 0.25)
    if cuadro == 2:  # ñam: boca bien abierta
        c.rect(mx - 1, my - 1, mx + 2, my + 2, TRAZO)
        c.rect(mx, my, mx + 1, my + 1, (232, 76, 96, 255))
    elif cuadro == 3:
        c.rect(mx, my, mx + 1, my + 1, TRAZO)
    else:
        c.punto(mx, my, TRAZO)
        c.punto(mx + 1, my, TRAZO)
    # Mejilla colorada de los peces felices (dormido y ñam).
    if cuadro in (2, 4):
        c.punto(ox - 1, oy + 3, (255, 130, 150, 255))
        c.punto(ox, oy + 3, (255, 130, 150, 255))
    return c


def hoja_peces():
    hoja = Image.new("RGBA", (COLUMNAS * CW * PX, 4 * CH * PX), (0, 0, 0, 0))
    for especie in range(4):
        for cuadro in range(COLUMNAS):
            hoja.paste(pez(especie, cuadro).ampliada(), (cuadro * CW * PX, especie * CH * PX))
    return hoja


# --- Objetos pequeños ----------------------------------------------------------------------------------------------

def objetos():
    celdas = []
    # burbuja
    c = Lienzo(12, 12)
    c.elipse(6, 6, 5, 5, (200, 240, 255, 150))
    for x, y in ((3, 2), (4, 1), (5, 1), (6, 1), (7, 1), (8, 2), (9, 3), (10, 4), (10, 7), (9, 8), (8, 9), (7, 10), (5, 10), (4, 10), (3, 9), (2, 8), (1, 7), (1, 4), (2, 3)):
        c.punto(x, y, (255, 255, 255, 235))
    c.punto(3, 4, (255, 255, 255, 255))
    c.punto(3, 5, (255, 255, 255, 255))
    celdas.append(c)
    # corazón
    c = Lienzo(12, 12)
    for x, y in ((2, 2), (3, 2), (4, 2), (7, 2), (8, 2), (9, 2), (1, 3), (5, 3), (6, 3), (10, 3), (1, 4), (10, 4), (1, 5), (10, 5), (2, 6), (9, 6), (3, 7), (8, 7), (4, 8), (7, 8), (5, 9), (6, 9)):
        c.punto(x, y, TRAZO)
    c.rect(2, 3, 4, 3, (255, 96, 132, 255))
    c.rect(7, 3, 9, 3, (255, 96, 132, 255))
    c.rect(2, 4, 9, 5, (255, 96, 132, 255))
    c.rect(3, 6, 8, 6, (255, 96, 132, 255))
    c.rect(4, 7, 7, 7, (255, 96, 132, 255))
    c.rect(5, 8, 6, 8, (255, 96, 132, 255))
    c.punto(3, 3, (255, 190, 206, 255))
    c.punto(2, 4, (255, 190, 206, 255))
    celdas.append(c)
    # copo de comida
    c = Lienzo(12, 12)
    c.rect(4, 4, 7, 7, (255, 150, 60, 255))
    c.rect(5, 5, 6, 6, (255, 214, 140, 255))
    c.contorno((140, 66, 40, 255))
    celdas.append(c)
    # brillo
    c = Lienzo(12, 12)
    for x, y in ((5, 1), (6, 1), (5, 2), (6, 2), (5, 3), (6, 3), (5, 4), (6, 4), (1, 5), (2, 5), (3, 5), (4, 5), (7, 5), (8, 5), (9, 5), (10, 5), (1, 6), (2, 6), (3, 6), (4, 6), (7, 6), (8, 6), (9, 6), (10, 6), (5, 7), (6, 7), (5, 8), (6, 8), (5, 9), (6, 9), (5, 10), (6, 10)):
        c.punto(x, y, (255, 240, 140, 255))
    c.rect(4, 4, 7, 7, (255, 255, 255, 255))
    celdas.append(c)
    # zeta de dormir
    c = Lienzo(12, 12)
    z = (198, 214, 255, 255)
    c.rect(2, 2, 9, 3, z)
    for k in range(6):
        c.rect(8 - k - (0 if k < 5 else 0), 4 + k, 9 - k, 4 + k, z)
    c.rect(2, 9, 9, 10, z)
    c.contorno((60, 80, 160, 255))
    celdas.append(c)
    # gota
    c = Lienzo(12, 12)
    c.poligono([(6, 1), (9, 7), (6, 11), (3, 7)], (150, 220, 255, 255))
    c.elipse(6, 7.5, 3, 3, (150, 220, 255, 255))
    c.punto(5, 6, (255, 255, 255, 255))
    c.contorno((60, 130, 200, 255))
    celdas.append(c)
    hoja = Image.new("RGBA", (len(celdas) * 48, 48), (0, 0, 0, 0))
    for i, celda in enumerate(celdas):
        hoja.paste(celda.ampliada(), (i * 48, 0))
    return hoja


def main():
    guardar(habitacion_ampliada(), ASSETS / "worlds" / "casa-habitacion-vacia-v2.webp")
    guardar(fondo_pecera().ampliada(), ASSETS / "sprites" / "casa-pecera-fondo-v1.webp")
    guardar(cristal_pecera().ampliada(), ASSETS / "sprites" / "casa-pecera-cristal-v1.webp")
    guardar(hoja_peces(), ASSETS / "sprites" / "casa-peces-v1.webp")
    guardar(objetos(), ASSETS / "sprites" / "casa-pecera-objetos-v1.webp")
    x0, y0, x1, y1 = AGUA
    print("agua (px del dibujo):", dict(izquierda=x0 * PX, derecha=(x1 + 1) * PX, superficie=y0 * PX, arena=ARENA_DESDE * PX, fondo=(y1 + 1) * PX))
    print("bote:", dict(izquierda=61 * PX, derecha=74 * PX, arriba=-1 * PX, abajo=7 * PX))
    print("interruptor:", dict(izquierda=68 * PX, derecha=73 * PX, arriba=9 * PX, abajo=11 * PX))
    print("castillo (puerta):", dict(izquierda=57 * PX, derecha=64 * PX, arriba=42 * PX, abajo=53 * PX))


if __name__ == "__main__":
    main()
