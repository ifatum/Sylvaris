const SCRIPT = `root="$1"; mode="$2"
if [ "$mode" = on ]; then
    for a in "$root"/*/authorized; do [ -w "$a" ] && [ "$(cat "$a")" = 0 ] && echo 1 > "$a"; done
fi
seen=" "; live=0; denied=0; blocked=0
for c in "$root"/*:*/bInterfaceClass; do
    [ "$(cat "$c" 2>/dev/null)" = 0e ] || continue
    i="\${c%/bInterfaceClass}"; n="\${i##*/}"; d="\${n%%:*}"
    case "$seen" in *" $d "*) continue ;; esac
    seen="$seen$d "; a="$root/$d/authorized"
    if [ ! -w "$a" ]; then denied=$((denied + 1)); continue; fi
    [ "$mode" = off ] && echo 0 > "$a"
    [ "$(cat "$a")" = 1 ] && live=$((live + 1))
done
for a in "$root"/*/authorized; do [ -w "$a" ] && [ "$(cat "$a")" = 0 ] && blocked=$((blocked + 1)); done
echo "$blocked $live $denied"`

export function cameraArgs(mode, root) {
    return ["sh", "-c", SCRIPT, "sh", root || "/sys/bus/usb/devices", mode]
}

export function parseCameras(text) {
    const n = String(text).trim().split(/\s+/).map(Number)
    const at = i => Number.isInteger(n[i]) && n[i] >= 0 ? n[i] : 0
    return { blocked: at(0), live: at(1), denied: at(2) }
}

export function cameraUsersArgs(root) {
    return ["sh", "-c", "find \"$1\"/[0-9]*/fd -maxdepth 1 -lname '/dev/video*' 2>/dev/null | while read -r f; do cat \"${f%/fd/*}/comm\" 2>/dev/null; done", "sh", root || "/proc"]
}

export function parseUsers(text) {
    const out = []
    for (const line of String(text).split("\n")) {
        const name = line.trim()
        if (name !== "" && !/^(pipewire|wireplumber)$/.test(name) && !out.includes(name))
            out.push(name)
    }
    return out
}
