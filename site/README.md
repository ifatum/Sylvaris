# The Sylvaris website

A static site built from `docs/`, a landing page and the legal pages. It needs Node.js and, for the demo videos, `ffmpeg`. Nothing is downloaded while it builds.

```sh
cp site/operator.example.json site/operator.json   # once, then fill it in
node site/build.mjs                                  # writes site/dist
python3 -m http.server -d site/dist 8000             # look at it on http://localhost:8000
```

`node site/build.mjs --strict` refuses to finish while the operator details are missing, which is the safe way to build for publishing.

## What goes in operator.json

The legal pages need to say who runs the site. `site/operator.json` is ignored by git, so these details never land in the public repository.

| Key | What to put there | Why |
|---|---|---|
| `name` | your first and last name | the service provider and the data controller must be identified by name (art. 5 of the Polish e-services act, art. 13 GDPR) |
| `address` | your address | the act asks for "miejsce zamieszkania i adres" next to the name (art. 5 ust. 2). Many people publish a correspondence address instead; that is common but not what the text says, so decide knowingly |
| `email` | an address you read | for complaints and privacy requests |
| `host` | your VPS company, for example "Hetzner Online GmbH" | the privacy policy must name who else can see the server logs |
| `hostCountry` | where the server is, for example "Niemcy (UE)" | the Polish text shows it as written, so write it in Polish |
| `logDays` | how many days the web server keeps logs | must match your server setup below |
| `updated` | the date of the last change to the legal pages | shown on the pages |

This is a careful reading of Polish and EU law for a small, free, non-commercial site that collects nothing, not legal advice. If the site ever starts selling something, takes payments, shows ads, adds analytics or accepts content from visitors, the pages have to change.

Things worth doing on the server side, because the privacy policy promises them:

- Keep access logs for no longer than `logDays` (the default is 14).
- Sign or accept your VPS provider's data processing agreement (DPA). Most providers include one in their terms; the policy describes them as a processor.
- Do not add analytics, fonts, embeds or anything else from other servers. `tests/site.test.mjs` checks the built pages for that.

## Publishing

```sh
node site/build.mjs --strict
rsync -av --delete site/dist/ you@your-vps:/var/www/sylvaris/
```

An nginx server block that matches what the site promises: strict security headers, long caching for fonts and videos, and access logs with the last part of every IP address removed.

```nginx
map $remote_addr $sylvaris_ip {
    ~(?P<a>\d+\.\d+\.\d+)\.\d+       $a.0;
    ~(?P<a>[^:]+:[^:]+:[^:]+):       $a::;
    default                          0.0.0.0;
}

log_format sylvaris '$sylvaris_ip [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent"';

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name sylvaris.example.org;

    root /var/www/sylvaris;
    index index.html;
    error_page 404 /404.html;
    access_log /var/log/nginx/sylvaris.log sylvaris;

    add_header Content-Security-Policy "default-src 'self'; img-src 'self' data:; media-src 'self'; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Strict-Transport-Security "max-age=31536000" always;

    location /assets/ { expires 30d; }
    location /media/  { expires 30d; }
}
```

`expires` sets the caching headers without touching the others. Avoid `add_header` inside a `location`: it replaces every header set above it, including the security ones. Rotate the log so it matches `logDays`, for example with logrotate:

```
/var/log/nginx/sylvaris.log {
    daily
    rotate 14
    missingok
    compress
    delaycompress
    postrotate
        nginx -s reopen
    endscript
}
```

## How it is put together

- `build.mjs` renders every page. The docs keep their folder layout, so `docs/parts/island.md` becomes `docs/parts/island.html`, and links to files outside `docs/` point to GitHub.
- `markdown.mjs` is a small Markdown renderer for exactly what the docs use, tested in `tests/site.test.mjs`.
- `content.mjs` holds the documentation menu, the parts shown on the landing page and the list of legal pages.
- `landing.html` is the home page; `legal/*.md` are the legal pages in Polish and English, with `{{name}}`-style fields filled from `operator.json`.
- `assets/` holds the stylesheet, one script and the fonts. `fonts.sh` rebuilds the font subsets from nixpkgs; their licence is in `assets/fonts/OFL.txt`.
- The demo videos are made from the GIFs in `docs/demo` with `ffmpeg` and cached in `dist/media`.
