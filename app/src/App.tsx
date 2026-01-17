import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

function App() {
  const [status, setStatus] = useState("unknown");

async function checkEngine() {
  const port = await invoke<number | null>("get_engine_port");
  console.log("engine port:", port);

  if (!port) {
    setStatus("NO PORT");
    return;
  }

  const res = await fetch(`http://127.0.0.1:${port}/health`);
  const text = await res.text();
  setStatus(text);
}


  return (
    <div style={{ padding: 20 }}>
      <h2>DevResidue</h2>
      <button onClick={checkEngine}>Check engine</button>
      <p>Status: {status}</p>
    </div>
  );
}

export default App;
