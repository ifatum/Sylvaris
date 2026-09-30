import { test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, chmodSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { cameraArgs, parseCameras } from "../shell/lib/privacy.mjs"

function sysfs() {
    const root = mkdtempSync(join(tmpdir(), "syl-usb-"))
    const put = (path, text, mode) => {
        mkdirSync(join(root, path, ".."), { recursive: true })
        writeFileSync(join(root, path), text + "\n")
        if (mode !== undefined)
            chmodSync(join(root, path), mode)
    }
    put("7-1/authorized", "1")
    put("7-1:1.0/bInterfaceClass", "0e")
    put("7-1:1.1/bInterfaceClass", "0e")
    put("7-1:1.2/bInterfaceClass", "01")
    put("3-2/authorized", "1")
    put("3-2:1.0/bInterfaceClass", "03")
    put("5-4/authorized", "1", 0o444)
    put("5-4:1.0/bInterfaceClass", "0e")
    put("usb1/authorized", "1", 0o444)
    return root
}

const run = (root, mode) => parseCameras(execFileSync(cameraArgs(mode, root)[0], cameraArgs(mode, root).slice(1), { encoding: "utf8" }))

test("cameras are switched off and back on through writable authorized files", () => {
    const root = sysfs()
    assert.deepEqual(run(root, "state"), { blocked: 0, live: 1, denied: 1 })
    assert.deepEqual(run(root, "off"), { blocked: 1, live: 0, denied: 1 })
    assert.equal(readFileSync(join(root, "7-1/authorized"), "utf8").trim(), "0")
    assert.equal(readFileSync(join(root, "3-2/authorized"), "utf8").trim(), "1")
    assert.deepEqual(run(root, "on"), { blocked: 0, live: 1, denied: 1 })
    assert.equal(readFileSync(join(root, "7-1/authorized"), "utf8").trim(), "1")
})

test("parseCameras falls back to zeros on junk", () => {
    assert.deepEqual(parseCameras(""), { blocked: 0, live: 0, denied: 0 })
    assert.deepEqual(parseCameras("2 1 0\n"), { blocked: 2, live: 1, denied: 0 })
})

test("cameraArgs defaults to the real usb device directory", () => {
    assert.equal(cameraArgs("off")[4], "/sys/bus/usb/devices")
    assert.equal(cameraArgs("off")[5], "off")
})
