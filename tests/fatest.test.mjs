import { test } from "node:test"
import assert from "node:assert/strict"
import { INITIAL, parseLine, reduce, parseHistory, speed, gauge, configArgs, parseConfig } from "../shell/lib/fatest.mjs"

const run = lines => lines.reduce((s, l) => reduce(s, parseLine(l)), INITIAL)

test("a full stream walks server, download, upload and result", () => {
    const s = run([
        '{"event":"status","phase":"server"}',
        '{"event":"server","server":"Orange (Warsaw, Poland)","id":"4166","ping":18.7}',
        '{"event":"download","mbps":120.5}',
        '{"event":"download","mbps":80}',
        '{"event":"download","mbps":318.77,"done":true}',
        '{"event":"upload","mbps":20}',
        '{"event":"upload","mbps":43.78,"done":true}',
        '{"event":"result","result":{"server":"Orange (Warsaw, Poland)","ping":18.7,"download":318.77,"upload":43.78,"timestamp":"2026-09-27T22:20:21"}}'
    ])
    assert.equal(s.phase, "done")
    assert.equal(s.server, "Orange (Warsaw, Poland)")
    assert.equal(s.serverId, "4166")
    assert.equal(s.ping, 18.7)
    assert.equal(s.download, 318.77)
    assert.equal(s.upload, 43.78)
    assert.equal(s.result.timestamp, "2026-09-27T22:20:21")
})

test("live values track the current phase and its peak", () => {
    const s = run(['{"event":"server","server":"A","id":"1","ping":5}', '{"event":"download","mbps":120}', '{"event":"download","mbps":80}'])
    assert.equal(s.phase, "download")
    assert.equal(s.live, 80)
    assert.equal(s.peak, 120)
    const u = reduce(s, parseLine('{"event":"download","mbps":150,"done":true}'))
    assert.equal(u.phase, "upload")
    assert.equal(u.live, 0)
    assert.equal(u.peak, 0)
})

test("errors, warnings and junk lines", () => {
    const e = run(['{"event":"status"}', '{"event":"error","message":"offline"}'])
    assert.equal(e.phase, "error")
    assert.equal(e.error, "offline")
    assert.equal(run(['{"event":"warning","message":"server 42 is gone"}']).warning, "server 42 is gone")
    assert.equal(parseLine("not json"), null)
    assert.equal(parseLine("[1,2]"), null)
    assert.equal(reduce(INITIAL, null), INITIAL)
    assert.equal(reduce(INITIAL, { event: "mystery" }), INITIAL)
    const bad = run(['{"event":"server","server":"A","id":"1","ping":5}', '{"event":"download","mbps":"fast"}', '{"event":"download","mbps":-3}'])
    assert.equal(bad.live, 0)
})

test("a new run clears the previous one", () => {
    const done = run(['{"event":"error","message":"x"}'])
    const again = reduce(done, parseLine('{"event":"status","phase":"server"}'))
    assert.equal(again.phase, "server")
    assert.equal(again.error, "")
})

test("parseHistory keeps valid FaTest entries, newest first", () => {
    const text = JSON.stringify([
        { server: "A", ping: 10, download: 100, upload: 20, timestamp: "2026-09-01T10:00:00", client_ip: "1.1.1.1" },
        { server: "B", ping: "x", download: 100, upload: 20, timestamp: "2026-09-02T10:00:00" },
        null,
        { server: "C", ping: 12, download: 300, upload: 40, timestamp: "2026-09-03T10:00:00", extra: true }
    ])
    const h = parseHistory(text)
    assert.deepEqual(h.map(r => r.server), ["C", "A"])
    assert.equal(h[0].extra, true)
    assert.deepEqual(parseHistory(""), [])
    assert.deepEqual(parseHistory("{}"), [])
    assert.deepEqual(parseHistory("broken"), [])
})

test("speed and gauge", () => {
    assert.equal(speed(0), "0 Mbps")
    assert.equal(speed(4.567), "4.6 Mbps")
    assert.equal(speed(318.77), "319 Mbps")
    assert.equal(speed(1250), "1.25 Gbps")
    assert.equal(gauge(0), 0)
    assert.equal(gauge(1000), 1)
    assert.equal(gauge(5000), 1)
    assert.ok(gauge(100) > 0.6 && gauge(100) < 0.7)
    assert.equal(gauge(-1), 0)
})

test("configArgs validates FaTest defaults before they reach the command line", () => {
    assert.deepEqual(configArgs("pl", ""), ["config", "--country", "PL", "--server", "none"])
    assert.deepEqual(configArgs("", "4166"), ["config", "--country", "none", "--server", "4166"])
    assert.deepEqual(configArgs(" de ", " 12 "), ["config", "--country", "DE", "--server", "12"])
    assert.equal(configArgs("Poland", ""), null)
    assert.equal(configArgs("PL", "12; rm -rf ~"), null)
    assert.equal(configArgs("PL", "--show"), null)
})

test("parseConfig reads FaTest's config file", () => {
    assert.deepEqual(parseConfig('{"country":"PL","server_id":"4166"}'), { country: "PL", server: "4166" })
    assert.deepEqual(parseConfig('{"country":null,"server_id":null}'), { country: "", server: "" })
    assert.deepEqual(parseConfig("nope"), { country: "", server: "" })
})
