import React from "react";
import { PortSnapshot, KillState } from "../types";
import { ResourceIcon } from "./ResourceIcon";

interface PortMonitorProps {
  ports: PortSnapshot[];
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
    fresh: "#00FF41",
    lingering: "#FFB000",
    forgotten: "#FF0000",
  };
  const color = category ? colors[category as keyof typeof colors] : "#00FF41";

  return (
    <div 
      className="age-indicator" 
      title={`${category?.toUpperCase()} - Open for ${duration || "unknown"}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px'
      }}
    >
      <div
        className="age-dot"
        style={{
          background: color,
          boxShadow: `0 0 10px ${color}`,
          width: '6px',
          height: '6px',
          borderRadius: '0',
          transition: 'all 0.3s ease'
        }}
      />
      <span style={{ fontSize: '0.45rem', color: color, fontWeight: 'bold' }}>
        {duration}
      </span>
    </div>
  );
};

/**
 * Risk badge component
 */
const RiskBadge: React.FC<{ risk: string }> = ({ risk }) => {
  const styles: Record<string, { bg: string; text: string }> = {
    PUBLIC_EXPOSURE: { bg: "#FF0000", text: "#000" },
    ORPHANED_PROCESS: { bg: "#FFB000", text: "#000" },
    HIDDEN_PROCESS: { bg: "#555", text: "#FFF" },
  };

  const style = styles[risk] || { bg: "#333", text: "#FFF" };

  return (
    <span 
      style={{ 
        background: style.bg, 
        color: style.text, 
        fontSize: '0.6rem', 
        fontWeight: 'bold', 
        padding: '1px 4px', 
        marginLeft: '4px',
        borderRadius: '2px',
        textTransform: 'uppercase'
      }}
    >
      {risk.replace('_', ' ')}
    </span>
  );
};

/**
 * Reusable table component for different port categories
 */
const PortTable: React.FC<{
  title: string;
  ports: PortSnapshot[];
  onSimulateKill: (pid: number) => Promise<void>;
  onKillProject?: (projectName: string) => void;
  isKilling: number | null;
  emptyMessage: string;
}> = ({ title, ports, onSimulateKill, onKillProject, isKilling, emptyMessage }) => {
  // Group by project for the sweeper action
  const projects = Array.from(new Set(ports.filter(p => p.project).map(p => p.project!.name)));

  return (
    <div 
      className="terminal-card" 
      style={{ 
        padding: '16px', 
        overflow: 'hidden', 
        border: '2px solid #00FF41',
        background: '#050505',
        borderRadius: 0,
        boxShadow: '0 0 20px rgba(0, 255, 65, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        marginBottom: '20px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1rem', color: '#00FF41', fontWeight: 'bold' }}>
          [ {title} ]
        </h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {onKillProject && projects.length > 0 && (
            <div style={{ display: 'flex', gap: '4px' }}>
              <span style={{ fontSize: '0.6rem', color: 'rgba(0, 255, 65, 0.5)' }}>SWEEP:</span>
              {projects.map(proj => (
                <button 
                  key={proj}
                  onClick={() => onKillProject(proj)}
                  className="terminal-btn"
                  style={{ fontSize: '0.55rem', padding: '1px 4px', background: 'rgba(255, 0, 0, 0.2)', border: '1px solid #FF0000', color: '#FF0000' }}
                >
                  {proj.toUpperCase()}
                </button>
              ))}
            </div>
          )}
          <span style={{ fontSize: '0.7rem', color: 'rgba(0, 255, 65, 0.5)' }}>COUNT: {ports.length}</span>
        </div>
      </div>

      <div style={{ color: '#00FF41', fontFamily: 'monospace', marginBottom: '8px', fontSize: '0.7rem', flexShrink: 0 }}>
        +------------------------------------------------------------------------------------------------------------------+
      </div>
      
      <div style={{ overflow: 'auto', flex: 1, position: 'relative' }}>
        <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'separate', borderSpacing: 0, fontFamily: 'monospace' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 20 }}>
            <tr style={{ background: '#003B00' }}>
              <th style={{ padding: '8px', borderRight: '1px solid #00FF41', borderBottom: '2px solid #00FF41', color: '#00FF41', textAlign: 'center', width: '40px' }}>ST</th>
              <th style={{ padding: '8px', borderRight: '1px solid #00FF41', borderBottom: '2px solid #00FF41', color: '#00FF41', textAlign: 'left', width: '80px' }}>PORT</th>
              <th style={{ padding: '8px', borderRight: '1px solid #00FF41', borderBottom: '2px solid #00FF41', color: '#00FF41', textAlign: 'left', width: '80px' }}>PID</th>
              <th style={{ padding: '8px', borderRight: '1px solid #00FF41', borderBottom: '2px solid #00FF41', color: '#00FF41', textAlign: 'left', width: '100px' }}>ACTIVITY</th>
              <th style={{ padding: '8px', borderRight: '1px solid #00FF41', borderBottom: '2px solid #00FF41', color: '#00FF41', textAlign: 'left', width: '150px' }}>PROCESS / PROJECT</th>
              <th style={{ padding: '8px', borderRight: '1px solid #00FF41', borderBottom: '2px solid #00FF41', color: '#00FF41', textAlign: 'left' }}>CMDLINE / DETAILS</th>
              <th style={{ padding: '8px', borderRight: '1px solid #00FF41', borderBottom: '2px solid #00FF41', color: '#00FF41', textAlign: 'center', width: '80px' }}>MEM</th>
              <th style={{ padding: '8px', borderBottom: '2px solid #00FF41', color: '#00FF41', textAlign: 'right', width: '120px' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {ports.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '48px 24px', textAlign: 'center', color: '#00FF41', border: '1px solid rgba(0, 255, 65, 0.2)' }}>
                  [ {emptyMessage} ]
                </td>
              </tr>
            ) : (
              ports.map((p) => {
                const key = `${p.port}-${p.pid}`;
                const memStr = p.process?.memory_mb ? `${p.process.memory_mb.toFixed(1)}M` : '0.0M';
                
                return (
                  <tr
                    key={key}
                    style={{ 
                      borderBottom: '1px solid rgba(0, 255, 65, 0.2)',
                      background: p.insight?.is_forgotten ? 'rgba(255, 0, 0, 0.05)' : 'transparent'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 255, 65, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = p.insight?.is_forgotten ? 'rgba(255, 0, 0, 0.05)' : 'transparent'; }}
                  >
                    <td style={{ padding: '8px', borderRight: '1px solid rgba(0, 255, 65, 0.2)', textAlign: 'center' }}>
                       <AgeIndicator category={p.insight?.age_category} duration={p.insight?.age_duration} />
                    </td>
                    <td style={{ padding: '8px', borderRight: '1px solid rgba(0, 255, 65, 0.2)', color: '#00FF41', fontWeight: 800 }}>
                      :{p.port}
                    </td>
                    <td style={{ padding: '8px', borderRight: '1px solid rgba(0, 255, 65, 0.2)', color: 'rgba(0, 255, 65, 0.7)' }}>
                      {p.pid === 0 ? '-' : p.pid}
                    </td>
                    <td style={{ padding: '8px', borderRight: '1px solid rgba(0, 255, 65, 0.2)', textAlign: 'center' }}>
                       {p.traffic?.is_active ? (
                         <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-start' }}>
                           <div className="animate-pulse" style={{ width: '6px', height: '6px', background: '#00FF41', boxShadow: '0 0 5px #00FF41' }} />
                           <span style={{ fontSize: '0.6rem', color: '#00FF41', fontWeight: 'bold' }}>ACTIVE</span>
                         </div>
                       ) : (
                         <span style={{ fontSize: '0.6rem', color: 'rgba(0, 255, 65, 0.4)' }}>DORMANT</span>
                       )}
                    </td>
                    <td style={{ padding: '8px', borderRight: '1px solid rgba(0, 255, 65, 0.2)', color: '#00FF41', fontWeight: 600 }}>
                      <div className="flex flex-col">
                        <span>{p.process?.name || (p.pid === 0 ? "KERNEL" : "UNKNOWN")}</span>
                        {p.project && (
                          <span style={{ fontSize: '0.6rem', color: 'rgba(0, 255, 65, 0.5)', fontStyle: 'italic' }}>
                            @{p.project.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '8px', borderRight: '1px solid rgba(0, 255, 65, 0.2)', maxWidth: '300px' }}>
                      <div className="flex flex-col gap-1">
                        <div style={{ 
                          fontSize: '0.7rem', 
                          color: 'rgba(0, 255, 65, 0.6)', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap' 
                        }} title={p.process?.cmdline || p.insight?.explanation}>
                          {p.process?.cmdline || p.insight?.explanation || '-'}
                        </div>
                        {p.risks && p.risks.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {p.risks.map(r => <RiskBadge key={r} risk={r} />)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '8px', borderRight: '1px solid rgba(0, 255, 65, 0.2)', textAlign: 'center', color: 'rgba(0, 255, 65, 0.7)' }}>
                      {memStr}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      <button
                        className="terminal-btn"
                        style={{ padding: "4px 8px", fontSize: "0.65rem", cursor: isKilling === p.pid ? 'not-allowed' : 'pointer' }}
                        disabled={isKilling === p.pid}
                        onClick={() => onSimulateKill(p.pid)}
                      >
                        {isKilling === p.pid ? "TERM..." : "KILL"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ color: '#00FF41', fontFamily: 'monospace', marginTop: '8px', fontSize: '0.7rem', flexShrink: 0 }}>
        +------------------------------------------------------------------------------------------------------------------+
      </div>
    </div>
  );
};

export const PortMonitor: React.FC<PortMonitorProps> = ({
  ports,
  onSimulateKill,
  killState,
}) => {
  const sortedPorts = [...ports].sort((a, b) => a.port - b.port);
  
  // Enforce rigorous Dev Port definition via category
  const devPorts = sortedPorts.filter(p => p.insight?.category === "dev");
  const systemPorts = sortedPorts.filter(p => p.insight?.category === "system" || p.insight?.category === "unidentified");

  const isKilling = killState.status === "terminating" ? killState.pid : null;

  // Opinionated Automation: Workspace Sweeper
  const handleKillProject = async (projectName: string) => {
    const projectPorts = ports.filter(p => p.project?.name === projectName && p.pid > 0);
    // Kill them one by one (simplified for now)
    for (const p of projectPorts) {
      await onSimulateKill(p.pid);
    }
  };

  return (
    <div className="view-fade-in flex flex-col max-h-full overflow-hidden" style={{ width: '100%', maxWidth: '100%' }}>
      <div style={{ 
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'nowrap',
        gap: '16px',
        borderBottom: '2px solid #00FF41',
        paddingBottom: '12px',
        flexShrink: 0
      }}>
        <h1 className="text-terminal-green uppercase tracking-widest font-bold m-0" style={{ fontSize: '1.5rem' }}>
          &gt; PORTWATCH_MONITOR.LOG
        </h1>
        <div style={{ 
          fontSize: '0.875rem', 
          color: '#00FF41',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontFamily: 'monospace'
        }}>
          <span>DEV_SERVICES: {devPorts.length}</span>
          <span>SYSTEM_PROC: {systemPorts.length}</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {devPorts.length > 0 && (
          <PortTable 
            title="ACTIVE DEVELOPMENT_SERVICES" 
            ports={devPorts} 
            onSimulateKill={onSimulateKill}
            onKillProject={handleKillProject}
            isKilling={isKilling}
            emptyMessage="NO_DEV_SERVICES_DETECTED"
          />
        )}

        {systemPorts.length > 0 && (
          <PortTable 
            title="OTHER_PROCESSES & SYSTEM_SERVICES" 
            ports={systemPorts} 
            onSimulateKill={onSimulateKill} 
            isKilling={isKilling}
            emptyMessage="NO_OTHER_PROCESSES_RECORDED"
          />
        )}

        {devPorts.length === 0 && systemPorts.length === 0 && (
          <div className="terminal-card" style={{ padding: '48px', textAlign: 'center', color: '#00FF41', border: '2px solid #00FF41' }}>
            [ NO_ACTIVE_PROCESSES_DETECTED ]
          </div>
        )}
      </div>
    </div>
  );
};