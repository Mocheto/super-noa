"""Recorta y exporta las cortinas, la estantería y el cojín de la casa (docs/art/casa-decorar-v2.md).

Entrada: una carpeta con las láminas tal como salen del generador (cualquier extensión): casa-cortinas,
casa-estanterias y casa-cojines, cada una con cinco piezas sobre verde en dos filas (tres arriba y dos abajo):
la de siempre y las cuatro de las habitaciones con tema, en ese orden.

Salida (WebP): public/assets/sprites/casa-mueble-<mueble>-v1.webp, cinco celdas en fila del tamaño exacto de su caja en
la habitación (la de src/game/casaDecoracion.ts). La estantería y el cojín se escalan para caber en su caja sin
deformarse y se apoyan abajo, centrados. Las cortinas salen más anchas que la ventana: cada juego se parte por el hueco
de en medio, cada cortina va a un borde de la caja y la barra se alarga entre ellas, para que el cristal quede libre.

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-decorar-v2-recorte.py CARPETA_ORIGEN
"""
import importlib.util
import sys
from pathlib import Path

import numpy as np
from PIL import Image

_spec = importlib.util.spec_from_file_location("casa_recorte", Path(__file__).with_name("casa-recorte.py"))
casa = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(casa)

# Caja de cada mueble en la escena de 1280 × 540 (ancho, alto) y cómo se apoya en ella.
MUEBLES = {
    "cortinas": {"lamina": "casa-cortinas", "caja": (298, 262), "apoyo": "arriba"},
    "estanteria": {"lamina": "casa-estanterias", "caja": (160, 82), "apoyo": "abajo"},
    "cojin": {"lamina": "casa-cojines", "caja": (180, 86), "apoyo": "abajo"},
}


def sin_fondo(img):
    """Como casa.key_out, pero el fondo es solo el verde chillón (#00FF00 y su ruido de JPEG): las hojas de palmera y el
    dinosaurio de cuello largo son verdes y con el verde amplio se agujereaban."""
    from scipy import ndimage
    hsv = np.array(img.convert("HSV")).astype(int)
    hue, sat, val = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
    chillon = (hue >= 95) & (hue <= 135) & (sat > 0.65) & (val > 0.6)
    etiquetas, _ = ndimage.label(chillon)
    borde = set(np.unique(np.concatenate([etiquetas[0], etiquetas[-1], etiquetas[:, 0], etiquetas[:, -1]]))) - {0}
    # El verde chillón encerrado (entre la vela y el mástil, dentro de la luna) también es fondo.
    tamanos = ndimage.sum(chillon, etiquetas, range(1, etiquetas.max() + 1))
    encerrado = [i + 1 for i, t in enumerate(tamanos) if t >= 20]
    alfa = ~(np.isin(etiquetas, list(borde)) | np.isin(etiquetas, encerrado))
    alfa = ndimage.binary_erosion(alfa, structure=ndimage.generate_binary_structure(2, 1))
    alfa = ndimage.binary_opening(alfa, iterations=1)
    return np.dstack([np.array(img), (alfa * 255).astype(np.uint8)])


def piezas(folder, lamina):
    rgba = sin_fondo(casa.load(folder, lamina))
    encontradas = casa.poses(rgba, 5, min_area=4000)
    if len(encontradas) != 5:
        raise SystemExit(f"{lamina}: hay {len(encontradas)} piezas, no 5")
    filas = casa.por_filas(encontradas, [3, 2])
    return [casa.recorte(rgba, p) for fila in filas for p in fila]


# Cada cortina, como mucho así de ancha en la escena: más tapa demasiado cristal o choca con la balda de la planta.
CORTINA_ANCHO = 100


def juego_de_cortinas(pieza, ancho, alto):
    """Parte un juego de cortinas por su hueco (columnas sin nada bajo la barra), pone una cortina en cada borde de la
    celda colgando de arriba y alarga la barra entre ellas con la columna de en medio del hueco."""
    a = np.array(pieza)
    h, w = a.shape[:2]
    bajo_la_barra = a[int(h * 0.22):, :, 3] > 0
    vacias = ~bajo_la_barra.any(axis=0)
    mejor, inicio = (0, 0), None
    for x in range(int(w * 0.2), int(w * 0.8) + 1):
        if x < int(w * 0.8) and vacias[x]:
            inicio = x if inicio is None else inicio
        elif inicio is not None:
            mejor = max(mejor, (x - inicio, inicio))
            inicio = None
    largo, desde = mejor
    if largo < 4:
        raise SystemExit("Un juego de cortinas no tiene hueco en medio: las cortinas tienen que ir recogidas a los lados.")
    izquierda = pieza.crop((0, 0, desde, h))
    derecha = pieza.crop((desde + largo, 0, w, h))
    barra = pieza.crop((desde + largo // 2, 0, desde + largo // 2 + 1, h))
    factor = min(alto / h, CORTINA_ANCHO / max(izquierda.width, derecha.width))
    izquierda, derecha = casa.escalar(izquierda, factor), casa.escalar(derecha, factor)
    barra = barra.convert("RGBa").resize((ancho, derecha.height), Image.NEAREST).convert("RGBA")
    celda = Image.new("RGBA", (ancho, alto))
    celda.alpha_composite(barra, (0, 0))
    celda.alpha_composite(izquierda, (0, 0))
    celda.alpha_composite(derecha, (ancho - derecha.width, 0))
    return celda


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    folder = Path(sys.argv[1])
    for mueble, datos in MUEBLES.items():
        ancho, alto = datos["caja"]
        hoja = Image.new("RGBA", (ancho * 5, alto))
        for i, pieza in enumerate(piezas(folder, datos["lamina"])):
            if mueble == "cortinas":
                hoja.alpha_composite(juego_de_cortinas(pieza, ancho, alto), (i * ancho, 0))
                continue
            pieza = casa.escalar(pieza, min(ancho / pieza.width, alto / pieza.height))
            y = 0 if datos["apoyo"] == "arriba" else alto - pieza.height
            hoja.alpha_composite(pieza, (i * ancho + (ancho - pieza.width) // 2, y))
        destino = casa.SPRITES / f"casa-mueble-{mueble}-v1.webp"
        hoja.save(destino, "WEBP", quality=casa.QUALITY, method=6)
        print(f"{mueble}: {destino.name} ({hoja.width} × {hoja.height})")


if __name__ == "__main__":
    main()
