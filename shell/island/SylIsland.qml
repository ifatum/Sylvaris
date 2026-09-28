import QtQuick
import Quickshell
import Quickshell.Wayland
import Quickshell.Services.Notifications
import qs
import qs.services
import qs.plugins.diver
import "../lib/island.mjs" as I
import "../lib/notify.mjs" as N

Scope {
    id: root

    readonly property var cfg: Settings.values.island
    property var peers: ({})
    property var live: []
    property var avoid: null
    property bool wanted: false
    property bool hovered: false
    property bool hot: false
    property var flash: null
    property bool armed: false
    property real now: Date.now()
    property string time: Qt.formatTime(new Date(), "HH:mm")
    property int lastNote: -1
    property var devicesBefore: []
    readonly property var place: I.placeOf(root.cfg.position)
    readonly property var screenInfo: Compositor.screenFor(Compositor.focusedName())
    readonly property var capture: root.peers.capture === undefined ? null : root.peers.capture
    readonly property bool recording: root.capture !== null && root.capture.recording
    readonly property bool covered: root.avoid !== null && root.avoid.corner === root.cfg.position && root.screenInfo !== null && root.avoid.screen === root.screenInfo.name
    readonly property var items: I.activities({
        flash: root.flash,
        recording: root.capture === null ? null : {
            on: root.capture.recording,
            started: root.capture.started,
            elapsed: root.now - root.capture.recordStart,
            wait: root.capture.waitUntil - root.now
        },
        alarm: Diver.alarm === null ? null : {
            id: Diver.alarm.id,
            title: Diver.alarm.title
        },
        focus: Diver.focusEnd > root.now ? {
            title: Diver.focusTitle,
            left: Diver.focusEnd - root.now
        } : null,
        next: Diver.active && Diver.next !== null ? {
            text: Diver.plain(Diver.next.task.text),
            mins: Math.round((Diver.next.start - root.now) / 60000)
        } : null,
        media: {
            title: Media.title,
            artist: Media.artist,
            art: Media.art,
            player: Media.identity,
            playing: Media.playing
        }
    }, root.cfg)
    readonly property var shortcuts: I.shortcutsFor(root.cfg.shortcuts, root.live).map(s => Object.assign({}, s, {
                lit: root.litOf(s.id),
                badge: s.id === "notify" ? Notifications.count : 0
            }))
    readonly property bool expanded: root.wanted || root.cfg.hover && root.hot

    signal requested(string part)

    function litOf(id: string): bool {
        switch (id) {
        case "dnd":
            return Notifications.dnd;
        case "wifi":
            return NetworkService.enabled;
        case "bluetooth":
            return BluetoothService.enabled;
        case "night":
            return NightLight.enabled;
        case "record":
            return root.recording;
        default:
            return false;
        }
    }

    function close(): void {
        root.wanted = false;
    }

    function open(): void {
        root.wanted = true;
    }

    function toggle(): void {
        root.wanted = !root.wanted;
    }

    function toggleOn(screen: var): void {
        root.toggle();
    }

    function show(f: var): void {
        root.flash = f;
        flashTimer.restart();
    }

    function say(text: string): void {
        const f = I.custom(text);
        if (f === null)
            throw new Error("usage: island show <text>");
        root.show(f);
    }

    function runShortcut(id: string): void {
        const s = I.SHORTCUTS[id];
        if (s === undefined)
            throw new Error("unknown shortcut: " + id + "; one of " + Object.keys(I.SHORTCUTS).join(", "));
        if (s.needs.toLowerCase() === s.needs) {
            root.close();
            root.hot = false;
        }
        const words = id === "record" && root.recording ? ["capture", "stop"] : s.run;
        const out = Ipc.run(words);
        if (out.indexOf("error:") === 0)
            root.say(out.slice(6).trim());
    }

    function partFor(kind: string): string {
        return ({
                media: "media",
                volume: "center",
                device: "center",
                notification: "notify",
                alarm: "clock",
                focus: "clock",
                next: "clock",
                recording: "capture"
            })[kind] || "";
    }

    function act(kind: string, what: string): void {
        const a = root.items.find(x => x.kind === kind) || null;
        if (what === "open") {
            const part = root.partFor(kind);
            root.close();
            root.hot = false;
            if (part !== "")
                root.requested(part);
            return;
        }
        if (what.indexOf("seek:") === 0) {
            const x = Number(what.slice(5));
            if (kind === "volume")
                Audio.setVolume(x);
            else
                Media.seekTo(x * Media.length);
            return;
        }
        if (kind === "media")
            what === "previous" ? Media.previous() : what === "next" ? Media.next() : Media.toggle();
        else if (kind === "recording" && root.capture !== null)
            root.capture.stop();
        else if (kind === "focus")
            Diver.stopFocus();
        else if (kind === "alarm" && a !== null)
            what === "done" ? Diver.done(a.id) : Diver.snooze(a.id, 10);
        else if (kind === "volume")
            Audio.toggleMute();
        else if (kind === "notification" && a !== null) {
            Notifications.dismiss(a.id);
            root.flash = null;
        }
    }

    function state(): var {
        return {
            expanded: root.expanded,
            covered: root.covered,
            position: root.cfg.position,
            screen: root.screenInfo ? root.screenInfo.name : "",
            shortcuts: root.shortcuts.map(s => s.id),
            items: root.items.map(a => ({
                        kind: a.kind,
                        label: I.label(a)
                    }))
        };
    }

    onHoveredChanged: {
        if (root.hovered) {
            leaveTimer.stop();
            enterTimer.restart();
        } else {
            enterTimer.stop();
            leaveTimer.restart();
        }
    }

    Timer {
        id: enterTimer
        interval: 90
        onTriggered: root.hot = true
    }

    Timer {
        id: leaveTimer
        interval: 320
        onTriggered: root.hot = false
    }

    Timer {
        interval: 1500
        running: true
        onTriggered: {
            root.devicesBefore = BluetoothService.items;
            root.lastNote = Notifications.list.length > 0 ? Notifications.list[0].id : -1;
            root.armed = true;
        }
    }

    Timer {
        id: flashTimer
        interval: root.cfg.seconds * 1000
        onTriggered: {
            if (root.hovered)
                flashTimer.restart();
            else
                root.flash = null;
        }
    }

    Timer {
        interval: 1000
        repeat: true
        running: root.recording || root.cfg.diver && (Diver.focusEnd > root.now || Diver.next !== null)
        onTriggered: root.now = Date.now()
    }

    Timer {
        interval: 10000
        repeat: true
        triggeredOnStart: true
        running: root.cfg.idle === "clock"
        onTriggered: root.time = Qt.formatTime(new Date(), "HH:mm")
    }

    Timer {
        interval: 1000
        repeat: true
        running: root.expanded && Media.playing
        onTriggered: Media.tick()
    }

    Connections {
        target: Audio
        enabled: root.armed

        function onVolumeChanged() {
            root.show({
                kind: "volume",
                value: Audio.volume,
                muted: Audio.muted
            });
        }

        function onMutedChanged() {
            root.show({
                kind: "volume",
                value: Audio.volume,
                muted: Audio.muted
            });
        }
    }

    Connections {
        target: Notifications
        enabled: root.armed

        function onListChanged() {
            const e = Notifications.list.length > 0 ? Notifications.list[0] : null;
            if (e === null || e.id === root.lastNote)
                return;
            root.lastNote = e.id;
            if (!root.cfg.notifications || Notifications.centerOpen || Notifications.dnd && e.n.urgency !== NotificationUrgency.Critical)
                return;
            root.show({
                kind: "notification",
                id: e.id,
                app: e.n.appName,
                summary: e.n.summary,
                body: N.plainText(e.n.body)
            });
        }
    }

    Connections {
        target: BluetoothService
        enabled: root.armed

        function onItemsChanged() {
            const d = I.joined(root.devicesBefore, BluetoothService.items);
            root.devicesBefore = BluetoothService.items;
            if (d !== null)
                root.show({
                    kind: "device",
                    name: d.name,
                    battery: d.battery,
                    audio: d.audio
                });
        }
    }

    PanelWindow {
        visible: body.shown && !root.covered
        screen: root.screenInfo
        anchors.top: root.place.top
        anchors.bottom: !root.place.top
        anchors.left: root.place.side === "left"
        anchors.right: root.place.side === "right"
        margins.top: Tokens.edgeMargin
        margins.bottom: Tokens.edgeMargin
        margins.left: Tokens.edgeMargin
        margins.right: Tokens.edgeMargin
        implicitWidth: body.cardWidth + body.pillHeight + 16
        implicitHeight: 540
        color: "transparent"
        exclusionMode: ExclusionMode.Normal
        exclusiveZone: 0
        WlrLayershell.layer: WlrLayer.Top
        WlrLayershell.namespace: "sylisland"
        WlrLayershell.keyboardFocus: WlrKeyboardFocus.None
        mask: Region {
            item: body
        }
        BackgroundEffect.blurRegion: Resin.enabled ? blur : null

        Region {
            id: blur

            Region {
                item: body.pill
                radius: Math.min(body.pill.height / 2, Tokens.radiusPanel)
            }

            Region {
                item: body.bubble ? body.side : null
                radius: body.pillHeight / 2
            }
        }

        IslandBody {
            id: body
            x: root.place.side === "left" ? 0 : root.place.side === "right" ? parent.width - width : (parent.width - body.pill.width) / 2
            y: root.place.top ? 0 : parent.height - height
            items: root.items
            shortcuts: root.shortcuts
            expanded: root.expanded
            atTop: root.place.top
            idle: root.cfg.idle
            time: root.time
            progress: Media.length > 0 ? Media.position / Media.length : 0
            onAct: (kind, what) => root.act(kind, what)
            onRun: id => root.runShortcut(id)
            onPin: root.toggle()
            onWheel: steps => Audio.setVolume(Audio.volume + steps * 0.05)

            HoverHandler {
                onHoveredChanged: root.hovered = hovered
            }
        }
    }
}
