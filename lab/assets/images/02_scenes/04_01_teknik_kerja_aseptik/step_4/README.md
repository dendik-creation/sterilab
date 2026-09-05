# Langkah 4 "Menyalakan Bunsen" - asset provenance

Figma: file `6En2q7upHv4JMs1gBaC0IV`, canvas `42:678`, frame `61:542`
"LANGKAH 4 NEW" (1920x1080).

| File | Figma node | Shown during |
| --- | --- | --- |
| `backgrounds/1.png` | `231:610` | burner unlit; analyst holds a lit match |
| `backgrounds/2.png` | `231:611` | burner lit and stable; analyst gives a thumbs-up |

The burner is painted into both full-frame rasters and shifts horizontally
between them, so each frame has its own measured burner and wick coordinates in
`src/data/stages/teknikAseptik.ts`.

The flame transition, movable cap, flame-cover patch, and smoke are DOM/SVG in
`Prosedur04MenyalakanBunsen.tsx`; there are no additional raster assets. The lit
plate already contains a painted flame, so the patch samples a clean vertical
band from that same plate while the cap covers the flame base.
