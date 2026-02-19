# Sound effects

## Single-file sounds

Place `.mp3`, `.wav`, `.ogg`, `.m4a`, or `.webm` files here to list them in the "Typing sound" dropdown. One sample is played for every key.

## 9-point positional packs

A **pack** is a subfolder with exactly 10 samples. The app analyzes each sample (pitch, spectral centroid, RMS, fade-out) and for every other key computes **target properties = weighted average** of the 9 point samples by distance. It then plays the **nearest** sample with playback rate and volume adjusted so it matches that target (e.g. pitch ratio, loudness ratio).

### Required files (any supported audio extension)

| Name (no extension) | Role | Layout key (US) |
|---------------------|------|------------------|
| `nw` | North-west | ` ~ |
| `n` | North | 7 |
| `ne` | North-east | + = |
| `w` | West | a |
| `c` | Center | h |
| `e` | East | ' |
| `sw` | South-west | z |
| `s` | South | b |
| `se` | South-east | ? / |
| `space` | Spacebar | Space |

Example: `public/sfx/cherry vintage brown/nw.wav`, `n.wav`, … `space.wav`.

On first load of a pack, the app analyzes all samples once and caches the per-key playback settings so typing stays responsive.
