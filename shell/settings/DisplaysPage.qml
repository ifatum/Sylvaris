import QtQuick
import qs
import qs.services
import qs.components
import "../lib/icons.mjs" as Icons

Column {
    required property var host

    spacing: 24

    Card {
        title: "Night light"

        SettingRow {
            title: "Night light"
            subtitle: NightLight.available ? "Warmer colours through wlsunset" : "Install wlsunset to use night light"

            Toggle {
                checked: NightLight.enabled
                onToggled: v => NightLight.setEnabled(v)
            }
        }

        SettingRow {
            title: "Colour temperature"
            last: true

            Slider {
                width: 300
                value: (NightLight.temperature - 2500) / 4000
                label: NightLight.temperature + " K"
                onMoved: v => Settings.put("nightLight.temperature", Math.round((2500 + v * 4000) / 100) * 100)
            }
        }
    }

    Card {
        title: "Screens"

        SettingRow {
            title: "Arrange displays"
            subtitle: "Resolution, refresh rate, scale and position, with automatic revert"
            last: true

            Chip {
                text: "Open"
                glyph: Icons.GLYPHS.displays
                onClicked: host.hand("center", "displays")
            }
        }
    }
}
