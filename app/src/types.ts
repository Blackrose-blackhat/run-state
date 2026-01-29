export type EngineStatus = "starting" | "ready" | "unreachable" | "error";

export interface ProcInfo {
  pid: number;
  ppid: number;
  name: string;
  cmdline: string;
  username: string;
  create_time: string;
  memory_mb: number;
}

// Port insight data from the engine
export interface PortInsight {
  explanation: string;
  icon: string;
  category: "dev" | "system" | "unidentified";
  age_category: "fresh" | "lingering" | "forgotten";
  age_duration: string;
  is_forgotten: boolean;
  forgotten_reasons?: string[];
}

export interface PortSnapshot {
  port: number;
  pid: number;
  local_addr: string;
  interface: "loopback" | "any" | "private" | "public" | "unknown";
  process?: ProcInfo;
  first_seen: string;
  last_seen: string;
  orphaned: boolean;
  insight?: PortInsight;
  traffic?: TrafficInfo;
  risks?: string[];
  project?: ProjectInfo;
}

export interface TrafficInfo {
  tx_queue: number;
  rx_queue: number;
  is_active: boolean;
}

export interface ProjectInfo {
  name: string;
  path: string;
}

// Kill simulation response for dry-run preview
export interface KillSimulation {
  target_pid: number;
  target_process: ProcInfo | null;
  child_processes: ProcInfo[];
  affected_ports: number[];
  is_protected: boolean;
  protected_reason?: string;
  warnings: string[];
}

// Kill result from graceful termination
export interface KillResult {
  success: boolean;
  phase: "sigterm" | "sigkill";
  message: string;
}

// Kill state machine for UI feedback
export type KillState = 
  | { status: "idle" }
  | { status: "simulating"; pid: number }
  | { status: "confirming"; pid: number; simulation: KillSimulation }
  | { status: "terminating"; pid: number; phase: "sigterm" | "sigkill" }
  | { status: "success"; pid: number; message: string }
  | { status: "error"; pid: number; error: string };


