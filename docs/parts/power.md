# SylPower

`sylvaris power`, the `power` bar module or the deck's power button opens SylPower: your avatar and uptime in the middle, with the actions orbiting around it. Arrows or the mouse choose, Enter confirms, and each action has a letter: L lock, S suspend, H hibernate, O log out, R restart, F firmware, P shut down.

Anything that closes your session counts down first. Press again to do it now, or Esc to stay.

| Key (`power.`) | Default | Meaning |
|---|---|---|
| `actions` | `["lock", "suspend", "logout", "reboot", "shutdown"]` | which actions show, from `lock`, `suspend`, `hibernate`, `logout`, `reboot`, `firmware`, `shutdown` |
| `confirm` | `true` | count down before log out, restart, shut down and hibernate |
| `countdown` | `3` | seconds |
| `commands` | `{}` | replace a command, such as `{ "lock": "hyprlock" }` |

`sylvaris power list` prints the actions and `sylvaris power run <action>` runs one without the menu. Lock runs `lockCommand` from `config.json`; set it to `sylvaris lock` to use [SylLock](lock.md).
