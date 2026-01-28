import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { PreferencesProvider } from "./hooks/usePreferences";
import { NotificationsProvider } from "./lib/notifications";
import { ThemeProvider } from "./components/ui/theme-provider";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <PreferencesProvider>
        <NotificationsProvider>
          <App />
        </NotificationsProvider>
      </PreferencesProvider>
    </ThemeProvider>
  </React.StrictMode>
);
