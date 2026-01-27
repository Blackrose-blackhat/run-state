import { useState, useEffect, useMemo } from "react";
import { useEngine } from "./hooks/useEngine";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { PortMonitor } from "./components/PortMonitor";
import { ProcessList } from "./components/ProcessList";
import { KillConfirmModal } from "./components/KillConfirmModal";
import { View } from "./types";
import { usePreferences } from "./hooks/usePreferences";
import { Settings } from "./components/Settings";
import { NotificationToast } from "./components/NotificationToast";

/**
 * Main application component for DevResidue.
 * Uses modular components and a custom hook for state management.
 */
function App() {
  const { 
    status, 
    processes, 
    ports, 
    killState,
    simulateKill,
    killProcess, 
    resetKillState,
    forgottenPortsCount,
    orphanedPortsCount,
  } = useEngine();
  
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const { preferences, toggleTheme } = usePreferences();
  const theme = preferences.theme;

  // Handle kill confirmation from modal
  const handleConfirmKill = async (force?: boolean) => {
    if (killState.status === "confirming") {
      await killProcess(killState.pid, force);
      // Auto-reset after success/error with delay
      setTimeout(resetKillState, 2000);
    }
  };

  // Watch for errors
  useEffect(() => {
    if (killState.status === "error") {
      resetKillState();
    }
  }, [killState, resetKillState]);
  
  // Handle modal cancel
  const handleCancelKill = () => {
    resetKillState();
  };

  // Filtered data based on search query
  const filteredPorts = useMemo(() => {
    if (!searchQuery) return ports;
    const query = searchQuery.toLowerCase();
    return ports.filter(p => 
      p.port.toString().includes(query) || 
      p.pid.toString().includes(query) ||
      p.process?.name.toLowerCase().includes(query) ||
      p.process?.cmdline.toLowerCase().includes(query)
    );
  }, [ports, searchQuery]);

  const filteredProcesses = useMemo(() => {
    const procList = Object.values(processes);
    if (!searchQuery) return processes;
    const query = searchQuery.toLowerCase();
    const filtered = procList.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.pid.toString().includes(query) ||
      p.cmdline.toLowerCase().includes(query)
    );
    // Convert back to Record
    return filtered.reduce((acc, p) => {
      acc[p.pid] = p;
      return acc;
    }, {} as Record<number, ProcInfo>);
  }, [processes, searchQuery]);

  // Handle simulate kill from PortMonitor or ProcessList
  const handleSimulateKill = async (pid: number) => {
    await simulateKill(pid);
  };

  return (
    <div style={{ display: 'contents' }}>
      <Sidebar 
        activeView={activeView}
        setActiveView={setActiveView}
        status={status}
        theme={theme}
        toggleTheme={toggleTheme}
        forgottenCount={forgottenPortsCount}
        orphanedCount={orphanedPortsCount}
      />

      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search processes, ports..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px', width: '300px' }}
            />
          </div>
        </div>

         {activeView === 'dashboard' && (
           <Dashboard 
             processes={processes} 
             ports={ports} 
             forgottenPortsCount={forgottenPortsCount}
           />
         )}
         {activeView === 'ports' && (
           <PortMonitor 
             ports={filteredPorts} 
             processes={processes} 
             onSimulateKill={handleSimulateKill}
             killState={killState}
           />
         )}
         {activeView === 'processes' && (
           <ProcessList 
             processes={filteredProcesses} 
             ports={ports} 
             onSimulateKill={handleSimulateKill}
             killState={killState}
           />
         )}
         {activeView === 'settings' && (
           <Settings />
         )}
      </main>

      {/* Kill confirmation modal */}
      <KillConfirmModal
        killState={killState}
        onConfirm={handleConfirmKill}
        onCancel={handleCancelKill}
      />

      {/* Global component-specific CSS transitions and animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        .view-fade-in { animation: fadeIn 0.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        
        .port-row { cursor: pointer; transition: background 0.1s; }
        .port-row.expanded { background: var(--secondary); }
        
        .detail-row td { padding: 0; border: none; }
        .detail-container { padding: 16px 20px; border-bottom: 1px solid var(--border); background: var(--secondary); }
        
        .detail-tabs { display: flex; gap: 8px; margin-bottom: 12px; }
        .tab-btn { background: none; border: none; padding: 4px 8px; color: var(--muted-foreground); cursor: pointer; font-size: 0.75rem; font-weight: 500; border-radius: 4px; }
        .tab-btn:hover { background: var(--muted); }
        .tab-btn.active { color: var(--foreground); background: var(--muted); }
        
        .telemetry-view { background: #000; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 0.75rem; color: #eee; }
        .log-line span { color: #666; margin-right: 8px; }
        .log-line .type { color: #3b82f6; font-weight: bold; margin-right: 8px; }
        .pulse { color: #10b981; animation: blink 2s infinite; }
        @keyframes blink { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
        
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.75rem; }
        .detail-item .label { color: var(--muted-foreground); display: block; margin-bottom: 2px; }
        .full-cmd { word-break: break-all; max-height: 80px; overflow-y: auto; display: block; background: var(--background); padding: 4px; border: 1px solid var(--border); border-radius: 2px; font-family: monospace; }
        
        .graph-view { padding: 10px; display: flex; justify-content: center; }
        .tree-node { display: flex; flex-direction: column; align-items: center; position: relative; }
        .node-box { padding: 4px 10px; border-radius: 4px; border: 1px solid var(--border); font-size: 0.75rem; background: var(--background); }
        .node-box.root { border-color: var(--ring); border-width: 2px; }
        .tree-children { display: flex; gap: 12px; margin-top: 16px; }
        .connector { position: absolute; top: -16px; height: 16px; width: 1px; background: var(--border); }
        
        .search-input { background: var(--background); border: 1px solid var(--input); padding: 6px 12px; border-radius: var(--radius); font-size: 0.875rem; transition: var(--transition); width: 200px; }
        .search-input:focus { outline: none; border-color: var(--ring); }
        `}} />
      <NotificationToast />
    </div>
  );
}

export default App;
