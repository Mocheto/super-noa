set -x
node medir.mjs /private/tmp/claude-502/-Users-03558996-IdeaProjects-mocheto-schedule-io/d87f7e0a-ad1e-4c38-9e4f-15995910ffbb/scratchpad/dist-medir r/gpu --rates=4,6 --seconds=10 --shots=1
node medir.mjs /private/tmp/claude-502/-Users-03558996-IdeaProjects-mocheto-schedule-io/d87f7e0a-ad1e-4c38-9e4f-15995910ffbb/scratchpad/dist-medir r/sw --rates=4,6 --seconds=10 --sw=1
node medir.mjs /private/tmp/claude-502/-Users-03558996-IdeaProjects-mocheto-schedule-io/d87f7e0a-ad1e-4c38-9e4f-15995910ffbb/scratchpad/dist-medir r/gpu-traza --rates=1,4,6 --seconds=8 --trace=1
node medir.mjs /private/tmp/claude-502/-Users-03558996-IdeaProjects-mocheto-schedule-io/d87f7e0a-ad1e-4c38-9e4f-15995910ffbb/scratchpad/dist-medir r/sw-traza --rates=6 --seconds=8 --trace=1 --sw=1
python3 analizar.py r/*.trace.json > r/analisis.txt
