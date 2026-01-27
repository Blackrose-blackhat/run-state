import React from "react";
import { ProcInfo, PortSnapshot, KillState } from "../types";
import { ResourceIcon } from "./ResourceIcon";

interface ProcessListProps {
  processes: Record<number, ProcInfo>;
  ports: PortSnapshot[];
  onSimulateKill: (pid: number) => Promise<void>;
  killState: KillState;
}

/**
 * ProcessList component displays a searchable table of all system processes.
 */
export const ProcessList: React.FC<ProcessListProps> = ({ 
  processes, 
  ports, 
  onSimulateKill,
  killState
}) => {
  const allProcs = Object.values(processes);
  const devProcs = allProcs.filter(p => (p as any).is_dev === true);
  const isKilling = killState.status === "terminating" ? killState.pid : null;

  return (
    <div className="view-fade-in">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px' 
      }}>
        <h1 style={{ textAlign: 'left', margin: 0 }}>Development Processes</h1>
        <div className="text-muted" style={{ fontWeight: 600, fontSize: '0.875rem' }}>
          {devProcs.length} dev services active
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 80 }}>PID</th>
              <th>Process Name</th>
              <th>Memory Use</th>
              <th>Active Ports</th>
              <th style={{ textAlign: 'right' }}>Management</th>
            </tr>
          </thead>
          <tbody>
            {devProcs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: 'var(--muted-foreground)' }}>
                  No active development processes detected
                </td>
              </tr>
            ) : (
              devProcs.slice(0, 100).map(p => {
                const ownedPorts = ports.filter(port => port.pid === p.pid);
                const isPortOwner = ownedPorts.length > 0;
                
                return (
                  <tr key={p.pid} style={{ transition: 'var(--transition)' }}>
                    <td style={{ fontWeight: 700, color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>
                      {p.pid}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ResourceIcon type={(p as any).icon} size={16} />
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</div>
                      </div>
                      <div className="text-muted" style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 500,
                        fontFamily: 'monospace',
                        marginTop: '4px',
                        maxWidth: '300px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }} title={p.cmdline}>
                        {p.cmdline}
                      </div>
                    </td>
                    <td style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                      {p.memory_mb.toFixed(1)} MB
                    </td>
                    <td>
                      {isPortOwner ? (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {ownedPorts.map(port => (
                            <code 
                              key={port.port} 
                              style={{ 
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: 'var(--secondary)',
                                color: 'var(--primary)',
                                padding: '2px 8px',
                                borderRadius: '4px'
                              }}
                            >
                              :{port.port}
                            </code>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.75rem', opacity: 0.5 }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 14px', fontSize: '0.75rem', fontWeight: 700 }}
                        disabled={isKilling === p.pid}
                        onClick={() => onSimulateKill(p.pid)}
                      >
                        {isKilling === p.pid ? "..." : "Terminate"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};


