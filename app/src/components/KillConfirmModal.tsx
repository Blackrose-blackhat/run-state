import React from "react";
import { KillState } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "./ui/dialog";

import { ShieldAlert, AlertTriangle, Activity, Loader2 } from "lucide-react";

interface KillConfirmModalProps {
  killState: KillState;
  onConfirm: (force?: boolean) => void;
  onCancel: () => void;
}

/**
 * Modal for kill simulation preview and confirmation using Shadcn UI.
 */
export const KillConfirmModal: React.FC<KillConfirmModalProps> = ({
  killState,
  onConfirm,
  onCancel,
}) => {
  const isOpen = killState.status === "confirming" || killState.status === "terminating";
  const isTerminating = killState.status === "terminating";
  const simulation = killState.status === "confirming" ? killState.simulation : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border-2 border-terminal-green bg-terminal-black shadow-[0_0_30px_rgba(0,255,65,0.2)]">
        {/* Header */}
        <DialogHeader className="p-6 pb-2 border-b border-terminal-green/30">
          <div className="flex items-center gap-4">
            <div className={`p-2 border-2 ${simulation?.is_protected ? 'border-terminal-red text-terminal-red' : 'border-terminal-amber text-terminal-amber'}`}>
              {simulation?.is_protected ? <ShieldAlert className="size-6" /> : <AlertTriangle className="size-6" />}
            </div>
            <div className="flex flex-col">
              <DialogTitle className="text-lg font-bold uppercase tracking-[0.2em] text-terminal-green">
                {simulation?.is_protected ? "CRITICAL_GUARD_OVERRIDE" : "TERMINATION_REQUEST"}
              </DialogTitle>
              <DialogDescription className="text-[10px] font-mono uppercase text-terminal-green/60">
                MODULE: IMPACT_ANALYZER_V1.0.4
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="p-6 pt-4 space-y-6 font-mono">
          {simulation ? (
            <>
              {/* Target Process */}
              <div className="border border-terminal-green/30 bg-terminal-green/5 p-4 relative overflow-hidden">
                <div className="flex flex-col gap-2 relative z-10">
                  <span className="text-[10px] uppercase font-bold text-terminal-green/40">&gt;&gt; TARGET_ENTITY</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-xl font-bold text-terminal-green">{simulation.target_process?.name || "UNKNOWN_PROC"}</span>
                    <span className="text-xs text-terminal-green/50">[PID_{simulation.target_pid}]</span>
                  </div>
                </div>
                <Activity className="absolute -bottom-2 -right-2 size-20 opacity-[0.05] text-terminal-green" />
              </div>

              {/* Protected Warning */}
              {simulation.is_protected && (
                <div className="border border-terminal-red bg-terminal-red/10 p-4 flex gap-3 items-start animate-pulse">
                  <ShieldAlert className="size-5 text-terminal-red shrink-0" />
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-black text-terminal-red uppercase tracking-widest">ACCESS_DENIED</span>
                    <span className="text-[10px] text-terminal-red leading-tight font-bold">{simulation.protected_reason || "PROCESS_UNDER_SYSTEM_PROTECTION"}</span>
                  </div>
                </div>
              )}

              {/* Impact Details */}
              {(simulation.child_processes.length > 0 || simulation.affected_ports.length > 0) && (
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-bold text-terminal-green/40 tracking-widest px-1">COLLATERAL_IMPACT</h4>
                  <div className="space-y-2">
                    {simulation.child_processes.length > 0 && (
                      <div className="flex items-center gap-3 p-2 border border-terminal-green/10 text-[11px] text-terminal-green/80">
                        <span className="text-terminal-green">&gt;&gt;</span>
                        <span>{simulation.child_processes.length} SUBSIDIARY PROCESSES WILL BE TERMINATED</span>
                      </div>
                    )}
                    {simulation.affected_ports.length > 0 && (
                      <div className="flex items-center gap-3 p-2 border border-terminal-green/10 text-[11px] text-terminal-green/80">
                        <span className="text-terminal-amber">&gt;&gt;</span>
                        <span>RELEASING_PORTS: {simulation.affected_ports.map((p) => `:${p}`).join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {simulation.warnings.length > 0 && (
                <div className="space-y-1">
                  {simulation.warnings.map((w, i) => (
                    <div key={i} className="text-[10px] text-terminal-green/60 flex gap-2 px-1 items-start">
                      <span>[*]</span>
                      <span>{w.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : isTerminating ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4 font-mono">
              <Loader2 className="size-8 text-terminal-green animate-spin" />
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-terminal-green uppercase tracking-[0.3em]">
                  {killState.phase === "sigterm" ? "SENDING_SIGTERM" : "SENDING_SIGKILL"}
                </span>
                <span className="text-[10px] text-terminal-green/40 uppercase">AWAITING_KERNEL_ACK...</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-terminal-green/30 sm:justify-between gap-4">
          <button
            onClick={onCancel}
            disabled={isTerminating}
            className="px-4 py-2 border border-terminal-green/30 text-terminal-green/60 hover:text-terminal-green hover:border-terminal-green font-bold text-xs uppercase transition-all disabled:opacity-30"
          >
            [ ABORT_SEQUENCE ]
          </button>
          {simulation && (
            <button
              onClick={() => onConfirm(simulation.is_protected)}
              disabled={isTerminating}
              className={`px-6 py-2 border-2 font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${
                simulation.is_protected 
                  ? 'border-terminal-red bg-terminal-red text-terminal-black hover:bg-transparent hover:text-terminal-red' 
                  : 'border-terminal-green bg-terminal-green text-terminal-black hover:bg-transparent hover:text-terminal-green'
              }`}
            >
              {simulation.is_protected ? "FORCE_OVERRIDE" : "EXECUTE_PURGE"}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


