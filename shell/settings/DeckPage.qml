import QtQuick
import Quickshell
import qs
import qs.services
import qs.components
import "../lib/bar.mjs" as B
import "../lib/icons.mjs" as Icons

Column {
    required property var host

    spacing: 24

    Card {
        title: "SylDeck"

        DeckPreview {}

        SettingRow {
            title: "Show the deck"
            subtitle: "A dock for pinned and running apps along the bottom"

            Toggle {
                checked: Settings.values.deck.enabled
                onToggled: v => Settings.set("deck.enabled", v)
            }
        }

        SettingRow {
            title: "Hover effect"
            subtitle: "Bloom lifts one icon with a glow, magnify grows its neighbours too"

            Segmented {
                width: 300
                current: Settings.values.deck.effect
                options: [
                    {
                        key: "bloom",
                        label: "Bloom"
                    },
                    {
                        key: "magnify",
                        label: "Magnify"
                    },
                    {
                        key: "none",
                        label: "None"
                    }
                ]
                onPicked: key => Settings.set("deck.effect", key)
            }
        }

        SettingRow {
            title: "Reserve space"
            subtitle: "Off lets windows go underneath the deck"

            Toggle {
                checked: Settings.values.deck.reserve
                onToggled: v => Settings.set("deck.reserve", v)
            }
        }

        SettingRow {
            title: "Hide"
            subtitle: Settings.values.deck.hide === "windows" ? "Shows on an empty desktop and slides away when a window opens on this screen" : Settings.values.deck.hide === "always" ? "Slides away until the pointer reaches the bottom edge" : "Always visible"

            Segmented {
                width: 300
                options: [
                    {
                        key: "never",
                        label: "Never"
                    },
                    {
                        key: "windows",
                        label: "With windows"
                    },
                    {
                        key: "always",
                        label: "Always"
                    }
                ]
                current: Settings.values.deck.hide
                onPicked: key => Settings.set("deck.hide", key)
            }
        }

        SettingRow {
            title: "Peek line"
            subtitle: "A small line in your theme colour that stays while the deck is hidden"

            Toggle {
                checked: Settings.values.deck.peek
                onToggled: v => Settings.set("deck.peek", v)
            }
        }

        SettingRow {
            title: "Peek thickness"
            enabled: Settings.values.deck.peek

            Stepper {
                value: Settings.values.deck.peekSize
                from: 2
                to: 12
                suffix: " px"
                onStepped: v => Settings.set("deck.peekSize", v)
            }
        }

        SettingRow {
            title: "Icon size"

            Stepper {
                value: Settings.values.deck.size
                from: 36
                to: 96
                onStepped: v => Settings.set("deck.size", v)
            }
        }

        SettingRow {
            title: "Power button"

            Segmented {
                width: 280
                current: Settings.values.deck.power
                options: [
                    {
                        key: "start",
                        label: "Start"
                    },
                    {
                        key: "end",
                        label: "End"
                    },
                    {
                        key: "none",
                        label: "None"
                    }
                ]
                onPicked: key => Settings.set("deck.power", key)
            }
        }

        SettingRow {
            title: "App launcher button"
            last: true

            Segmented {
                width: 280
                current: Settings.values.deck.pad
                options: [
                    {
                        key: "start",
                        label: "Start"
                    },
                    {
                        key: "end",
                        label: "End"
                    },
                    {
                        key: "none",
                        label: "None"
                    }
                ]
                onPicked: key => Settings.set("deck.pad", key)
            }
        }
    }

    Card {
        title: "Pinned apps"
        note: Settings.values.deck.pinned.length === 0 ? "Nothing pinned yet. Right-click an app in SylPad or in the deck to keep it here." : ""

        Repeater {
            model: Settings.values.deck.pinned

            delegate: SettingRow {
                required property string modelData
                required property int index
                readonly property var entry: Demo.enabled ? Apps.byId(modelData) : DesktopEntries.byId(modelData)
                title: entry ? entry.name : modelData
                subtitle: modelData
                last: index === Settings.values.deck.pinned.length - 1

                Row {
                    spacing: 6

                    Repeater {
                        model: [
                            {
                                glyph: Icons.GLYPHS.up,
                                act: -1
                            },
                            {
                                glyph: Icons.GLYPHS.down,
                                act: 1
                            },
                            {
                                glyph: Icons.GLYPHS.close,
                                act: 0
                            }
                        ]

                        delegate: Chip {
                            required property var modelData
                            glyph: modelData.glyph
                            onClicked: {
                                const list = Settings.values.deck.pinned;
                                Settings.set("deck.pinned", modelData.act === 0 ? list.filter((p, k) => k !== index) : B.shift(list, index, modelData.act));
                            }
                        }
                    }
                }
            }
        }
    }
}
