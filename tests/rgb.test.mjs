import { test } from "node:test"
import assert from "node:assert/strict"
import { DEFAULT_RGB, validateRgb, hex, dim, plan, glyphOf, PRESETS, summary } from "../shell/lib/rgb.mjs"

const devices = [
    { id: 0, name: "SteelSeries Rival 3 Wireless", type: "mouse", mode: "Direct", modes: [{ name: "Direct", color: true }, { name: "Breathing", color: true }, { name: "Off", color: false }], color: "#ff0000" },
    { id: 1, name: "Krux Atax Pro RGB", type: "keyboard", mode: "Static", modes: [{ name: "Static", color: true }, { name: "Spectrum Cycle", color: false }], color: "#0000ff" },
    { id: 2, name: "Gigabyte RGB", type: "motherboard", mode: "Static", modes: [{ name: "Static", color: true }], color: "#00ff00" }
]

test("hex accepts the usual ways of writing a colour and nothing else", () => {
    assert.equal(hex("#C9702F"), "#c9702f")
    assert.equal(hex("c9702f"), "#c9702f")
    assert.equal(hex("#abc"), "#aabbcc")
    assert.equal(hex("#80c9702f"), "#c9702f")
    assert.equal(hex("red"), "")
    assert.equal(hex("#12345"), "")
    assert.equal(hex(null), "")
})

test("dim scales a colour by brightness in percent", () => {
    assert.equal(dim("#ff8040", 100), "#ff8040")
    assert.equal(dim("#ff8040", 50), "#804020")
    assert.equal(dim("#ff8040", 0), "#000000")
})

test("validateRgb keeps good values and repairs the rest", () => {
    assert.deepEqual(validateRgb(undefined), DEFAULT_RGB)
    const v = validateRgb({ on: false, color: "C9702F", follow: true, brightness: 140, restore: "yes", host: "", port: 99999,
        devices: { "Krux Atax Pro RGB": { off: true, color: "#abc", mode: "Static", extra: 1 }, "__proto__": { off: true }, "": {}, "Bad": "x" } })
    assert.equal(v.on, false)
    assert.equal(v.color, "#c9702f")
    assert.equal(v.follow, true)
    assert.equal(v.brightness, 100)
    assert.equal(v.restore, true)
    assert.equal(v.host, "127.0.0.1")
    assert.equal(v.port, 6742)
    assert.deepEqual(Object.keys(v.devices), ["Krux Atax Pro RGB"])
    assert.deepEqual(v.devices["Krux Atax Pro RGB"], { off: true, color: "#aabbcc", mode: "Static" })
    assert.equal(validateRgb({ brightness: -5 }).brightness, 0)
    assert.equal(validateRgb({ port: 16742, host: "10.0.0.2" }).port, 16742)
})

test("plan leaves devices alone until you pick something", () => {
    assert.deepEqual(plan(devices, DEFAULT_RGB, "#c9702f"), [])
})

test("plan paints every device, dimmed, and follows the theme when asked", () => {
    const cfg = validateRgb({ color: "#ff8040", brightness: 50 })
    assert.deepEqual(plan(devices, cfg, "#c9702f").map(o => [o.id, o.name, o.do, o.color]), [
        [0, "SteelSeries Rival 3 Wireless", "color", "#804020"],
        [1, "Krux Atax Pro RGB", "color", "#804020"],
        [2, "Gigabyte RGB", "color", "#804020"]
    ])
    const follow = validateRgb({ color: "#ff8040", follow: true })
    assert.equal(plan(devices, follow, "#c9702f")[0].color, "#c9702f")
})

test("per-device choices win over the shared colour", () => {
    const cfg = validateRgb({ color: "#ffffff", devices: { "Krux Atax Pro RGB": { mode: "Spectrum Cycle" }, "Gigabyte RGB": { off: true }, "SteelSeries Rival 3 Wireless": { color: "#00ff00", mode: "Breathing" } } })
    assert.deepEqual(plan(devices, cfg, ""), [
        { id: 0, name: "SteelSeries Rival 3 Wireless", do: "mode", mode: "Breathing", color: "#00ff00" },
        { id: 1, name: "Krux Atax Pro RGB", do: "mode", mode: "Spectrum Cycle" },
        { id: 2, name: "Gigabyte RGB", do: "off" }
    ])
})

test("turning lights off overrides everything, and a missing effect falls back to the colour", () => {
    const off = validateRgb({ on: false, color: "#ffffff", devices: { "Krux Atax Pro RGB": { mode: "Spectrum Cycle" } } })
    assert.deepEqual(plan(devices, off, "").map(o => o.do), ["off", "off", "off"])
    const gone = validateRgb({ color: "#ffffff", devices: { "Gigabyte RGB": { mode: "Rainbow" } } })
    assert.deepEqual(plan(devices, gone, "")[2], { id: 2, name: "Gigabyte RGB", do: "color", color: "#ffffff" })
})

test("glyphs, presets and the one-line summary", () => {
    assert.equal(glyphOf("mouse"), "mouse")
    assert.equal(glyphOf("keyboard"), "keyboard")
    assert.equal(glyphOf("something new"), "rgb")
    assert.ok(PRESETS.every(p => hex(p) === p))
    assert.equal(summary(validateRgb({}), 3, ""), "3 devices")
    assert.equal(summary(validateRgb({ on: false }), 3, ""), "Off")
    assert.equal(summary(validateRgb({}), 1, ""), "1 device")
    assert.equal(summary(validateRgb({}), 0, "OpenRGB is not reachable"), "OpenRGB not running")
})
