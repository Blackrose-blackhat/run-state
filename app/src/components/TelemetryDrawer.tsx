import React from "react";
import { PortSnapshot, ProcInfo, DetailTab } from "../types";

interface TelemetryDrawerProps {
  port: PortSnapshot;
  processes: Record<number, ProcInfo>;
  activeTab: DetailTab;
  setActiveTab: (tab: DetailTab) => void;
  getProcessTree: (pid: number) => number[];
}

/**
 * An expandable drawer that provides deep telemetry for a specific network port.
 */
export const TelemetryDrawer: React.FC<TelemetryDrawerProps> = ({
  port,
  processes,
  activeTab,
  setActiveTab,
  getProcessTree
}) => {
  const children = getProcessTree(port.pid);

  return (
    <div className="detail-container">
      <div className="detail-tabs">
        {["telemetry", "details", "graph"].map((t) => (
          <button
            key={t}
            className={`tab-btn ${activeTab === t ? "active" : ""}`}
            onClick={() => setActiveTab(t as DetailTab)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === "telemetry" && (
          <div className="telemetry-view">
            <LogLine time="23:08:29" type="EVENT" message={`Bound port ${port.port}`} />
            <LogLine time="23:09:05" type="METRIC" message={`RSS: ${port.process?.memory_mb.toFixed(1)} MB`} />
            <div className="log-line pulse">Monitoring...</div>
          </div>
        )}

        {activeTab === "details" && (
          <div className="details-grid">
            <DetailItem label="Binary" value={port.process?.name || "N/A"} showCode />
            <DetailItem label="User" value={port.process?.username || "N/A"} />
            <div className="detail-item" style={{ gridColumn: "span 2" }}>
              <span className="label">Command</span>
              <code className="full-cmd">{port.process?.cmdline || "N/A"}</code>
            </div>
          </div>
        )}

        {activeTab === "graph" && (
          <div className="graph-view">
            <div className="tree-node">
              <div className="node-box root">
                {port.process?.name} <small>({port.pid})</small>
              </div>
              {children.length > 0 && (
                <div className="tree-children">
                  {children.map((pid) => (
                    <div key={pid} className="tree-node">
                      <div className="connector"></div>
                      <div className="node-box child">
                        {processes[pid]?.name || "Unknown"} <small>({pid})</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const LogLine = ({ time, type, message }: { time: string; type: string; message: string }) => (
  <div className="log-line">
    <span>[{time}]</span> <span className="type">{type}</span> {message}
  </div>
);

const DetailItem = ({ label, value, showCode }: { label: string; value: string; showCode?: boolean }) => (
  <div className="detail-item">
    <span className="label">{label}</span>
    {showCode ? <code>{value}</code> : <span>{value}</span>}
  </div>
);
