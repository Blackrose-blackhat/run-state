import { useState, useEffect } from "react";
import { useEngine } from "./hooks/useEngine";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { PortMonitor } from "./components/PortMonitor";
import { ProcessList } from "./components/ProcessList";
import { KillConfirmModal } from "./components/KillConfirmModal";
import { View } from "./types";
import { Settings } from "./components/Settings";
import { NotificationToast } from "./components/NotificationToast";

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
  const filteredPorts = ports;
  const filteredProcesses = processes;

  // Handle simulate kill from PortMonitor or ProcessList
  const handleSimulateKill = async (pid: number) => {
    await simulateKill(pid);
  };

  return (
    <SidebarProvider>
      <div className="flex w-full h-full bg-neutral-300/20 min-h-screen  font-sans antialiased text-foreground selection:bg-primary/20 selection:text-primary">
        <Sidebar 
        
          activeView={activeView}
          setActiveView={setActiveView}
          status={status}
          forgottenCount={forgottenPortsCount}
          orphanedPortsCount={orphanedPortsCount}
        />
        <div className="flex-1 flex flex-col min-w-0 py-5  " >
        <section className="bg-background  flex-1  min-w-full rounded-tl-2xl rounded-bl-2xl flex flex-col">
          

          <main className="flex-1 overflow-y-auto p-6 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
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
            </div>
          </main>
        </section>
        </div>

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
