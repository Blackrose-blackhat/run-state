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
import { Button } from "./ui/button";
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
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-border/50 shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-6 pb-0 flex-row items-center gap-4 space-y-0">
          <div className={`p-2.5 rounded-xl ${simulation?.is_protected ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
            {simulation?.is_protected ? <ShieldAlert className="size-6" /> : <AlertTriangle className="size-6" />}
          </div>
          <div className="flex flex-col gap-0.5">
            <DialogTitle className="text-xl font-bold tracking-tight">
              {simulation?.is_protected ? "System-Critical Guard" : "Termination Preview"}
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold uppercase tracking-wider opacity-60">
              Impact Analysis Snapshot
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="p-6 pt-2 space-y-6">
          {simulation ? (
            <>
              {/* Target Process */}
              <div className="bg-secondary/40 border border-border/40 p-5 rounded-2xl relative overflow-hidden group">
                <div className="flex flex-col gap-1.5 relative z-10">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest">Target Entity</span>
                  <div className="flex items-center gap-3">
                    <code className="text-lg font-black text-foreground">{simulation.target_process?.name || "Unknown"}</code>
                    <span className="px-2 py-0.5 bg-background/50 rounded-md text-xs font-bold border border-border/20 text-muted-foreground">PID {simulation.target_pid}</span>
                  </div>
                </div>
                <Activity className="absolute -bottom-4 -right-4 size-24 opacity-[0.03] rotate-12 group-hover:opacity-[0.06] transition-opacity" />
              </div>

              {/* Protected Warning */}
              {simulation.is_protected && simulation.protected_reason && (
                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
                  <ShieldAlert className="size-5 text-destructive shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-destructive">Restricted Action</span>
                    <span className="text-xs text-destructive/80 leading-relaxed font-medium">{simulation.protected_reason}</span>
                  </div>
                </div>
              )}

              {/* Impact Details */}
              {(simulation.child_processes.length > 0 || simulation.affected_ports.length > 0) && (
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-bold text-muted-foreground/40 tracking-widest px-1">Collateral Impact</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {simulation.child_processes.length > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-xl border border-border/5 text-sm font-medium">
                        <div className="size-1.5 rounded-full bg-primary/40 shadow-[0_0_8px_rgba(var(--primary),0.4)]" />
                        <span>{simulation.child_processes.length} dependant process{simulation.child_processes.length > 1 ? "es" : ""} affected</span>
                      </div>
                    )}
                    {simulation.affected_ports.length > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-xl border border-border/5 text-sm font-medium">
                        <div className="size-1.5 rounded-full bg-warning/40 shadow-[0_0_8px_rgba(var(--warning),0.4)]" />
                        <span>Releasing Ports: {simulation.affected_ports.map((p) => `:${p}`).join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {simulation.warnings.length > 0 && (
                <div className="space-y-2">
                  {simulation.warnings.map((w, i) => (
                    <div key={i} className="text-[11px] font-medium text-muted-foreground/70 flex gap-2.5 px-1 items-center">
                      <div className="size-1 rounded-full bg-muted-foreground/30" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : isTerminating ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4 animate-in fade-in zoom-in-95">
              <div className="relative">
                <Loader2 className="size-10 text-primary animate-spin" />
                <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-bold text-foreground">
                  {killState.phase === "sigterm" ? "Graceful Signal Sent" : "Forced Shutdown in Progress"}
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Awaiting Runtime Response</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <DialogFooter className="p-6 bg-secondary/30 border-t border-border/20 sm:justify-between gap-4">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isTerminating}
            className="font-bold hover:bg-background/80"
          >
            Abort Action
          </Button>
          {simulation && (
            <Button
              variant={simulation.is_protected ? "destructive" : "default"}
              onClick={() => onConfirm(simulation.is_protected)}
              disabled={isTerminating}
              className={`font-bold px-8 shadow-lg transition-all active:scale-95 ${simulation.is_protected ? 'shadow-destructive/20' : 'shadow-primary/20'}`}
            >
              {simulation.is_protected ? "Override Guard" : "Confirm Termination"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

