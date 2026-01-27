import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { PreferencesProvider } from "./hooks/usePreferences";
import { NotificationsProvider } from "./lib/notifications";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <PreferencesProvider>
      <NotificationsProvider>
        <App />
      </NotificationsProvider>
    </PreferencesProvider>
  </React.StrictMode>
);
