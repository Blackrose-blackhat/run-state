import React from "react";

interface ResourceIconProps {
  type?: string;
  size?: number;
  className?: string;
}

/**
 * ResourceIcon provides dev-centric SVGs for various services.
 */
export const ResourceIcon: React.FC<ResourceIconProps> = ({ 
  type = "system", 
  size = 18,
  className = "" 
}) => {
  const icons: Record<string, React.ReactNode> = {
    docker: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 7.7c0-.6-.4-1.2-.8-1.5.3-.2.8-.5.8-1.2 0-.6-.4-1.1-.9-1.3.2-.3.4-.6.4-1 0-.6-.5-1.1-1.1-1.1h-1.8c-.1-1.1-1-2-2.1-2h-2.1c-1.1 0-2 .9-2.1 2H3.5C2.7 2.6 2 3.3 2 4.1v15.8c0 .8.7 1.5 1.5 1.5h17c.8 0 1.5-.7 1.5-1.5V7.7z" />
        <path d="M12 11h2v2h-2z" /><path d="M16 11h2v2h-2z" /><path d="M8 11h2v2H8z" />
        <path d="M12 7h2v2h-2z" /><path d="M16 7h2v2h-2z" /><path d="M8 7h2v2H8z" /><path d="M4 11h2v2H4z" />
      </svg>
    ),
    database: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
      </svg>
    ),
    node: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
    python: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 10V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V10h-8z"/>
        <path d="M10 22v-6c0-1.1.9-2 2-2h6"/>
      </svg>
    ),
    go: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
        <path d="M14 10V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"/>
        <path d="M8 18h0a2 2 0 0 1-2-2v0a2 2 0 0 1 2-2h4v4a2 2 0 0 1-2 2z"/>
      </svg>
    ),
    rust: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M12 22l10-5-10-5-10 5 10 5z"/><path d="M2 7v10l10 5M22 7v10l-10 5"/>
      </svg>
    ),
    k8s: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l10 5v10l-10 5-10-5V7l10-5z"/><path d="M12 22V12"/><path d="M12 12l10-5"/><path d="M12 12L2 7"/>
      </svg>
    ),
    terminal: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
      </svg>
    ),
    system: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
        <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
      </svg>
    )
  };

  const colors: Record<string, string> = {
    docker: "#0db7ed",
    database: "#4479a1",
    node: "#68a063",
    python: "#3776ab",
    go: "#00add8",
    rust: "#dea584",
    k8s: "#326ce5",
    terminal: "var(--primary)",
    system: "var(--muted-foreground)"
  };

  return (
    <div className={`resource-icon ${className}`} style={{ color: colors[type] || colors.system, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {icons[type] || icons.system}
    </div>
  );
};
