import { test } from "node:test"
import assert from "node:assert/strict"
import { DEFAULT_ISLAND, validateIsland, activities, label, joined, custom } from "../shell/lib/island.mjs"

const idle = { flash: null, recording: { on: false }, alarm: null, focus: null, next: null, media: { title: "", playing: false } }

test("validateIsland keeps booleans and bounds the flash seconds", () => {
    assert.deepEqual(validateIsland(null), DEFAULT_ISLAND)
    const v = validateIsland({ media: false, notifications: true, seconds: 7, hover: "yes", extra: 1 })
    assert.equal(v.media, false)
    assert.equal(v.notifications, true)
    assert.equal(v.seconds, 7)
    assert.equal(v.hover, true)
    assert.equal(v.extra, 1)
    assert.equal(validateIsland({ seconds: 0 }).seconds, DEFAULT_ISLAND.seconds)
    assert.equal(validateIsland({ seconds: 2.5 }).seconds, DEFAULT_ISLAND.seconds)
    assert.equal(validateIsland({ seconds: 11 }).seconds, DEFAULT_ISLAND.seconds)
})

test("nothing going on means no activity", () => {
    assert.deepEqual(activities(idle, DEFAULT_ISLAND), [])
    assert.deepEqual(activities({}, DEFAULT_ISLAND), [])
})

test("activities come in priority order: flash, recording, alarm, focus, next, media", () => {
    const s = {
        flash: { kind: "volume", value: 0.4, muted: false },
        recording: { on: true, started: true, elapsed: 65000 },
        alarm: { text: "Stand-up" },
        focus: { title: "Write", left: 90000 },
        next: { text: "Lunch", mins: 12 },
        media: { title: "Song", artist: "Band", playing: true }
    }
    assert.deepEqual(activities(s, DEFAULT_ISLAND).map(a => a.kind), ["volume", "recording", "alarm", "focus", "next", "media"])
})

test("switches in the settings drop their activities", () => {
    const s = {
        flash: { kind: "notification", summary: "Hi" },
        recording: { on: true, started: true, elapsed: 1000 },
        alarm: { text: "A" },
        media: { title: "Song", playing: true }
    }
    const cfg = Object.assign({}, DEFAULT_ISLAND, { recording: false, diver: false, media: false })
    assert.deepEqual(activities(s, cfg), [])
    assert.deepEqual(activities(s, Object.assign({}, cfg, { notifications: true })).map(a => a.kind), ["notification"])
    assert.deepEqual(activities({ flash: { kind: "volume", value: 1 } }, Object.assign({}, DEFAULT_ISLAND, { volume: false })), [])
    assert.deepEqual(activities({ flash: { kind: "device", name: "Buds" } }, Object.assign({}, DEFAULT_ISLAND, { devices: false })), [])
})

test("paused media, far tasks and an unknown flash stay out", () => {
    const s = { flash: { kind: "nope" }, next: { text: "Later", mins: 40 }, media: { title: "Song", playing: false } }
    assert.deepEqual(activities(s, DEFAULT_ISLAND), [])
    assert.deepEqual(activities({ next: { text: "Soon", mins: 15 } }, DEFAULT_ISLAND).map(a => a.kind), ["next"])
})

test("label gives the short compact text", () => {
    assert.equal(label({ kind: "volume", value: 0.456, muted: false }), "46%")
    assert.equal(label({ kind: "volume", value: 0.4, muted: true }), "Muted")
    assert.equal(label({ kind: "notification", app: "Mail", summary: "" }), "Mail")
    assert.equal(label({ kind: "notification", app: "Mail", summary: "New mail" }), "New mail")
    assert.equal(label({ kind: "device", name: "Buds", battery: 80 }), "Buds · 80%")
    assert.equal(label({ kind: "device", name: "Mouse", battery: -1 }), "Mouse")
    assert.equal(label({ kind: "recording", started: true, elapsed: 65000 }), "1:05")
    assert.equal(label({ kind: "recording", started: false, wait: 2100 }), "Starts in 3")
    assert.equal(label({ kind: "alarm", title: "Stand-up" }), "Stand-up")
    assert.equal(label({ kind: "focus", title: "Write", left: 3723000 }), "1:02:03")
    assert.equal(label({ kind: "next", text: "Lunch", mins: 0 }), "now")
    assert.equal(label({ kind: "next", text: "Lunch", mins: 7 }), "in 7m")
    assert.equal(label({ kind: "media", title: "Song", artist: "Band" }), "Song")
    assert.equal(label({ kind: "media", title: "", artist: "Band" }), "Band")
})

test("joined finds the device that just connected", () => {
    const before = [{ key: "a", connected: true }, { key: "b", connected: false }]
    const after = [{ key: "a", connected: true }, { key: "b", name: "Buds", connected: true, battery: 70 }, { key: "c", connected: true }]
    assert.equal(joined(before, after).key, "b")
    assert.equal(joined(after, after), null)
    assert.equal(joined([], [{ key: "c", connected: false }]), null)
})

test("custom turns script text into a safe flash", () => {
    assert.deepEqual(custom("  Build   done "), { kind: "custom", text: "Build done" })
    assert.equal(custom("a\u0007b\nc").text, "a b c")
    assert.equal(custom("x".repeat(200)).text.length, 120)
    assert.equal(custom("   "), null)
    assert.equal(custom(undefined), null)
    assert.deepEqual(activities({ flash: custom("Hi") }, Object.assign({}, DEFAULT_ISLAND, { volume: false, notifications: false, devices: false })).map(a => a.kind), ["custom"])
    assert.equal(label(custom("Hi")), "Hi")
})
