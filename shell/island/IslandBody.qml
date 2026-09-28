import QtQuick
import qs
import qs.services
import qs.components
import "../lib/island.mjs" as I
import "../lib/icons.mjs" as Icons

Item {
    id: root

    property var items: []
    property bool expanded: false
    property real progress: 0
    readonly property var main: root.items.length > 0 ? root.items[0] : null
    readonly property var second: root.items.length > 1 ? root.items[1] : null
    readonly property bool shown: root.main !== null
    readonly property real pillHeight: 38
    readonly property real cardWidth: 380
    readonly property real cardHeight: root.main !== null && (root.main.kind === "media" || root.main.kind === "volume") ? 118 : 96
    readonly property real bodyWidth: root.expanded ? root.cardWidth : Math.min(340, compactRow.implicitWidth + 28)
    readonly property real bodyHeight: root.expanded ? root.cardHeight : root.pillHeight
    readonly property bool bubble: root.second !== null && !root.expanded

    readonly property Item pill: body
    readonly property Item side: bubbleItem

    signal act(string kind, string what)
    signal wheel(int steps)

    implicitWidth: root.bodyWidth + (root.bubble ? root.pillHeight + 8 : 0)
    implicitHeight: root.bodyHeight
    opacity: root.shown ? 1 : 0
    scale: root.shown ? 1 : 0.86

    Behavior on opacity {
        NumberAnimation {
            duration: Tokens.fadeDuration
            easing.type: Easing.OutCubic
        }
    }

    Behavior on scale {
        NumberAnimation {
            duration: Tokens.morphDuration
            easing.type: Easing.OutBack
            easing.overshoot: 1.2
        }
    }

    function glyphOf(a: var): string {
        if (a === null)
            return "";
        switch (a.kind) {
        case "volume":
            return a.muted || a.value <= 0 ? Icons.GLYPHS.volumeMute : Icons.GLYPHS.volume;
        case "notification":
            return Icons.GLYPHS.bell;
        case "device":
            return a.audio ? Icons.GLYPHS.headphones : Icons.GLYPHS.bluetooth;
        case "recording":
            return Icons.GLYPHS.record;
        case "alarm":
            return Icons.GLYPHS.alarm;
        case "focus":
            return Icons.GLYPHS.timer;
        case "next":
            return Icons.GLYPHS.planner;
        case "custom":
            return Icons.GLYPHS.info;
        default:
            return Icons.GLYPHS.musicNote;
        }
    }

    function tintOf(a: var): color {
        return a !== null && (a.kind === "recording" || a.kind === "alarm") ? Theme.danger : Theme.accent;
    }

    function headOf(a: var): string {
        if (a === null)
            return "";
        switch (a.kind) {
        case "volume":
            return "Volume";
        case "notification":
            return a.summary || a.app;
        case "device":
            return a.name;
        case "recording":
            return a.started ? "Recording" : "Recording soon";
        case "alarm":
            return a.title;
        case "focus":
            return a.title;
        case "next":
        case "custom":
            return a.text;
        default:
            return a.title || a.artist;
        }
    }

    function subOf(a: var): string {
        if (a === null)
            return "";
        switch (a.kind) {
        case "volume":
            return I.label(a);
        case "notification":
            return a.body || a.app;
        case "device":
            return a.battery >= 0 ? "Connected · " + a.battery + "% battery" : "Connected";
        case "recording":
            return I.label(a);
        case "alarm":
            return "Diver alarm";
        case "focus":
            return "Focus · " + I.label(a) + " left";
        case "next":
            return "Starts " + I.label(a);
        case "custom":
            return "Sylvaris";
        default:
            return a.artist || a.player || "";
        }
    }

    function actionsOf(a: var): var {
        if (a === null)
            return [];
        switch (a.kind) {
        case "media":
            return [
                {
                    id: "previous",
                    glyph: Icons.GLYPHS.previous
                },
                {
                    id: "toggle",
                    glyph: Icons.GLYPHS.pause
                },
                {
                    id: "next",
                    glyph: Icons.GLYPHS.next
                }
            ];
        case "recording":
            return [
                {
                    id: "stop",
                    glyph: Icons.GLYPHS.stopCircle
                }
            ];
        case "alarm":
            return [
                {
                    id: "snooze",
                    glyph: Icons.GLYPHS.sleep
                },
                {
                    id: "done",
                    glyph: Icons.GLYPHS.check
                }
            ];
        case "focus":
            return [
                {
                    id: "stop",
                    glyph: Icons.GLYPHS.close
                }
            ];
        case "volume":
            return [
                {
                    id: "mute",
                    glyph: a.muted ? Icons.GLYPHS.volumeMute : Icons.GLYPHS.volume
                }
            ];
        case "notification":
            return [
                {
                    id: "dismiss",
                    glyph: Icons.GLYPHS.close
                }
            ];
        default:
            return [];
        }
    }

    component Lead: Item {
        id: lead

        property var a: null
        property real size: 24

        width: lead.size
        height: lead.size

        RoundImage {
            id: artImage
            anchors.fill: parent
            visible: lead.a !== null && lead.a.kind === "media" && lead.a.art !== undefined && lead.a.art !== ""
            source: visible ? lead.a.art : ""
            radius: lead.size >= 40 ? 12 : lead.size / 2
            fallbackColor: Theme.accentDeep
        }

        Rectangle {
            anchors.centerIn: parent
            visible: lead.a !== null && lead.a.kind === "recording"
            width: lead.size * 0.42
            height: width
            radius: width / 2
            color: Theme.danger

            SequentialAnimation on opacity {
                running: lead.visible && lead.a !== null && lead.a.kind === "recording" && Tokens.motion > 0.05
                loops: Animation.Infinite
                NumberAnimation {
                    to: 0.3
                    duration: 700
                }
                NumberAnimation {
                    to: 1
                    duration: 700
                }
            }
        }

        Glyph {
            anchors.centerIn: parent
            visible: !artImage.visible && lead.a !== null && lead.a.kind !== "recording"
            text: root.glyphOf(lead.a)
            size: lead.size * 0.72
            color: root.tintOf(lead.a)
        }
    }

    component Bars: Row {
        id: bars

        property bool live: false

        spacing: 2
        height: 14

        Repeater {
            model: 4

            Rectangle {
                id: bar

                required property int index
                property real level: 0.4

                anchors.bottom: parent.bottom
                width: 3
                radius: 1.5
                height: bars.height * bar.level
                color: Theme.accent

                SequentialAnimation on level {
                    running: bars.live && Tokens.motion > 0.05
                    loops: Animation.Infinite
                    NumberAnimation {
                        to: 1
                        duration: 260 + bar.index * 90
                        easing.type: Easing.InOutSine
                    }
                    NumberAnimation {
                        to: 0.25 + 0.1 * bar.index
                        duration: 300 + bar.index * 70
                        easing.type: Easing.InOutSine
                    }
                }
            }
        }
    }

    component Press: Item {
        id: press

        property string glyph: ""
        property bool strong: false

        signal clicked

        width: 34
        height: 34
        opacity: press.enabled ? 1 : 0.4
        scale: area.pressed ? 0.9 : 1

        Behavior on scale {
            NumberAnimation {
                duration: Tokens.stateDuration
                easing.type: Easing.OutCubic
            }
        }

        Rectangle {
            anchors.fill: parent
            radius: width / 2
            color: press.strong ? Theme.accent : area.pressed ? Qt.alpha(Theme.text, 0.18) : area.containsMouse || press.activeFocus ? Qt.alpha(Theme.text, 0.1) : "transparent"
            border.width: press.activeFocus ? 1 : 0
            border.color: Theme.accent

            Behavior on color {
                ColorAnimation {
                    duration: Tokens.stateDuration
                }
            }
        }

        Glyph {
            anchors.centerIn: parent
            text: press.glyph
            size: 18
            color: press.strong ? Theme.onAccent : Theme.text
        }

        MouseArea {
            id: area
            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor
            onClicked: press.clicked()
        }

        Keys.onReturnPressed: press.clicked()
        Keys.onSpacePressed: press.clicked()
    }

    Item {
        id: body
        width: root.bodyWidth
        height: root.bodyHeight
        clip: true

        Behavior on width {
            NumberAnimation {
                duration: Tokens.morphDuration
                easing.type: Easing.OutBack
                easing.overshoot: 0.9
            }
        }

        Behavior on height {
            NumberAnimation {
                duration: Tokens.morphDuration
                easing.type: Easing.OutBack
                easing.overshoot: 0.9
            }
        }

        Glass {
            anchors.fill: parent
            radius: Math.min(height / 2, Tokens.radiusPanel)
            raised: true
            offColor: Theme.surface
            offBorder: Theme.line
        }

        MouseArea {
            anchors.fill: parent
            acceptedButtons: Qt.LeftButton | Qt.RightButton
            cursorShape: Qt.PointingHandCursor
            onClicked: e => root.act(root.main ? root.main.kind : "", e.button === Qt.RightButton ? "menu" : "open")
            onWheel: e => root.wheel(e.angleDelta.y > 0 ? 1 : e.angleDelta.y < 0 ? -1 : 0)
        }

        Row {
            id: compactRow
            x: 14
            anchors.verticalCenter: parent.verticalCenter
            spacing: 10
            opacity: root.expanded ? 0 : 1
            visible: opacity > 0

            Behavior on opacity {
                NumberAnimation {
                    duration: Tokens.fadeDuration
                }
            }

            Lead {
                anchors.verticalCenter: parent.verticalCenter
                a: root.main
                size: 22
            }

            Text {
                anchors.verticalCenter: parent.verticalCenter
                width: Math.min(implicitWidth, 220)
                text: root.main !== null ? I.label(root.main) : ""
                elide: Text.ElideRight
                color: Theme.text
                font.family: root.main !== null && ["recording", "focus", "volume"].indexOf(root.main.kind) >= 0 ? Tokens.fontMono : Tokens.fontUi
                font.pixelSize: Tokens.smallSize
                font.weight: Font.DemiBold
            }

            Bars {
                anchors.verticalCenter: parent.verticalCenter
                visible: root.main !== null && root.main.kind === "media"
                live: visible && root.shown
            }
        }

        Item {
            anchors.fill: parent
            anchors.margins: 16
            opacity: root.expanded ? 1 : 0
            visible: opacity > 0

            Behavior on opacity {
                NumberAnimation {
                    duration: Tokens.fadeDuration
                }
            }

            Lead {
                id: bigLead
                a: root.main
                size: 56
            }

            Column {
                anchors.left: bigLead.right
                anchors.leftMargin: 14
                anchors.right: actions.left
                anchors.rightMargin: 8
                y: (bigLead.height - height) / 2
                spacing: 3

                Text {
                    width: parent.width
                    text: root.headOf(root.main)
                    elide: Text.ElideRight
                    color: Theme.text
                    font.family: Tokens.fontUi
                    font.pixelSize: Tokens.bodySize
                    font.weight: Font.DemiBold
                }

                Text {
                    width: parent.width
                    text: root.subOf(root.main)
                    elide: Text.ElideRight
                    maximumLineCount: 1
                    color: Theme.textDim
                    font.family: root.main !== null && ["recording", "volume"].indexOf(root.main.kind) >= 0 ? Tokens.fontMono : Tokens.fontUi
                    font.pixelSize: Tokens.smallSize
                }
            }

            Row {
                id: actions
                anchors.right: parent.right
                y: (bigLead.height - height) / 2
                spacing: 2

                Repeater {
                    model: root.actionsOf(root.main)

                    Press {
                        required property var modelData
                        glyph: modelData.id === "toggle" ? (root.main !== null && root.main.playing ? Icons.GLYPHS.pause : Icons.GLYPHS.play) : modelData.glyph
                        strong: modelData.id === "toggle" || modelData.id === "done" || modelData.id === "stop" && root.main !== null && root.main.kind === "recording"
                        onClicked: root.act(root.main.kind, modelData.id)
                    }
                }
            }

            Rectangle {
                anchors.left: parent.left
                anchors.right: parent.right
                anchors.bottom: parent.bottom
                visible: root.main !== null && (root.main.kind === "media" || root.main.kind === "volume")
                height: 4
                radius: 2
                color: Qt.alpha(Theme.text, 0.14)

                Rectangle {
                    width: parent.width * Math.max(0, Math.min(1, root.main !== null && root.main.kind === "volume" ? root.main.value : root.progress))
                    height: parent.height
                    radius: 2
                    color: root.main !== null && root.main.kind === "volume" && root.main.muted ? Theme.textDim : Theme.accent

                    Behavior on width {
                        NumberAnimation {
                            duration: Tokens.stateDuration
                        }
                    }
                }

                MouseArea {
                    anchors.fill: parent
                    anchors.margins: -6
                    cursorShape: Qt.PointingHandCursor
                    onClicked: e => root.act(root.main.kind, "seek:" + Math.max(0, Math.min(1, (e.x - 6) / (width - 12))))
                }
            }
        }
    }

    Item {
        id: bubbleItem
        x: root.bodyWidth + 8
        width: root.pillHeight
        height: root.pillHeight
        opacity: root.bubble ? 1 : 0
        scale: root.bubble ? 1 : 0.4
        visible: opacity > 0

        Behavior on opacity {
            NumberAnimation {
                duration: Tokens.fadeDuration
            }
        }

        Behavior on scale {
            NumberAnimation {
                duration: Tokens.morphDuration
                easing.type: Easing.OutBack
            }
        }

        Glass {
            anchors.fill: parent
            radius: height / 2
            raised: true
            offColor: Theme.surface
            offBorder: Theme.line
        }

        Lead {
            anchors.centerIn: parent
            a: root.second
            size: 22
        }

        MouseArea {
            anchors.fill: parent
            cursorShape: Qt.PointingHandCursor
            onClicked: root.act(root.second ? root.second.kind : "", "open")
        }
    }
}
