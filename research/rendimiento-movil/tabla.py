import json,glob,os
exec(open('analizar.py').read().split('if __name__')[0])
NOM={'5-3':'5-3 cañones','10-3':'10-3 lava','2-3':'2-3 niebla','9-2':'9-2 exploración','casa':'casa (5 gatitos)'}
def carga(pref):
  return {(r['screen'],r['viewport'],r['rate']):r for r in json.load(open(f'r/{pref}.json'))} if os.path.exists(f'r/{pref}.json') else {}
cache={}
def traza(pref,s,vp,rate):
  f=f'r/{pref}-{s}-{vp}-x{rate}.trace.json'
  if not os.path.exists(f): return None
  if f not in cache: cache[f]=analizar(f)
  return cache[f]
out=[]
for modo,pm,pt in [('GPU','gpu','gpu-traza'),('software','sw','sw-traza')]:
  out.append(f'\n### Lienzo por {modo}\n')
  out.append('| Pantalla | Tamaño | CPU | fps | Intervalo media / p95 (ms) | Cuadros perdidos | JS del juego media / p95 (ms) | Hilo principal media / p95 (ms) | Libre a p95 (ms) |')
  out.append('|---|---|---|---|---|---|---|---|---|')
  for vp in ['375x812','740x340','800x1280']:
    m=carga(pm) if vp!='800x1280' else carga('tab-'+pm)
    for s in ['5-3','10-3','2-3','9-2','casa']:
      for rate in [4,6]:
        r=m.get((s,vp,rate))
        if not r: continue
        t=traza(pt if vp!='800x1280' else 'tab-'+pt,s,vp,rate)
        hp=f"{t['main']['mean']:.1f} / {t['main']['p95']:.1f}" if t else '—'
        libre=f"{16.7-t['main']['p95']:.1f}" if t else '—'
        out.append(f"| {NOM[s]} | {vp.replace('x','×')} | ×{rate} | {r['fps']:.1f} | {r['interval']['mean']:.1f} / {r['interval']['p95']:.1f} | {r['lost']} ({r['lostPct']:.1f} %) | {r['work']['mean']:.2f} / {r['work']['p95']:.2f} | {hp} | {libre} |")
out.append('\n### Desglose del hilo principal a ×6 (ms por cuadro, media)\n')
out.append('| Pantalla | Tamaño | Lienzo | Total | JS | Volcado del lienzo | Decodificar imágenes | Pintado DOM | Estilo | Commit | GC | Otros | Peor cuadro (ms) | GPU proc. media |')
out.append('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
for modo,pt in [('GPU','gpu-traza'),('software','sw-traza')]:
  for vp in ['375x812','740x340','800x1280']:
    for s in ['5-3','10-3','2-3','9-2','casa']:
      t=traza(pt if vp!='800x1280' else 'tab-'+pt,s,vp,6)
      if not t: continue
      d=t['desglose']; g=lambda k: f"{d.get(k,0):.2f}"
      out.append(f"| {NOM[s]} | {vp.replace('x','×')} | {modo} | {t['main']['mean']:.1f} | {g('js')} | {g('lienzo')} | {g('decodificar')} | {g('pintado')} | {g('estilo')} | {g('commit')} | {g('gc')} | {g('otros')} | {t['main']['max']:.0f} | {t['gpu']['mean']:.1f} |")
out.append('\n### Efectos de prueba en 5-3, 800×1280, ×6\n')
out.append('| Efecto | Lienzo | Hilo principal media / p95 (ms) | Volcado del lienzo (ms) | Coste extra sobre «ninguno» (media, ms) | GPU proc. media (ms) |')
out.append('|---|---|---|---|---|---|')
for m,modo in [('0','GPU'),('1','software')]:
  base=None
  for e in ['ninguno','velo','contornos','halos','halos-sprite','velo,contornos,halos-sprite']:
    t=traza(f'ef-{e}-sw{m}','5-3','800x1280',6)
    if not t: continue
    if base is None: base=t['main']['mean']
    out.append(f"| {e} | {modo} | {t['main']['mean']:.1f} / {t['main']['p95']:.1f} | {t['desglose'].get('lienzo',0):.2f} | {t['main']['mean']-base:+.1f} | {t['gpu']['mean']:.1f} |")
print('\n'.join(out))
