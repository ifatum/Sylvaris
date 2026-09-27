import QtQuick
import qs
import qs.services
import qs.components

Column {
    required property var host

    spacing: 24

    Card {
        title: "SylPad"
        note: "Open it with the apps button on the bar or deck, or bind `sylvaris pad` to a key."

        PadPreview {}

        SettingRow {
            title: "Layout"
            subtitle: "A full-screen grid, or a compact list in the middle of the screen"

            Segmented {
                width: 260
                current: Settings.values.pad.mode
                options: [
                    {
                        key: "launchpad",
                        label: "Launchpad"
                    },
                    {
                        key: "list",
                        label: "List"
                    }
                ]
                onPicked: key => Settings.set("pad.mode", key)
            }
        }

        SettingRow {
            title: "Columns"

            Stepper {
                value: Settings.values.pad.columns
                from: 3
                to: 10
                onStepped: v => Settings.set("pad.columns", v)
            }
        }

        SettingRow {
            title: "Rows"
            last: true

            Stepper {
                value: Settings.values.pad.rows
                from: 2
                to: 8
                onStepped: v => Settings.set("pad.rows", v)
            }
        }
    }
}
