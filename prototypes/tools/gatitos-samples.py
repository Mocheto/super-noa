"""Samples originales v0 de «La fiesta de los gatitos»: marimba, flauta, pizzicato, cascabeles, madera y maullidos.

Se sintetizan por código (sin grabaciones ni servicios externos) y se guardan como WAV mono de 16 bits a
32 kHz en public/assets/audio/gatitos/ (los que carga el juego), con una copia incrustada en
prototypes/assets/gatitos-samples/samples.js para la página de audición. Cada instrumento afinado se renderiza en una sola nota base y
el juego la transporta cambiando la velocidad de reproducción. Todo es original.

Uso: python3 prototypes/tools/gatitos-samples.py   (requiere numpy)
"""
import base64
import json
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/assets/audio/gatitos"
EMBEDDED = ROOT / "prototypes/assets/gatitos-samples/samples.js"
SR = 32000
RNG = np.random.default_rng(7)  # semilla fija: el mismo resultado en cada ejecución


def t_axis(seconds):
    return np.arange(int(SR * seconds)) / SR


def decay(t, tau):
    return np.exp(-t / tau)


def fade(sig, attack=0.003, release=0.02):
    a, r = max(1, int(SR * attack)), max(1, int(SR * release))
    env = np.ones(len(sig))
    env[:a] = np.linspace(0, 1, a)
    env[-r:] *= np.linspace(1, 0, r)
    return sig * env


def lowpass(sig, cutoff):
    """Filtro de un polo: suficiente para suavizar ruido y golpes."""
    alpha = 1 - np.exp(-2 * np.pi * cutoff / SR)
    out = np.empty_like(sig)
    acc = 0.0
    for i, x in enumerate(sig):
        acc += alpha * (x - acc)
        out[i] = acc
    return out


def highpass(sig, cutoff):
    return sig - lowpass(sig, cutoff)


def bandpass(sig, low, high):
    return lowpass(highpass(sig, low), high)


def marimba(freq=523.25, seconds=1.1):
    t = t_axis(seconds)
    sig = np.zeros_like(t)
    for ratio, amp, tau in ((1.0, 1.0, 0.55), (3.99, 0.32, 0.16), (9.9, 0.07, 0.04)):
        sig += amp * np.sin(2 * np.pi * freq * ratio * t) * decay(t, tau)
    click = bandpass(RNG.standard_normal(len(t)), 600, 3500) * decay(t, 0.006) * 0.35
    return fade(sig + click, 0.002, 0.08)


def flauta(freq=783.99, seconds=0.9):
    t = t_axis(seconds)
    vibrato = 1 + 0.006 * np.sin(2 * np.pi * 5.2 * t) * np.clip(t / 0.25, 0, 1)
    phase = 2 * np.pi * np.cumsum(freq * vibrato) / SR
    sig = np.sin(phase) + 0.22 * np.sin(2 * phase) + 0.07 * np.sin(3 * phase)
    breath = bandpass(RNG.standard_normal(len(t)), freq, freq * 3) * 0.05 * np.clip(1 - t / 0.2, 0.25, 1)
    env = np.clip(t / 0.07, 0, 1) * np.clip((seconds - t) / 0.2, 0, 1) * (0.85 + 0.15 * np.exp(-t / 0.4))
    return (sig + breath) * env


def pizzicato(freq=130.81, seconds=0.6):
    """Cuerda pellizcada (Karplus-Strong)."""
    n = int(SR * seconds)
    period = int(round(SR / freq))
    buf = RNG.uniform(-1, 1, period)
    out = np.empty(n)
    for i in range(n):
        out[i] = buf[i % period]
        buf[i % period] = 0.4985 * (buf[i % period] + buf[(i + 1) % period])
    t = t_axis(seconds)
    body = np.sin(2 * np.pi * freq * t) * decay(t, 0.22)  # el cuerpo grave que sostiene la nota
    return fade(lowpass(out, 1500) * 0.7 + body * 0.9, 0.001, 0.05)


def cascabeles(seconds=0.5):
    t = t_axis(seconds)
    sig = np.zeros_like(t)
    for k, start in enumerate((0.0, 0.022, 0.05)):
        s = int(SR * start)
        tt = t[: len(t) - s]
        bell = sum(amp * np.sin(2 * np.pi * f * tt) for f, amp in ((2740, 1.0), (3620, 0.8), (4980, 0.6), (6410, 0.4), (7730, 0.25)))
        sig[s:] += bell * decay(tt, 0.11 - 0.015 * k) * (1 - 0.18 * k)
    sig += highpass(RNG.standard_normal(len(t)), 5000) * decay(t, 0.05) * 0.4
    return fade(sig, 0.001, 0.08)


def madera(seconds=0.14):
    t = t_axis(seconds)
    sig = np.sin(2 * np.pi * 880 * t) * decay(t, 0.03) + 0.6 * np.sin(2 * np.pi * 2140 * t) * decay(t, 0.015)
    sig += bandpass(RNG.standard_normal(len(t)), 1000, 5000) * decay(t, 0.004) * 0.5
    return fade(sig, 0.0005, 0.02)


def hachazo(seconds=0.4):
    """Hachazo en un tronco: golpe grave de madera con un «tok» seco encima."""
    t = t_axis(seconds)
    thump = np.sin(2 * np.pi * np.cumsum(np.linspace(190, 70, len(t))) / SR) * decay(t, 0.09)
    tok = (np.sin(2 * np.pi * 760 * t) * decay(t, 0.025) + 0.5 * np.sin(2 * np.pi * 1630 * t) * decay(t, 0.012))
    chip = lowpass(RNG.standard_normal(len(t)), 4000) * decay(t, 0.012) * 0.5
    return fade(thump * 1.2 + tok * 0.7 + chip, 0.0005, 0.04)


def golpe_sordo(seconds=0.25):
    t = t_axis(seconds)
    thump = np.sin(2 * np.pi * np.cumsum(np.linspace(120, 75, len(t))) / SR) * decay(t, 0.06)
    return fade(lowpass(thump + RNG.standard_normal(len(t)) * 0.05 * decay(t, 0.02), 900), 0.002, 0.05) * 0.8


def plop(seconds=0.22):
    t = t_axis(seconds)
    glide = np.sin(2 * np.pi * np.cumsum(np.linspace(820, 260, len(t))) / SR) * decay(t, 0.05)
    return fade(glide + 0.25 * np.sin(2 * np.pi * 1500 * t) * decay(t, 0.012), 0.001, 0.03)


def miau(base=620.0, seconds=0.38, bright=1.0):
    """Maullido de gatito: tono que sube y baja con un formante que se abre («mi-au»)."""
    n = int(SR * seconds)
    u = np.linspace(0, 1, n)
    f0 = base * (0.82 + 0.5 * np.sin(np.pi * np.clip(u * 1.15, 0, 1)) * (1 - 0.3 * u) + 0.0)
    f0 *= 1 + 0.008 * np.sin(2 * np.pi * 7 * u * seconds)
    phase = 2 * np.pi * np.cumsum(f0) / SR
    formant = (1000 + 900 * np.sin(np.pi * np.clip(u * 1.1, 0, 1))) * bright  # «i» → «a» → «u»
    sig = np.zeros(n)
    for h in range(1, 14):
        harmonic = h * f0
        amp = np.exp(-((harmonic - formant) / (650 * bright)) ** 2) / np.sqrt(h)
        sig += amp * np.sin(h * phase)
    env = np.clip(u / 0.05, 0, 1) * np.clip((1 - u) / 0.28, 0, 1) ** 0.8
    return sig * env + RNG.standard_normal(n) * 0.012 * env


SAMPLES = {
    "marimba-do5": marimba,
    "flauta-sol5": flauta,
    "pizzicato-do3": pizzicato,
    "cascabeles": cascabeles,
    "madera": madera,
    "hachazo": hachazo,
    "golpe-sordo": golpe_sordo,
    "plop-ovillo": plop,
    "miau-gatito-1": lambda: miau(640, 0.36, 1.0),
    "miau-gatito-2": lambda: miau(500, 0.44, 0.85),
}


def save(name, sig):
    peak = float(np.max(np.abs(sig))) or 1.0
    data = np.int16(np.clip(sig / peak * 0.7, -1, 1) * 32767)  # pico a -3 dBFS
    OUT.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUT / f"{name}.wav"), "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(data.tobytes())
    return len(data) / SR


def main():
    for name, make in SAMPLES.items():
        seconds = save(name, make())
        print(f"{name}.wav  {seconds:.2f} s  {(OUT / f'{name}.wav').stat().st_size // 1024} KB")
    # Copia incrustada para que la página de audición suene también abierta como archivo (sin servidor):
    # los navegadores bloquean fetch() sobre file://, pero sí cargan un <script>.
    data = {name: "data:audio/wav;base64," + base64.b64encode((OUT / f"{name}.wav").read_bytes()).decode() for name in SAMPLES}
    EMBEDDED.parent.mkdir(parents=True, exist_ok=True)
    EMBEDDED.write_text("window.GATITOS_SAMPLES = " + json.dumps(data) + ";\n")


if __name__ == "__main__":
    main()
