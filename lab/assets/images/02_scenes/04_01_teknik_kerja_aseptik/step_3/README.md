# Langkah 3 "Membersihkan Meja Kerja" - asset provenance

Figma: file `6En2q7upHv4JMs1gBaC0IV`, canvas `42:678`, frame `61:541`
"LANGKAH 3 NEW" (1920x1080).

Every file here is now a real export. The stand-ins the first pass authored -
and the `*.svg` sources they were rasterised from - have been deleted.

| File | Figma node | Shown during |
| --- | --- | --- |
| `backgrounds/1.png` | `229:13` `BG_1_1_` | phase `spray` - bench dirty, analyst idle |
| `backgrounds/2.png` | `229:12` `BG_2` | phase `wipe` - analyst spraying and wiping |
| `backgrounds/3.png` | `229:11` `BG_3_2_` | phase `done` - bench clean, thumbs up |
| `alcohol_spray.png` | `229:595` `alkohol_2_` | the spray phase's tool |
| `cloth.png` | - | the wipe phase's tool |

## The bench rect is per background

`BG_LANGKAH_3`'s three rasters are not registered to each other. The painted
slab sits at y 635..694 on plate 1, y 591..659 on plate 2 and y 607..676 on
plate 3 - up to 44 design px apart. So each plate carries its own bench rect in
`CleanFrame.surface` (`src/data/stages/teknikAseptik.ts`) instead of the step
carrying one; a single rect would leave the grime and the sweep strip floating
above the table for the whole wipe phase.

The bench has no Figma node of its own - it is painted into the background - so
each rect is measured off its own raster. The slab is a trapezoid in
perspective and the rect is its narrower back edge, so no part of the strip
hangs off the painted table.

Both ends are then clipped to the gap between the two cards that sit above the
strip: the PROSEDUR card ends at x 556.489 and the floating card starts at
x 1428.65. The slab itself reaches x 506 on every plate, but a strip starting
there would put its first segment underneath the PROSEDUR card, where a press
lands on the card and never reaches the bench.

## Tool exports carry 8px of transparent padding, no more

Both tools arrived with large transparent margins - the cloth's ink occupied
only the bottom 55% of its 865x1008 canvas - which floated it below the pointer
while dragging and left a gap above it in the card's tool panel. Both were
cropped to their alpha bounding box plus a uniform 8px margin, matching the
Langkah 2 items:

| File | As delivered | Cropped | Drawn at (design px) |
| --- | --- | --- | --- |
| `alcohol_spray.png` | 694x1008 | 612x949 | 123 x 190 |
| `cloth.png` | 865x1008 | 763x572 | 170 x 128 |

Re-exports need the same crop, or the `width`/`height` in `CLEAN_BENCH_STEP.tools`
stop describing the ink.
