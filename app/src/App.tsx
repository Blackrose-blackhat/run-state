import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

type EngineStatus =
  | "starting"
  | "ready"
  | "unreachable"
  | "error";

function App() {
  const [status, setStatus] = useState<EngineStatus>("starting");
  const [port, setPort] = useState<number | null>(null);

  async function checkEngine() {
    try {
      const enginePort = await invoke<number | null>("get_engine_port");
      setPort(enginePort);

      if (!enginePort) {
        setStatus("starting");
        return;
      }

      const res = await fetch(`http://127.0.0.1:${enginePort}/health`, {
        method: "GET",
      });

      if (!res.ok) {
        setStatus("unreachable");
        return;
      }

      const text = await res.text();
      if (text === "OK") {
        setStatus("ready");
      } else {
        setStatus("unreachable");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  // auto-poll engine status
  useEffect(() => {
    checkEngine();
    const id = setInterval(checkEngine, 2000);
    return () => clearInterval(id);
  }, []);

  function renderStatus() {
    switch (status) {
      case "starting":
        return "Starting local safety engine…";
      case "ready":
        return `Engine running on port ${port}`;
      case "unreachable":
        return "Engine not responding";
      case "error":
        return "Engine error";
    }
  }

  return (
    <div
      style={{
        padding: 24,
        fontFamily: "system-ui, sans-serif",
        maxWidth: 480,
      }}
    >
      <h2 style={{ marginBottom: 8 }}>DevResidue</h2>

      <p
        style={{
          color:
            status === "ready"
              ? "#2e7d32"
              : status === "starting"
              ? "#555"
              : "#c62828",
        }}
      >
        {renderStatus()}
      </p>

      {/* keep this for debugging / reassurance */}
      <button onClick={checkEngine} style={{ marginTop: 12 }}>
        Recheck engine
      </button>
    </div>
  );
}

export default App;
