import QtQuick
import qs
import qs.services
import qs.components
import "../lib/settings.mjs" as S
import "../lib/modules.mjs" as M

Column {
    required property var host

    spacing: 24

    Card {
        title: "Panels"

        PlacementPreview {}

        SettingRow {
            title: "Control Center"
            subtitle: "Where SylCenter and SylMedia open"

            Segmented {
                width: 300
                options: host.corners
                current: Settings.values.center.corner
                onPicked: key => Settings.set("center.corner", key)
            }
        }

        SettingRow {
            title: "Clock"
            subtitle: "Where SylClock opens"

            Segmented {
                width: 300
                options: host.corners
                current: Settings.values.clock.corner
                onPicked: key => Settings.set("clock.corner", key)
            }
        }

        SettingRow {
            title: "Notifications"
            subtitle: "Where toasts and the notification center appear"
            last: true

            Segmented {
                width: 300
                options: host.corners
                current: Settings.values.notifications.corner
                onPicked: key => Settings.set("notifications.corner", key)
            }
        }
    }

    Card {
        title: "More panels"
        note: "Middle opens a panel in the middle of the screen. With the bar at the bottom or on a side, the top spots follow it."

        Repeater {
            model: [
                {
                    key: "media",
                    title: "Media",
                    subtitle: "Same spot as the Control Center unless you pick one"
                },
                {
                    key: "clip",
                    title: "Clipboard",
                    subtitle: "Where SylClip opens"
                },
                {
                    key: "capture",
                    title: "Capture",
                    subtitle: "Where the screenshot and recording panel opens"
                },
                {
                    key: "access",
                    title: "Accessibility",
                    subtitle: "Where SylAccessibility opens"
                },
                {
                    key: "diver",
                    title: "Diver",
                    subtitle: "Where the Diver planner opens"
                },
                {
                    key: "fatest",
                    title: "FaTest",
                    subtitle: "Where the speed test opens"
                }
            ]

            delegate: SettingRow {
                required property var modelData
                required property int index
                title: modelData.title
                subtitle: modelData.subtitle
                last: index === 5

                Segmented {
                    width: 360
                    options: (modelData.key === "media" ? [
                            {
                                key: "auto",
                                label: "Auto"
                            }
                        ] : []).concat(host.corners, [
                        {
                            key: "center",
                            label: "Middle"
                        }
                    ])
                    current: Settings.values.placement[modelData.key]
                    onPicked: key => Settings.set("placement." + modelData.key, key)
                }
            }
        }
    }

    Card {
        title: "Parts"
        note: "An excluded part is not loaded, and neither is anything only it uses. The same switch works without this panel: sylvaris set parts.<name> false"

        Repeater {
            model: Object.keys(S.PARTS)

            delegate: SettingRow {
                required property string modelData
                required property int index
                title: M.PRODUCT[modelData] || modelData
                subtitle: (M.MODULES[modelData] ? M.MODULES[modelData].label + " · " : "") + "parts." + modelData
                last: index === Object.keys(S.PARTS).length - 1

                Toggle {
                    checked: Settings.values.parts[modelData]
                    onToggled: v => Settings.set("parts." + modelData, v)
                }
            }
        }
    }

    Card {
        title: "From config.json"
        note: "These live in " + Config.path + ", which Sylvaris never writes. Edit that file or your Nix config; changes apply as soon as it is saved."

        Repeater {
            model: ["avatar", "terminal", "lockCommand", "themeHook", "themesDir"]

            delegate: SettingRow {
                required property string modelData
                required property int index
                title: modelData
                last: index === 4

                Text {
                    width: Math.min(implicitWidth, 380)
                    text: Config.values[modelData] === "" ? "not set" : Config.values[modelData]
                    elide: Text.ElideMiddle
                    color: Theme.textSoft
                    font.family: Tokens.fontMono
                    font.pixelSize: Tokens.smallSize
                }
            }
        }
    }
}
