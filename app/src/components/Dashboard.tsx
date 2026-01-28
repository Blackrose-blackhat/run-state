import React, { useMemo } from "react";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
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
        <div className="card card-premium bg-gradient-to-br from-card to-secondary/20">
          <h3 className="metric-label opacity-70">System State</h3>
          <p className="text-muted leading-relaxed">
            RunState is currently monitoring <strong className="text-foreground">{metrics.activeProcesses}</strong> processes. 
            Identified <strong className="text-foreground">{metrics.portCount}</strong> active endpoints, including system services and containers.
          </p>
          {forgottenPortsCount > 0 && (
            <div className="urgent-bg mt-5 p-4 rounded-xl text-sm border">
              <span className="text-warning font-bold mr-1">Action Required:</span> {forgottenPortsCount} forgotten development server{forgottenPortsCount > 1 ? 's' : ''} detected.
            </div>
          )}
        </div>

        <div className="card bg-gradient-to-br from-card to-secondary/10">
          <h3 className="metric-label opacity-70">Data Export</h3>
          <p className="text-muted mb-6">Generate snapshots of your current system state for audit or analysis.</p>
          <div className="flex flex-wrap gap-3">
            <button 
              className="btn btn-secondary h-11 px-6 shadow-sm hover:shadow-md" 
              onClick={() => downloadCSV(Object.values(processes), 'processes.csv')}
            >
              Processes CSV
            </button>
            <button 
              className="btn btn-secondary h-11 px-6 shadow-sm hover:shadow-md" 
              onClick={() => downloadCSV(ports, 'ports.csv')}
            >
              Ports CSV
            </button>
            <button 
              className="btn btn-primary h-11 px-8 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30" 
              onClick={() => downloadJSON({ processes, ports }, 'runstate-audit.json')}
            >
              Full JSON Snapshot
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
  const cardClass = cn(
    "card group cursor-default transition-all duration-300",
    urgent && "urgent-bg ring-1 ring-warning/20",
    danger && "danger-bg ring-1 ring-destructive/20"
  );
  
  const valueColor = danger ? 'text-destructive' : urgent ? 'text-warning' : 'text-foreground';

  return (
    <div className={cardClass}>
      <div className="metric-label flex items-center gap-2 mb-3 opacity-60 group-hover:opacity-100 transition-opacity">
        {icon && <span className="text-lg">{icon}</span>}
        <span className="font-bold tracking-wider">{label}</span>
      </div>
      <div className={cn("metric-value truncate", valueColor)}>
        {value}
      </div>
      <div className="absolute -bottom-2 -right-2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12 pointer-events-none">
        <Activity className="size-24" />
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
  <div className="flex items-center gap-4 transition-transform hover:translate-x-1 duration-200">
    <div 
      className="size-3.5 rounded-full ring-2 ring-background shadow-[0_0_12px_rgba(0,0,0,0.1)]"
      style={{ 
        background: color,
        boxShadow: count > 0 ? `0 0 16px ${color}66` : 'none',
      }} 
    />
    <div className="flex flex-col">
      <div className="flex items-baseline gap-2">
        <span className="font-bold text-lg leading-none">{count}</span>
        <span className="text-sm font-semibold opacity-60 lowercase">{label}</span>
      </div>
      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/40">{description}</div>
    </div>
  </div>
);

