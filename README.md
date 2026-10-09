# Afterburner

A games page that opens browser games through [Scramjet](https://github.com/MercuryWorkshop/scramjet).

## Run

```bash
pnpm install
pnpm start
```

Open `http://localhost:8080`. Each button shows a logo and the game name. Clicking it opens Scramjet with that game’s address. The box at the top does the same for any link you paste.

## GitHub Codespaces

Create a codespace from this repo. The dev container installs dependencies and starts the server on port 8080. Open the forwarded site from the Ports tab. That address is `https://<codespace>-8080.app.github.dev`, which is what Scramjet needs for the service worker and the Wisp socket.

Use that forwarded link in the browser. A `localhost` address typed on your own machine only works when VS Code is forwarding the port onto your computer.
