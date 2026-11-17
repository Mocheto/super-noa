"""Samples originales de «La abeja ninja»: koto, flauta de bambú, taiko, bajo, zumbido y efectos.

Se sintetizan por código (sin grabaciones ni servicios externos) y se guardan como WAV mono de 16 bits a
32 kHz en public/assets/audio/abeja-ninja/. Los instrumentos afinados se renderizan en una sola nota base y el
juego la transporta cambiando la velocidad de reproducción. Todo es original: nada se copia de Rhythm Heaven
ni de otros juegos.

Uso: python3 prototypes/tools/abeja-ninja-samples.py   (requiere numpy)
"""
import importlib.util
import wave
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
_spec = importlib.util.spec_from_file_location("gatitos_samples", HERE / "gatitos-samples.py")
g = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(g)

ROOT = HERE.parents[1]
OUT = ROOT / "public/assets/audio/abeja-ninja"
SR = g.SR
RNG = np.random.default_rng(11)  # semilla fija: el mismo resultado en cada ejecución
t_axis, decay, fade, lowpass, highpass, bandpass = g.t_axis, g.decay, g.fade, g.lowpass, g.highpass, g.bandpass


def glide(f0, f1, seconds, curve=1.0):
    """Fase de un tono que va de f0 a f1 (curva > 1: el cambio se concentra al principio)."""
    u = np.linspace(0, 1, int(SR * seconds))
    freq = f1 + (f0 - f1) * (1 - u) ** curve
    return 2 * np.pi * np.cumsum(freq) / SR


def koto(freq=587.33, seconds=1.3):
    """Cuerda pulsada con púa (Karplus-Strong brillante) y el pequeño «doblado» de tono del ataque."""
    n = int(SR * seconds)
    period = SR / freq
    buf = RNG.uniform(-1, 1, int(round(period)))
    buf = buf - lowpass(buf, 3000) * 0.3
    out = np.empty(n)
    size = len(buf)
    for i in range(n):
        out[i] = buf[i % size]
        buf[i % size] = 0.4992 * (buf[i % size] + buf[(i + 1) % size])
    t = t_axis(seconds)
    bend = np.sin(glide(freq * 1.03, freq, seconds, curve=12)) * decay(t, 0.5)  # la nota cae un poco al pulsarla
    pick = bandpass(RNG.standard_normal(n), 1500, 6000) * decay(t, 0.008) * 0.6
    return fade(out * 0.8 + bend * 0.35 + 0.15 * np.sin(2 * np.pi * freq * 2 * t) * decay(t, 0.25) + pick, 0.001, 0.12)


def flauta_bambu(freq=880.0, seconds=1.0):
    """Flauta de bambú: mucho aire, entrada que sube desde un poco más grave y vibrato tardío."""
    t = t_axis(seconds)
    scoop = 1 - 0.03 * np.exp(-t / 0.06)
    vibrato = 1 + 0.008 * np.sin(2 * np.pi * 5.0 * t) * np.clip((t - 0.25) / 0.3, 0, 1)
    phase = 2 * np.pi * np.cumsum(freq * scoop * vibrato) / SR
    tone = np.sin(phase) + 0.12 * np.sin(2 * phase) + 0.05 * np.sin(3 * phase)
    breath = bandpass(RNG.standard_normal(len(t)), freq * 0.8, freq * 4) * (0.16 + 0.12 * np.exp(-t / 0.08))
    env = np.clip(t / 0.06, 0, 1) * np.clip((seconds - t) / 0.25, 0, 1)
    return (tone + breath) * env


def taiko(seconds=0.8):
    """Tambor grande: parche grave que cae de tono, golpe de maza y cuerpo de madera."""
    t = t_axis(seconds)
    body = np.sin(glide(140, 52, seconds, curve=6)) * decay(t, 0.28)
    overtone = 0.3 * np.sin(glide(310, 150, seconds, curve=6)) * decay(t, 0.07)
    thump = lowpass(RNG.standard_normal(len(t)), 600) * decay(t, 0.03) * 1.4
    return fade(body * 1.2 + overtone + thump, 0.0005, 0.1)


def bajo(freq=146.83, seconds=0.6):
    """Bajo redondo y corto, con un poco de púa."""
    t = t_axis(seconds)
    sig = np.sin(2 * np.pi * freq * t) * decay(t, 0.3) + 0.35 * np.sin(4 * np.pi * freq * t) * decay(t, 0.12)
    sig += 0.12 * np.sin(6 * np.pi * freq * t) * decay(t, 0.05)
    return fade(sig + bandpass(RNG.standard_normal(len(t)), 300, 1500) * decay(t, 0.006) * 0.3, 0.001, 0.06)


def buzz(f0, f1, seconds, flutter=34.0, bright=1800):
    """Zumbido de abeja: diente de sierra filtrado con el aleteo de las alas."""
    t = t_axis(seconds)
    phase = glide(f0, f1, seconds, curve=1.0)
    saw = 2 * ((phase / (2 * np.pi)) % 1) - 1
    wings = 0.65 + 0.35 * np.sin(2 * np.pi * flutter * t)
    return bandpass(saw, 120, bright) * wings


def zumbido(seconds=0.7):
    sig = buzz(170, 190, seconds, flutter=30, bright=1200)
    t = t_axis(seconds)
    return fade(sig * np.clip(t / 0.08, 0, 1) * np.clip((seconds - t) / 0.2, 0, 1), 0.01, 0.05)


def zum(seconds=0.24):
    """«¡zum!»: la flor sale disparada con un zumbido que sube."""
    t = t_axis(seconds)
    sig = buzz(240, 460, seconds, flutter=40, bright=2600) * np.clip(t / 0.02, 0, 1) * decay(t, 0.12)
    whoosh = bandpass(RNG.standard_normal(len(t)), 800, 4000) * np.sin(np.pi * t / seconds) * 0.25
    return fade(sig + whoosh, 0.002, 0.04)


def zum_zum():
    a, b = zum(0.2), zum(0.22) * 0.9
    out = np.zeros(int(SR * 0.42))
    out[:len(a)] += a
    start = int(SR * 0.17)
    out[start:start + len(b)] += b
    return out


def campanita(freq, seconds, tau):
    t = t_axis(seconds)
    return sum(amp * np.sin(2 * np.pi * freq * ratio * t) * decay(t, tau / k) for k, (ratio, amp) in enumerate(((1, 1.0), (2.76, 0.5), (5.4, 0.25)), start=1))


def bzz_tin(seconds=0.6):
    """«¡bzz-tin!»: la mariquita llega zumbando y saluda con una campanita."""
    out = np.zeros(int(SR * seconds))
    b = buzz(400, 370, 0.16, flutter=46, bright=3000)
    out[:len(b)] += b * 0.7 * np.clip(np.linspace(1, 0, len(b)) * 2, 0, 1)
    start = int(SR * 0.13)
    bell = campanita(2093, seconds - 0.13, 0.25)
    out[start:start + len(bell)] += bell * 0.8
    return fade(out, 0.002, 0.05)


def shing(seconds=0.42):
    """«¡shing!»: el aguijón corta el aire con un brillo metálico."""
    t = t_axis(seconds)
    air = bandpass(RNG.standard_normal(len(t)), 2500, 9000) * np.clip(t / 0.01, 0, 1) * decay(t, 0.06)
    metal = sum(amp * np.sin(glide(f * 0.9, f, seconds, curve=4)) * decay(t, tau)
                for f, amp, tau in ((2600, 0.5, 0.18), (3910, 0.35, 0.12), (5270, 0.25, 0.08), (7130, 0.15, 0.05)))
    return fade(air * 0.8 + metal, 0.0005, 0.08)


def toque_sordo(seconds=0.22):
    """Toque sordo del «¡Uy!»: un golpecito grave y apagado, sin castigo."""
    t = t_axis(seconds)
    thump = np.sin(glide(120, 70, seconds, curve=3)) * decay(t, 0.05)
    return fade(lowpass(thump + RNG.standard_normal(len(t)) * 0.05 * decay(t, 0.015), 800), 0.002, 0.04)


def plof(seconds=0.32):
    """«plof»: la flor cae al suelo sobre la hierba."""
    t = t_axis(seconds)
    drop = np.sin(glide(320, 110, seconds, curve=2)) * decay(t, 0.07)
    grass = lowpass(RNG.standard_normal(len(t)), 1200) * decay(t, 0.05) * 0.6
    return fade(drop + grass, 0.002, 0.05)


def fanfarria(seconds=2.0):
    """Fanfarria de cierre: arpegio de koto, golpe de taiko y lluvia de campanillas."""
    out = np.zeros(int(SR * seconds))
    for k, freq in enumerate((293.66, 440.0, 587.33, 739.99, 880.0, 1174.66)):
        note = koto(freq, 1.2) * (0.7 if k < 5 else 1.0)
        start = int(SR * 0.09 * k)
        out[start:start + len(note)] += note[:len(out) - start]
    drum = taiko(0.8)
    start = int(SR * 0.45)
    out[start:start + len(drum)] += drum * 0.9
    for k in range(8):
        bell = campanita(2093 * 2 ** ((k % 4) / 12 * 3), 0.6, 0.18) * 0.18
        start = int(SR * (0.5 + 0.07 * k))
        out[start:start + len(bell)] += bell[:len(out) - start]
    return fade(out, 0.001, 0.3)


SAMPLES = {
    "koto-re5": koto,
    "flauta-bambu-la5": flauta_bambu,
    "taiko": taiko,
    "bajo-re3": bajo,
    "zumbido": zumbido,
    "zum": zum,
    "zum-zum": zum_zum,
    "bzz-tin": bzz_tin,
    "shing": shing,
    "toque-sordo": toque_sordo,
    "plof": plof,
    "fanfarria": fanfarria,
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


if __name__ == "__main__":
    main()
