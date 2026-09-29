# SylMedia

Right-click the media item in SylBar, click the media card in SylCenter, or run `sylvaris media open [playing|sound|devices]`.

## Playing

The artwork, a seek bar, previous, play and next, shuffle and repeat when the player supports them, the player's own volume, and a switch between players. Everything comes from MPRIS, so it works with Spotify, Cider, browsers, mpv and the rest.

```sh
sylvaris media toggle      # play or pause (also: next, previous)
sylvaris media seek 90     # jump to 1:30
```

## Sound

A 10-band equalizer (31 Hz to 16 kHz, ±12 dB) with presets, for everything you hear. Sylvaris runs it as a small PipeWire filter, makes it the default output and sends it on to the device you picked. Choosing another output in SylCenter moves the equalizer with it, and turning it off brings your normal output back. Changes apply a moment after you let go of a slider.

```sh
sylvaris eq preset rock    # also: on, off, toggle
sylvaris eq band 3 4       # band 1 to 10, in dB
sylvaris eq spatial on
```

**Spatial audio** is headphone crossfeed. A little of each channel, low-passed and delayed by a fraction of a millisecond, reaches the other ear, so music sounds like speakers in front of you rather than inside your head. Apple's own Spatial Audio with head tracking is rendered by Apple devices, not by the AirPods, so no Linux shell can switch it on; this is the local equivalent.

## Devices

With the [AirPods plugin](../plugins/airpods.md) on, AirPods and Beats get their own card while they are connected. Below that is the battery of every device that reports one: mice, keyboards, controllers, headsets and the laptop battery.

SylMedia opens where SylCenter does, unless you give it its own spot with `placement.media` (see [where panels open](../configuration.md#where-panels-open)).
