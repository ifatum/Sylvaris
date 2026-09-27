import QtQuick
import Quickshell
import Quickshell.Io
import Quickshell.Wayland
import Quickshell.Services.Pam
import qs
import qs.services
import qs.components
import "../lib/lock.mjs" as L
import "../lib/settings.mjs" as S

Scope {
    id: root

    readonly property var cfg: Settings.values.lock
    readonly property string user: Quickshell.env("USER") || ""
    readonly property string avatar: S.expandHome(Config.values.avatar || "", Quickshell.env("HOME"))
    readonly property string testDir: Demo.enabled ? Quickshell.env("SYLVARIS_PAM_DIR") || "" : ""
    property bool locked: false
    property string typed: ""
    property bool busy: false
    property bool error: false
    property bool awaiting: false
    property string message: ""
    property string pending: ""
    property var installed: []
    property real now: Date.now()
    readonly property string stateFile: (Quickshell.env("XDG_RUNTIME_DIR") || "/tmp") + "/sylvaris/lock.json"
    readonly property string service: root.testDir !== "" ? "sylvaris-test" : L.pamService(root.cfg.pam, root.installed)

    signal failed

    Component.onCompleted: {
        root.locked = true;
        refused.start();
    }

    function relock(): void {
        quit.stop();
        if (root.locked)
            return;
        root.typed = "";
        root.message = "";
        root.error = false;
        root.busy = false;
        root.awaiting = false;
        root.locked = true;
        refused.restart();
    }

    function submit(text: string): void {
        if (!root.locked || root.busy)
            return;
        root.typed = "";
        if (root.awaiting) {
            root.awaiting = false;
            root.busy = true;
            pam.respond(text);
            return;
        }
        if (text === "")
            return;
        root.pending = text;
        root.busy = true;
        root.error = false;
        root.message = "";
        if (!pam.start()) {
            root.pending = "";
            root.busy = false;
            root.error = true;
            root.message = "Could not start authentication with the " + root.service + " PAM service";
        }
    }

    function state(): var {
        return {
            locked: root.locked,
            secure: session.secure,
            busy: root.busy,
            message: root.message,
            error: root.error,
            service: root.service
        };
    }

    Process {
        running: true
        command: ["sh", "-c", "for s in " + L.PAM_SERVICES.join(" ") + "; do [ -e /etc/pam.d/$s ] && echo $s; done"]
        stdout: StdioCollector {
            onStreamFinished: root.installed = text.split("\n").filter(s => s !== "")
        }
    }

    Timer {
        running: root.locked
        interval: 1000
        repeat: true
        triggeredOnStart: true
        onTriggered: root.now = Date.now()
    }

    PamContext {
        id: pam
        config: root.service
        configDirectory: root.testDir !== "" ? root.testDir : "/etc/pam.d"
        user: root.user
        onPamMessage: {
            if (pam.responseRequired) {
                if (root.pending !== "") {
                    const text = root.pending;
                    root.pending = "";
                    pam.respond(text);
                } else {
                    root.busy = false;
                    root.awaiting = true;
                    root.error = false;
                    root.message = pam.message;
                }
            } else if (pam.message !== "") {
                root.error = pam.messageIsError;
                root.message = pam.message;
            }
        }
        onCompleted: result => {
            root.busy = false;
            root.pending = "";
            root.awaiting = false;
            if (result === PamResult.Success) {
                root.message = "";
                root.error = false;
                root.locked = false;
                quit.start();
            } else {
                root.error = true;
                root.message = result === PamResult.MaxTries ? "Too many tries, wait a moment" : "Wrong password";
                root.failed();
            }
        }
        onError: err => {
            root.busy = false;
            root.pending = "";
            root.awaiting = false;
            root.error = true;
            root.message = "Authentication error: " + PamError.toString(err);
            root.failed();
        }
    }

    onLockedChanged: root.publish()
    onBusyChanged: root.publish()
    onErrorChanged: root.publish()
    onMessageChanged: root.publish()

    function publish(): void {
        stateOut.setText(JSON.stringify(root.state()));
    }

    FileView {
        id: stateOut
        path: root.stateFile
        printErrors: false
    }

    Timer {
        id: quit
        interval: 300
        onTriggered: Qt.quit()
    }

    Timer {
        id: refused
        interval: 5000
        onTriggered: {
            if (!root.locked || session.secure)
                return;
            root.error = true;
            root.message = "The compositor did not grant the session lock";
            root.locked = false;
            quit.start();
        }
    }

    WlSessionLock {
        id: session
        locked: root.locked
        onSecureChanged: root.publish()

        WlSessionLockSurface {
            id: surface
            color: Theme.base

            LockView {
                anchors.fill: parent
                lock: root
            }
        }
    }
}
