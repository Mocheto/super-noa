set -x
node medir.mjs /private/tmp/claude-502/-Users-03558996-IdeaProjects-mocheto-schedule-io/d87f7e0a-ad1e-4c38-9e4f-15995910ffbb/scratchpad/dist-medir r/tab-gpu --viewports=800x1280 --dpr=2.25 --rates=4,6 --seconds=10 --shots=1
node medir.mjs /private/tmp/claude-502/-Users-03558996-IdeaProjects-mocheto-schedule-io/d87f7e0a-ad1e-4c38-9e4f-15995910ffbb/scratchpad/dist-medir r/tab-sw --viewports=800x1280 --dpr=2.25 --rates=4,6 --seconds=10 --sw=1
node medir.mjs /private/tmp/claude-502/-Users-03558996-IdeaProjects-mocheto-schedule-io/d87f7e0a-ad1e-4c38-9e4f-15995910ffbb/scratchpad/dist-medir r/tab-gpu-traza --viewports=800x1280 --dpr=2.25 --rates=6 --seconds=8 --trace=1
node medir.mjs /private/tmp/claude-502/-Users-03558996-IdeaProjects-mocheto-schedule-io/d87f7e0a-ad1e-4c38-9e4f-15995910ffbb/scratchpad/dist-medir r/tab-sw-traza --viewports=800x1280 --dpr=2.25 --rates=6 --seconds=8 --trace=1 --sw=1
for e in ninguno velo contornos halos halos-sprite velo,contornos,halos-sprite; do
  for m in 0 1; do node medir-efectos.mjs /private/tmp/claude-502/-Users-03558996-IdeaProjects-mocheto-schedule-io/d87f7e0a-ad1e-4c38-9e4f-15995910ffbb/scratchpad/dist-medir r/ef-$e-sw$m --screens=5-3 --viewports=800x1280 --dpr=2.25 --rates=6 --seconds=8 --trace=1 --sw=$m --efectos=$e; done
done
python3 analizar.py r/tab-*.trace.json r/ef-*.trace.json > r/analisis2.txt
