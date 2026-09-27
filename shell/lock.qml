import QtQuick
import Quickshell
import Quickshell.Io
import qs.lock

ShellRoot {
    LockSession {
        id: session
    }

    IpcHandler {
        target: "sylvaris"

        function run(request: string): string {
            return JSON.stringify(session.state());
        }
    }
}
