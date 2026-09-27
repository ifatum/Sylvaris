# Architecture

Sylvaris is a desktop shell written in QML and JavaScript on top of [Quickshell](https://quickshell.org). This page explains how the pieces fit together. [CONTRIBUTING.md](CONTRIBUTING.md) covers setup, tests and commit style; [docs/guide.md](docs/guide.md) covers what each part does for users.

## Processes

Sylvaris runs as several independent Quickshell processes. Each one has its own entry file in `shell/` and shares the same modules.

| Entry | Started by | Lifetime | Holds |
|---|---|---|---|
| `shell.qml` | `sylvaris` (usually from the compositor's autostart) | the session | every part: bar, panels, notifications, the IPC socket |
| `lock.qml` | the `lock` part in the main shell, with `qs -p lock.qml -n` | until you unlock | the `ext-session-lock` and PAM; nothing else |
| `greet.qml` | `sylvaris greet` under greetd, inside sway | until you log in | SylGreet and the greetd connection |
| `doctor.qml` | `sylvaris doctor` | one run, offscreen | nothing; it reads the config files and prints a report |

The lock is a separate process on purpose. A crash or QML error in the bar, any part or any plugin cannot take the lock screen with it, and the main shell never holds the session lock. `-n` (no duplicate) makes locking twice harmless. The lock process publishes its non-secret state (locked, busy, message, error, PAM service) to `$XDG_RUNTIME_DIR/sylvaris/lock.json`; the main shell watches that file to answer `sylvaris state lock`. Typed passwords only ever live in the lock process, and the field is emptied the moment it is submitted.

## Layout

```
bin/sylvaris          CLI: starts the shell, forwards commands over the IPC socket, runs doctor
shell/shell.qml       main entry: loads parts, services, the command table and the state snapshot
shell/<part>/         one QML module per part (import qs.<part>), entry file SylX.qml
shell/services/       singletons (pragma Singleton), imported as qs.services
shell/plugins/        SylPlugins, plus the built-in plugins Diver (plugins/diver, qs.plugins.diver) and AirPods (plugins/airpods)
shell/components/     shared visual building blocks: Glass, Toggle, Segmented, Card, AuthCard, ...
shell/lib/*.mjs       pure logic, unit-tested with node
shell/helpers/        small Python and shell helpers run as processes (AirPods, Diver, theme sync, doctor facts)
nix/                  package, Home Manager module, NixOS module, generated option schema
tests/                node tests, Python tests, fixtures and the headless harness
examples/plugins/     a complete example plugin
```

A part is a directory with an entry file `SylX.qml` that exposes `open()`, `close()`, `toggleOn(screen)`, `wanted` and `screenInfo`. `shell.qml` loads each one in a `LazyLoader` that is only active while the part is enabled in `parts`, so a disabled part runs no process, timer or watcher. Panel windows are built only while open and freed 20 seconds after they close.

## Services

Services are singletons in `shell/services/`. The main shell lists the ones it always needs (`Tokens`, `Ipc`, `Config`, `Settings`, `Theme`, `Resin`, `Compositor`, `Keybinds`) in `boot`; the rest are started only when an enabled part depends on them (`PARTS` and `SERVICE_DEPS` in `lib/settings.mjs`). A service owns one concern: audio, network, Bluetooth, media, notifications, weather, Diver sync, and so on. Parts read service properties and call service functions; they do not talk to each other directly. Built-in plugins (`BUILTIN` in `lib/plugins.mjs`) own parts and services that stay out of `live` until `plugins.enabled.<id>` is true; their command tables are wrapped with `gated` from `lib/ipc.mjs` so every verb explains how to turn them on.

## lib/ is pure

Everything in `shell/lib/*.mjs` is plain JavaScript with no QML imports and no side effects: parsers, validators, geometry, command builders, formatters. QML files call into it and do the I/O. This keeps the logic testable with `node --test` and lets the same code run in QML's JavaScript engine, which lacks a few newer built-ins (`Object.fromEntries`, `flatMap`, `replaceAll`); `tests/qmljs.test.mjs` guards against them.

`lib/diver.mjs` is the exception in shape, not in purity: it is an IIFE shared byte for byte with the Diver web app, and its task format stays backward compatible, with unknown fields passed through untouched.

## Compositors

Only `services/Compositor.qml` and `lib/wm.mjs` know whether Hyprland (Lua or classic config), niri or sway is running. `lib/wm.mjs` translates Sylvaris verbs (`workspace`, `move-to`, `focus`, `minimize`, ...) into each compositor's commands and reduces niri's event stream into the common workspace shape. Windows come from the foreign-toplevel protocol, which all three support.

Where a feature cannot work everywhere, it is gated by a capability flag in `CAPABILITIES` in `lib/wm.mjs`, read through `Compositor.can("<flag>")`. The UI hides or explains what a compositor cannot do. `tests/wm.test.mjs` checks the table against the code paths that implement each feature, and the table in [docs/guide.md](docs/guide.md#compositor-support) is generated from it.

## Configuration

Two files live in `~/.config/sylvaris/`:

- `config.json` belongs to the user or to Nix (`programs.sylvaris.settings`). Sylvaris never writes it.
- `settings.json` belongs to Sylvaris. It holds what the user changes in SylSettings, SylCenter or with `sylvaris set`.

The effective settings are `validateSettings(deepMerge(settingsLayer(config.json), settings.json))`: every settings key may appear in `config.json` as a default, and `settings.json` overrides it. Defaults and validators live in `lib/settings.mjs` (`DEFAULT_CONFIG`, `DEFAULT_SETTINGS`); validators keep unknown keys and replace invalid values with defaults. Both files are watched and apply live.

Both files carry a `version`. `migrateConfig` and `migrateSettings` upgrade older files step by step in memory without dropping keys. A file from a newer Sylvaris is refused: defaults are used, `Settings` freezes and never writes, and the reason shows in `sylvaris doctor` and `sylvaris state settingsNotice`. `nix/schema.json` is generated from the defaults and drives one Home Manager option per setting.

## IPC

`services/Ipc.qml` listens on `$XDG_RUNTIME_DIR/sylvaris/ipc.sock`. A request is one line: plain words (`center toggle`) or a JSON array of strings; the reply is one JSON line. `bin/sylvaris` sends requests with `socat` and falls back to Quickshell's own IPC (`qs ipc call sylvaris run`). The command table is built in `shell.qml` (`commands`): each part maps verbs to functions, and commands of disabled parts disappear. `sylvaris list` prints them.

`sylvaris state` returns one snapshot object built by `stateObject()`. `sylvaris watch [topic...]` turns a connection into a stream that sends a topic whenever its JSON changes. Nothing secret is ever part of the snapshot.

## Plugins

A plugin is a folder in `~/.config/sylvaris/plugins/<id>/` with `plugin.json` (`id`, `name`, `kind`, `entry`, optional `version`, `description`, `author`) and a QML entry file. `lib/plugins.mjs` validates the manifest. Kinds:

- `bar`: a widget, placed by adding `plugin:<id>` to a bar group.
- `panel`: a panel opened with `sylvaris plugins open <id>`.
- `service`: an invisible component that runs in the background.

Plugins are loaded with a `Loader` from a `file://` URL and receive an `api` object: `api.id`, `api.config` (their own settings under `plugins.config.<id>`), `api.set(key, value)` and `api.run(words)` to call any IPC command. They may import `qs`, `qs.services` and `qs.components`. Plugins run with the user's full permissions, so every plugin stays off until the user enables it, and installing from git first shows the resolved commit and a warning and waits for confirmation.

## Look

Every surface is drawn through `components/Glass.qml` (a test forbids self-painted fills). Colours come from `Theme`, sizes and radii from `Tokens`, motion curves and durations from `lib/motion.mjs`, all scaled by the `motion` and `performance` settings.
