import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { kindOf, mimeOf, MIME_TYPES, NAME_FILTERS, pathFrom, order, step, DEFAULT_VIEWER, validateViewer, clock, execArgs, openers, uriOf } from "../shell/lib/viewer.mjs"

test("kindOf tells images from videos by extension, ignoring case", () => {
    assert.equal(kindOf("/a/b.PNG"), "image")
    assert.equal(kindOf("/a/b.webp"), "image")
    assert.equal(kindOf("/a/clip.mkv"), "video")
    assert.equal(kindOf("/a/clip.MP4"), "video")
    assert.equal(kindOf("/a/notes.txt"), null)
    assert.equal(kindOf("/a/noext"), null)
    assert.equal(kindOf("/a.dir/noext"), null)
})

test("mimeOf maps known files and falls back to octet-stream", () => {
    assert.equal(mimeOf("/x/y.jpg"), "image/jpeg")
    assert.equal(mimeOf("/x/y.webm"), "video/webm")
    assert.equal(mimeOf("/x/y.bin"), "application/octet-stream")
})

test("the desktop entry lists exactly the mime types the viewer opens", () => {
    const entry = readFileSync(new URL("../share/applications/sylvaris-viewer.desktop", import.meta.url), "utf8")
    const line = entry.split("\n").find(l => l.startsWith("MimeType="))
    assert.deepEqual(line.slice(9).split(";").filter(s => s !== "").sort(), MIME_TYPES.slice().sort())
    assert.ok(NAME_FILTERS.includes("*.png") && NAME_FILTERS.includes("*.MKV"))
})

test("pathFrom accepts absolute paths and file URIs and rejects everything else", () => {
    assert.equal(pathFrom("/home/n/Pictures/a b.png"), "/home/n/Pictures/a b.png")
    assert.equal(pathFrom("file:///home/n/a%20b%23.png"), "/home/n/a b#.png")
    assert.equal(pathFrom("file://localhost/tmp/x.png"), "/tmp/x.png")
    assert.equal(pathFrom("  /tmp/x.png\n"), "/tmp/x.png")
    assert.equal(pathFrom("relative.png"), "")
    assert.equal(pathFrom("https://example.com/a.png"), "")
    assert.equal(pathFrom("file://otherhost/a.png"), "")
    assert.equal(pathFrom("/tmp/a\u0000b.png"), "")
    assert.equal(pathFrom("file:///bad%zz.png"), "")
    assert.equal(pathFrom(undefined), "")
    assert.equal(pathFrom("/tmp/../etc/x.png"), "/etc/x.png")
})

test("order sorts names naturally so 2 comes before 10", () => {
    assert.deepEqual(order(["img10.png", "img2.png", "Img1.png", "b.mp4"]), ["b.mp4", "Img1.png", "img2.png", "img10.png"])
    assert.deepEqual(order(["shot10.jpg", "shot2.mp4", "shot 1.png"]), ["shot 1.png", "shot2.mp4", "shot10.jpg"])
    assert.deepEqual(order(["a.png", "A.png", "a1.png"]), ["A.png", "a.png", "a1.png"])
})

test("step wraps around both ends and handles empty lists", () => {
    assert.equal(step(3, 2, 1), 0)
    assert.equal(step(3, 0, -1), 2)
    assert.equal(step(3, 1, 1), 2)
    assert.equal(step(0, 0, 1), -1)
})

test("clock prints media positions in seconds as m:ss or h:mm:ss", () => {
    assert.equal(clock(0), "0:00")
    assert.equal(clock(65.4), "1:05")
    assert.equal(clock(3725), "1:02:05")
    assert.equal(clock(-3), "0:00")
    assert.equal(clock(NaN), "0:00")
})

test("validateViewer keeps booleans and falls back to defaults", () => {
    assert.deepEqual(validateViewer(null), DEFAULT_VIEWER)
    const v = validateViewer({ autoplay: false, loop: "yes", muted: true, extra: 1 })
    assert.equal(v.autoplay, false)
    assert.equal(v.loop, DEFAULT_VIEWER.loop)
    assert.equal(v.muted, true)
    assert.equal(v.extra, 1)
})

test("execArgs fills the file into an Exec line without a shell", () => {
    assert.deepEqual(execArgs("gimp-2.10 %U", "/p/a b.png"), ["gimp-2.10", "file:///p/a%20b.png"])
    assert.deepEqual(execArgs("mpv --player-operation-mode=pseudo-gui -- %F", "/v.mkv"), ["mpv", "--player-operation-mode=pseudo-gui", "--", "/v.mkv"])
    assert.deepEqual(execArgs("\"/opt/My App/run\" --x=\"a \\\"q\\\"\" %u", "/i.png"), ["/opt/My App/run", "--x=a \"q\"", "file:///i.png"])
    assert.deepEqual(execArgs("krita %i %c %k", "/i.png"), ["krita", "/i.png"])
    assert.deepEqual(execArgs("app --name=100%%", "/i.png"), ["app", "--name=100%", "/i.png"])
    assert.deepEqual(execArgs("", "/i.png"), [])
    assert.deepEqual(execArgs("viewer %u", "/a b#.png"), ["viewer", "file:///a%20b%23.png"])
})

test("openers offers other apps from the matching category, by name", () => {
    const apps = [
        { id: "gimp", name: "GIMP", categories: ["Graphics", "2DGraphics"], execString: "gimp %U" },
        { id: "mpv", name: "mpv", categories: ["AudioVideo", "Video", "Player"], execString: "mpv %F" },
        { id: "sylvaris-viewer", name: "SylViewer", categories: ["Graphics", "Video"], execString: "sylvaris viewer open %f" },
        { id: "calc", name: "Calc", categories: ["Office"], execString: "calc" },
        { id: "blank", name: "Blank", categories: ["Graphics"], execString: "" }
    ]
    assert.deepEqual(openers(apps, "image").map(a => a.id), ["gimp"])
    assert.deepEqual(openers(apps, "video").map(a => a.id), ["mpv"])
})

test("uriOf escapes spaces, hashes and question marks", () => {
    assert.equal(uriOf("/a b/c#1?.png"), "file:///a%20b/c%231%3F.png")
})
