import { useState, useEffect } from "react";
import { useEngine } from "./hooks/useEngine";
import { PortMonitor } from "./components/PortMonitor";
import { KillConfirmModal } from "./components/KillConfirmModal";
import { NotificationToast } from "./components/NotificationToast";
import { SplashScreen } from "./components/SplashScreen";

/**
 * Main application component for PortWatch.
 * Uses modular components and a custom hook for state management.
 */
function App() {
  const { 
    ports, 
    killState,
    simulateKill,
    killProcess, 
    resetKillState,
  } = useEngine();

  // Track if terms were accepted
  const [isInitialized, setIsInitialized] = useState<boolean>(() => {
    return localStorage.getItem("runstate_initialized") === "true";
  });
  
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

  // Handle simulate kill from PortMonitor
  const handleSimulateKill = async (pid: number) => {
    await simulateKill(pid);
  };

  const handleInitialize = () => {
    localStorage.setItem("runstate_initialized", "true");
    setIsInitialized(true);
  };

  return (
    <div className="flex w-full h-screen bg-[#050505] font-mono antialiased text-terminal-green selection:bg-terminal-green/30 selection:text-terminal-black overflow-hidden relative">
      {!isInitialized ? (
        <SplashScreen onAccept={handleInitialize} />
      ) : (
        <>
          <div className="flex-1 flex flex-col min-w-0">
            <section className="bg-transparent flex-1 min-w-full flex flex-col overflow-hidden">
              <main className="flex-grow flex flex-col overflow-hidden p-6 md:p-10 pt-5">
                <div className="max-w-[1600px] w-full mx-auto flex flex-col min-h-0 animate-in fade-in duration-500">
                  <PortMonitor 
                    ports={ports} 
                    onSimulateKill={handleSimulateKill}
                    killState={killState}
                  />
                </div>
              </main>
            </section>
          </div>

          <KillConfirmModal
            killState={killState}
            onConfirm={handleConfirmKill}
            onCancel={handleCancelKill}
          />
        </>
      )}
      <NotificationToast />
    </div>
  );
}

export default App;
