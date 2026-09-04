# Langkah 3 "Membersihkan Meja Kerja" - asset provenance

Figma: file `6En2q7upHv4JMs1gBaC0IV`, canvas `42:678`, frame `61:541`
"LANGKAH 3 NEW" (1920x1080).

| File | Origin | Figma node to replace it from |
| --- | --- | --- |
| `backgrounds/1.png` | **authored here**, not a Figma export | `229:10` `BG_LANGKAH_3` (three stacked rasters: `229:11` `BG_3_2_`, `229:12` `BG_2`, `229:13` `BG_1_1_`) |
| `alcohol_spray.png` | **authored here**, not a Figma export | `229:595` `alkohol_2_` (212.612 x 190.629 incl. its spray mist) |
| `cloth.png` | authored here; the frame has no cloth layer at all | - |

`backgrounds/1.png` and `alcohol_spray.png` are stand-ins. The session that
built this Screen could not export the real art: outbound HTTPS to
`www.figma.com` is refused by the egress policy (403 on CONNECT), and every
asset URL the Figma MCP server hands back is on that host. The geometry is
*not* guessed, though - the table surface the interaction targets was measured
off a render of the real frame and lands at design rect
`x 562, y 632, w 910, h 57`, so dropping the real export in at the same path
lines the dirt, spray and wipe up with the painted table without touching code.

The stand-in deliberately leaves out the analyst standing behind the bench:
inventing a character would have been a worse lie than an empty room.

`backgrounds/1.svg` and the `*.svg` beside each PNG are the sources the PNG was rasterised from (Chromium at
1x). Delete both the SVG and the PNG when the real export lands.
