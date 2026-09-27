import { test } from "node:test"
import assert from "node:assert/strict"
import { TOOLS, TOOL_KEYS, WIDTHS, INKS, normRect, arrowHead, fit, toImage, clampRect, addPoint, emptyHistory, push, undo, redo, isMark, editedName } from "../shell/lib/annotate.mjs"

test("every tool has one key and the keys do not collide", () => {
    assert.deepEqual(TOOLS, ["pen", "highlighter", "line", "arrow", "rect", "ellipse", "text", "pixelate", "crop"])
    assert.deepEqual(Object.values(TOOL_KEYS).sort(), TOOLS.slice().sort())
    assert.deepEqual(WIDTHS, [2, 4, 8])
    assert.ok(INKS.length >= 6 && INKS.every(c => /^#[0-9a-f]{6}$/.test(c)))
})

test("normRect works in any drag direction", () => {
    assert.deepEqual(normRect({ x: 10, y: 20 }, { x: 4, y: 30 }), { x: 4, y: 20, w: 6, h: 10 })
    assert.deepEqual(normRect({ x: 5, y: 5 }, { x: 5, y: 5 }), { x: 5, y: 5, w: 0, h: 0 })
})

test("arrowHead puts two wings behind the tip", () => {
    const [a, b] = arrowHead(0, 0, 100, 0, 10)
    assert.ok(a.x < 100 && b.x < 100)
    assert.ok(Math.abs(a.y + b.y) < 1e-9)
    assert.ok(Math.abs(Math.hypot(100 - a.x, a.y) - 10) < 1e-9)
})

test("fit scales an image down into a box, never up, and centres it", () => {
    assert.deepEqual(fit(2000, 1000, 1000, 1000), { scale: 0.5, x: 0, y: 250 })
    assert.deepEqual(fit(400, 200, 1000, 1000), { scale: 1, x: 300, y: 400 })
})

test("toImage maps view points back to image pixels and clamps them", () => {
    const f = fit(2000, 1000, 1000, 1000)
    assert.deepEqual(toImage(500, 500, f, 2000, 1000), { x: 1000, y: 500 })
    assert.deepEqual(toImage(-50, 5000, f, 2000, 1000), { x: 0, y: 1000 })
})

test("clampRect keeps a crop inside the image", () => {
    assert.deepEqual(clampRect({ x: -10, y: 5, w: 50, h: 2000 }, 100, 100), { x: 0, y: 5, w: 40, h: 95 })
    assert.deepEqual(clampRect({ x: 200, y: 0, w: 10, h: 10 }, 100, 100), { x: 100, y: 0, w: 0, h: 10 })
    assert.deepEqual(clampRect({ x: 1.4, y: 2.6, w: 10.3, h: 5.5 }, 100, 100), { x: 1, y: 3, w: 11, h: 5 })
})

test("addPoint skips moves shorter than the step", () => {
    let pts = addPoint([], { x: 0, y: 0 }, 2)
    pts = addPoint(pts, { x: 1, y: 0 }, 2)
    pts = addPoint(pts, { x: 3, y: 0 }, 2)
    assert.deepEqual(pts, [{ x: 0, y: 0 }, { x: 3, y: 0 }])
})

test("history pushes, undoes and redoes, and a new mark drops the redo stack", () => {
    let h = emptyHistory()
    h = push(h, "a")
    h = push(h, "b")
    h = undo(h)
    assert.deepEqual(h, { items: ["a"], undone: ["b"] })
    h = redo(h)
    assert.deepEqual(h, { items: ["a", "b"], undone: [] })
    h = undo(undo(h))
    assert.deepEqual(undo(h), h)
    h = push(redo(h), "c")
    assert.deepEqual(h, { items: ["a", "c"], undone: [] })
    assert.deepEqual(redo(h), h)
})

test("isMark drops clicks that drew nothing", () => {
    assert.equal(isMark({ tool: "rect", rect: { x: 0, y: 0, w: 1, h: 1 } }), false)
    assert.equal(isMark({ tool: "rect", rect: { x: 0, y: 0, w: 5, h: 1 } }), true)
    assert.equal(isMark({ tool: "pixelate", rect: { x: 0, y: 0, w: 5, h: 1 } }), false)
    assert.equal(isMark({ tool: "pen", points: [{ x: 0, y: 0 }] }), false)
    assert.equal(isMark({ tool: "pen", points: [{ x: 0, y: 0 }, { x: 4, y: 4 }] }), true)
    assert.equal(isMark({ tool: "arrow", from: { x: 0, y: 0 }, to: { x: 1, y: 1 } }), false)
    assert.equal(isMark({ tool: "text", at: { x: 0, y: 0 }, text: "" }), false)
    assert.equal(isMark({ tool: "text", at: { x: 0, y: 0 }, text: "hi" }), true)
})

test("editedName saves next to the original", () => {
    assert.equal(editedName("/a/Screenshot 1.png"), "/a/Screenshot 1 edited.png")
    assert.equal(editedName("/a/shot.jpg"), "/a/shot edited.png")
    assert.equal(editedName("/a/Screenshot 1 edited.png"), "/a/Screenshot 1 edited.png")
    assert.equal(editedName("/a/noext"), "/a/noext edited.png")
})
