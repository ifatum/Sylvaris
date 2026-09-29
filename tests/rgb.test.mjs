import { test } from "node:test"
import assert from "node:assert/strict"
import { DEFAULT_RGB, validateRgb, hex, dim, plan, glyphOf, PRESETS, summary, vivid, reactTargets } from "../shell/lib/rgb.mjs"

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
    assert.deepEqual(v.devices["Krux Atax Pro RGB"], { off: true, color: "#aabbcc", mode: "Static", press: "" })
    assert.equal(validateRgb({ devices: { m: { press: "#FFF" } } }).devices.m.press, "#ffffff")
    assert.equal(v.vivid, true)
    assert.equal(validateRgb({ vivid: false }).vivid, false)
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
    const follow = validateRgb({ color: "#ff8040", follow: true, vivid: false })
    assert.equal(plan(devices, follow, "#c9702f")[0].color, "#c9702f")
    assert.equal(plan(devices, validateRgb({ follow: true }), "#c9702f")[0].color, "#ff7a19")
    assert.equal(plan(devices, validateRgb({ follow: true }), "#c9702f", "#00ff00")[0].color, "#00ff00")
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

test("vivid pushes a theme colour to full strength and keeps greys white", () => {
    assert.equal(vivid("#c9702f"), "#ff7a19")
    assert.equal(vivid("#86d1bf"), "#19ffc8")
    assert.equal(vivid("#e8e8e8"), "#ffffff")
    assert.equal(vivid("#ff0000"), "#ff0000")
    assert.equal(vivid("nope"), "")
})

test("reactTargets lists mice with a press colour that show a plain colour", () => {
    const withLoc = devices.map(d => Object.assign({ location: "HID: /dev/hidraw" + d.id }, d))
    const cfg = validateRgb({ color: "#ff8040", brightness: 50, devices: { "SteelSeries Rival 3 Wireless": { press: "#ffffff" }, "Krux Atax Pro RGB": { press: "#00ff00", mode: "Spectrum Cycle" } } })
    assert.deepEqual(reactTargets(withLoc, cfg, ""), [{ id: 0, name: "SteelSeries Rival 3 Wireless", location: "HID: /dev/hidraw0", base: "#804020", press: "#808080" }])
    assert.deepEqual(reactTargets(withLoc, validateRgb({ on: false, devices: { "SteelSeries Rival 3 Wireless": { press: "#ffffff" } } }), ""), [])
    assert.deepEqual(reactTargets(withLoc, validateRgb({ devices: { "SteelSeries Rival 3 Wireless": { press: "#ffffff" } } }), "")[0].base, "#000000")
})
