(() => {
    const doc = document.documentElement
    doc.classList.add("js")
    const base = document.body.dataset.base || ""
    const calm = matchMedia("(prefers-reduced-motion: reduce)")
    const $ = (sel, root) => (root || document).querySelector(sel)
    const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel))

    $$("[data-theme-pick]").forEach(btn => btn.addEventListener("click", () => {
        const id = btn.dataset.themePick
        if (id === "warm")
            delete doc.dataset.theme
        else
            doc.dataset.theme = id
        $$("[data-theme-pick]").forEach(b => b.setAttribute("aria-pressed", String(b === btn)))
    }))

    $$("pre").forEach(pre => {
        const btn = document.createElement("button")
        btn.type = "button"
        btn.className = "copy"
        btn.setAttribute("aria-label", "Copy")
        btn.innerHTML = "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"8\" y=\"8\" width=\"12\" height=\"12\" rx=\"3\"/><path d=\"M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2\"/></svg>"
        btn.addEventListener("click", () => {
            const text = (pre.querySelector("code") || pre).innerText
            const done = () => {
                btn.classList.add("done")
                setTimeout(() => btn.classList.remove("done"), 1400)
            }
            if (navigator.clipboard)
                navigator.clipboard.writeText(text).then(done, () => {})
        })
        pre.appendChild(btn)
    })

    const dialog = $("dialog.search")
    const input = $("#q")
    const list = $(".results")
    let index = null
    let hits = []
    let active = 0

    const loadIndex = () => index ? Promise.resolve(index) : fetch(base + "assets/search.json").then(r => r.json()).then(d => (index = d))
    const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[c])

    function score(q) {
        const words = norm(q).split(/\s+/).filter(Boolean)
        if (words.length === 0)
            return []
        const out = []
        for (const page of index) {
            const title = norm(page.t)
            const text = norm(page.x)
            let base = 0
            let ok = true
            for (const w of words) {
                if (title.includes(w))
                    base += title.startsWith(w) ? 12 : 8
                else if (text.includes(w))
                    base += 2
                else
                    ok = false
            }
            if (ok)
                out.push({ s: base, t: page.t, u: page.u, sub: snippet(page.x, words[0]) })
            for (const [id, h] of page.h) {
                const nh = norm(h)
                if (words.every(w => nh.includes(w)))
                    out.push({ s: 10 + (nh.startsWith(words[0]) ? 4 : 0), t: h, u: page.u + "#" + id, sub: page.t })
            }
        }
        return out.sort((a, b) => b.s - a.s).slice(0, 12)
    }

    function snippet(text, word) {
        const i = norm(text).indexOf(word)
        if (i < 0)
            return text.slice(0, 110)
        const start = Math.max(0, i - 40)
        return (start > 0 ? "..." : "") + text.slice(start, start + 120)
    }

    function show() {
        active = Math.min(active, Math.max(0, hits.length - 1))
        if (input.value.trim() === "") {
            list.innerHTML = "<li class=\"empty\">Try \"island\", \"per screen\", \"wallpaper\" or \"keybinds\".</li>"
            return
        }
        if (hits.length === 0) {
            list.innerHTML = "<li class=\"empty\">Nothing found for \"" + esc(input.value) + "\".</li>"
            return
        }
        list.innerHTML = hits.map((h, i) => "<li role=\"option\" aria-selected=\"" + (i === active) + "\"><a href=\"" + base + h.u + "\"><b>" + esc(h.t) + "</b><small>" + esc(h.sub) + "</small></a></li>").join("")
        const sel = list.children[active]
        if (sel)
            sel.scrollIntoView({ block: "nearest" })
    }

    function openSearch() {
        if (!dialog || dialog.open)
            return
        dialog.showModal()
        input.value = ""
        hits = []
        show()
        loadIndex().catch(() => {
            list.innerHTML = "<li class=\"empty\">Search needs the site to be served over http, not opened as a file.</li>"
        })
    }

    $$("[data-search-open]").forEach(b => b.addEventListener("click", openSearch))
    document.addEventListener("keydown", e => {
        const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)
        if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) {
            e.preventDefault()
            openSearch()
        }
    })
    if (input) {
        input.addEventListener("input", () => {
            loadIndex().then(() => {
                hits = score(input.value)
                active = 0
                show()
            })
        })
        input.addEventListener("keydown", e => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault()
                active = (active + (e.key === "ArrowDown" ? 1 : hits.length - 1)) % Math.max(1, hits.length)
                show()
            } else if (e.key === "Enter" && hits[active]) {
                e.preventDefault()
                location.href = base + hits[active].u
            }
        })
        dialog.addEventListener("click", e => {
            if (e.target === dialog)
                dialog.close()
        })
    }

    const toc = $$(".toc a")
    if (toc.length > 0 && "IntersectionObserver" in window) {
        const byId = new Map(toc.map(a => [a.getAttribute("href").slice(1), a]))
        const seen = new Set()
        const io = new IntersectionObserver(entries => {
            for (const en of entries) {
                if (en.isIntersecting)
                    seen.add(en.target.id)
                else
                    seen.delete(en.target.id)
            }
            const first = $$(".prose h2, .prose h3").find(h => seen.has(h.id))
            toc.forEach(a => a.classList.toggle("here", first !== undefined && a === byId.get(first.id)))
        }, { rootMargin: "-80px 0px -60% 0px" })
        $$(".prose h2, .prose h3").forEach(h => io.observe(h))
    }

    const pad = n => String(n).padStart(2, "0")
    function tick() {
        const now = new Date()
        $$("[data-clock]").forEach(el => (el.textContent = pad(now.getHours()) + ":" + pad(now.getMinutes())))
        $$("[data-date]").forEach(el => (el.textContent = now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })))
    }
    if ($("[data-clock]")) {
        tick()
        setInterval(tick, 15000)
    }

    const island = $("[data-island]")
    if (island) {
        const label = $("[data-isl-label]", island)
        const lead = $("[data-isl-lead]", island)
        const recTime = $("[data-rec-time]", island)
        const seek = $("[data-seek]", island)
        const playIcon = $("[data-play-icon]", island)
        const playBtn = $("[data-act=play]", island)
        let recording = true
        let playing = true
        let rec = 41
        let pos = 38
        let hovered = false
        const states = [
            () => ({ cls: "", text: "Night Drive" }),
            () => ({ cls: "rec", text: Math.floor(rec / 60) + ":" + pad(rec % 60) }),
            () => ({ cls: "msg", text: "Ana: see you at 8?" })
        ]
        let step = 0
        function paint() {
            const s = recording ? states[step]() : states[step === 1 ? 0 : step]()
            label.textContent = s.text
            lead.className = "isl-lead" + (s.cls ? " " + s.cls : "")
            recTime.textContent = Math.floor(rec / 60) + ":" + pad(rec % 60)
            seek.style.width = pos + "%"
            island.classList.toggle("solo", !recording)
            island.classList.toggle("paused", !playing)
        }
        const setOpen = on => island.classList.toggle("open", on)
        island.addEventListener("mouseenter", () => { hovered = true; setOpen(true) })
        island.addEventListener("mouseleave", () => { hovered = false; setOpen(false) })
        island.addEventListener("focusin", () => setOpen(true))
        island.addEventListener("focusout", e => { if (!island.contains(e.relatedTarget)) setOpen(false) })
        island.addEventListener("click", e => { if (e.target === island || e.target.closest(".island-pill")) setOpen(!island.classList.contains("open")) })
        $("[data-act=stop]", island).addEventListener("click", () => {
            recording = false
            if (step === 1)
                step = 0
            paint()
        })
        playBtn.addEventListener("click", () => {
            playing = !playing
            playIcon.innerHTML = playing ? "<path d=\"M9 6v12M15 6v12\"/>" : "<path d=\"M8 5.5v13l11-6.5z\"/>"
            playBtn.setAttribute("aria-label", playing ? "Pause" : "Play")
            paint()
        })
        setInterval(() => {
            if (recording)
                rec++
            if (playing)
                pos = pos >= 100 ? 0 : pos + 0.4
            paint()
        }, 1000)
        setInterval(() => {
            if (!hovered && !calm.matches) {
                step = (step + 1) % states.length
                if (!recording && step === 1)
                    step = 2
                paint()
            }
        }, 3600)
        paint()
    }

    $$(".tile").forEach(t => t.addEventListener("click", () => {
        const on = t.getAttribute("aria-pressed") !== "true"
        t.setAttribute("aria-pressed", String(on))
        const small = $("small", t)
        if (small && /^(On|Off)$/.test(small.textContent))
            small.textContent = on ? "On" : "Off"
    }))
    const vol = $("[data-vol]")
    if (vol) {
        const out = $("[data-vol-out]")
        vol.addEventListener("input", () => (out.textContent = vol.value + "%"))
    }

    const sky = $("[data-sky]")
    if (sky) {
        const parts = []
        const card = { name: $("[data-card-name]"), text: $("[data-card-text]"), link: $("[data-card-link]") }
        const nodes = $$(".node", sky)
        const wide = matchMedia("(min-width: 901px)")
        let filter = "all"
        let t0 = performance.now()
        let visible = true
        fetch(base + "assets/parts.json").then(r => r.json()).then(data => {
            data.forEach(p => parts.push(p))
            pick("island")
        }).catch(() => {})
        function pick(id) {
            const p = parts.find(x => x.id === id)
            if (!p)
                return
            nodes.forEach(n => n.setAttribute("aria-pressed", String(n.dataset.part === id)))
            card.name.textContent = p.name
            card.text.textContent = p.text
            card.link.textContent = "Read about " + p.name
            card.link.href = base + p.url
        }
        nodes.forEach(n => n.addEventListener("click", () => pick(n.dataset.part)))
        $$("[data-filter]").forEach(b => b.addEventListener("click", () => {
            filter = b.dataset.filter
            $$("[data-filter]").forEach(x => x.setAttribute("aria-pressed", String(x === b)))
            nodes.forEach(n => n.classList.toggle("dim", filter !== "all" && n.dataset.group !== filter))
        }))
        if ("IntersectionObserver" in window)
            new IntersectionObserver(es => (visible = es[0].isIntersecting)).observe(sky)
        function frame(now) {
            if (visible && wide.matches) {
                const stage = sky.querySelector("[data-stage]")
                const w = stage.clientWidth - 48
                const h = stage.clientHeight - 40
                const cx = 24 + w / 2
                const cy = 20 + h / 2
                const turn = calm.matches ? 0 : (now - t0) / 1000 * 0.035
                nodes.forEach((n, i) => {
                    const li = n.parentElement
                    const a = -Math.PI / 2 + i / nodes.length * Math.PI * 2 + turn + Math.sin(now / 2000 + i) * (calm.matches ? 0 : 0.01)
                    const x = cx + Math.cos(a) * (w / 2) * 0.88 - li.offsetWidth / 2
                    const y = cy + Math.sin(a) * (h / 2) * 0.82 - li.offsetHeight / 2
                    li.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)"
                })
            }
            requestAnimationFrame(frame)
        }
        requestAnimationFrame(frame)
    }

    const videos = $$(".reel video")
    if (videos.length > 0) {
        videos.forEach(v => v.addEventListener("click", () => (v.paused ? v.play() : v.pause())))
        if ("IntersectionObserver" in window && !calm.matches) {
            const io = new IntersectionObserver(es => es.forEach(e => {
                if (e.isIntersecting)
                    e.target.play().catch(() => {})
                else
                    e.target.pause()
            }), { threshold: 0.6 })
            videos.forEach(v => io.observe(v))
        }
    }

    const tabs = $("[data-tabs]")
    if (tabs) {
        const btns = $$("[role=tab]", tabs)
        const select = btn => {
            btns.forEach(b => {
                const on = b === btn
                b.setAttribute("aria-selected", String(on))
                b.tabIndex = on ? 0 : -1
                $("#" + b.getAttribute("aria-controls")).hidden = !on
            })
        }
        btns.forEach((b, i) => {
            b.addEventListener("click", () => select(b))
            b.addEventListener("keydown", e => {
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                    const next = btns[(i + (e.key === "ArrowRight" ? 1 : btns.length - 1)) % btns.length]
                    select(next)
                    next.focus()
                }
            })
        })
        select(btns[0])
    }
})()
