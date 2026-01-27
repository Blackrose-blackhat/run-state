import React, { useMemo } from "react";
import { ProcInfo, PortSnapshot } from "../types";
import { downloadCSV, downloadJSON } from "../lib/export";

interface DashboardProps {
  processes: Record<number, ProcInfo>;
  ports: PortSnapshot[];
  forgottenPortsCount: number;
}

/**
 * Dashboard component displaying high-level system and dev activity metrics.
 */
export const Dashboard: React.FC<DashboardProps> = ({ 
  processes, 
  ports, 
  forgottenPortsCount 
}) => {
  const metrics = useMemo(() => {
    const portPids = new Set(ports.map(p => p.pid));
    const portMemory = Object.values(processes)
      .filter(p => portPids.has(p.pid))
      .reduce((acc, p) => acc + (p.memory_mb || 0), 0);
    
    const ageCounts = { fresh: 0, lingering: 0, forgotten: 0 };
    ports.forEach(p => {
      const cat = p.insight?.age_category;
      if (cat && cat in ageCounts) {
        ageCounts[cat as keyof typeof ageCounts]++;
      }
    });
    
    return {
      activeProcesses: Object.keys(processes).length,
      portCount: ports.length,
      orphanedPorts: ports.filter(p => p.orphaned).length,
      residentMemory: portMemory,
      ageCounts
    };
  }, [processes, ports]);

  return (
    <div className="view-fade-in">
      <h1 style={{ textAlign: 'left', marginBottom: '32px' }}>System Overview</h1>
      
      {/* Main metrics */}
      <div className="dashboard-grid">
        <MetricCard label="Active Ports" value={metrics.portCount} />
        <MetricCard 
          label="Forgotten" 
          value={forgottenPortsCount} 
          urgent={forgottenPortsCount > 0}
          icon="⚠️"
        />
        <MetricCard 
          label="Orphaned" 
          value={metrics.orphanedPorts} 
          urgent={metrics.orphanedPorts > 0} 
          danger
        />
        <MetricCard 
          label="Port Memory" 
          value={`${metrics.residentMemory.toFixed(1)} MB`} 
        />
      </div>

      {/* Port age breakdown */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h3 className="metric-label">Port Age Distribution</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', marginTop: '16px' }}>
          <AgeBreakdown 
            label="Fresh" 
            count={metrics.ageCounts.fresh} 
            color="#10b981" 
            description="< 5 minutes"
          />
          <AgeBreakdown 
            label="Lingering" 
            count={metrics.ageCounts.lingering} 
            color="#f59e0b" 
            description="5-15 minutes"
          />
          <AgeBreakdown 
            label="Forgotten" 
            count={metrics.ageCounts.forgotten} 
            color="#ef4444" 
            description="> 15 minutes"
          />
        </div>
      </div>

      {/* Details section */}
      <div className="section-grid">
        <div className="card card-premium">
          <h3 className="metric-label">System State</h3>
          <p className="text-muted" style={{ lineHeight: 1.6 }}>
            RunState is currently monitoring <strong>{metrics.activeProcesses}</strong> processes. 
            Identified <strong>{metrics.portCount}</strong> active endpoints, including system services and containers.
          </p>
          {forgottenPortsCount > 0 && (
            <div className="urgent-bg" style={{ 
              marginTop: '16px', 
              padding: '12px', 
              borderRadius: '8px',
              fontSize: '0.875rem',
              border: '1px solid var(--warning)'
            }}>
              <span style={{ color: 'var(--warning)', fontWeight: 600 }}>Action Required:</span> {forgottenPortsCount} forgotten development server{forgottenPortsCount > 1 ? 's' : ''} detected.
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="metric-label">Data Export</h3>
          <p className="text-muted" style={{ marginBottom: '20px' }}>Generate snapshots of your current system state.</p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => downloadCSV(Object.values(processes), 'processes.csv')}
            >
              Processes CSV
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => downloadCSV(ports, 'ports.csv')}
            >
              Ports CSV
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => downloadJSON({ processes, ports }, 'runstate-audit.json')}
            >
              Full JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: string | number;
  urgent?: boolean;
  danger?: boolean;
  icon?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, urgent, danger, icon }) => {
  const cardClass = `card ${urgent ? 'urgent-bg' : ''} ${danger ? 'danger-bg' : ''}`;
  const valueColor = danger ? 'var(--destructive)' : urgent ? 'var(--warning)' : 'var(--foreground)';

  return (
    <div className={cardClass}>
      <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon && <span>{icon}</span>}
        {label}
      </div>
      <div className="metric-value" style={{ color: valueColor }}>
        {value}
      </div>
    </div>
  );
};

interface AgeBreakdownProps {
  label: string;
  count: number;
  color: string;
  description: string;
}

const AgeBreakdown: React.FC<AgeBreakdownProps> = ({ label, count, color, description }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
    <div style={{ 
      width: 14, 
      height: 14, 
      borderRadius: '50%', 
      background: color,
      boxShadow: count > 0 ? `0 0 12px ${color}88` : 'none',
      border: '2px solid white'
    }} />
    <div>
      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{count} {label}</div>
      <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 500 }}>{description}</div>
    </div>
  </div>
);

