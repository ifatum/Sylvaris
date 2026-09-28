import QtQuick
import qs
import qs.services
import qs.components
import qs.island
import "../lib/island.mjs" as I

Column {
    id: root

    readonly property var cfg: Settings.values.island
    readonly property bool on: Settings.values.parts.island
    readonly property var sample: I.activities({
        flash: null,
        recording: {
            on: true,
            started: true,
            elapsed: 83000
        },
        alarm: null,
        focus: {
            title: "Draft the release notes",
            left: 1417000
        },
        next: null,
        media: {
            title: Media.title || "Night Drive",
            artist: Media.artist || "Hollow Coast",
            art: Media.art,
            playing: true
        }
    }, root.cfg)

    spacing: 24

    Card {
        title: "Island"
        note: "A pill at the top of the focused screen that shows what is going on: music from any MPRIS player, screen recordings, Diver focus timers and alarms, volume changes, new Bluetooth devices and, if you like, notifications. Hover to expand it, click to open the matching panel, scroll on it to change the volume. Scripts can post to it with “sylvaris island show <text>”."

        Item {
            width: parent.width
            height: 150

            Glass {
                anchors.fill: parent
                radius: Tokens.radiusCard
                inner: true
            }

            IslandBody {
                id: preview
                anchors.horizontalCenter: parent.horizontalCenter
                y: 16
                items: root.sample.length > 0 ? root.sample : [I.custom("Nothing is shown with every source off")]
                expanded: previewHover.hovered
                progress: 0.42
                opacity: root.on ? 1 : 0.5

                HoverHandler {
                    id: previewHover
                }
            }
        }

        SettingRow {
            title: "Show the island"
            subtitle: "Off by default. The same switch: sylvaris set parts.island true"

            Toggle {
                checked: root.on
                onToggled: v => Settings.set("parts.island", v)
            }
        }

        SettingRow {
            title: "Expand on hover"
            subtitle: "Otherwise click the island to expand it"

            Toggle {
                checked: root.cfg.hover
                enabled: root.on
                onToggled: v => Settings.set("island.hover", v)
            }
        }

        SettingRow {
            title: "Seconds for short alerts"
            subtitle: "How long volume, device and notification alerts stay"
            last: true

            Stepper {
                value: root.cfg.seconds
                from: 1
                to: 10
                suffix: " s"
                onStepped: v => Settings.set("island.seconds", v)
            }
        }
    }

    Card {
        title: "What it shows"
        note: "Recordings replace the separate recording pill. Notifications taken by the island skip the usual toasts, except critical ones."

        Repeater {
            model: [
                {
                    key: "media",
                    title: "Music and video",
                    subtitle: "Any player that speaks MPRIS: browsers, Spotify, mpv, VLC"
                },
                {
                    key: "recording",
                    title: "Screen recording",
                    subtitle: "Elapsed time and a stop button"
                },
                {
                    key: "diver",
                    title: "Diver",
                    subtitle: "Alarms, focus timers and tasks starting within 15 minutes"
                },
                {
                    key: "volume",
                    title: "Volume changes",
                    subtitle: "From keys, apps or any mixer"
                },
                {
                    key: "devices",
                    title: "Bluetooth devices",
                    subtitle: "When one connects, with its battery"
                },
                {
                    key: "notifications",
                    title: "Notifications",
                    subtitle: "Instead of toasts"
                }
            ]

            delegate: SettingRow {
                required property var modelData
                required property int index
                title: modelData.title
                subtitle: modelData.subtitle
                last: index === 5

                Toggle {
                    checked: root.cfg[modelData.key]
                    onToggled: v => Settings.set("island." + modelData.key, v)
                }
            }
        }
    }
}
