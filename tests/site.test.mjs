import { test } from "node:test"
import assert from "node:assert/strict"
import { render, slug, inline } from "../site/markdown.mjs"

test("slug makes stable ids from headings, Polish letters included", () => {
    assert.equal(slug("SylBar"), "sylbar")
    assert.equal(slug("Start it with your compositor"), "start-it-with-your-compositor")
    assert.equal(slug("Polityka prywatności"), "polityka-prywatnosci")
    assert.equal(slug("`capture.fps` and more!"), "capture-fps-and-more")
})

test("headings get ids, deduplicated, and are collected", () => {
    const r = render("# Title\n\n## Setup\n\ntext\n\n## Setup\n")
    assert.equal(r.title, "Title")
    assert.match(r.html, /<h2 id="setup"><a class="anchor" href="#setup"[^>]*>/)
    assert.match(r.html, /<h2 id="setup-2">/)
    assert.deepEqual(r.headings.map(h => [h.level, h.id]), [[1, "title"], [2, "setup"], [2, "setup-2"]])
})

test("paragraphs join lines and escape html", () => {
    assert.equal(render("one\ntwo <b>\n").html, "<p>one two &lt;b&gt;</p>\n")
})

test("inline code, bold, italics, links and images", () => {
    assert.equal(inline("run `a <b>` **now** and _then_ *maybe*"), "run <code>a &lt;b&gt;</code> <strong>now</strong> and <em>then</em> <em>maybe</em>")
    assert.equal(inline("[docs](guide.md) ![logo](a.svg)", h => h.replace(".md", ".html")), "<a href=\"guide.html\">docs</a> <img src=\"a.svg\" alt=\"logo\" loading=\"lazy\">")
    assert.equal(inline("`**not bold**`"), "<code>**not bold**</code>")
    assert.equal(inline("snake_case_word stays"), "snake_case_word stays")
    assert.equal(inline("[x](javascript:alert(1))"), "x")
})

test("fenced code keeps text and marks the language", () => {
    const r = render("```nix\n{ a = \"<b>\"; }\n```\n")
    assert.equal(r.html, "<pre data-lang=\"nix\"><code>{ a = &quot;&lt;b&gt;&quot;; }</code></pre>\n")
})

test("lists, ordered lists and continuation lines", () => {
    assert.equal(render("- one\n  more\n- two\n").html, "<ul>\n<li>one more</li>\n<li>two</li>\n</ul>\n")
    assert.equal(render("1. a\n2. b\n").html, "<ol>\n<li>a</li>\n<li>b</li>\n</ol>\n")
})

test("tables with alignment", () => {
    const r = render("| A | B |\n|---|:---:|\n| `x` | y |\n")
    assert.equal(r.html, "<div class=\"table\"><table>\n<thead><tr><th>A</th><th class=\"c\">B</th></tr></thead>\n<tbody>\n<tr><td><code>x</code></td><td class=\"c\">y</td></tr>\n</tbody></table></div>\n")
})

test("pipes inside code spans do not split table cells", () => {
    const r = render("| Command | Does |\n|---|---|\n| `wm workspace <n\\|next>` | go |\n")
    assert.match(r.html, /<td><code>wm workspace &lt;n\|next&gt;<\/code><\/td><td>go<\/td>/)
})

test("blockquotes and rules", () => {
    assert.equal(render("> **Experimental.** Careful.\n\n---\n").html, "<blockquote><p><strong>Experimental.</strong> Careful.</p>\n</blockquote>\n<hr>\n")
})
