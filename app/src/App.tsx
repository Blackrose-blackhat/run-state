import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

type EngineStatus = "starting" | "ready" | "unreachable" | "error";

interface ProcInfo {
  pid: number;
  ppid: number;
  name: string;
  cmdline: string;
  username: string;
  create_time: string;
  memory_mb: number;
}

interface PortSnapshot {
  port: number;
  pid: number;
  process?: ProcInfo;
  first_seen: string;
  last_seen: string;
  orphaned: boolean;
}

type View = "dashboard" | "processes" | "ports";

function App() {
  const [status, setStatus] = useState<EngineStatus>("starting");
  const [port, setPort] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [processes, setProcesses] = useState<Record<number, ProcInfo>>({});
  const [ports, setPorts] = useState<PortSnapshot[]>([]);
  const [search, setSearch] = useState("");

  async function fetchData() {
    try {
      const enginePort = await invoke<number | null>("get_engine_port");
      setPort(enginePort);

      if (!enginePort) {
        setStatus("starting");
        return;
      }

      const [procsRes, portsRes] = await Promise.all([
        fetch(`http://127.0.0.1:${enginePort}/processes`),
        fetch(`http://127.0.0.1:${enginePort}/ports`),
      ]);

      if (procsRes.ok && portsRes.ok) {
        setProcesses(await procsRes.json());
        setPorts(await portsRes.json());
        setStatus("ready");
      } else {
        setStatus("unreachable");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 2000);
    return () => clearInterval(id);
  }, []);

  const renderDashboard = () => {
    const totalMemory = Object.values(processes).reduce((acc, p) => acc + p.memory_mb, 0);
    const orphanedPorts = ports.filter(p => p.orphaned).length;

    return (
      <div className="view-fade-in">
        <h2>Dashboard</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div className="card">
            <div className="text-muted">Active Processes</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{Object.keys(processes).length}</div>
          </div>
          <div className="card">
            <div className="text-muted">Listening Ports</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{ports.length}</div>
          </div>
          <div className="card" style={{ borderColor: orphanedPorts > 0 ? 'var(--warning)' : 'var(--glass-border)' }}>
            <div className="text-muted">Orphaned Ports</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: orphanedPorts > 0 ? 'var(--warning)' : 'inherit' }}>
              {orphanedPorts}
            </div>
          </div>
          <div className="card">
            <div className="text-muted">Memory Usage</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalMemory.toFixed(1)} MB</div>
          </div>
        </div>

        <h3 style={{ marginTop: '40px', marginBottom: '16px' }}>System Health</h3>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <span className={`badge ${status === 'ready' ? 'badge-success' : 'badge-danger'}`}>
               {status.toUpperCase()}
             </span>
             <span className="text-muted">Engine is running on local port {port}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderProcesses = () => {
    const filteredProcs = Object.values(processes).filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.pid.toString().includes(search)
    );

    return (
      <div className="view-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2>Processes</h2>
          <input 
            type="text" 
            placeholder="Search processes..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              background: 'var(--surface-secondary)', 
              border: '1px solid var(--glass-border)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              width: '240px'
            }}
          />
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>PID</th>
                <th>Name</th>
                <th>User</th>
                <th>Memory</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredProcs.slice(0, 50).map(p => (
                <tr key={p.pid}>
                  <td style={{ fontWeight: '600' }}>{p.pid}</td>
                  <td>{p.name}</td>
                  <td>{p.username}</td>
                  <td>{p.memory_mb.toFixed(1)} MB</td>
                  <td className="text-muted">{new Date(p.create_time).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPorts = () => {
    return (
      <div className="view-fade-in">
        <h2>Network Ports</h2>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Port</th>
                <th>Process</th>
                <th>PID</th>
                <th>Status</th>
                <th>First Seen</th>
              </tr>
            </thead>
            <tbody>
              {ports.map((p, idx) => (
                <tr key={`${p.port}-${idx}`}>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{p.port}</td>
                  <td>{p.process?.name || 'Unknown'}</td>
                  <td>{p.pid}</td>
                  <td>
                    {p.orphaned ? 
                      <span className="badge badge-warning">Orphaned</span> : 
                      <span className="badge badge-success">Active</span>
                    }
                  </td>
                  <td className="text-muted">{new Date(p.first_seen).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="sidebar">
        <div style={{ marginBottom: '40px', padding: '0 16px' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0 }}>RunState</h2>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>Local Safety Engine</div>
        </div>
        
        <div className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>
          Dashboard
        </div>
        <div className={`nav-item ${activeView === 'processes' ? 'active' : ''}`} onClick={() => setActiveView('processes')}>
          Processes
        </div>
        <div className={`nav-item ${activeView === 'ports' ? 'active' : ''}`} onClick={() => setActiveView('ports')}>
          Ports
        </div>

        <div style={{ marginTop: 'auto', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <div style={{ width: 8, height: 8, borderRadius: '50%', background: status === 'ready' ? 'var(--accent)' : 'var(--danger)' }}></div>
             <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
               {status === 'ready' ? 'Engine Connected' : 'Engine Disconnected'}
             </span>
          </div>
        </div>
      </div>

      <main className="main-content">
        {activeView === 'dashboard' && renderDashboard()}
        {activeView === 'processes' && renderProcesses()}
        {activeView === 'ports' && renderPorts()}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .view-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </>
  );
}

export default App;
