"""Recorta el arte generado de la pecera (docs/art/casa-pecera-v1.md) y lo deja en las medidas del juego.

Sustituye a `casa-pecera-arte.py` (que lo pintaba por código). Entrada: las láminas generadas sobre verde plano en
`--origen` (la carpeta con las JPEG, una por lámina, ver LAMINAS). Salida: WebP sin pérdida en `--salida`.

Uso: uv run --with pillow --with numpy --with scipy python prototypes/tools/casa-pecera-recorte.py --origen DIR --salida DIR
"""
import argparse, glob, json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

# Prefijo del nombre de archivo de cada lámina original.
LAMINAS = dict(mueble="ca710624", deco="8656a874", bote="fce2047f", naranja="fc9c601b", azul="deb727f5", payaso="cbd7258f",
               globo="3ef131d6", objetos="a8696ca8", saltando="ca717aa2", contento="35d4638c", cofre="daac8fb4", caballito="f777a5ce")

ANCHO_MUEBLE = 412   # px de escena del mueble completo
MARGEN_ARRIBA = 24   # hueco sobre el mueble para el bote
CW, CH = 96, 72      # cuadro de un pez


def abre(origen, clave):
    return Image.open(glob.glob(f"{origen}/{LAMINAS[clave]}*")[0]).convert("RGB")


def quitar_verde(img):
    """Pasa a RGBA quitando el verde plano (y el halo de la JPEG) sin tocar los verdes de las algas."""
    a = np.asarray(img).astype(float)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(-1), a.min(-1)
    s = (mx - mn) / np.maximum(mx, 1)
    d = np.maximum(mx - mn, 1)
    h = 60 * ((b - r) / d) + 120
    fondo = (mx == g) & (h > 100) & (h < 140) & (s > 0.6) & (mx > 70)
    fondo = ndi.binary_dilation(fondo, iterations=2)
    alfa = ndi.binary_opening(~fondo, iterations=1)
    rgba = np.dstack([a.astype(np.uint8), (alfa * 255).astype(np.uint8)])
    borde = ndi.binary_dilation(~alfa, iterations=4) & alfa
    g2 = rgba[..., 1].astype(int)
    m2 = np.maximum(rgba[..., 0], rgba[..., 2]).astype(int)
    rgba[..., 1] = np.where(borde & (g2 > m2), m2, g2).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def grupos(im, y0=0, y1=None, hueco=60):
    """Piezas sueltas de la lámina, de izquierda a derecha: cajas (x0, y0, x1, y1)."""
    a = np.asarray(im.getchannel("A")) > 0
    a = a.copy()
    a[:y0] = False
    if y1:
        a[y1:] = False
    lab, _ = ndi.label(a)
    cajas = []
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        if (lab[sl] == i).sum() >= 150:
            cajas.append([sl[1].start, sl[0].start, sl[1].stop, sl[0].stop])
    cajas.sort()
    res = []
    for c in cajas:
        if res and c[0] <= res[-1][2] + hueco:
            u = res[-1]
            res[-1] = [min(u[0], c[0]), min(u[1], c[1]), max(u[2], c[2]), max(u[3], c[3])]
        else:
            res.append(c)
    return res


def pieza(im, caja, voltear=False):
    p = im.crop(caja)
    p = p.crop(p.getchannel("A").getbbox())
    return p.transpose(Image.FLIP_LEFT_RIGHT) if voltear else p


def escalar(p, k):
    return p.resize((max(1, round(p.width * k)), max(1, round(p.height * k))), Image.LANCZOS)


def ancla(p, inflado=False):
    """Centro del cuerpo de un pez: el centroide del 60 % de la derecha (sin cola), o todo si va inflado."""
    a = np.asarray(p.getchannel("A")) > 0
    x0 = 0 if inflado else int(p.width * 0.4)
    ys, xs = np.nonzero(a[:, x0:])
    return xs.mean() + x0, ys.mean()


def hoja_fila(frames, s, cw, ch, inflado=()):
    """Cuadros ya recortados -> una fila de cuadros cw × ch, con el centro del cuerpo en el mismo sitio de cada uno."""
    esc = [escalar(f, s) for f in frames]
    anc = [ancla(f, i in inflado) for i, f in enumerate(esc)]
    izq = max(a[0] for a in anc)
    der = max(f.width - a[0] for f, a in zip(esc, anc))
    arr = max(a[1] for a in anc)
    aba = max(f.height - a[1] for f, a in zip(esc, anc))
    cx = cw / 2 - (der - izq) / 2   # reparte el sobrante: la unión de todos los cuadros queda centrada
    cy = ch / 2 - (aba - arr) / 2
    fila = Image.new("RGBA", (cw * len(esc), ch), (0, 0, 0, 0))
    for i, (f, a) in enumerate(zip(esc, anc)):
        fila.alpha_composite(f, (round(i * cw + cx - a[0]), round(cy - a[1])))
    return fila, (izq + der, arr + aba)


def guardar(im, ruta):
    ruta.parent.mkdir(parents=True, exist_ok=True)
    im.save(ruta, "WEBP", lossless=True, quality=100, method=6)
    print("escrito", ruta.name, im.size)


# --- El mueble con la pecera, su cristal y la decoración -------------------------------------------------------------

def arregla_tapa(im):
    """El verde plano se ve a través del cristal en la franja de arriba y en las esquinas: se pinta de agua clara."""
    a = np.asarray(im).copy()
    ys, xs = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    zona = (xs > 724) & (xs < 2092) & (ys > 334) & (ys < 366)
    verdoso = (a[..., 1].astype(int) > a[..., 0].astype(int) + 25) & (a[..., 1].astype(int) > a[..., 2].astype(int) + 10)
    a[zona & ((a[..., 3] == 0) | verdoso)] = (186, 230, 232, 255)
    return Image.fromarray(a, "RGBA")


def monta_fondo(o, sal):
    m = arregla_tapa(quitar_verde(abre(o, "mueble")))
    x0, y0, x1, y1 = m.getchannel("A").getbbox()
    mueble = m.crop((x0, y0, x1, y1))
    k = ANCHO_MUEBLE / mueble.width
    mu = escalar(mueble, k)
    ancho, alto = mu.width, mu.height + MARGEN_ARRIBA
    f = lambda x, y: (round((x - x0) * k), round((y - y0) * k) + MARGEN_ARRIBA)  # de la lámina al dibujo
    agua_x0, agua_x1 = f(726, 0)[0], f(2090, 0)[0]
    sup = f(0, 350)[1]
    arena = f(0, 718)[1]
    fondo = Image.new("RGBA", (ancho, alto), (0, 0, 0, 0))
    fondo.alpha_composite(mu, (0, MARGEN_ARRIBA))

    # Decoración dentro del agua, apoyada en la arena (centro x, altura final).
    im = quitar_verde(abre(o, "deco"))
    cajas = grupos(im, hueco=12)
    assert len(cajas) == 7, cajas  # castillo, 2 algas, coral, piedras, concha, estrella
    pz = [pieza(im, c) for c in cajas]
    castillo, alga1, alga2, coral, piedras, concha, estrella = pz
    def pon(p, cx, base, alto_final=None, ancho_final=None):
        kk = (alto_final / p.height) if alto_final else (ancho_final / p.width)
        e = escalar(p, kk)
        fondo.alpha_composite(e, (round(cx - e.width / 2), round(base - e.height)))
        return e
    suelo = arena + 13
    r = ANCHO_MUEBLE / 380  # las medidas de la decoración se pensaron para 380 px de ancho
    pon(alga1, 48, suelo, alto_final=round(64 * r))
    pon(alga2, 83, suelo - 1, alto_final=round(46 * r))
    pon(coral, 162, suelo + 1, alto_final=round(44 * r))
    pon(piedras, 233, suelo + 3, ancho_final=round(50 * r))
    pon(concha, 122, suelo + 3, ancho_final=round(13 * r))
    pon(estrella, 139, suelo + 4, ancho_final=round(17 * r))
    cas = pon(castillo, ancho - 84, suelo + 2, alto_final=round(80 * r))
    cx_cas = ancho - 84
    # Puerta del castillo: arco oscuro en el centro, abajo.
    puerta = dict(x=round(cx_cas), y=round(suelo + 2 - cas.height * 0.13))

    # Bote y interruptor sobre la tapa, a la derecha.
    im = quitar_verde(abre(o, "bote"))
    cajas = grupos(im, hueco=12)
    assert len(cajas) == 3, cajas
    bote = escalar(pieza(im, cajas[0]), round(40 * r) / pieza(im, cajas[0]).width)
    inter = pieza(im, cajas[2])
    inter = escalar(inter, round(32 * r) / inter.height)
    tapa_arriba = f(0, 232)[1]  # la franja baja y ancha de la tapa
    bote_xy = (ancho - round(104 * r), tapa_arriba - bote.height + 4)
    fondo.alpha_composite(bote, bote_xy)
    inter_xy = (ancho - round(36 * r) - inter.width // 2, tapa_arriba - 6)
    fondo.alpha_composite(inter, inter_xy)

    # Cristal: el borde y los brillos, por delante de los peces.
    cr = Image.new("RGBA", (ancho, alto), (0, 0, 0, 0))
    arr = np.asarray(m).astype(int)
    ys, xs = np.mgrid[0:arr.shape[0], 0:arr.shape[1]]
    dentro = (xs > 726) & (xs < 2090) & (ys > 372) & (ys < 700)
    blanco = (arr[..., :3].min(-1) > 208) & ((arr[..., :3].max(-1) - arr[..., :3].min(-1)) < 45) & dentro
    hi = np.zeros(arr.shape[:2] + (4,), np.uint8)
    hi[blanco] = (255, 255, 255, 200)
    ring = ((xs >= 712) & (xs <= 2104) & (ys >= 322) & (ys <= 860)) & ~((xs > 728) & (xs < 2088) & (ys > 338) & (ys < 842))
    hi[ring & (arr[..., 3] > 0)] = np.append(arr[ring & (arr[..., 3] > 0)][:, :3].mean(0), 255).astype(np.uint8) if False else (206, 238, 250, 255)
    hi_im = Image.fromarray(hi, "RGBA").crop((x0, y0, x1, y1))
    cr.alpha_composite(escalar(hi_im, k), (0, MARGEN_ARRIBA))
    guardar(fondo, sal / "casa-pecera-fondo-v1.webp")
    guardar(cr, sal / "casa-pecera-cristal-v1.webp")
    return dict(
        tamano=dict(ancho=ancho, alto=alto), agua=dict(izquierda=agua_x0, derecha=agua_x1, superficie=sup, arena=arena, fondo=f(0, 850)[1]),
        bote=dict(izquierda=bote_xy[0], derecha=bote_xy[0] + bote.width, arriba=bote_xy[1], abajo=bote_xy[1] + bote.height),
        interruptor=dict(izquierda=inter_xy[0], derecha=inter_xy[0] + inter.width, arriba=inter_xy[1], abajo=inter_xy[1] + inter.height),
        castillo=puerta)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--origen", required=True)
    ap.add_argument("--salida", required=True)
    o = ap.parse_args()
    sal = Path(o.salida)
    medidas = {}

    # --- Peces: cuatro hojas de 5 poses que miran a la izquierda en la lámina (se voltean para mirar a la derecha) ---
    cuadros = {}
    for esp in ("naranja", "azul", "payaso", "globo"):
        im = quitar_verde(abre(o.origen, esp))
        y0 = int(im.height * 0.38) if esp == "globo" else 0  # el globo salió en dos filas: se usa la de abajo, más limpia
        cajas = grupos(im, y0=y0)
        assert len(cajas) == 5, (esp, cajas)
        cuadros[esp] = [pieza(im, c, voltear=True) for c in cajas]
    def largo(fs):
        return max(f.width for f in fs[:3]), max(f.height for f in fs[:3])
    s = min(50 / largo(cuadros["naranja"])[0], 38 / largo(cuadros["naranja"])[1])
    hoja = Image.new("RGBA", (5 * CW, 4 * CH), (0, 0, 0, 0))
    for fila, esp in enumerate(("naranja", "azul", "payaso", "globo")):
        k = s
        if esp == "globo":  # el inflado es el cuadro más grande: que quepa
            inf = cuadros[esp][3]
            k = min(s, 0.92 * CW / inf.width, 0.92 * CH / inf.height)
        f, _ = hoja_fila(cuadros[esp], k, CW, CH, inflado=(3,) if esp == "globo" else ())
        hoja.alpha_composite(f, (0, fila * CH))
    guardar(hoja, sal / "casa-peces-v1.webp")

    # --- Extras: saltando, contento (ya miran a la derecha), caballito (cinco poses, cuadros de 96 × 96) y cofre ---
    ex = []
    for nom in ("saltando", "contento"):
        im = quitar_verde(abre(o.origen, nom))
        ex.append(pieza(im, grupos(im)[0]))
    k = min(0.8 * CW / max(e.width for e in ex), 0.8 * CH / max(e.height for e in ex))
    fila, _ = hoja_fila(ex, k, CW, CH, inflado=(0, 1))
    guardar(fila, sal / "casa-peces-extras-v1.webp")
    im = quitar_verde(abre(o.origen, "caballito"))
    cab = [pieza(im, c) for c in grupos(im)]
    k = min(0.92 * 96 / max(c.width for c in cab), 0.92 * 96 / max(c.height for c in cab))
    fila, _ = hoja_fila(cab, k, 96, 96, inflado=(0, 1, 2, 3, 4))
    guardar(fila, sal / "casa-pez-caballito-v1.webp")
    im = quitar_verde(abre(o.origen, "cofre"))
    cof = [pieza(im, c) for c in grupos(im, hueco=10)]
    cof = [c if c.width < 0.9 * (c.height * 2) else c for c in cof]
    k = 52 / max(c.width for c in cof)
    esc = [escalar(c, k) for c in cof]
    base = max(e.height for e in esc)
    fila = Image.new("RGBA", (64 * 2, 64), (0, 0, 0, 0))
    for i, e in enumerate(esc):
        fila.alpha_composite(e, (i * 64 + (64 - e.width) // 2, 62 - e.height))
    guardar(fila, sal / "casa-pecera-cofre-v1.webp")

    # --- Objetos: seis cuadros de 48 × 48 ---
    im = quitar_verde(abre(o.origen, "objetos"))
    cajas = grupos(im, hueco=10)
    assert len(cajas) == 6, cajas
    pz = [pieza(im, c) for c in cajas]
    k = min(40 / max(p.width for p in pz), 40 / max(p.height for p in pz))
    hoja = Image.new("RGBA", (6 * 48, 48), (0, 0, 0, 0))
    for i, p in enumerate(pz):
        e = escalar(p, k)
        if i == 0:  # la burbuja salió opaca: su interior pasa a medio transparente
            a = np.asarray(e).copy()
            claro = (a[..., 2] > 200) & (a[..., 0] > 170) & (a[..., 0] < 235)
            a[..., 3] = np.where(claro, 140, a[..., 3])
            e = Image.fromarray(a, "RGBA")
        hoja.alpha_composite(e, (i * 48 + (48 - e.width) // 2, (48 - e.height) // 2))
    guardar(hoja, sal / "casa-pecera-objetos-v1.webp")
    medidas.update(monta_fondo(o.origen, sal))
    json.dump(medidas, open(sal / "medidas.json", "w"), indent=1)
    print(json.dumps(medidas))


if __name__ == "__main__":
    main()
