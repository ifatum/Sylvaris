# AirPods

With this plugin on, AirPods and Beats get their own card in SylMedia › Devices while they are connected:

- battery for each bud and the case
- listening mode: off, transparency, adaptive or noise cancellation
- conversation awareness

Turn it on in SylSettings › Plugins or with `sylvaris plugins enable airpods`. Sylvaris talks to the headphones directly over Apple's accessory protocol, as documented by the LibrePods project, and finds them by name. To pick a device yourself, set `media.airpods` to its Bluetooth address.

```sh
sylvaris headphones noise anc          # off, transparency, adaptive, anc
sylvaris headphones awareness on       # also: off
sylvaris headphones state
```

SylCenter can get an AirPods tile (`center.extra`): the icon switches between noise cancellation and transparency, and the tile opens SylMedia › Devices.

Apple's Spatial Audio with head tracking is rendered by Apple devices, not by the AirPods, so it cannot be switched on from Linux. SylMedia's own spatial audio is a crossfeed that works with any headphones.

AirPods, Beats and FaceTime are trademarks of Apple Inc. Sylvaris is not affiliated with Apple.
