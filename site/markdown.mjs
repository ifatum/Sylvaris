const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }

export function escape(text) {
    return String(text).replace(/[&<>"]/g, c => ESC[c])
}

export function slug(text) {
    return String(text).replace(/`/g, "").replace(/ł/g, "l").replace(/Ł/g, "L").normalize("NFD").replace(/[̀-ͯ]/g, "")
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

function safeHref(href) {
    return /^(https?:|mailto:|#|\.{0,2}\/|[a-z0-9_.-]+(\/|$|#|\.))/i.test(href) && !/^[a-z]+script:/i.test(href)
}

export function inline(text, link) {
    const fix = link || (h => h)
    const codes = []
    let s = String(text).replace(/`([^`]+)`/g, (m, code) => {
        codes.push("<code>" + escape(code) + "</code>")
        return "\u0000" + (codes.length - 1) + "\u0000"
    })
    s = escape(s)
    const target = "\\(((?:[^()\\s]|\\([^()\\s]*\\))+)\\)"
    s = s.replace(new RegExp("!\\[([^\\]]*)\\]" + target, "g"), (m, alt, href) => safeHref(href) ? "<img src=\"" + fix(href) + "\" alt=\"" + alt + "\" loading=\"lazy\">" : alt)
    s = s.replace(new RegExp("\\[([^\\]]+)\\]" + target, "g"), (m, label, href) => safeHref(href) ? "<a href=\"" + fix(href) + "\">" + label + "</a>" : label)
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    s = s.replace(/(^|[^\w*])\*([^*\s][^*]*?)\*(?=[^\w*]|$)/g, "$1<em>$2</em>")
    s = s.replace(/(^|[^\w])_([^_\s][^_]*?)_(?=[^\w]|$)/g, "$1<em>$2</em>")
    return s.replace(/\u0000(\d+)\u0000/g, (m, i) => codes[Number(i)])
}

function cells(line) {
    const out = []
    let cur = ""
    let code = false
    const body = line.trim().replace(/^\|/, "").replace(/\|$/, "")
    for (let i = 0; i < body.length; i++) {
        const c = body[i]
        if (c === "\\" && body[i + 1] === "|") {
            cur += "|"
            i++
        } else if (c === "`") {
            code = !code
            cur += c
        } else if (c === "|" && !code) {
            out.push(cur.trim())
            cur = ""
        } else {
            cur += c
        }
    }
    out.push(cur.trim())
    return out
}

const isFence = l => /^```/.test(l)
const isHeading = l => /^#{1,6}\s/.test(l)
const isRule = l => /^(-{3,}|\*{3,})\s*$/.test(l)
const isItem = l => /^\s*([-*]|\d+\.)\s+/.test(l)
const isQuote = l => /^>/.test(l)
const isTableAt = (lines, i) => /^\|/.test(lines[i]) && i + 1 < lines.length && /^\|?\s*:?-{2,}/.test(lines[i + 1])

export function render(source, link) {
    const lines = String(source).replace(/\r\n/g, "\n").split("\n")
    const headings = []
    const used = {}
    const inl = t => inline(t, link)
    let html = ""
    let i = 0
    while (i < lines.length) {
        const line = lines[i]
        if (line.trim() === "") {
            i++
        } else if (isFence(line)) {
            const lang = line.slice(3).trim()
            const body = []
            i++
            while (i < lines.length && !isFence(lines[i]))
                body.push(lines[i++])
            i++
            html += "<pre" + (lang ? " data-lang=\"" + escape(lang) + "\"" : "") + "><code>" + escape(body.join("\n")) + "</code></pre>\n"
        } else if (isHeading(line)) {
            const m = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line)
            const level = m[1].length
            const plain = m[2].replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*_]/g, "")
            let id = slug(plain) || "section"
            used[id] = (used[id] || 0) + 1
            if (used[id] > 1)
                id += "-" + used[id]
            headings.push({ level: level, id: id, text: plain.replace(/`/g, "") })
            html += "<h" + level + " id=\"" + id + "\"><a class=\"anchor\" href=\"#" + id + "\" aria-hidden=\"true\" tabindex=\"-1\">#</a>" + inl(m[2]) + "</h" + level + ">\n"
            i++
        } else if (isRule(line)) {
            html += "<hr>\n"
            i++
        } else if (isTableAt(lines, i)) {
            const head = cells(line)
            const align = cells(lines[i + 1]).map(c => /^:-+:$/.test(c) ? " class=\"c\"" : /-+:$/.test(c) ? " class=\"r\"" : "")
            i += 2
            let rows = ""
            while (i < lines.length && /^\|/.test(lines[i])) {
                rows += "<tr>" + cells(lines[i]).map((c, k) => "<td" + (align[k] || "") + ">" + inl(c) + "</td>").join("") + "</tr>\n"
                i++
            }
            html += "<div class=\"table\"><table>\n<thead><tr>" + head.map((c, k) => "<th" + (align[k] || "") + ">" + inl(c) + "</th>").join("") + "</tr></thead>\n<tbody>\n" + rows + "</tbody></table></div>\n"
        } else if (isQuote(line)) {
            const body = []
            while (i < lines.length && isQuote(lines[i]))
                body.push(lines[i++].replace(/^>\s?/, ""))
            html += "<blockquote>" + render(body.join("\n"), link).html + "</blockquote>\n"
        } else if (isItem(line)) {
            const ordered = /^\s*\d+\./.test(line)
            const items = []
            while (i < lines.length && lines[i].trim() !== "" && (isItem(lines[i]) || /^\s+\S/.test(lines[i]))) {
                if (isItem(lines[i]))
                    items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ""))
                else
                    items[items.length - 1] += " " + lines[i].trim()
                i++
            }
            const tag = ordered ? "ol" : "ul"
            html += "<" + tag + ">\n" + items.map(t => "<li>" + inl(t) + "</li>\n").join("") + "</" + tag + ">\n"
        } else {
            const body = []
            while (i < lines.length && lines[i].trim() !== "" && !isFence(lines[i]) && !isHeading(lines[i]) && !isRule(lines[i]) && !isQuote(lines[i]) && !isItem(lines[i]) && !isTableAt(lines, i))
                body.push(lines[i++].trim())
            html += "<p>" + inl(body.join(" ")) + "</p>\n"
        }
    }
    const first = headings.find(h => h.level === 1)
    return { html: html, headings: headings, title: first ? first.text : "" }
}
