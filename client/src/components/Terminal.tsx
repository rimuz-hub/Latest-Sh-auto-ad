import { useEffect, useRef } from "react";
import { type LogEntry } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Terminal as TerminalIcon } from "lucide-react";

interface TerminalProps {
  logs: LogEntry[];
  isRunning: boolean;
}

export function Terminal({ logs, isRunning }: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-black/90 border border-primary/30 relative overflow-hidden font-mono text-sm shadow-[0_0_30px_rgba(0,255,0,0.05)]">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-primary/20 bg-primary/5">
        <div className="flex items-center gap-2 text-primary">
          <TerminalIcon size={16} />
          <span className="text-xs font-bold tracking-widest">SYSTEM_LOGS</span>
        </div>
        <div className="flex gap-2">
          <div className={cn("w-2 h-2 rounded-full", isRunning ? "bg-primary animate-pulse shadow-[0_0_10px_#00ff00]" : "bg-red-500/50")} />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-1">
          {logs.length === 0 && (
            <div className="text-primary/30 italic text-xs py-4 text-center">
              Awaiting system initiation...
            </div>
          )}
          
          {logs.map((log) => (
            <div key={log.id} className="flex gap-3 text-xs md:text-sm animate-in fade-in slide-in-from-left-4 duration-300">
              <span className="text-primary/40 whitespace-nowrap select-none">
                [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}]
              </span>
              <span className={cn(
                "break-all",
                log.type === 'error' ? "text-destructive font-bold" :
                log.type === 'success' ? "text-primary font-semibold" :
                "text-primary/80"
              )}>
                <span className="mr-2 select-none opacity-50">
                  {log.type === 'error' ? 'ERR >>' : log.type === 'success' ? 'OK >>' : 'INF >>'}
                </span>
                {log.message}
              </span>
            </div>
          ))}
          
          {/* Typing cursor at the bottom */}
          {isRunning && (
            <div className="h-4 w-2 bg-primary animate-pulse mt-2" />
          )}
        </div>
      </ScrollArea>
      
      {/* Decorative scanlines */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,6px_100%] z-20" />
    </div>
  );
}
