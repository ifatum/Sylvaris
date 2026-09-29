import QtQuick
import QtQuick.Shapes
import qs
import qs.services
import qs.components
import "../../lib/icons.mjs" as Icons

Column {
    spacing: 16

    Item {
        width: parent.width
        height: podsColumn.implicitHeight + 32
        visible: Headphones.device !== null

        Glass {
            anchors.fill: parent
            radius: Tokens.radiusCard
            inner: true
            offBorder: Theme.cardLine
        }

        Column {
            id: podsColumn
            x: 16
            y: 16
            width: parent.width - 32
            spacing: 16

            Row {
                spacing: 10

                Glyph {
                    anchors.verticalCenter: parent.verticalCenter
                    text: Icons.GLYPHS.headphones
                    size: 20
                    color: Theme.accent
                }

                Text {
                    textFormat: Text.PlainText
                    anchors.verticalCenter: parent.verticalCenter
                    text: Headphones.name
                    color: Theme.text
                    font.family: Tokens.fontUi
                    font.pixelSize: Tokens.bodySize
                    font.weight: Font.DemiBold
                }

                Text {
                    textFormat: Text.PlainText
                    anchors.verticalCenter: parent.verticalCenter
                    visible: !Headphones.connected
                    text: "connecting…"
                    color: Theme.textDim
                    font.family: Tokens.fontUi
                    font.pixelSize: Tokens.smallSize
                }
            }

            Row {
                anchors.horizontalCenter: parent.horizontalCenter
                spacing: 34
                visible: Headphones.connected

                Repeater {
                    model: ["left", "right", "case"]

                    delegate: Item {
                        id: ring
                        required property string modelData
                        readonly property var b: Headphones.battery[modelData] || null
                        width: 74
                        height: 96
                        opacity: b === null ? 0.35 : 1

                        Shape {
                            width: 70
                            height: 70
                            anchors.horizontalCenter: parent.horizontalCenter
                            preferredRendererType: Shape.CurveRenderer

                            ShapePath {
                                fillColor: "transparent"
                                strokeColor: Qt.alpha(Theme.text, 0.12)
                                strokeWidth: 6
                                capStyle: ShapePath.RoundCap

                                PathAngleArc {
                                    centerX: 35
                                    centerY: 35
                                    radiusX: 30
                                    radiusY: 30
                                    startAngle: -90
                                    sweepAngle: 360
                                }
                            }

                            ShapePath {
                                fillColor: "transparent"
                                strokeColor: ring.b !== null && ring.b.level < 20 ? Theme.danger : Theme.accent
                                strokeWidth: 6
                                capStyle: ShapePath.RoundCap

                                PathAngleArc {
                                    centerX: 35
                                    centerY: 35
                                    radiusX: 30
                                    radiusY: 30
                                    startAngle: -90
                                    sweepAngle: 3.6 * (ring.b === null ? 0 : ring.b.level)
                                }
                            }
                        }

                        Text {
                            textFormat: Text.PlainText
                            x: (parent.width - width) / 2
                            y: 35 - height / 2
                            text: ring.b === null ? "—" : ring.b.level + "%"
                            color: Theme.text
                            font.family: Tokens.fontUi
                            font.pixelSize: Tokens.smallSize
                            font.weight: Font.DemiBold
                        }

                        Row {
                            anchors.horizontalCenter: parent.horizontalCenter
                            anchors.bottom: parent.bottom
                            spacing: 4

                            Glyph {
                                visible: ring.b !== null && ring.b.charging
                                text: Icons.GLYPHS.bolt
                                size: 13
                                color: Theme.accent
                            }

                            Text {
                                textFormat: Text.PlainText
                                text: modelData.charAt(0).toUpperCase() + modelData.slice(1)
                                color: Theme.textDim
                                font.family: Tokens.fontUi
                                font.pixelSize: Tokens.smallSize
                            }
                        }
                    }
                }
            }

            Text {
                textFormat: Text.PlainText
                visible: Headphones.connected
                text: "Listening mode"
                color: Theme.textDim
                font.family: Tokens.fontUi
                font.pixelSize: Tokens.smallSize
                font.weight: Font.DemiBold
            }

            Segmented {
                width: parent.width
                visible: Headphones.connected
                current: Headphones.noise
                options: [
                    {
                        key: "off",
                        label: "Off"
                    },
                    {
                        key: "transparency",
                        label: "Transparency"
                    },
                    {
                        key: "adaptive",
                        label: "Adaptive"
                    },
                    {
                        key: "anc",
                        label: "Noise cancel"
                    }
                ]
                onPicked: key => Headphones.setNoise(key)
            }

            Item {
                width: parent.width
                height: 30
                visible: Headphones.connected

                Row {
                    anchors.verticalCenter: parent.verticalCenter
                    spacing: 10

                    Glyph {
                        anchors.verticalCenter: parent.verticalCenter
                        text: Icons.GLYPHS.voice
                        size: 18
                        color: Theme.accent
                    }

                    Text {
                        textFormat: Text.PlainText
                        anchors.verticalCenter: parent.verticalCenter
                        text: "Conversation awareness"
                        color: Theme.text
                        font.family: Tokens.fontUi
                        font.pixelSize: Tokens.bodySize
                    }
                }

                Toggle {
                    anchors.right: parent.right
                    anchors.verticalCenter: parent.verticalCenter
                    checked: Headphones.awareness
                    onToggled: v => Headphones.setAwareness(v)
                }
            }

            Text {
                textFormat: Text.PlainText
                width: parent.width
                visible: !Headphones.connected && Headphones.error !== ""
                text: "Couldn't talk to the AirPods: " + Headphones.error + ". Retrying…"
                wrapMode: Text.Wrap
                color: Theme.textDim
                font.family: Tokens.fontUi
                font.pixelSize: Tokens.smallSize
            }
        }
    }

    Text {
        textFormat: Text.PlainText
        width: parent.width
        visible: Headphones.device === null
        text: "Connect AirPods to change listening modes and conversation awareness here."
        wrapMode: Text.Wrap
        color: Theme.textDim
        font.family: Tokens.fontUi
        font.pixelSize: Tokens.smallSize
    }
}
