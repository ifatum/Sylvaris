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
    property bool confirmed: false
    property string problem: ""
    readonly property bool locked: root.surface.locked === true
    property var screenInfo: null
    readonly property bool wanted: root.locked

    signal opened

    function lock(): void {
        root.opened();
        root.problem = "";
        root.confirmed = false;
        Quickshell.execDetached(["sh", "-c", "mkdir -p \"$(dirname \"$1\")\"; i=0; while [ $i -lt 50 ]; do r=$(qs -p \"$0\" ipc call sylvaris run lock 2>/dev/null) || exec qs -p \"$0\" -n; case $r in *'\"locked\":true'*) exit 0 ;; esac; sleep 0.1; i=$((i + 1)); done; exit 1", Quickshell.shellDir + "/lock.qml", root.stateFile]);
        watchdog.restart();
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
            message: root.problem !== "" ? root.problem : root.surface.message || "",
            error: root.problem !== "" || root.surface.error === true,
            service: root.surface.service || ""
        };
    }

    onSurfaceChanged: {
        if (root.surface.locked === true && root.surface.secure === true)
            root.confirmed = true;
    }

    Timer {
        id: watchdog
        interval: 6500
        onTriggered: {
            if (root.confirmed || root.surface.locked === true && root.surface.secure === true)
                return;
            root.problem = root.surface.error === true && root.surface.message ? root.surface.message : "The lock screen did not start";
            if (!Demo.enabled)
                Quickshell.execDetached(["notify-send", "-a", "Sylvaris", "-u", "critical", "Sylvaris could not lock the screen", root.problem]);
        }
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

    property bool monitorUp: true
    property int monitorRetries: 0

    Timer {
        id: monitorAgain
        interval: Math.min(60000, 2000 * Math.pow(2, root.monitorRetries))
        onTriggered: {
            root.monitorRetries++;
            root.monitorUp = true;
        }
    }

    Process {
        running: root.cfg.logind && !Demo.enabled && root.monitorUp
        command: ["gdbus", "monitor", "--system", "--dest", "org.freedesktop.login1"]
        onExited: {
            root.monitorUp = false;
            monitorAgain.restart();
        }
        stdout: SplitParser {
            onRead: line => {
                root.monitorRetries = 0;
                if (L.isLockSignal(line, L.sessionPath(Quickshell.env("XDG_SESSION_ID") || "")))
                    root.lock();
            }
        }
    }
}
