export const INITIAL = { phase: "idle", server: "", serverId: "", ping: 0, download: 0, upload: 0, live: 0, peak: 0, warning: "", error: "", result: null }

const isObject = v => v !== null && typeof v === "object" && !Array.isArray(v)
const mbps = v => typeof v === "number" && isFinite(v) && v >= 0 ? v : 0
const text = v => typeof v === "string" ? v : ""

export function parseLine(line) {
    try {
        const v = JSON.parse(line)
        return isObject(v) ? v : null
    } catch (e) {
        return null
    }
}

export function reduce(state, e) {
    if (!isObject(e))
        return state
    const set = patch => Object.assign({}, state, patch)
    switch (e.event) {
    case "status":
        return Object.assign({}, INITIAL, { phase: "server" })
    case "server":
        return set({ phase: "download", server: text(e.server), serverId: text(e.id), ping: mbps(e.ping), live: 0, peak: 0 })
    case "download":
    case "upload": {
        const v = mbps(e.mbps)
        if (e.done === true)
            return set({ phase: e.event === "download" ? "upload" : "saving", [e.event]: v, live: 0, peak: 0 })
        return set({ phase: e.event, live: v, peak: Math.max(state.peak, v) })
    }
    case "warning":
        return set({ warning: text(e.message) })
    case "error":
        return set({ phase: "error", error: text(e.message) || "FaTest failed", live: 0 })
    case "result":
        return isObject(e.result) ? set({ phase: "done", result: e.result, live: 0, peak: 0 }) : state
    default:
        return state
    }
}

const validEntry = r => isObject(r) && typeof r.timestamp === "string" && ["ping", "download", "upload"].every(k => typeof r[k] === "number" && isFinite(r[k]))

export function parseHistory(raw) {
    try {
        const list = JSON.parse(raw)
        return Array.isArray(list) ? list.filter(validEntry).sort((a, b) => a.timestamp < b.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : 0) : []
    } catch (e) {
        return []
    }
}

export function speed(v) {
    const n = mbps(v)
    if (n >= 1000)
        return (n / 1000).toFixed(2) + " Gbps"
    if (n === 0)
        return "0 Mbps"
    return (n < 10 ? n.toFixed(1) : Math.round(n).toString()) + " Mbps"
}

export function gauge(v) {
    return Math.min(1, Math.log10(1 + mbps(v)) / 3)
}

export function configArgs(country, server) {
    const cc = String(country || "").trim().toUpperCase()
    const id = String(server || "").trim()
    if (cc !== "" && !/^[A-Z]{2}$/.test(cc))
        return null
    if (id !== "" && !/^[0-9]{1,9}$/.test(id))
        return null
    return ["config", "--country", cc || "none", "--server", id || "none"]
}

export function parseConfig(raw) {
    try {
        const v = JSON.parse(raw)
        return { country: text(isObject(v) ? v.country : ""), server: isObject(v) && v.server_id !== null && v.server_id !== undefined ? String(v.server_id) : "" }
    } catch (e) {
        return { country: "", server: "" }
    }
}
