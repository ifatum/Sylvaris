# SylClip

A clipboard history. `sylvaris clip toggle` opens it with a search field. The arrows and Enter paste an item back into the clipboard, Delete removes one, and the pin keeps an item at the top for good.

Text and images are kept. Anything a password manager marks as secret never is.

| Key | Default | Meaning |
|---|---|---|
| `clip.limit` | `50` | items to keep, 5 to 500, on top of pinned ones |
| `clip.images` | `true` | keep screenshots and copied pictures, in `~/.cache/sylvaris/clip` |
| `clip.persist` | `false` | remember the history after a restart, in `~/.local/state/sylvaris/clip.json` |

```sh
sylvaris clip list         # the history as JSON
sylvaris clip copy 2       # put item 2 back on the clipboard
sylvaris clip clear
```

`placement.clip` sets where it opens.
