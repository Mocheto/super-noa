"""Alarga el fondo de la habitación de la casa para la jaula de hámsters (docs/casa/jaula-hamsters.md).

Parte de `casa-habitacion-vacia-v2.webp` (la habitación con la ampliación de la pecera, desde x = -420) y le pone 720 px
más a la izquierda repitiendo las mismas seis rayas de la pared, con su zócalo y su suelo, así que no hay costura. El
resultado, `casa-habitacion-vacia-v3.webp`, mide 2420 × 540 y su borde izquierdo es x = -1140 de la escena.

Uso: uv run --with pillow --with numpy python prototypes/tools/casa-hamsters-fondo.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

MUNDOS = Path(__file__).resolve().parents[2] / "public" / "assets" / "worlds"
ANTES = 420  # lo que ya medía la ampliación
NUEVO = 720
LARGO, HASTA = 170, 442  # el tramo que se repite, en x de la habitación sin ampliar (ver casa-pecera-arte.py)

vieja = np.asarray(Image.open(MUNDOS / "casa-habitacion-vacia-v2.webp").convert("RGB"))
nueva = np.zeros((vieja.shape[0], NUEVO + vieja.shape[1], 3), dtype=np.uint8)
nueva[:, NUEVO:] = vieja
for j in range(NUEVO):
    # La columna j-ésima a la izquierda de la costura sigue la repetición donde la dejó la ampliación anterior.
    nueva[:, NUEVO - 1 - j] = vieja[:, ANTES + HASTA - 1 - ((j + ANTES) % LARGO)]
Image.fromarray(nueva, "RGB").save(MUNDOS / "casa-habitacion-vacia-v3.webp", "WEBP", lossless=True, quality=100, method=6)
print(nueva.shape)
