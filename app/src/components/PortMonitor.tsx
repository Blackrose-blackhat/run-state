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
  const color = category ? colors[category as keyof typeof colors] : "var(--muted-foreground)";

  return (
    <div className="age-indicator" title={`Open for ${duration || "unknown"}`}>
      <div
        className="age-dot"
        style={{
          background: color,
          boxShadow: category === "forgotten" ? `0 0 10px ${color}66` : "none",
          width: '10px',
          height: '10px'
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
    <div className="view-fade-in">
      <h1 style={{ textAlign: 'left', marginBottom: '32px' }}>Port Monitor</h1>
      <div className="card" style={{ padding: 0, overflow: "hidden", border: '1px solid var(--border)' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 60, textAlign: 'center' }}>Age</th>
              <th>Port</th>
              <th>Process / Service</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedPorts.map((p) => {
              const key = `${p.port}-${p.pid}`;
              const isExpanded = expandedKey === key;

              return (
                <React.Fragment key={key}>
                  <tr
                    className={`port-row ${isExpanded ? "expanded" : ""} ${
                      p.insight?.is_forgotten ? "forgotten-row" : ""
                    }`}
                    onClick={() => setExpandedKey(isExpanded ? null : key)}
                    style={{ cursor: 'pointer', transition: 'var(--transition)' }}
                  >
                    <td style={{ textAlign: 'center' }}>
                      <AgeIndicator
                        category={p.insight?.age_category}
                        duration={p.insight?.age_duration}
                      />
                    </td>
                    <td>
                      <code
                        style={{ 
                          fontWeight: 700, 
                          color: "var(--primary)",
                          background: 'var(--secondary)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.9rem'
                        }}
                      >
                        :{p.port}
                      </code>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ResourceIcon type={p.insight?.icon} size={16} />
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--foreground)' }}>
                          {p.process?.name || "System/Container"}
                        </div>
                      </div>
                      <div
                        className="text-muted"
                        style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 500,
                          fontFamily: 'monospace',
                          background: 'var(--muted)',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          marginTop: '4px',
                          maxWidth: '400px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={p.process?.cmdline || p.insight?.explanation}
                      >
                        {p.process?.cmdline || p.insight?.explanation || `PID: ${p.pid}`}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {p.insight?.is_forgotten && (
                          <span className="badge badge-warning">Forgotten</span>
                        )}
                        {p.orphaned && (
                          <span className="badge badge-danger">Orphaned</span>
                        )}
                        {!p.orphaned && !p.insight?.is_forgotten && (
                          <span className="badge badge-success">Healthy</span>
                        )}
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "6px 12px", fontSize: "0.75rem", fontWeight: 700 }}
                        disabled={isKilling === p.pid}
                        onClick={() => onSimulateKill(p.pid)}
                      >
                        {isKilling === p.pid ? "..." : "Terminate"}
                      </button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="detail-row">
                      <td colSpan={5} style={{ padding: '0', background: 'var(--muted)' }}>
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
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

