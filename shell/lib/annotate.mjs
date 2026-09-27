export const TOOLS = ["pen", "highlighter", "line", "arrow", "rect", "ellipse", "text", "pixelate", "crop"]
export const TOOL_KEYS = { p: "pen", h: "highlighter", l: "line", a: "arrow", r: "rect", e: "ellipse", t: "text", x: "pixelate", c: "crop" }
export const WIDTHS = [2, 4, 8]
export const INKS = ["#ef4444", "#f59e0b", "#facc15", "#22c55e", "#3b82f6", "#f5f5f4", "#1c1917"]

export function normRect(a, b) {
    return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) }
}

export function arrowHead(x1, y1, x2, y2, size) {
    const angle = Math.atan2(y2 - y1, x2 - x1)
    const spread = Math.PI / 7
    return [
        { x: x2 - size * Math.cos(angle - spread), y: y2 - size * Math.sin(angle - spread) },
        { x: x2 - size * Math.cos(angle + spread), y: y2 - size * Math.sin(angle + spread) }
    ]
}

export function fit(w, h, boxW, boxH) {
    const scale = Math.min(1, boxW / w, boxH / h)
    return { scale: scale, x: Math.round((boxW - w * scale) / 2), y: Math.round((boxH - h * scale) / 2) }
}

export function toImage(px, py, f, w, h) {
    const clamp = (v, max) => Math.max(0, Math.min(max, v))
    return { x: clamp((px - f.x) / f.scale, w), y: clamp((py - f.y) / f.scale, h) }
}

export function clampRect(r, w, h) {
    const x = Math.round(Math.max(0, Math.min(w, r.x)))
    const y = Math.round(Math.max(0, Math.min(h, r.y)))
    return { x: x, y: y, w: Math.round(Math.max(0, Math.min(w, r.x + r.w) - x)), h: Math.round(Math.max(0, Math.min(h, r.y + r.h) - y)) }
}

export function addPoint(points, p, step) {
    const last = points[points.length - 1]
    if (last !== undefined && Math.hypot(p.x - last.x, p.y - last.y) < step)
        return points
    return points.concat([p])
}

export function emptyHistory() {
    return { items: [], undone: [] }
}

export function push(h, item) {
    return { items: h.items.concat([item]), undone: [] }
}

export function undo(h) {
    if (h.items.length === 0)
        return h
    return { items: h.items.slice(0, -1), undone: h.undone.concat([h.items[h.items.length - 1]]) }
}

export function redo(h) {
    if (h.undone.length === 0)
        return h
    return { items: h.items.concat([h.undone[h.undone.length - 1]]), undone: h.undone.slice(0, -1) }
}

export function isMark(m) {
    if (m.tool === "text")
        return typeof m.text === "string" && m.text.trim() !== ""
    if (m.points !== undefined)
        return m.points.length > 1
    if (m.rect !== undefined) {
        const area = m.rect.w >= 3 && m.rect.h >= 3
        return m.tool === "crop" || m.tool === "pixelate" ? area : m.rect.w >= 3 || m.rect.h >= 3
    }
    return Math.hypot(m.to.x - m.from.x, m.to.y - m.from.y) >= 3
}

export function editedName(file) {
    const slash = file.lastIndexOf("/")
    const dot = file.lastIndexOf(".")
    const base = dot > slash ? file.slice(0, dot) : file
    return (/ edited$/.test(base) ? base : base + " edited") + ".png"
}
