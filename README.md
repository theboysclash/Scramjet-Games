# Afterburner

A games page that opens browser games through [Scramjet](https://github.com/MercuryWorkshop/scramjet).

## Run

```bash
pnpm install
pnpm start
```

Open `http://localhost:8080`. Each button shows a logo and the game name. Clicking it opens Scramjet with that game’s address. The box at the top does the same for any link you paste.

## GitHub Codespaces

Create a codespace and wait until setup finishes. The site listens on port 8080 over HTTP. Open the forwarded `https://<codespace>-8080.app.github.dev` link from the terminal.

In the Ports tab, port 8080 must use the HTTP protocol. HTTPS on that port makes Codespaces return HTTP 502, because this server does not speak TLS. The browser link is still `https://`.
