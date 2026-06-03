import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ReminderWindow } from "./pages/ReminderWindow";
import "./index.css";

const params = new URLSearchParams(window.location.search);
const isReminderWindow = params.get("window") === "reminder";

if (isReminderWindow) {
  // Transparent root so the rounded card shape shows correctly
  document.documentElement.style.background = "transparent";
  document.body.style.background = "transparent";
}

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <React.StrictMode>
    {isReminderWindow ? <ReminderWindow /> : <App />}
  </React.StrictMode>,
);
