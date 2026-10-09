# Afterburner

A games page that opens browser games through [Scramjet](https://github.com/MercuryWorkshop/scramjet).

## Run

```bash
pnpm install
pnpm start
```

Open `http://localhost:8080`. Each button shows a logo and the game name. Clicking it opens Scramjet with that game’s address. The box at the top does the same for any link you paste.

## GitHub Codespaces

Create a codespace from this repo and wait until the setup command finishes installing dependencies. Port 8080 stays closed until you start the site. In the codespace terminal run:

```bash
pnpm start
```

Click the `http://localhost:8080` link in that terminal. Codespaces forwards it to `https://<codespace>-8080.app.github.dev`. Use that forwarded link in the browser. If 8080 is already taken, the server prints the next port and that is the link to open.
