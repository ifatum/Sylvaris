import QtQuick
import qs
import qs.services
import qs.components

Column {
    required property var host

    spacing: 24

    Card {
        title: "Weather"
        note: Weather.error !== "" ? Weather.error : Weather.available ? "Now " + Weather.data.temp + Weather.data.unit + ", " + Weather.now.label.toLowerCase() + ". Forecasts come from Open-Meteo for the location below." : "Forecasts come from Open-Meteo for the location below."

        SettingRow {
            title: "Show the weather"
            subtitle: "In SylClock, refreshed in the background"

            Toggle {
                checked: Settings.values.weather.enabled
                onToggled: v => Settings.set("weather.enabled", v)
            }
        }

        SettingRow {
            title: "Units"

            Segmented {
                width: 240
                current: Settings.values.weather.units
                options: [
                    {
                        key: "metric",
                        label: "°C · km/h"
                    },
                    {
                        key: "imperial",
                        label: "°F · mph"
                    }
                ]
                onPicked: key => Settings.set("weather.units", key)
            }
        }

        SettingRow {
            title: "Refresh every"
            last: true

            Stepper {
                value: Settings.values.weather.refresh
                from: 10
                to: 360
                step: 10
                suffix: " min"
                onStepped: v => Settings.set("weather.refresh", v)
            }
        }
    }
}
