import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { EngineStatus, ProcInfo, PortSnapshot, KillSimulation, KillResult, KillState } from "../types";
import { useNotifications } from "../lib/notifications";

export function useEngine() {
  const [status, setStatus] = useState<EngineStatus>("starting");
  const [enginePort, setEnginePort] = useState<number | null>(null);

  const [ports, setPorts] = useState<PortSnapshot[]>([]);
  const [killState, setKillState] = useState<KillState>({ status: "idle" });
  const { addNotification } = useNotifications();

  const fetchData = useCallback(async () => {
    try {
      const port = await invoke<number | null>("get_engine_port");
      setEnginePort(port);
      if (port) {
        localStorage.setItem('engine_port', port.toString());
      }

      if (!port) {
        setStatus("starting");
        return;
      }

      const portsRes = await fetch(`http://127.0.0.1:${port}/ports`);

      if (portsRes.ok) {
        setPorts(await portsRes.json());
        setStatus("ready");
      } else {
        setStatus("unreachable");
      }
    } catch (err) {
      console.error("Engine fetch error:", err);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Simulate kill (dry run) - returns impact analysis
  const simulateKill = async (pid: number): Promise<KillSimulation | null> => {
    if (!enginePort) return null;
    
    setKillState({ status: "simulating", pid });
    
    try {
      const res = await fetch(`http://127.0.0.1:${enginePort}/kill/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pid }),
      });
      
      if (!res.ok) {
        throw new Error(await res.text());
      }
      
      const simulation: KillSimulation = await res.json();
      setKillState({ status: "confirming", pid, simulation });
      return simulation;
    } catch (err) {
      setKillState({ status: "error", pid, error: String(err) });
      return null;
    }
  };

  // Execute kill with graceful two-phase termination
  const killProcess = async (pid: number, force: boolean = false): Promise<KillResult> => {
    if (!enginePort) {
      return { success: false, phase: "sigterm", message: "Engine not connected" };
    }
    
    setKillState({ status: "terminating", pid, phase: "sigterm" });
    
    try {
      const res = await fetch(`http://127.0.0.1:${enginePort}/kill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pid, force }),
      });
      
      if (!res.ok) {
        throw new Error(await res.text());
      }
      
      const result: KillResult = await res.json();
      
      if (result.success) {
        setKillState({ status: "success", pid, message: result.message });
        addNotification(`Process ${pid} terminated successfully`, 'success');
        // Refresh data after successful kill
        await fetchData();
      } else {
        setKillState({ status: "error", pid, error: result.message });
        addNotification(`Failed to terminate process ${pid}: ${result.message}`, 'error');
      }
      
      return result;
    } catch (err) {
      const error = String(err);
      setKillState({ status: "error", pid, error });
      addNotification(`Error: ${error}`, 'error');
      return { success: false, phase: "sigterm", message: error };
    }
  };

  // Reset kill state to idle
  const resetKillState = () => {
    setKillState({ status: "idle" });
  };

  // Get counts for and alerts
  const forgottenPortsCount = ports.filter(p => p.insight?.is_forgotten).length;
  const orphanedPortsCount = ports.filter(p => p.orphaned).length;

  return {
    status,
    enginePort,

    ports,
    killState,
    simulateKill,
    killProcess,
    resetKillState,
    forgottenPortsCount,
    orphanedPortsCount,
    refresh: fetchData
  };
}
