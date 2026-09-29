# SylCapture

Screenshots and screen recordings. `sylvaris capture toggle` opens a small panel; for keys, use the commands directly:

```sh
sylvaris capture shot area       # also: window, screen
sylvaris capture record area     # also: screen
sylvaris capture stop
sylvaris capture edit [file]
```

Shots can be an area, a window (click it) or the whole screen, with an optional delay. They are copied and saved to `~/Pictures/Screenshots`. Recordings of an area or a screen, with sound if you like, go to `~/Videos/Recordings`, and a red pill with the time lets you stop them. With [SylIsland](island.md) on, the recording shows in the island instead.

## Recordings you can share

Recordings are made to upload cleanly to chat apps, video sites and phones:

- standard colour (`yuv420p`, TV range), so nothing is rejected or washed out
- at most 60 frames per second unless you pick more
- the MP4 index moved to the front of the file, so web players can start before the upload finishes
- with **Copy to the clipboard** on, the finished file is copied as a file, so you can paste it straight into Discord, a browser upload field or a file manager

The fix-up after recording needs `ffmpeg`. Without it the recording is still saved, just without the moved index.

## The editor

`sylvaris capture edit` opens the last screenshot, or any image you name, in the editor. It has a pen, highlighter, line, arrow, rectangle, ellipse, text, pixelate and crop, a colour row that starts with your theme's accent, three widths, and undo and redo for every step. Copy puts the result on the clipboard; Save writes it next to the original as `… edited.png`, at full resolution.

Keys: `P` `H` `L` `A` `R` `E` `T` `X` `C` pick a tool, `1` to `3` the width, `Ctrl+Z` and `Ctrl+Shift+Z` undo and redo, `Delete` clears, `Ctrl+C` copies, `Ctrl+S` saves, `Esc` closes. Set `capture.after` to `edit` to open every new screenshot in it.

## Settings

| Setting | Default | Values |
|---|---|---|
| `capture.folder`, `capture.videos` | `~/Pictures/Screenshots`, `~/Videos/Recordings` | any folder |
| `capture.copy`, `capture.save` | `true`, `true` | copy to the clipboard, save a file |
| `capture.format`, `capture.quality` | `png`, `90` | `png` or `jpeg`; JPEG quality 1 to 100 |
| `capture.cursor` | `false` | include the pointer |
| `capture.scale` | `0` | `0` (sharpest screen scale), `0.5`, `1`, `2` |
| `capture.delay` | `0` | `0`, `3`, `5`, `10` seconds |
| `capture.after` | `notify` | `notify`, `edit`, `none` |
| `capture.pattern` | `{kind} {date} {time}` | file name; `{kind}`, `{date}` and `{time}` are filled in |
| `capture.fps` | `0` | `0` (Auto: only when the screen changes, at most 60), `24`, `30`, `60`, `120` |
| `capture.resolution` | `native` | `native`, `2160`, `1440`, `1080`, `720` |
| `capture.codec` | `h264` | `h264`, `h265`, `vp9` (saved as WebM), `vaapi` (H.264 on the GPU) |
| `capture.container` | `mp4` | `mp4`, `mkv` |
| `capture.videoQuality` | `balanced` | `high`, `balanced`, `small` |
| `capture.audio`, `capture.audioSource` | `false`, `output` | record sound from the `output` or the `mic` |
| `capture.constant` | `false` | record every frame for a steady frame rate |
| `capture.countdown` | `0` | `0`, `3`, `5`, `10` seconds before recording starts |
| `capture.limit` | `0` | stop after `1`, `5`, `10`, `30` or `60` minutes; `0` never |

H.264 in MP4 plays almost everywhere. H.265 and MKV are smaller or more flexible, but many websites and phones refuse them. `placement.capture` sets where the panel opens.
