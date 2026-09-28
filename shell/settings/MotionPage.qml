import QtQuick
import qs
import qs.services
import qs.components

Column {
    required property var host

    spacing: 24

    Card {
        title: "Motion"
        note: "Every panel opens, moves and closes with the same motion. Speed stretches or shortens all of it at once."

        MotionPreview {}

        SettingRow {
            title: "Animation speed"
            subtitle: Settings.shown.motion.scale === 1 ? "Default" : Settings.shown.motion.scale < 1 ? "Faster" : "Slower"

            Slider {
                width: 300
                value: (Settings.shown.motion.scale - 0.25) / 1.75
                label: "×" + (1 / Settings.shown.motion.scale).toFixed(2)
                onMoved: v => Settings.put("motion.scale", Math.round((0.25 + v * 1.75) * 20) / 20)
            }
        }

        SettingRow {
            title: "Background reveal"
            subtitle: "How the blurred background of SylSettings, SylPad and SylPower spreads when they open and close"

            Segmented {
                width: 300
                options: [
                    {
                        key: "edges",
                        label: "Edges in"
                    },
                    {
                        key: "center",
                        label: "Center out"
                    },
                    {
                        key: "fade",
                        label: "Fade"
                    }
                ]
                current: Settings.shown.motion.reveal
                onPicked: key => Settings.put("motion.reveal", key)
            }
        }

        SettingRow {
            title: "Reduce motion"
            subtitle: "Panels appear and disappear without moving"
            last: true

            Toggle {
                checked: Settings.shown.motion.reduced
                onToggled: v => Settings.put("motion.reduced", v)
            }
        }
    }

    Card {
        title: "Performance"
        note: "Also a tile in SylCenter. Nothing to install: Sylvaris trims itself and, on Hyprland and sway, the compositor too."

        SettingRow {
            title: "Performance mode"
            subtitle: "Drops blur, grain, sheen and ambient movement and shortens animations; turns off compositor animations, blur, shadows and gaps until you turn it off"
            last: true

            Toggle {
                checked: Settings.shown.performance
                onToggled: v => Settings.put("performance", v)
            }
        }
    }
}
