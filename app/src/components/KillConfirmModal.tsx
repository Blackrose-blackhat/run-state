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
  onStopService: (pid: number, serviceName: string) => void;
  onCancel: () => void;
}

/**
 * Modal for kill simulation preview and confirmation using Shadcn UI.
 */
export const KillConfirmModal: React.FC<KillConfirmModalProps> = ({
  killState,
  onConfirm,
  onStopService,
  onCancel,
}) => {
  const isOpen =
    killState.status === "confirming" || killState.status === "terminating";
  const isTerminating = killState.status === "terminating";
  const simulation =
    killState.status === "confirming" ? killState.simulation : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="w-fit max-w-2xl p-0 overflow-hidden border-2 border-terminal-green bg-terminal-black shadow-[0_0_40px_rgba(0,255,65,0.15)]">
        {/* Header */}
        <DialogHeader className="px-6 py-5 border-b border-terminal-green/20">
          <div className="flex items-center gap-4">
            <div
              className={`p-2.5 border-2 transition-colors duration-300 ${simulation?.is_protected ? "border-terminal-red text-terminal-red" : "border-terminal-amber text-terminal-amber"}`}
            >
              {simulation?.is_protected ? (
                <ShieldAlert className="size-7" />
              ) : (
                <AlertTriangle className="size-7" />
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <DialogTitle className="text-lg font-black uppercase tracking-[0.2em] text-terminal-green">
                {simulation?.is_protected
                  ? simulation.system_service
                    ? "SERVICE_CONTROL"
                    : "GUARD_OVERRIDE"
                  : "TERMINATION_REQUEST"}
              </DialogTitle>
              <DialogDescription className="text-[9px] font-mono uppercase tracking-widest text-terminal-green/50">
                MODULE: IMPACT_ANALYZER_V1.1.0 // AUTH:{" "}
                {simulation?.is_protected ? "ELEVATED" : "USER"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 font-mono">
          {simulation ? (
            <>
              {/* Target Entity Section */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-terminal-green/30 bg-terminal-green/5 p-4 relative overflow-hidden group">
                  <span className="text-[9px] uppercase font-bold text-terminal-green/40 block mb-1.5 tracking-widest">
                    &gt;&gt; TARGETID
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-lg font-bold text-terminal-green truncate">
                      {simulation.target_process?.name || "UNKNOWN_PROC"}
                    </span>
                    <span className="text-[9px] text-terminal-green/50 font-bold">
                      PID: {simulation.target_pid}
                    </span>
                  </div>
                  <Activity className="absolute -bottom-2 -right-2 size-14 opacity-[0.03] text-terminal-green group-hover:scale-110 transition-transform" />
                </div>

                <div className="border border-white/10 bg-white/5 p-4 relative">
                  <span className="text-[9px] uppercase font-bold text-white/30 block mb-1.5 tracking-widest">
                    &gt;&gt; OWNER
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-lg font-bold text-white/80 truncate">
                      {simulation.target_process?.username || "SYSTEM"}
                    </span>
                    <span className="text-[9px] text-white/30 font-bold uppercase">
                      CLASS: {simulation.is_protected ? "PROTECTED" : "USER"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Service/Warning Detection */}
              {simulation.is_protected && (
                <div
                  className={`p-4 flex gap-3 items-start border-l-4 transition-all ${simulation.system_service ? "bg-terminal-amber/10 border-terminal-amber" : "bg-terminal-red/10 border-terminal-red animate-pulse"}`}
                >
                  {simulation.system_service ? (
                    <Activity className="size-5 text-terminal-amber shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="size-5 text-terminal-red shrink-0 mt-0.5" />
                  )}
                  <div className="flex flex-col gap-1.5">
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest ${simulation.system_service ? "text-terminal-amber" : "text-terminal-red"}`}
                    >
                      {simulation.system_service
                        ? "SYSTEM_SERVICE_DETECTED"
                        : "SECURITY_GUARD_WARNING"}
                    </span>
                    <p className="text-[9px] text-white/80 leading-relaxed font-bold uppercase">
                      {simulation.system_service
                        ? `Process is managed by SystemD: ${simulation.system_service}. Direct termination will trigger a restart. Use service stop for clean shutdown.`
                        : simulation.protected_reason ||
                          "Critical system process. Unauthorized termination may impact system stability."}
                    </p>
                  </div>
                </div>
              )}

              {/* Collateral Impact Vectors */}
              {(simulation.child_processes.length > 0 ||
                simulation.affected_ports.length > 0) && (
                <div className="space-y-3 bg-white/[0.02] p-4 border border-white/5">
                  <h4 className="text-[9px] uppercase font-black text-terminal-green/30 tracking-[3px]">
                    COLLATERAL_IMPACT_VECTORS
                  </h4>
                  <div className="space-y-2.5">
                    {simulation.child_processes.length > 0 && (
                      <div className="flex items-center gap-3 text-[10px]">
                        <div className="size-1.5 rounded-full bg-terminal-red shrink-0" />
                        <span className="text-white/60 uppercase">
                          <b className="text-terminal-red">
                            {simulation.child_processes.length}
                          </b>{" "}
                          SUBSIDIARY PROCESSES WILL BE TERMINATED
                        </span>
                      </div>
                    )}
                    {simulation.affected_ports.length > 0 && (
                      <div className="flex items-center gap-3 text-[10px]">
                        <div className="size-1.5 rounded-full bg-terminal-amber shrink-0" />
                        <span className="text-white/60 uppercase">
                          RELEASING_PORTS:{" "}
                          <b className="text-terminal-amber">
                            {simulation.affected_ports
                              .map((p) => `:${p}`)
                              .join(", ")}
                          </b>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : isTerminating ? (
            <div className="flex flex-col items-center justify-center py-10 gap-5 font-mono">
              <Loader2 className="size-11 text-terminal-green animate-spin opacity-40" />
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-xs font-black text-terminal-green uppercase tracking-[0.4em]">
                  {killState.phase === "sigterm" ? "SEND_TERM" : "SEND_KILL"}
                </span>
                <span className="text-[9px] text-terminal-green/30 uppercase tracking-[0.2em]">
                  AWAITING_SYS_ACK...
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-terminal-green/10 sm:justify-between items-center gap-4">
          <button
            onClick={onCancel}
            disabled={isTerminating}
            className="text-terminal-green/40 hover:text-terminal-green transition-colors font-bold text-[9px] uppercase tracking-[2px] disabled:opacity-30"
          >
            [ ABORT_SEQUENCE ]
          </button>

          <div className="flex gap-3 w-full sm:w-auto">
            {simulation?.system_service ? (
              <>
                <button
                  onClick={() => onConfirm(simulation.is_protected)}
                  disabled={isTerminating}
                  className="flex-1 sm:flex-initial px-4 py-2.5 border border-terminal-red/30 text-terminal-red/50 hover:text-terminal-red hover:bg-terminal-red/10 font-black text-[9px] uppercase tracking-widest transition-all active:scale-95"
                  title="Killing the PID directly will likely cause an immediate restart."
                >
                  DIRECT_KILL_PID
                </button>
                <button
                  onClick={() =>
                    onStopService(
                      simulation.target_pid,
                      simulation.system_service!,
                    )
                  }
                  disabled={isTerminating}
                  className="flex-[2] sm:flex-initial px-6 py-2.5 bg-terminal-amber text-terminal-black font-black text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(255,176,0,0.2)] hover:scale-105 active:scale-95 transition-all"
                >
                  STOP_SYSTEM_SERVICE
                </button>
              </>
            ) : (
              simulation && (
                <button
                  onClick={() => onConfirm(simulation.is_protected)}
                  disabled={isTerminating}
                  className={`w-full sm:w-auto px-8 py-3 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl ${
                    simulation.is_protected
                      ? "bg-terminal-red text-terminal-black shadow-terminal-red/10"
                      : "bg-terminal-green text-terminal-black shadow-terminal-green/10"
                  }`}
                >
                  {simulation.is_protected ? "FORCE_OVERRIDE" : "EXECUTE_PURGE"}
                </button>
              )
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
