# Afterburner

A games lobby that opens browser games through [Scramjet](https://github.com/MercuryWorkshop/scramjet). The catalog stays on this site. Choosing a title loads that game’s public page inside a Scramjet frame, using the local Wisp server and libcurl transport from the [Scramjet demo app](https://github.com/MercuryWorkshop/Scramjet-App).

## Run

```bash
pnpm install
pnpm start
```

Open `http://localhost:8080`. Search filters the cabinet. Pasting a full link and pressing Open loads that address through Scramjet too.

Service workers need HTTPS once this is off localhost.
