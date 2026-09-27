import { test } from "node:test"
import assert from "node:assert/strict"
import { hyprRects, swayRects, fileName, elapsed, DEFAULT_CAPTURE, validateCapture, expand } from "../shell/lib/capture.mjs"

test("hyprRects lists visible, mapped windows as slurp boxes", () => {
    const clients = [
        { at: [10, 20], size: [800, 600], workspace: { id: 1 }, mapped: true, hidden: false, title: "a" },
        { at: [0, 0], size: [100, 100], workspace: { id: 2 }, mapped: true, hidden: false, title: "other ws" },
        { at: [5, 5], size: [50, 50], workspace: { id: 1 }, mapped: false, hidden: false, title: "unmapped" }
    ]
    const monitors = [{ activeWorkspace: { id: 1 } }]
    assert.deepEqual(hyprRects(clients, monitors), ["10,20 800x600"])
})

test("swayRects walks the tree and keeps visible windows", () => {
    const tree = { nodes: [{ type: "output", nodes: [{ type: "workspace", visible: true, nodes: [{ type: "con", pid: 1, visible: true, rect: { x: 0, y: 30, width: 640, height: 480 }, nodes: [] }], floating_nodes: [{ type: "floating_con", pid: 2, visible: true, rect: { x: 100, y: 100, width: 200, height: 150 }, nodes: [] }] }, { type: "workspace", visible: false, nodes: [{ type: "con", pid: 3, visible: false, rect: { x: 0, y: 0, width: 9, height: 9 }, nodes: [] }] }] }] }
    assert.deepEqual(swayRects(tree), ["0,30 640x480", "100,100 200x150"])
})

test("fileName stamps screenshots and recordings", () => {
    const d = new Date(2026, 8, 25, 4, 5, 6)
    assert.equal(fileName("shot", d), "Screenshot 2026-09-25 04-05-06.png")
    assert.equal(fileName("video", d), "Recording 2026-09-25 04-05-06.mp4")
})

test("elapsed reads like a stopwatch", () => {
    assert.equal(elapsed(0), "0:00")
    assert.equal(elapsed(65000), "1:05")
    assert.equal(elapsed(3725000), "1:02:05")
})

test("validateCapture and expand", () => {
    assert.deepEqual(validateCapture({}), DEFAULT_CAPTURE)
    assert.equal(validateCapture({ delay: 7 }).delay, 0)
    assert.equal(validateCapture({ delay: 5 }).delay, 5)
    assert.equal(validateCapture({ folder: 3 }).folder, DEFAULT_CAPTURE.folder)
    assert.equal(validateCapture({ copy: false, save: false }).save, true)
    assert.equal(expand("~/Pictures/Shots", "/home/a"), "/home/a/Pictures/Shots")
})

test("new capture settings have safe defaults and reject bad values", async () => {
    const { FORMATS, SCALES, AFTER, FPS, RESOLUTIONS, CODECS, CONTAINERS, VIDEO_QUALITIES, AUDIO_SOURCES, LIMITS } = await import("../shell/lib/capture.mjs")
    const d = validateCapture({})
    assert.equal(d.format, "png")
    assert.equal(d.quality, 90)
    assert.equal(d.cursor, false)
    assert.equal(d.scale, 0)
    assert.equal(d.after, "notify")
    assert.equal(d.pattern, "{kind} {date} {time}")
    assert.equal(d.fps, 0)
    assert.equal(d.resolution, "native")
    assert.equal(d.codec, "h264")
    assert.equal(d.container, "mp4")
    assert.equal(d.videoQuality, "balanced")
    assert.equal(d.audioSource, "output")
    assert.equal(d.constant, false)
    assert.equal(d.limit, 0)
    assert.equal(d.countdown, 0)
    const bad = validateCapture({ format: "gif", quality: 500, cursor: "yes", scale: 3, after: "print", pattern: "../x", fps: 7, resolution: "8k", codec: "prores", container: "avi", videoQuality: "ultra", audioSource: "both", constant: 1, limit: 2, countdown: 4 })
    for (const k of ["format", "quality", "cursor", "scale", "after", "pattern", "fps", "resolution", "codec", "container", "videoQuality", "audioSource", "constant", "limit", "countdown"])
        assert.deepEqual(bad[k], d[k], k)
    assert.equal(validateCapture({ quality: 55 }).quality, 55)
    assert.equal(validateCapture({ pattern: "shot-{date}" }).pattern, "shot-{date}")
    assert.equal(validateCapture({ pattern: "" }).pattern, d.pattern)
    assert.equal(validateCapture({ pattern: "a\u0000b" }).pattern, d.pattern)
    assert.equal(validateCapture({ pattern: ".hidden" }).pattern, d.pattern)
    assert.ok(FORMATS.includes("jpeg") && SCALES.includes(2) && AFTER.includes("edit") && FPS.includes(60))
    assert.ok(RESOLUTIONS.includes("1080") && CODECS.includes("vaapi") && CONTAINERS.includes("mkv"))
    assert.ok(VIDEO_QUALITIES.includes("small") && AUDIO_SOURCES.includes("mic") && LIMITS.includes(30))
})

test("fileName follows the pattern, the format and the container", () => {
    const d = new Date(2026, 8, 25, 4, 5, 6)
    const c = validateCapture({})
    assert.equal(fileName("shot", d, c), "Screenshot 2026-09-25 04-05-06.png")
    assert.equal(fileName("video", d, c), "Recording 2026-09-25 04-05-06.mp4")
    assert.equal(fileName("shot", d, validateCapture({ format: "jpeg", pattern: "{date}_{time}" })), "2026-09-25_04-05-06.jpg")
    assert.equal(fileName("video", d, validateCapture({ container: "mkv" })), "Recording 2026-09-25 04-05-06.mkv")
    assert.equal(fileName("video", d, validateCapture({ codec: "vp9" })), "Recording 2026-09-25 04-05-06.webm")
    assert.equal(fileName("shot", d, validateCapture({ pattern: "plain" })), "plain.png")
})

test("grimArgs turns shot settings into grim flags", async () => {
    const { grimArgs } = await import("../shell/lib/capture.mjs")
    assert.deepEqual(grimArgs(validateCapture({})), ["-t", "png"])
    assert.deepEqual(grimArgs(validateCapture({ format: "jpeg", quality: 70, cursor: true, scale: 1 })), ["-t", "jpeg", "-q", "70", "-c", "-s", "1"])
    assert.deepEqual(grimArgs(validateCapture({ scale: 0.5 })), ["-t", "png", "-s", "0.5"])
})

test("recorderArgs turns video settings into wf-recorder flags", async () => {
    const { recorderArgs } = await import("../shell/lib/capture.mjs")
    assert.deepEqual(recorderArgs(validateCapture({}), ""), ["-c", "libx264", "-x", "yuv420p", "-p", "crf=23", "-p", "preset=veryfast"])
    assert.deepEqual(recorderArgs(validateCapture({ codec: "h265", videoQuality: "high", fps: 60, resolution: "1080", constant: true }), "sink.monitor"),
        ["-c", "libx265", "-x", "yuv420p", "-p", "crf=22", "-p", "preset=fast", "-r", "60", "-F", "scale=-2:1080", "-D", "--audio=sink.monitor"])
    assert.deepEqual(recorderArgs(validateCapture({ codec: "vp9", videoQuality: "small" }), ""), ["-c", "libvpx-vp9", "-p", "crf=40", "-p", "b=0", "-p", "deadline=realtime", "-p", "cpu-used=8"])
    assert.deepEqual(recorderArgs(validateCapture({ codec: "vaapi", resolution: "720" }), ""), ["-c", "h264_vaapi", "-d", "/dev/dri/renderD128", "-p", "qp=24", "-F", "scale_vaapi=w=-2:h=720:format=nv12"])
    assert.deepEqual(recorderArgs(validateCapture({ codec: "vaapi", videoQuality: "high" }), ""), ["-c", "h264_vaapi", "-d", "/dev/dri/renderD128", "-p", "qp=20", "-F", "scale_vaapi=format=nv12"])
    assert.deepEqual(recorderArgs(validateCapture({ codec: "vp9", audio: true }), "").slice(-2), ["-C", "libopus"])
    assert.equal(recorderArgs(validateCapture({ codec: "h264", audio: true }), "").indexOf("-C"), -1)
})
