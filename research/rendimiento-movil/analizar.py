import json,sys,collections,bisect
CAT={'FireAnimationFrame':'js','FunctionCall':'js','EventDispatch':'js','v8.callFunction':'js','TimerFire':'js','v8.run':'js','EvaluateScript':'js',
 'Decode Image':'decodificar','ImageDecoder::DecodeFrameBufferAtIndex':'decodificar','Decode LazyPixelRef':'decodificar','GpuImageDecodeCache::DecodeImage':'decodificar',
 'Canvas2DResourceProviderSharedImage::ProduceCanvasResource':'lienzo','RasterImplementation::RasterCHROMIUM':'lienzo','CanvasResourceProvider::FlushCanvas':'lienzo','Canvas2DLayerBridge::PrepareTransferableResource':'lienzo',
 'UpdateLayoutTree':'estilo','Layout':'estilo','RecalcStyle':'estilo','ParseHTML':'estilo',
 'PrePaint':'pintado','Paint':'pintado','Layerize':'pintado','LocalFrameView::RunPaintLifecyclePhase':'pintado','LocalFrameView::RunPrePaintLifecyclePhase':'pintado',
 'Commit':'commit','MinorGC':'gc','MajorGC':'gc','V8.GC_SCAVENGER':'gc','V8.GCScavenger':'gc','BlinkGC.AtomicPhase':'gc','V8.GCFinalizeMC':'gc','V8.GC_MC_BACKGROUND':'gc'}
TOP=('ThreadControllerImpl::RunTask','RunTask')
def stat(a):
  a=sorted(a); n=len(a)
  return dict(mean=sum(a)/n, p95=a[min(n-1,int(.95*n))], max=a[-1]) if n else {}
def analizar(f):
  ev=json.load(open(f)); names={}
  for e in ev:
    if e.get('ph')=='M' and e['name']=='thread_name': names[(e['pid'],e['tid'])]=e['args']['name']
  marks=sorted(e['ts'] for e in ev if e['name']=='cuadro' and e.get('ph') in ('R','I','i','n','b'))
  main=[k for k,v in names.items() if v=='CrRendererMain']
  # el hilo principal con marcas
  mk=collections.Counter((e['pid'],e['tid']) for e in ev if e['name']=='cuadro'); main=mk.most_common(1)[0][0]
  def busy(thread_name_or_key):
    keys=[thread_name_or_key] if isinstance(thread_name_or_key,tuple) else [k for k,v in names.items() if v==thread_name_or_key]
    per=[0.0]*(len(marks)-1)
    for e in ev:
      if (e['pid'],e['tid']) in keys and e.get('ph')=='X' and e['name']==TOP[0]:
        i=bisect.bisect_right(marks,e['ts'])-1
        if 0<=i<len(per): per[i]+=e.get('dur',0)/1000
    return per
  # desglose del hilo principal: tiempo propio asignado al antepasado más cercano con categoría
  xs=sorted([e for e in ev if (e['pid'],e['tid'])==main and e.get('ph')=='X' and marks[0]<=e['ts']<marks[-1]],key=lambda e:(e['ts'],-e.get('dur',0)))
  cat=collections.Counter(); stack=[]
  for e in xs:
    end=e['ts']+e.get('dur',0)
    while stack and stack[-1][1]<=e['ts']:
      stack.pop()
    parentcat=stack[-1][2] if stack else None
    c=CAT.get(e['name'],parentcat if parentcat else ('otros' if e['name'] in TOP else None))
    if stack: stack[-1][3]-=e.get('dur',0) if e['ts']+e.get('dur',0)<=stack[-1][1] else 0
    item=[e,end,c,e.get('dur',0)]
    stack.append(item)
    # acumular al cerrar: aproximación: sumar propio al final
    e['_item']=item
  for e in xs:
    it=e['_item']
    if it[2] and it[3]>0: cat[it[2]]+=it[3]/1000
  n=len(marks)-1
  return dict(frames=n, main=stat(busy(main)), gpu=stat(busy('CrGpuMain')), viz=stat(busy('VizCompositorThread')), comp=stat(busy('Compositor')),
              desglose={k:round(v/n,2) for k,v in cat.most_common()})
if __name__=='__main__':
  for f in sys.argv[1:]:
    r=analizar(f); print(f.split('/')[-1], json.dumps(r))
