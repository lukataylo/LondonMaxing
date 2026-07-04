import React from "react";
import ReactDOM from "react-dom/client";
import { GrudgeApp } from "./grudge/GrudgeApp";
import "./styles.css";
import "./screens/screens.css";

// Old Haunts is the shipped experience. The original Old Haunts AppShell is kept
// in the tree (./AppShell) for reference but no longer mounted.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GrudgeApp />
  </React.StrictMode>
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // The PWA still works without offline caching in unsupported contexts.
    });
  });
}
