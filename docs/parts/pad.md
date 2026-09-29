# SylPad

`sylvaris pad` fills the screen with your apps over a blurred copy of the wallpaper, alphabetically, a page at a time. Start typing to search names, descriptions and keywords. The arrows move the selection, Enter launches, PageUp and PageDown or the mouse wheel turn pages, and Esc clears the search, then closes. Terminal apps open in `terminal` from `config.json`.

| Key | Default | Meaning |
|---|---|---|
| `pad.columns` | `7` | columns in the grid |
| `pad.rows` | `5` | rows per page |
| `pad.mode` | `launchpad` | `list` turns it into a compact launcher in the middle of the screen, like rofi |

The apps ripple in from the middle when it opens and settle again while you type. Right-click an app to pin it to [SylDeck](deck.md). The launcher also lists every SylSettings section, so typing "clipboard" finds its settings.

## Pick from a list

`sylvaris pick` works like dmenu or `rofi -dmenu`: give it lines on stdin and it prints the one you choose.

```sh
printf 'shutdown\nreboot\nsuspend\n' | sylvaris pick "Power"
```
