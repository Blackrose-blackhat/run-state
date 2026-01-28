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
  theme: "light" | "dark";
  toggleTheme: () => void;
  forgottenCount?: number;
  orphanedCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  setActiveView, 
  status,
  theme,
  toggleTheme,
  forgottenCount = 0,
  orphanedCount = 0
}) => {
  return (
    <SidebarUI className="border-r border-border bg-card">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
            <Terminal className="size-5" />
            RunState
          </h2>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
            Liveness Intelligence
          </p>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeView === 'dashboard'} 
                onClick={() => setActiveView('dashboard')}
                className={cn(activeView === 'dashboard' && "bg-secondary text-primary font-semibold")}
              >
                <LayoutDashboard />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeView === 'ports'} 
                onClick={() => setActiveView('ports')}
                className={cn(activeView === 'ports' && "bg-secondary text-primary font-semibold")}
              >
                <Plug2 />
                <span>Port Monitor</span>
                {forgottenCount > 0 && (
                  <span className="ml-auto bg-warning/20 text-warning text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-warning/30">
                    {forgottenCount}
                  </span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeView === 'processes'} 
                onClick={() => setActiveView('processes')}
                className={cn(activeView === 'processes' && "bg-secondary text-primary font-semibold")}
              >
                <Activity />
                <span>Process List</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeView === 'settings'} 
                onClick={() => setActiveView('settings')}
                className={cn(activeView === 'settings' && "bg-secondary text-primary font-semibold")}
              >
                <Settings />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {(forgottenCount > 0 || orphanedCount > 0) && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel>Critical Alerts</SidebarGroupLabel>
            <SidebarMenu>
              {forgottenCount > 0 && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    className="text-warning hover:bg-warning/10 hover:text-warning"
                    onClick={() => setActiveView('ports')}
                  >
                    <AlertTriangle />
                    <span>{forgottenCount} Forgotten</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {orphanedCount > 0 && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setActiveView('ports')}
                  >
                    <ShieldAlert />
                    <span>{orphanedCount} Orphaned</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border mt-auto gap-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={toggleTheme}
              variant="outline"
              className="w-full justify-start border-border"
            >
              {theme === 'dark' ? <Sun /> : <Moon />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        <div className="flex items-center justify-between bg-secondary/50 p-3 rounded-xl border border-border/50">
          <div className="flex items-center gap-2">
            <div className={cn(
              "size-2 rounded-full",
              status === 'ready' ? "bg-success shadow-[0_0_8px_var(--success)]" : "bg-destructive shadow-[0_0_8px_var(--destructive)]"
            )} />
            <span className="text-xs font-bold text-foreground/80">
              {status === 'ready' ? 'System Live' : 'Offline'}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </SidebarUI>
  );
};

