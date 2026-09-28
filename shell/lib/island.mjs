import { elapsed } from "./capture.mjs"

export const DEFAULT_ISLAND = {
    media: true, recording: true, diver: true, volume: true, devices: true, notifications: false, hover: true, seconds: 3,
    position: "top-center", idle: "pill", shortcuts: ["notify", "center", "media", "screenshot", "record", "dnd"]
}

export const POSITIONS = ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"]
export const IDLE = ["hide", "pill", "clock"]
export const MAX_SHORTCUTS = 8

export const SHORTCUTS = {
    notify: { label: "Notifications", glyph: "bell", run: ["notify", "toggle"], needs: "notify" },
    center: { label: "Control Center", glyph: "toggle", run: ["center", "toggle"], needs: "center" },
    media: { label: "Media", glyph: "music", run: ["media", "open"], needs: "media" },
    clock: { label: "Calendar", glyph: "calendar", run: ["clock", "toggle"], needs: "clock" },
    pad: { label: "Launcher", glyph: "apps", run: ["pad", "toggle"], needs: "pad" },
    clip: { label: "Clipboard", glyph: "clipboard", run: ["clip", "toggle"], needs: "clip" },
    screenshot: { label: "Screenshot", glyph: "screenshot", run: ["capture", "shot", "region"], needs: "capture" },
    record: { label: "Record", glyph: "record", run: ["capture", "record", "region"], needs: "capture" },
    dnd: { label: "Do not disturb", glyph: "dnd", run: ["dnd", "toggle"], needs: "Dnd" },
    wifi: { label: "Wi-Fi", glyph: "wifi", run: ["wifi", "toggle"], needs: "NetworkService" },
    bluetooth: { label: "Bluetooth", glyph: "bluetooth", run: ["bluetooth", "toggle"], needs: "BluetoothService" },
    night: { label: "Night light", glyph: "nightLight", run: ["nightlight", "toggle"], needs: "NightLight" },
    settings: { label: "Settings", glyph: "settings", run: ["settings", "toggle"], needs: "settings" },
    power: { label: "Power", glyph: "power", run: ["power", "toggle"], needs: "power" },
    lock: { label: "Lock", glyph: "lock", run: ["lock", "now"], needs: "lock" }
}

const FLASHES = { volume: "volume", notification: "notifications", device: "devices", custom: null }

export function validateIsland(raw) {
    const v = raw !== null && typeof raw === "object" && !Array.isArray(raw) ? raw : {}
    const out = Object.assign({}, v)
    for (const key of Object.keys(DEFAULT_ISLAND))
        if (typeof DEFAULT_ISLAND[key] === "boolean")
            out[key] = typeof v[key] === "boolean" ? v[key] : DEFAULT_ISLAND[key]
    out.seconds = Number.isInteger(v.seconds) && v.seconds >= 1 && v.seconds <= 10 ? v.seconds : DEFAULT_ISLAND.seconds
    out.position = POSITIONS.includes(v.position) ? v.position : DEFAULT_ISLAND.position
    out.idle = IDLE.includes(v.idle) ? v.idle : DEFAULT_ISLAND.idle
    out.shortcuts = Array.isArray(v.shortcuts) ? [...new Set(v.shortcuts.filter(id => Object.prototype.hasOwnProperty.call(SHORTCUTS, id)))].slice(0, MAX_SHORTCUTS) : DEFAULT_ISLAND.shortcuts.slice()
    return out
}

export function activities(s, cfg) {
    const out = []
    const f = s.flash
    if (f && f.kind in FLASHES && (FLASHES[f.kind] === null || cfg[FLASHES[f.kind]]))
        out.push(f)
    if (cfg.recording && s.recording && s.recording.on)
        out.push(Object.assign({ kind: "recording" }, s.recording))
    if (cfg.diver && s.alarm)
        out.push(Object.assign({ kind: "alarm" }, s.alarm))
    if (cfg.diver && s.focus)
        out.push(Object.assign({ kind: "focus" }, s.focus))
    if (cfg.diver && s.next && s.next.mins <= 15)
        out.push(Object.assign({ kind: "next" }, s.next))
    if (cfg.media && s.media && s.media.playing && (s.media.title || s.media.artist))
        out.push(Object.assign({ kind: "media" }, s.media))
    return out
}

export function label(a) {
    switch (a.kind) {
    case "volume":
        return a.muted ? "Muted" : Math.round(a.value * 100) + "%"
    case "notification":
        return a.summary || a.app
    case "device":
        return a.battery >= 0 ? a.name + " · " + a.battery + "%" : a.name
    case "recording":
        return a.started ? elapsed(a.elapsed) : "Starts in " + Math.max(1, Math.ceil(a.wait / 1000))
    case "alarm":
        return a.title
    case "focus":
        return elapsed(a.left)
    case "next":
        return a.mins <= 0 ? "now" : "in " + a.mins + "m"
    case "media":
        return a.title || a.artist
    default:
        return a.text || ""
    }
}

export function joined(before, after) {
    const was = new Set(before.filter(d => d.connected).map(d => d.key))
    return after.find(d => d.connected && !was.has(d.key)) || null
}

export function custom(text) {
    const t = String(text === undefined || text === null ? "" : text).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120)
    return t === "" ? null : { kind: "custom", text: t }
}

export function shortcutsFor(ids, live) {
    return ids.filter(id => live.includes(SHORTCUTS[id].needs)).map(id => Object.assign({ id: id }, SHORTCUTS[id]))
}

export function placeOf(position) {
    const [edge, side] = position.split("-")
    return { top: edge === "top", side: side }
}

export function rowHeight(kind) {
    return kind === "media" || kind === "volume" ? 84 : 60
}

export function cardHeight(kinds, shortcuts) {
    const parts = kinds.map(rowHeight).concat(shortcuts ? [44] : [])
    return parts.length === 0 ? 0 : 24 + parts.reduce((a, b) => a + b, 0) + 6 * (parts.length - 1)
}
