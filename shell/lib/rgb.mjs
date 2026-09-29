export const DEFAULT_RGB = { on: true, color: "", follow: false, vivid: true, brightness: 100, restore: true, devices: {}, host: "127.0.0.1", port: 6742 }

export const PRESETS = ["#ffffff", "#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#00c7be", "#007aff", "#5856d6", "#af52de", "#ff2d55"]

const GLYPHS = { mouse: "mouse", mousemat: "mouse", keyboard: "keyboard", keypad: "keyboard", dram: "memory", gpu: "gpu", cooler: "fan", headset: "headphones", "headset stand": "headphones", gamepad: "gamepad", motherboard: "firmware", speaker: "speaker", case: "desktop", laptop: "desktop" }

const isObject = v => v !== null && typeof v === "object" && !Array.isArray(v)

export function hex(value) {
    const s = String(value === null || value === undefined ? "" : value).trim().toLowerCase().replace(/^#/, "")
    if (/^[0-9a-f]{3}$/.test(s))
        return "#" + s.split("").map(c => c + c).join("")
    if (/^[0-9a-f]{6}$/.test(s))
        return "#" + s
    if (/^[0-9a-f]{8}$/.test(s))
        return "#" + s.slice(2)
    return ""
}

export function dim(color, brightness) {
    const c = hex(color)
    if (c === "")
        return ""
    const k = Math.max(0, Math.min(100, brightness)) / 100
    return "#" + [1, 3, 5].map(i => Math.round(parseInt(c.slice(i, i + 2), 16) * k).toString(16).padStart(2, "0")).join("")
}

export function vivid(color) {
    const c = hex(color)
    if (c === "")
        return ""
    const [r, g, b] = [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16) / 255)
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const s = max === 0 ? 0 : (max - min) / max
    if (s < 0.12)
        return "#ffffff"
    const d = max - min
    const h = (max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60
    const sat = Math.max(s, 0.9)
    const f = n => {
        const k = (n + h / 60) % 6
        return 1 - sat * Math.max(0, Math.min(k, 4 - k, 1))
    }
    return "#" + [f(5), f(3), f(1)].map(x => Math.round(x * 255).toString(16).padStart(2, "0")).join("")
}

function validateDevice(raw) {
    const v = isObject(raw) ? raw : {}
    return { off: v.off === true, color: hex(v.color), mode: typeof v.mode === "string" ? v.mode.slice(0, 64) : "", press: hex(v.press) }
}

export function validateRgb(raw) {
    const v = isObject(raw) ? raw : {}
    const devices = {}
    if (isObject(v.devices))
        for (const name of Object.keys(v.devices))
            if (name !== "" && name.length <= 128 && !["__proto__", "constructor", "prototype"].includes(name) && isObject(v.devices[name]))
                devices[name] = validateDevice(v.devices[name])
    const b = v.brightness
    return Object.assign({}, v, {
        on: typeof v.on === "boolean" ? v.on : DEFAULT_RGB.on,
        color: hex(v.color),
        follow: v.follow === true,
        vivid: typeof v.vivid === "boolean" ? v.vivid : DEFAULT_RGB.vivid,
        brightness: typeof b === "number" && isFinite(b) ? Math.round(Math.max(0, Math.min(100, b))) : DEFAULT_RGB.brightness,
        restore: typeof v.restore === "boolean" ? v.restore : DEFAULT_RGB.restore,
        devices: devices,
        host: typeof v.host === "string" && /^[A-Za-z0-9.:_-]{1,253}$/.test(v.host) ? v.host : DEFAULT_RGB.host,
        port: Number.isInteger(v.port) && v.port >= 1 && v.port <= 65535 ? v.port : DEFAULT_RGB.port
    })
}

export function shared(cfg, accent, themeRgb) {
    if (!cfg.follow)
        return cfg.color
    if (hex(themeRgb) !== "")
        return hex(themeRgb)
    if (hex(accent) === "")
        return cfg.color
    return cfg.vivid ? vivid(accent) : hex(accent)
}

export function plan(devices, cfg, accent, themeRgb) {
    const common = shared(cfg, accent, themeRgb)
    const out = []
    for (const d of devices) {
        const own = cfg.devices[d.name] || { off: false, color: "", mode: "", press: "" }
        const base = { id: d.id, name: d.name }
        if (!cfg.on || own.off) {
            out.push(Object.assign(base, { do: "off" }))
            continue
        }
        const color = dim(own.color !== "" ? own.color : common, cfg.brightness)
        const effect = own.mode === "" ? null : (d.modes || []).find(m => m.name.toLowerCase() === own.mode.toLowerCase()) || null
        if (effect !== null)
            out.push(Object.assign(base, { do: "mode", mode: effect.name }, effect.color && color !== "" ? { color: color } : {}))
        else if (color !== "")
            out.push(Object.assign(base, { do: "color", color: color }))
    }
    return out
}

export function reactTargets(devices, cfg, accent, themeRgb) {
    if (!cfg.on)
        return []
    const ops = plan(devices, cfg, accent, themeRgb)
    const out = []
    for (const d of devices) {
        const own = cfg.devices[d.name]
        if (own === undefined || own.press === "")
            continue
        const op = ops.find(o => o.id === d.id)
        if (op !== undefined && op.do !== "color")
            continue
        out.push({ id: d.id, name: d.name, location: d.location || "", base: op !== undefined ? op.color : "#000000", press: dim(own.press, cfg.brightness) })
    }
    return out
}

export function glyphOf(type) {
    return GLYPHS[type] || "rgb"
}

export function summary(cfg, count, error) {
    if (error)
        return "OpenRGB not running"
    if (!cfg.on)
        return "Off"
    return count + (count === 1 ? " device" : " devices")
}
