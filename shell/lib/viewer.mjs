export const DEFAULT_VIEWER = { autoplay: true, loop: true, muted: false }

const IMAGES = {
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", bmp: "image/bmp", webp: "image/webp",
    svg: "image/svg+xml", tif: "image/tiff", tiff: "image/tiff", tga: "image/x-tga", ico: "image/vnd.microsoft.icon"
}

const VIDEOS = {
    mp4: "video/mp4", m4v: "video/x-m4v", mkv: "video/x-matroska", webm: "video/webm", mov: "video/quicktime",
    avi: "video/x-msvideo", ogv: "video/ogg", mpg: "video/mpeg", mpeg: "video/mpeg", wmv: "video/x-ms-wmv", flv: "video/x-flv"
}

export const ANIMATED = ["gif", "webp"]

export const MIME_TYPES = [...new Set(Object.values(IMAGES).concat(Object.values(VIDEOS)))]

export const NAME_FILTERS = Object.keys(IMAGES).concat(Object.keys(VIDEOS)).reduce((out, e) => out.concat(["*." + e, "*." + e.toUpperCase()]), [])

export function extOf(path) {
    const name = String(path || "").split("/").pop()
    const dot = name.lastIndexOf(".")
    return dot <= 0 ? "" : name.slice(dot + 1).toLowerCase()
}

export function kindOf(path) {
    const ext = extOf(path)
    return ext in IMAGES ? "image" : ext in VIDEOS ? "video" : null
}

export function mimeOf(path) {
    const ext = extOf(path)
    return IMAGES[ext] || VIDEOS[ext] || "application/octet-stream"
}

export function pathFrom(arg) {
    let s = String(arg === undefined || arg === null ? "" : arg).trim()
    if (s.startsWith("file://")) {
        const rest = s.slice(7)
        const slash = rest.indexOf("/")
        const host = slash < 0 ? rest : rest.slice(0, slash)
        if (slash < 0 || host !== "" && host !== "localhost")
            return ""
        try {
            s = decodeURIComponent(rest.slice(slash))
        } catch (e) {
            return ""
        }
    }
    if (!s.startsWith("/") || /[\u0000-\u001f]/.test(s))
        return ""
    const parts = []
    for (const p of s.split("/")) {
        if (p === "" || p === ".")
            continue
        if (p === "..")
            parts.pop()
        else
            parts.push(p)
    }
    return "/" + parts.join("/")
}

function chunks(name) {
    return String(name).toLowerCase().replace(/\s+/g, "").match(/\d+|\D+/g) || []
}

function stem(name) {
    const dot = String(name).lastIndexOf(".")
    return dot <= 0 ? String(name) : String(name).slice(0, dot)
}

export function natural(a, b) {
    const x = chunks(stem(a)).concat(["\u0000"], chunks(extOf(a)))
    const y = chunks(stem(b)).concat(["\u0000"], chunks(extOf(b)))
    for (let i = 0; i < Math.min(x.length, y.length); i++) {
        const nx = /^\d/.test(x[i])
        const ny = /^\d/.test(y[i])
        const d = nx && ny ? Number(x[i]) - Number(y[i]) : x[i] < y[i] ? -1 : x[i] > y[i] ? 1 : 0
        if (d !== 0)
            return d
    }
    return x.length - y.length || (a < b ? -1 : a > b ? 1 : 0)
}

export function order(names) {
    return names.slice().sort(natural)
}

export function step(count, index, delta) {
    return count <= 0 ? -1 : ((index + delta) % count + count) % count
}

export function clock(seconds) {
    const s = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
    const h = Math.floor(s / 3600)
    const m = Math.floor(s % 3600 / 60)
    const pad = n => String(n).padStart(2, "0")
    return (h > 0 ? h + ":" + pad(m) : String(m)) + ":" + pad(s % 60)
}

export function validateViewer(raw) {
    const v = raw !== null && typeof raw === "object" && !Array.isArray(raw) ? raw : {}
    const out = Object.assign({}, v)
    for (const key of Object.keys(DEFAULT_VIEWER))
        out[key] = typeof v[key] === "boolean" ? v[key] : DEFAULT_VIEWER[key]
    return out
}

function words(exec) {
    const out = []
    let cur = ""
    let quoted = false
    let started = false
    for (let i = 0; i < exec.length; i++) {
        const c = exec[i]
        if (quoted && c === "\\" && i + 1 < exec.length) {
            cur += exec[++i]
        } else if (c === "\"") {
            quoted = !quoted
            started = true
        } else if (!quoted && /\s/.test(c)) {
            if (started || cur !== "")
                out.push(cur)
            cur = ""
            started = false
        } else {
            cur += c
        }
    }
    if (started || cur !== "")
        out.push(cur)
    return out
}

export function uriOf(path) {
    return "file://" + encodeURI(path).replace(/#/g, "%23").replace(/\?/g, "%3F")
}

export function execArgs(exec, path) {
    const uri = uriOf(path)
    let placed = false
    const out = []
    for (const w of words(String(exec || ""))) {
        if (w === "%f" || w === "%F") {
            out.push(path)
            placed = true
        } else if (w === "%u" || w === "%U") {
            out.push(uri)
            placed = true
        } else if (/^%[a-zA-Z]$/.test(w)) {
            continue
        } else {
            out.push(w.replace(/%%/g, "%"))
        }
    }
    if (out.length > 0 && !placed)
        out.push(path)
    return out
}

export function openers(apps, kind) {
    const want = kind === "video" ? ["Video", "AudioVideo"] : ["Graphics"]
    return apps.filter(a => a.id !== "sylvaris-viewer" && String(a.execString || "").trim() !== "" && (a.categories || []).some(c => want.includes(c)))
        .sort((a, b) => a.name.localeCompare(b.name))
}
