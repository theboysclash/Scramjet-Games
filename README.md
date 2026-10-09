# Afterburner

A games lobby that opens browser games through [Scramjet](https://github.com/MercuryWorkshop/scramjet). The catalog stays on this site. Choosing a title loads that game’s public page inside a Scramjet frame, using the local Wisp server and libcurl transport from the [Scramjet demo app](https://github.com/MercuryWorkshop/Scramjet-App).

## Run

```bash
pnpm install
pnpm start
```

Open `http://localhost:8080`. Search filters the cabinet. Pasting a full link and pressing Open loads that address through Scramjet too.

Service workers need HTTPS once this is off localhost.

## GitHub Codespaces

Create a codespace from this repo. The dev container installs dependencies and starts the server on port 8080. Open the forwarded site from the Ports tab. That address is `https://<codespace>-8080.app.github.dev`, which is what Scramjet needs for the service worker and the Wisp socket.

Use that forwarded link in the browser. A `localhost` address typed on your own machine only works when VS Code is forwarding the port onto your computer.
