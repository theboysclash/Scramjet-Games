"use strict";

const swAllowedHostnames = ["localhost", "127.0.0.1"];

async function registerSW() {
  if (!navigator.serviceWorker) {
    if (
      location.protocol !== "https:" &&
      !swAllowedHostnames.includes(location.hostname)
    ) {
      throw new Error("Service workers need HTTPS on this host.");
    }
    throw new Error("This browser does not support service workers.");
  }

  await navigator.serviceWorker.register("./sw.js");
}
