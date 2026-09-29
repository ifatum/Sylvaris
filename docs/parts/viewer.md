# SylViewer

An image and video viewer that opens over the desktop.

```sh
sylvaris viewer open ~/Pictures/holiday.jpg
```

It takes an absolute path or a `file://` link. The arrow keys, the scroll wheel and the buttons at the bottom step through the other images and videos in the same folder, in the order a person would sort them (2 before 10). Esc or a click beside the picture closes it.

It opens PNG, JPEG, GIF, BMP, WebP, SVG, TIFF, TGA and ICO images (GIF and WebP animate), and MP4, M4V, MKV, WebM, MOV, AVI, OGV, MPEG, WMV and FLV videos.

## Videos

Videos play with a seek bar, the time, mute and loop. Space plays and pauses, M mutes. Playback needs Qt Multimedia; the Nix package brings it along, other installs need their distribution's `qt6-multimedia` package.

## The bar

| Button | Key | Does |
|---|---|---|
| Copy | Ctrl+C | copies an image as a picture, a video as a file |
| Open with | | lists the other image or video apps installed and opens the file in the one you pick |
| Show in folder | | opens the folder in your file manager |
| Set as wallpaper | | hands the image to [SylPaper](paper.md) |
| Move to trash | Delete | press twice; the next file shows |

## Open files with it by default

File managers open images and videos in SylViewer once it is their default app. With Home Manager:

```nix
programs.sylvaris.defaultViewer = true;
```

This needs `xdg.mimeApps.enable = true`. Without Home Manager, choose SylViewer under Open With in your file manager and make it the default.

## Settings

| Key | Default | Meaning |
|---|---|---|
| `viewer.autoplay` | `true` | start videos right away |
| `viewer.loop` | `true` | play videos again from the start |
| `viewer.muted` | `false` | start videos without sound |

```sh
sylvaris viewer next          # also: prev
sylvaris viewer play          # play or pause the video
sylvaris viewer copy          # also: wallpaper, trash
sylvaris viewer state
sylvaris viewer close
sylvaris set parts.viewer false
```
