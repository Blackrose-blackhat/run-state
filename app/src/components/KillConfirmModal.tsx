import React from "react";
import { KillState } from "../types";

interface KillConfirmModalProps {
  killState: KillState;
  onConfirm: (force?: boolean) => void;
  onCancel: () => void;
}

/**
 * Modal for kill simulation preview and confirmation.
 * Shows impact analysis before terminating a process.
 */
export const KillConfirmModal: React.FC<KillConfirmModalProps> = ({
  killState,
  onConfirm,
  onCancel,
}) => {
  if (killState.status !== "confirming" && killState.status !== "terminating") {
    return null;
  }

  const isTerminating = killState.status === "terminating";
  const simulation = killState.status === "confirming" ? killState.simulation : null;

  return (
    <div className="modal-overlay" onClick={onCancel} style={{ backdropFilter: 'blur(4px)', background: 'rgba(2, 6, 23, 0.4)' }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ boxShadow: 'var(--shadow-lg)' }}>
        {/* Header */}
        <div className="modal-header" style={{ padding: '20px 24px', background: 'var(--card)' }}>
          {simulation?.is_protected ? (
            <span className="modal-icon" style={{ filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.3))' }}>🔒</span>
          ) : (
            <span className="modal-icon" style={{ filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.3))' }}>⚠️</span>
          )}
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>
            {simulation?.is_protected
              ? "System-Critical Guard"
              : "Termination Preview"}
          </h3>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '24px' }}>
          {simulation ? (
            <>
              {/* Target Process */}
              <div className="target-info" style={{ 
                background: 'var(--secondary)', 
                padding: '16px', 
                borderRadius: '12px',
                border: '1px solid var(--border)' 
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Target Entity</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <code style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--foreground)' }}>{simulation.target_process?.name || "Unknown"}</code>
                    <span className="text-muted" style={{ fontWeight: 600 }}>PID {simulation.target_pid}</span>
                  </div>
                </div>
              </div>

              {/* Protected Warning */}
              {simulation.is_protected && simulation.protected_reason && (
                <div className="protected-warning" style={{ 
                  marginTop: '16px',
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: 'var(--destructive)',
                  fontWeight: 500,
                  fontSize: '0.875rem'
                }}>
                  <strong style={{ fontWeight: 800 }}>Critical:</strong> {simulation.protected_reason}
                </div>
              )}

              {/* Impact Summary */}
              {(simulation.child_processes.length > 0 ||
                simulation.affected_ports.length > 0) && (
                <div className="impact-summary" style={{ marginTop: '20px' }}>
                  <div className="metric-label" style={{ marginBottom: '12px', fontSize: '0.7rem' }}>Collateral Impact</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {simulation.child_processes.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 500 }}>
                        <span style={{ color: 'var(--primary)' }}>•</span>
                        <span>{simulation.child_processes.length} dependant process{simulation.child_processes.length > 1 ? "es" : ""}</span>
                      </div>
                    )}
                    {simulation.affected_ports.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 500 }}>
                        <span style={{ color: 'var(--primary)' }}>•</span>
                        <span>Releasing Ports: {simulation.affected_ports.map((p) => `:${p}`).join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {simulation.warnings.length > 0 && (
                <div style={{ marginTop: '20px', padding: '12px', background: 'var(--muted)', borderRadius: '8px' }}>
                  {simulation.warnings.map((w, i) => (
                    <div key={i} style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--muted-foreground)', display: 'flex', gap: '8px' }}>
                      <span>💡</span> <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : isTerminating ? (
            <div className="terminating-status">
              <div className="spinner" style={{ width: '32px', height: '32px' }} />
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '12px' }}>
                {killState.phase === "sigterm"
                  ? "Graceful Signal Sent..."
                  : "Forced Shutdown in Progress..."}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: '20px 24px', background: 'var(--muted)' }}>
          <button
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={isTerminating}
            style={{ fontWeight: 700 }}
          >
            Abort
          </button>
          {simulation && (
            <button
              className={`btn ${simulation.is_protected ? 'btn-danger' : 'btn-primary'}`}
              onClick={() => onConfirm(simulation.is_protected)}
              disabled={isTerminating}
              style={{ padding: '10px 24px', borderRadius: '8px' }}
            >
              {simulation.is_protected
                ? "Override Guard"
                : "Confirm Termination"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

