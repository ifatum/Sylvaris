import QtQuick
import Quickshell
import Quickshell.Io
import qs
import qs.services
import "../lib/lock.mjs" as L

Scope {
    id: root

    readonly property var cfg: Settings.values.lock
    readonly property string stateFile: (Quickshell.env("XDG_RUNTIME_DIR") || "/tmp") + "/sylvaris/lock.json"
    property var surface: ({})
    readonly property bool locked: root.surface.locked === true
    property var screenInfo: null
    readonly property bool wanted: root.locked

    signal opened

    function lock(): void {
        root.opened();
        Quickshell.execDetached(["sh", "-c", "mkdir -p \"$(dirname \"$1\")\" && exec qs -p \"$0\" -n", Quickshell.shellDir + "/lock.qml", root.stateFile]);
    }

    function open(): void {
        root.lock();
    }

    function close(): void {
    }

    function toggle(): void {
        root.lock();
    }

    function toggleOn(screen: var): void {
        root.lock();
    }

    function state(): var {
        return {
            locked: root.locked,
            secure: root.surface.secure === true,
            busy: root.surface.busy === true,
            message: root.surface.message || "",
            error: root.surface.error === true,
            service: root.surface.service || ""
        };
    }

    FileView {
        path: root.stateFile
        watchChanges: true
        printErrors: false
        onFileChanged: reload()
        onLoaded: {
            try {
                const v = JSON.parse(text());
                root.surface = v !== null && typeof v === "object" ? v : {};
            } catch (e) {
                root.surface = {};
            }
        }
        onLoadFailed: root.surface = {}
    }

    Process {
        running: root.cfg.logind && !Demo.enabled
        command: ["gdbus", "monitor", "--system", "--dest", "org.freedesktop.login1"]
        stdout: SplitParser {
            onRead: line => {
                if (L.isLockSignal(line, L.sessionPath(Quickshell.env("XDG_SESSION_ID") || "")))
                    root.lock();
            }
        }
    }
}
