import { useState, useEffect, useMemo } from "react";
import { useEngine } from "./hooks/useEngine";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { PortMonitor } from "./components/PortMonitor";
import { ProcessList } from "./components/ProcessList";
import { KillConfirmModal } from "./components/KillConfirmModal";
import { ProcInfo, View } from "./types";
import { usePreferences } from "./hooks/usePreferences";
import { Settings } from "./components/Settings";
import { NotificationToast } from "./components/NotificationToast";

import { Search } from "lucide-react";
import { SidebarProvider } from "./components/ui/sidebar";

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
    <SidebarProvider>
      <div className="flex w-full h-full min-h-screen bg-background font-sans antialiased text-foreground">
        <Sidebar 
          activeView={activeView}
          setActiveView={setActiveView}
          status={status}
          theme={theme}
          toggleTheme={toggleTheme}
          forgottenCount={forgottenPortsCount}
          orphanedCount={orphanedPortsCount}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="flex justify-end mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input 
                type="text" 
                className="flex h-10 w-full rounded-xl border border-input bg-background px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all" 
                placeholder="Search processes, ports..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
        <NotificationToast />
      </div>
    </SidebarProvider>
  );
}

export default App;
