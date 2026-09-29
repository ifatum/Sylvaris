# Diver

SylDiver brings [Diver](https://diver.fatum.cc) to your desktop: your plans in the calendars, reminders as notifications, alarms that take over the screen, and a full planner panel.

## Pairing

1. Turn the plugin on in SylSettings › Plugins, or run `sylvaris plugins enable diver`.
2. In Diver, open settings, then connected devices, then **connect sylvaris**, and enter your password.
3. Run the line it gives you (`sylvaris diver pair <code>`), or paste it into SylSettings › Diver.

Your list stays end-to-end encrypted. Sylvaris gets a key for the list and a token you can revoke, never your password. `sylvaris diver unpair` forgets both.

## On the desktop

Days with plans get dots in SylClock's and SylCenter's calendars. Clicking a day shows its plan with a field to add to it ("call Ana 18:00" works). Reminders become notifications, and tasks marked as alarms take over the screen with a sound until you snooze them (5, 10 or 30 minutes), finish or dismiss them. The `diver` bar module counts down to what's next, and [SylIsland](../parts/island.md) shows alarms, focus timers and tasks starting soon.

## The planner

`sylvaris diver` opens the planner with three views: Today (overdue, today and the next 7 days), Calendar (the month with busy days and a day agenda) and Lists (categories, sections and lists, each addable, renamable and removable).

Clicking a task opens its sheet with everything Diver stores: title, notes, date, start and end, repeats (presets, or every N days, weeks, months or years on chosen weekdays, ending never, on a date or after N times), reminders, alarm, list, priority, energy, estimate and steps. Unsaved changes are never dropped: Esc or Cancel asks first. Ctrl+Enter saves, Ctrl+1, 2 and 3 switch views, and Ctrl+N starts a new task. The target button on a task starts a focus session with a countdown and a notification at the end.

SylClock and SylCenter hand off to it. In a day's plan, clicking a task opens its sheet, the pencil beside "Add to this day" opens a new one for that day with what you typed, and **Diver ›** opens the calendar on that day.

## Commands

```sh
sylvaris diver add "call Ana tomorrow 9:00"   # capture into the inbox
sylvaris diver today                          # also: next
sylvaris diver done <id>
sylvaris diver snooze <id> <minutes>
sylvaris diver focus <id> [minutes]           # also: unfocus
sylvaris diver sync
sylvaris diver test                           # ring a test alarm
```

For scripts: `diver view <today|calendar|lists>`, `diver day <yyyy-mm-dd|today>`, `diver new [text]`, `diver edit <id>`, `diver set <id> <field> <value>` (fields: title, notes, due, time, end, repeat, until, remind, alarm, priority, energy, estimate, done), `diver move <id> <list>`, `diver delete <id>`, `diver lists`, and `diver list add|rename|remove <path> [name]`. Paths are positions such as `0`, `0-1` or `0-1-2`, so check `diver lists` first; `-` adds a category.

## Settings

| Key (`diver.`) | Default | Meaning |
|---|---|---|
| `enabled` | `true` | sync while the plugin is on |
| `refresh` | `2` | minutes between syncs |
| `notify` | `true` | reminders as notifications |
| `alarms` | `true` | full-screen alarms |
| `sound` | `true` | play a sound with alarms |
| `calendar` | `true` | plans in SylClock's and SylCenter's calendars |

Diver itself (diver.fatum.cc) is a separate app. Tasks are created and edited there or in the planner panel; this plugin is the sync client.
