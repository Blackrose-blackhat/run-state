import React from "react";

interface SplashScreenProps {
  onAccept: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onAccept }) => {
  const [accepted, setAccepted] = React.useState(false);

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] flex items-center justify-center p-6 font-mono overflow-hidden">
      {/* CRT Scanline Overlay */}
      <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
      </div>

      <div className="max-w-2xl w-full terminal-card border-2 border-terminal-green p-8 animate-in zoom-in-95 duration-300">
        <div className="flex items-center gap-4 mb-6 border-bottom-2 border-terminal-green pb-4">
          <div className="w-16 h-16 border-2 border-terminal-green flex items-center justify-center bg-terminal-green/10 overflow-hidden">
            <img
              src="/assets/portwatch.png"
              alt="PortWatch Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter uppercase m-0">
              PORTWATCH
            </h1>
            <p className="text-xs opacity-70 m-0">
              Version 2.0.1 - Monitor Protocol ACTIVE
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8 text-sm leading-relaxed overflow-y-auto max-h-[40vh] pr-4 custom-scrollbar">
          <p className="text-terminal-green font-bold">
            [ TERMS AND CONDITIONS ]
          </p>
          <p>
            Welcome to{" "}
            <span className="text-terminal-green font-bold text-lg">
              PORTWATCH
            </span>
            . By proceeding, you acknowledge that this is an advanced system
            monitoring and process management tool.
          </p>
          <p>
            <span className="text-terminal-red font-bold">WARNING:</span>{" "}
            Terminating system processes or developer services can lead to data
            loss or system instability. DevResidue is provided "as is" without
            any warranties.
          </p>
          <ul className="list-none p-0 space-y-2">
            <li>
              - You are responsible for any actions taken through this
              interface.
            </li>
            <li>- Process termination is permanent and cannot be undone.</li>
            <li>
              - Sensitive port information is handled locally and never
              transmitted.
            </li>
          </ul>
          <p className="opacity-70 italic text-xs">
            "With great power comes great responsibility to not kill your own
            database."
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="mt-1">
              <input
                type="checkbox"
                id="terms-checkbox"
                className="sr-only peer"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <div className="w-5 h-5 border-2 border-terminal-green peer-checked:bg-terminal-green transition-all flex items-center justify-center after:content-['✓'] after:text-terminal-black after:hidden peer-checked:after:block font-bold" />
            </div>
            <span className="text-xs group-hover:text-terminal-green transition-colors text-white/80">
              I have read the warnings and accept the responsibility for system
              modifications and process terminations.
            </span>
          </label>

          <button
            onClick={onAccept}
            disabled={!accepted}
            className={`terminal-btn mt-4 py-3 text-sm font-bold uppercase tracking-widest border-2 border-terminal-green bg-transparent transition-all active:scale-[0.98] ${
              !accepted
                ? "opacity-30 cursor-not-allowed border-terminal-green/30"
                : "hover:bg-terminal-green hover:text-terminal-black"
            }`}
          >
            &gt; INITIALIZE_SYSTEM
          </button>
        </div>

        <div className="mt-6 text-[10px] opacity-40 text-center uppercase tracking-widest">
          Auth: ROOT_ACCESS_GRANTED // SECURE_CHANNEL_READY
        </div>
      </div>
    </div>
  );
};
