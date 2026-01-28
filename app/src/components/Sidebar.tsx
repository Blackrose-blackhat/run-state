import React from "react";
import { 
  LayoutDashboard, 
  Plug2, 
  Settings, 
  Activity, 
  Sun, 
  Moon, 
  AlertTriangle, 
  ShieldAlert,
  Terminal
} from "lucide-react";
import { useTheme } from "next-themes";
import { View } from "../types";
import { 
  Sidebar as SidebarUI, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem 
} from "./ui/sidebar";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  status: "starting" | "ready" | "unreachable" | "error";
  forgottenCount?: number;
  orphanedPortsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  setActiveView, 
  status,
  forgottenCount = 0,
  orphanedPortsCount = 0
}) => {
  const { theme, setTheme } = useTheme();

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <SidebarUI variant="floating" className=" py-5  backdrop-blur-xl">
      <SidebarHeader className="p-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Terminal className="size-5" />
            </div>
            RunState
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">
            Liveness Intelligence
          </p>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">Navigation</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeView === 'dashboard'} 
                onClick={() => setActiveView('dashboard')}
                className={cn(
                  "transition-all duration-200 rounded-xl h-11 px-4 gap-3",
                  activeView === 'dashboard' 
                    ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-semibold shadow-sm ring-1 ring-primary/20" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <LayoutDashboard className="size-4.5" />
                <span className="text-sm">Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeView === 'ports'} 
                onClick={() => setActiveView('ports')}
                className={cn(
                  "transition-all duration-200 rounded-xl h-11 px-4 gap-3",
                  activeView === 'ports' 
                    ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-semibold shadow-sm ring-1 ring-primary/20" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Plug2 className="size-4.5" />
                <span className="text-sm">Port Monitor</span>
                {forgottenCount > 0 && (
                  <span className="ml-auto bg-warning/15 text-warning text-[10px] font-bold px-2 py-0.5 rounded-lg border border-warning/20">
                    {forgottenCount}
                  </span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeView === 'processes'} 
                onClick={() => setActiveView('processes')}
                className={cn(
                  "transition-all duration-200 rounded-xl h-11 px-4 gap-3",
                  activeView === 'processes' 
                    ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-semibold shadow-sm ring-1 ring-primary/20" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Activity className="size-4.5" />
                <span className="text-sm">Process List</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeView === 'settings'} 
                onClick={() => setActiveView('settings')}
                className={cn(
                  "transition-all duration-200 rounded-xl h-11 px-4 gap-3",
                  activeView === 'settings' 
                    ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-semibold shadow-sm ring-1 ring-primary/20" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Settings className="size-4.5" />
                <span className="text-sm">Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {(forgottenCount > 0 || orphanedPortsCount > 0) && (
          <SidebarGroup className="mt-8">
            <SidebarGroupLabel className="px-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">Critical Alerts</SidebarGroupLabel>
            <SidebarMenu className="gap-1">
              {forgottenCount > 0 && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    className="rounded-xl h-11 px-4 gap-3 text-warning hover:bg-warning/10 hover:text-warning border border-transparent hover:border-warning/20"
                    onClick={() => setActiveView('ports')}
                  >
                    <AlertTriangle className="size-4.5" />
                    <span className="text-sm">{forgottenCount} Forgotten</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {orphanedPortsCount > 0 && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    className="rounded-xl h-11 px-4 gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20"
                    onClick={() => setActiveView('ports')}
                  >
                    <ShieldAlert className="size-4.5" />
                    <span className="text-sm">{orphanedPortsCount} Orphaned</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 mt-auto">
        <div className="flex flex-col gap-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={handleThemeToggle}
                className="w-full justify-start rounded-xl h-11 px-4 gap-3 bg-secondary/50 hover:bg-secondary border border-border/50 transition-colors"
                variant="outline"
              >
                {theme === 'dark' ? <Sun className="size-4.5 text-warning" /> : <Moon className="size-4.5 text-primary" />}
                <span className="text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          
          <div className="flex items-center justify-between bg-card p-3 rounded-xl border border-border/60 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={cn(
                  "size-2.5 rounded-full animate-pulse",
                  status === 'ready' ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]"
                )} />
                <div className={cn(
                  "absolute inset-0 size-2.5 rounded-full animate-ping opacity-75",
                  status === 'ready' ? "bg-emerald-500" : "bg-red-500"
                )} />
              </div>
              <span className="text-[11px] font-bold tracking-tight text-foreground/80">
                {status === 'ready' ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
              </span>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground/40">v0.1.0</div>
          </div>
        </div>
      </SidebarFooter>
    </SidebarUI>
  );
};

