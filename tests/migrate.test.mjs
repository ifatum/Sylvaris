import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { migrateConfig, migrateSettings, CONFIG_VERSION, SETTINGS_VERSION, validateSettings, validateConfig, DEFAULT_CONFIG, DEFAULT_SETTINGS } from "../shell/lib/settings.mjs"
import { schema } from "../shell/lib/schema.mjs"

const fixture = name => JSON.parse(readFileSync(new URL("fixtures/migrate/" + name, import.meta.url)))

test("current versions are what the defaults and schema.json carry", () => {
    assert.equal(DEFAULT_CONFIG.version, CONFIG_VERSION)
    assert.equal(DEFAULT_SETTINGS.version, SETTINGS_VERSION)
    assert.equal(schema().version, CONFIG_VERSION)
    assert.equal(JSON.parse(readFileSync(new URL("../nix/schema.json", import.meta.url))).version, CONFIG_VERSION)
})

test("an unversioned config.json migrates without losing anything", () => {
    const raw = fixture("config-v0.json")
    const r = migrateConfig(raw)
    assert.equal(r.ok, true)
    assert.equal(r.from, 0)
    assert.deepEqual(r.value, Object.assign({}, raw, { version: CONFIG_VERSION }))
    assert.deepEqual(raw, fixture("config-v0.json"))
    assert.equal(validateConfig(r.value).toggles[0].on, "wg-quick up wg0")
})

test("an unversioned settings.json moves cc to center and keeps every other key", () => {
    const raw = fixture("settings-v0.json")
    const r = migrateSettings(raw)
    assert.equal(r.ok, true)
    assert.equal(r.from, 0)
    const expected = Object.assign({}, raw, { center: { corner: "top-left" }, version: SETTINGS_VERSION })
    delete expected.cc
    assert.deepEqual(r.value, expected)
    assert.equal(validateSettings(r.value).center.corner, "top-left")
    assert.equal(validateSettings(r.value).someFutureToggle, true)
})

test("cc never overrides an existing center", () => {
    const r = migrateSettings({ cc: { corner: "top-left" }, center: { corner: "bottom-right" } })
    assert.deepEqual(r.value.center, { corner: "bottom-right" })
    assert.deepEqual(r.value.cc, { corner: "top-left" })
})

test("a current file passes through untouched", () => {
    const raw = { version: SETTINGS_VERSION, center: { corner: "top-left" }, x: 1 }
    assert.deepEqual(migrateSettings(raw), { ok: true, from: SETTINGS_VERSION, value: raw, error: "" })
})

test("a file from a newer Sylvaris is refused with a clear error", () => {
    const r = migrateSettings(fixture("settings-future.json"))
    assert.equal(r.ok, false)
    assert.match(r.error, /settings\.json is version 99/)
    assert.match(r.error, /understands up to version 1/)
    assert.match(r.error, /left untouched/)
    const c = migrateConfig({ version: 7 })
    assert.equal(c.ok, false)
    assert.match(c.error, /config\.json is version 7/)
})

test("a version that is not a whole number is refused", () => {
    for (const v of ["1", 1.5, -1, null]) {
        const r = migrateSettings({ version: v })
        assert.equal(r.ok, false, String(v))
        assert.match(r.error, /version must be a whole number/)
    }
})

test("non-object input migrates to an empty current file", () => {
    assert.deepEqual(migrateSettings(null), { ok: true, from: 0, value: { version: SETTINGS_VERSION }, error: "" })
})
