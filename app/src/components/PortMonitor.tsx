import React, { useState } from "react";
import { PortSnapshot, ProcInfo, DetailTab, KillState } from "../types";
import { TelemetryDrawer } from "./TelemetryDrawer";
import { ResourceIcon } from "./ResourceIcon";

interface PortMonitorProps {
  ports: PortSnapshot[];
  processes: Record<number, ProcInfo>;
  onSimulateKill: (pid: number) => Promise<void>;
  killState: KillState;
}

/**
 * Age indicator component with color-coded visual feedback
 */
const AgeIndicator: React.FC<{ category?: string; duration?: string }> = ({
  category,
  duration,
}) => {
  const colors = {
    fresh: "#10b981",
    lingering: "#f59e0b",
    forgotten: "#ef4444",
  };
  const color = category ? colors[category as keyof typeof colors] : "#94a3b8";

  return (
    <div 
      className="age-indicator" 
      title={`Open for ${duration || "unknown"}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        className="age-dot"
        style={{
          background: color,
          boxShadow: category === "forgotten" ? `0 0 10px ${color}66` : "none",
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          transition: 'all 0.3s ease'
        }}
      />
    </div>
  );
};

export const PortMonitor: React.FC<PortMonitorProps> = ({
  ports,
  processes,
  onSimulateKill,
  killState,
}) => {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("telemetry");

  const sortedPorts = [...ports].sort((a, b) => {
    if (a.insight?.is_forgotten !== b.insight?.is_forgotten) {
      return a.insight?.is_forgotten ? -1 : 1;
    }
    if (a.orphaned !== b.orphaned) return a.orphaned ? -1 : 1;
    return new Date(b.first_seen).getTime() - new Date(a.first_seen).getTime();
  });

  const getProcessTree = (pid: number) => {
    const tree: number[] = [];
    const findChildren = (parent: number) => {
      Object.values(processes).forEach((p) => {
        if (p.ppid === parent) {
          tree.push(p.pid);
          findChildren(p.pid);
        }
      });
    };
    findChildren(pid);
    return tree;
  };

  const isKilling = killState.status === "terminating" ? killState.pid : null;

  return (
    <div className="view-fade-in" style={{ width: '100%', maxWidth: '100%' }}>
      <div style={{ 
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 700 }}>
          Port Monitor
        </h1>
        <div style={{ 
          fontSize: '0.875rem', 
          color: 'var(--muted-foreground)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{sortedPorts.length} active {sortedPorts.length === 1 ? 'port' : 'ports'}</span>
        </div>
      </div>

      <div 
        className="card" 
        style={{ 
          padding: 0, 
          overflow: 'hidden', 
          border: '1px solid var(--border)',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '800px' }}>
            <thead>
              <tr style={{ 
                background: 'var(--muted)',
                borderBottom: '2px solid var(--border)'
              }}>
                <th style={{ 
                  width: '60px', 
                  textAlign: 'center',
                  padding: '12px 16px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--muted-foreground)'
                }}>
                  Age
                </th>
                <th style={{ 
                  padding: '12px 16px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--muted-foreground)',
                  textAlign: 'left'
                }}>
                  Port
                </th>
                <th style={{ 
                  padding: '12px 16px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--muted-foreground)',
                  textAlign: 'left'
                }}>
                  Process / Service
                </th>
                <th style={{ 
                  padding: '12px 16px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--muted-foreground)',
                  textAlign: 'left'
                }}>
                  Status
                </th>
                <th style={{ 
                  padding: '12px 16px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--muted-foreground)',
                  textAlign: 'right',
                  width: '120px'
                }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPorts.length === 0 ? (
                <tr>
                  <td 
                    colSpan={5} 
                    style={{ 
                      padding: '48px 24px',
                      textAlign: 'center',
                      color: 'var(--muted-foreground)',
                      fontSize: '0.875rem'
                    }}
                  >
                    No active ports detected
                  </td>
                </tr>
              ) : (
                sortedPorts.map((p) => {
                  const key = `${p.port}-${p.pid}`;
                  const isExpanded = expandedKey === key;

                  return (
                    <React.Fragment key={key}>
                      <tr
                        className={`port-row ${isExpanded ? "expanded" : ""} ${
                          p.insight?.is_forgotten ? "forgotten-row" : ""
                        }`}
                        onClick={() => setExpandedKey(isExpanded ? null : key)}
                        style={{ 
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease',
                          borderBottom: '1px solid var(--border)',
                          background: isExpanded ? 'var(--muted)' : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (!isExpanded) {
                            e.currentTarget.style.background = 'var(--muted)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isExpanded) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        <td style={{ 
                          textAlign: 'center',
                          padding: '16px',
                          verticalAlign: 'middle'
                        }}>
                          <AgeIndicator
                            category={p.insight?.age_category}
                            duration={p.insight?.age_duration}
                          />
                        </td>
                        <td style={{ 
                          padding: '16px',
                          verticalAlign: 'middle'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <code
                                style={{ 
                                  fontWeight: 700, 
                                  color: "var(--primary)",
                                  background: 'var(--secondary)',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.9rem',
                                  fontFamily: 'monospace'
                                }}
                              >
                                :{p.port}
                              </code>
                              <span 
                                className={`badge ${
                                  p.interface === 'public' || p.interface === 'any' 
                                    ? 'badge-warning' 
                                    : 'badge-success'
                                }`}
                                style={{ 
                                  fontSize: '0.65rem', 
                                  padding: '3px 8px',
                                  fontWeight: 600,
                                  borderRadius: '4px'
                                }}
                              >
                                {p.interface.toUpperCase()}
                              </span>
                            </div>
                            <div style={{ 
                              fontSize: '0.7rem', 
                              color: 'var(--muted-foreground)', 
                              fontFamily: 'monospace',
                              letterSpacing: '-0.02em'
                            }}>
                              {p.local_addr}
                            </div>
                          </div>
                        </td>
                        <td style={{ 
                          padding: '16px',
                          verticalAlign: 'middle',
                          maxWidth: '350px'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <ResourceIcon type="system" size={16} />
                              <div style={{ 
                                fontWeight: 600, 
                                fontSize: '0.875rem', 
                                color: 'var(--foreground)',
                                lineHeight: 1.4
                              }}>
                                {p.process?.name || (p.pid === 0 ? "System/Container" : "Unknown Process")}
                              </div>
                            </div>
                            <div
                              className="text-muted"
                              style={{ 
                                fontSize: '0.7rem', 
                                fontWeight: 500,
                                fontFamily: 'monospace',
                                background: 'var(--secondary)',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: 'var(--muted-foreground)',
                                lineHeight: 1.5
                              }}
                              title={p.process?.cmdline || p.insight?.explanation}
                            >
                              {p.process?.cmdline || p.insight?.explanation || (p.pid === 0 ? "External or System Service" : `PID: ${p.pid}`)}
                            </div>
                          </div>
                        </td>
                        <td style={{ 
                          padding: '16px',
                          verticalAlign: 'middle'
                        }}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {p.insight?.is_forgotten && (
                              <span 
                                className="badge badge-warning"
                                style={{ 
                                  fontSize: '0.7rem',
                                  padding: '4px 10px',
                                  fontWeight: 600,
                                  borderRadius: '4px'
                                }}
                              >
                                Forgotten
                              </span>
                            )}
                            {p.orphaned && (
                              <span 
                                className="badge badge-danger"
                                style={{ 
                                  fontSize: '0.7rem',
                                  padding: '4px 10px',
                                  fontWeight: 600,
                                  borderRadius: '4px'
                                }}
                              >
                                Orphaned
                              </span>
                            )}
                            {!p.orphaned && !p.insight?.is_forgotten && (
                              <span 
                                className="badge badge-success"
                                style={{ 
                                  fontSize: '0.7rem',
                                  padding: '4px 10px',
                                  fontWeight: 600,
                                  borderRadius: '4px'
                                }}
                              >
                                Healthy
                              </span>
                            )}
                          </div>
                        </td>
                        <td 
                          onClick={(e) => e.stopPropagation()} 
                          style={{ 
                            textAlign: 'right',
                            padding: '16px',
                            verticalAlign: 'middle'
                          }}
                        >
                          <button
                            className="btn btn-secondary"
                            style={{ 
                              padding: "8px 16px", 
                              fontSize: "0.75rem", 
                              fontWeight: 600,
                              borderRadius: '6px',
                              transition: 'all 0.2s ease',
                              cursor: isKilling === p.pid ? 'not-allowed' : 'pointer',
                              opacity: isKilling === p.pid ? 0.6 : 1
                            }}
                            disabled={isKilling === p.pid}
                            onClick={() => onSimulateKill(p.pid)}
                          >
                            {isKilling === p.pid ? "Terminating..." : "Terminate"}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="detail-row">
                          <td 
                            colSpan={5} 
                            style={{ 
                              padding: '0', 
                              background: 'var(--muted)',
                              borderBottom: '1px solid var(--border)'
                            }}
                          >
                            <TelemetryDrawer
                              port={p}
                              processes={processes}
                              activeTab={activeTab}
                              setActiveTab={setActiveTab}
                              getProcessTree={getProcessTree}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};