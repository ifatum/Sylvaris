# SylRGB

One place for the lights on your mouse, keyboard, headset, memory, graphics card, motherboard, cooler and LED strips. SylRGB decides the colours; [OpenRGB](https://openrgb.org) talks to the hardware, so every device OpenRGB supports works here (several hundred, from SteelSeries, Logitech, Razer, Corsair, HyperX, ASUS, MSI, Gigabyte, Kingston and many others).

## Set it up

1. Install OpenRGB and turn on its SDK server. On NixOS that is one line, which also runs it as a service that can reach every device:

   ```nix
   services.hardware.openrgb.enable = true;
   ```

   Elsewhere, install `openrgb` from your distribution and either run `openrgb --server` at login or open OpenRGB and start the server in its SDK Server tab. Its udev rules (installed with the package) let it reach USB devices without root.
2. Turn SylRGB on in SylSettings › Plugins or with `sylvaris plugins enable rgb`.
3. Open it with `sylvaris rgb open`, from the Lighting tile in SylCenter, or from SylSettings › Lighting.

SylRGB needs `python3` (already there for other parts) and nothing else; it speaks OpenRGB's network protocol itself.

## What it does

- **One colour for everything**, from the swatches, a hex code or your theme: with "Follow the theme" on, every device takes the theme's accent colour and changes with it.
- **Brightness** scales every colour it sends.
- **Each device on its own**: tap a device for its own colour or one of its effects (breathing, spectrum and whatever else the device offers), or switch it off with its toggle.
- **Lights off** turns every device dark and back with one switch, also from SylCenter and `sylvaris rgb off`.
- **OpenRGB profiles** you saved in OpenRGB load with one tap. Loading one clears the colours picked in SylRGB, so the two never fight.
- **Colours come back** when Sylvaris starts and whenever a device reconnects, for example a wireless mouse waking up. Turn this off in SylSettings › Lighting if you would rather keep whatever the device shows.

Until you pick something, SylRGB leaves every device exactly as it is.

## Commands

```sh
sylvaris rgb                                   # state as JSON
sylvaris rgb open                              # the panel (also: toggle, close)
sylvaris rgb list                              # devices and their effects
sylvaris rgb color ff8800                      # every device
sylvaris rgb color 00c7be "Krux Atax Pro RGB"  # one device
sylvaris rgb mode Breathing                    # every device that has it
sylvaris rgb mode "Spectrum Cycle" "Krux Atax Pro RGB"
sylvaris rgb follow on                         # use the theme's accent colour
sylvaris rgb brightness 40
sylvaris rgb off                               # also: on
sylvaris rgb profile Evening                   # load an OpenRGB profile
```

Names with spaces go in quotes. `sylvaris watch rgb` streams changes.

## Settings

Everything lives under `rgb` in `settings.json`: `on`, `color`, `follow`, `brightness`, `restore`, `devices` (per-device `off`, `color` and `mode`, keyed by the name OpenRGB shows), `host` and `port` (the SDK server, `127.0.0.1:6742` by default; another computer's address works too). `placement.rgb` sets where the panel opens, and `center.extra` can hold the `rgb` tile.

## Devices that need a hand

**SteelSeries Rival 3 Wireless and Aerox 3 Wireless.** Both use the same 2.4 GHz dongle, so OpenRGB lists the mouse as "SteelSeries Aerox 3 Wireless" either way. Colours set while the mouse sleeps show up as soon as it wakes, because SylRGB puts them back when the device reconnects.

**Krux Atax Pro RGB** (USB `3299:2736`). It uses the same EVision V2 controller as the Endorfy Omnis, which OpenRGB 1.0 already drives, but OpenRGB does not list its ID yet. Until it does, add the ID with a small patch. On NixOS:

```nix
services.hardware.openrgb.package = pkgs.openrgb.overrideAttrs (old: {
  postPatch = (old.postPatch or "") + ''
    echo 'REGISTER_HID_DETECTOR_IP("Krux Atax Pro RGB", DetectEVisionV2Keyboards, SPCGEAR_VID, 0x2736, 1, EVISION_KEYBOARD_USAGE_PAGE);' \
      >> Controllers/EVisionKeyboardController/EVisionV2KeyboardController/EVisionV2KeyboardControllerDetect.cpp
  '';
});
```

On other distributions, add the same line to that file and build OpenRGB from source. Whole-keyboard colours and effects work this way; if single keys light up in the wrong places, the key layout differs from the generic one and is worth reporting to OpenRGB.

**A device OpenRGB does not see.** Check OpenRGB's own window first: if it is not listed there, SylRGB cannot see it either. [OpenRGB's supported devices](https://openrgb.org/devices.html) lists what works, and its issue tracker is where new devices get added.
