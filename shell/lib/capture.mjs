export const DELAYS = [0, 3, 5, 10]
export const FORMATS = ["png", "jpeg"]
export const SCALES = [0, 0.5, 1, 2]
export const AFTER = ["notify", "edit", "none"]
export const FPS = [0, 24, 30, 60, 120]
export const RESOLUTIONS = ["native", "2160", "1440", "1080", "720"]
export const CODECS = ["h264", "h265", "vp9", "vaapi"]
export const CONTAINERS = ["mp4", "mkv"]
export const VIDEO_QUALITIES = ["high", "balanced", "small"]
export const AUDIO_SOURCES = ["output", "mic"]
export const LIMITS = [0, 1, 5, 10, 30, 60]
export const DEFAULT_CAPTURE = {
    folder: "~/Pictures/Screenshots",
    videos: "~/Videos/Recordings",
    copy: true,
    save: true,
    delay: 0,
    audio: false,
    format: "png",
    quality: 90,
    cursor: false,
    scale: 0,
    after: "notify",
    pattern: "{kind} {date} {time}",
    fps: 0,
    resolution: "native",
    codec: "h264",
    container: "mp4",
    videoQuality: "balanced",
    audioSource: "output",
    constant: false,
    limit: 0,
    countdown: 0
}

const CRF = {
    h264: { high: 18, balanced: 23, small: 28 },
    h265: { high: 22, balanced: 26, small: 30 },
    vp9: { high: 24, balanced: 32, small: 40 }
}

function box(x, y, w, h) {
    return Math.round(x) + "," + Math.round(y) + " " + Math.round(w) + "x" + Math.round(h)
}

export function hyprRects(clients, monitors) {
    const shown = monitors.map(m => m.activeWorkspace && m.activeWorkspace.id)
    return clients.filter(c => c.mapped !== false && !c.hidden && shown.indexOf(c.workspace && c.workspace.id) >= 0).map(c => box(c.at[0], c.at[1], c.size[0], c.size[1]))
}

export function swayRects(tree) {
    const out = []
    const walk = (n, visible) => {
        const v = n.type === "workspace" ? n.visible === true : visible
        if ((n.type === "con" || n.type === "floating_con") && n.pid && v && n.visible !== false)
            out.push(box(n.rect.x, n.rect.y, n.rect.width, n.rect.height))
        for (const c of (n.nodes || []).concat(n.floating_nodes || []))
            walk(c, v)
    }
    walk(tree, true)
    return out
}

function pad(n) {
    return String(n).padStart(2, "0")
}

export function rectsCommand(compositor) {
    if (compositor === "hyprland")
        return ["sh", "-c", "hyprctl -j clients; echo; echo '\u001e'; hyprctl -j monitors"]
    if (compositor === "sway")
        return ["swaymsg", "-t", "get_tree"]
    return null
}

export function parseRects(compositor, text) {
    if (compositor === "hyprland") {
        const parts = String(text).split("\u001e")
        return hyprRects(JSON.parse(parts[0]), JSON.parse(parts[1]))
    }
    if (compositor === "sway")
        return swayRects(JSON.parse(text))
    return []
}

export function fileName(kind, d, cfg) {
    const c = cfg || DEFAULT_CAPTURE
    const date = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate())
    const time = pad(d.getHours()) + "-" + pad(d.getMinutes()) + "-" + pad(d.getSeconds())
    const base = c.pattern.split("{kind}").join(kind === "video" ? "Recording" : "Screenshot").split("{date}").join(date).split("{time}").join(time)
    if (kind === "video")
        return base + "." + (c.codec === "vp9" ? "webm" : c.container)
    return base + (c.format === "jpeg" ? ".jpg" : ".png")
}

export function grimArgs(c) {
    const out = ["-t", c.format]
    if (c.format === "jpeg")
        out.push("-q", String(c.quality))
    if (c.cursor)
        out.push("-c")
    if (c.scale > 0)
        out.push("-s", String(c.scale))
    return out
}

export function recorderArgs(c, audioDevice) {
    let out
    if (c.codec === "vaapi") {
        const size = c.resolution === "native" ? "" : "w=-2:h=" + c.resolution + ":"
        out = ["-c", "h264_vaapi", "-d", "/dev/dri/renderD128", "-F", "scale_vaapi=" + size + "format=nv12"]
    } else if (c.codec === "vp9") {
        out = ["-c", "libvpx-vp9", "-p", "crf=" + CRF.vp9[c.videoQuality], "-p", "b=0", "-p", "deadline=realtime", "-p", "cpu-used=8"]
    } else {
        out = ["-c", c.codec === "h265" ? "libx265" : "libx264", "-x", "yuv420p", "-p", "crf=" + CRF[c.codec][c.videoQuality], "-p", "preset=" + (c.codec === "h265" ? "fast" : "veryfast")]
    }
    if (c.fps > 0)
        out.push("-r", String(c.fps))
    if (c.resolution !== "native" && c.codec !== "vaapi")
        out.push("-F", "scale=-2:" + c.resolution)
    if (c.constant)
        out.push("-D")
    if (audioDevice)
        out.push("--audio=" + audioDevice)
    return out
}

export function elapsed(ms) {
    const s = Math.max(0, Math.floor(ms / 1000))
    const h = Math.floor(s / 3600)
    const m = Math.floor(s % 3600 / 60)
    return (h > 0 ? h + ":" + pad(m) : String(m)) + ":" + pad(s % 60)
}

export function expand(path, home) {
    return path.indexOf("~/") === 0 ? home + path.slice(1) : path
}

export function validateCapture(raw) {
    const v = raw !== null && typeof raw === "object" && !Array.isArray(raw) ? raw : {}
    const str = (x, d) => typeof x === "string" && x.trim() !== "" ? x : d
    const copy = v.copy !== false
    const pick = (list, x, d) => list.indexOf(x) >= 0 ? x : d
    const pattern = typeof v.pattern === "string" && v.pattern.length <= 80 && v.pattern.trim() !== "" && !/[\/\u0000-\u001f]/.test(v.pattern) && v.pattern[0] !== "." ? v.pattern : DEFAULT_CAPTURE.pattern
    const d = DEFAULT_CAPTURE
    return Object.assign({}, v, {
        folder: str(v.folder, DEFAULT_CAPTURE.folder),
        videos: str(v.videos, DEFAULT_CAPTURE.videos),
        copy: copy,
        save: v.save !== false || !copy,
        delay: DELAYS.indexOf(v.delay) >= 0 ? v.delay : 0,
        audio: v.audio === true,
        format: pick(FORMATS, v.format, d.format),
        quality: Number.isInteger(v.quality) && v.quality >= 1 && v.quality <= 100 ? v.quality : d.quality,
        cursor: v.cursor === true,
        scale: pick(SCALES, v.scale, d.scale),
        after: pick(AFTER, v.after, d.after),
        pattern: pattern,
        fps: pick(FPS, v.fps, d.fps),
        resolution: pick(RESOLUTIONS, v.resolution, d.resolution),
        codec: pick(CODECS, v.codec, d.codec),
        container: pick(CONTAINERS, v.container, d.container),
        videoQuality: pick(VIDEO_QUALITIES, v.videoQuality, d.videoQuality),
        audioSource: pick(AUDIO_SOURCES, v.audioSource, d.audioSource),
        constant: v.constant === true,
        limit: pick(LIMITS, v.limit, d.limit),
        countdown: pick(DELAYS, v.countdown, d.countdown)
    })
}
