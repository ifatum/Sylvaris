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
            if (request === "lock")
                session.relock();
            return JSON.stringify(session.state());
        }
    }
}
