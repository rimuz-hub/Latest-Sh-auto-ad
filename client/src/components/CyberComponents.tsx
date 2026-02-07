import { cn } from "@/lib/utils";
import React from "react";
import { Loader2 } from "lucide-react";

// === CARD ===
export function CyberCard({ 
  children, 
  title, 
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { title?: string }) {
  return (
    <div className={cn("cyber-card overflow-hidden", className)} {...props}>
      <div className="absolute top-0 right-0 p-2 opacity-50">
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-primary"></div>
          <div className="w-1 h-1 bg-primary"></div>
          <div className="w-1 h-1 bg-primary"></div>
        </div>
      </div>
      
      {title && (
        <div className="mb-6 border-b border-primary/20 pb-2 flex justify-between items-end">
          <h3 className="text-xl font-bold tracking-wider text-primary uppercase glitch-text" data-text={title}>
            {title}
          </h3>
          <span className="text-[10px] text-primary/50 tracking-[0.2em]">SYS.V.2.0</span>
        </div>
      )}
      
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Decorative corners */}
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-primary/30"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-primary/30"></div>
    </div>
  );
}

// === INPUT ===
interface CyberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const CyberInput = React.forwardRef<HTMLInputElement, CyberInputProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full group">
        {label && (
          <label className="text-xs font-bold text-primary/70 tracking-widest uppercase ml-1 group-focus-within:text-primary transition-colors">
            {'>'} {label}
          </label>
        )}
        <div className="relative">
          <input
            className={cn("cyber-input", className)}
            ref={ref}
            {...props}
          />
          <div className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-primary opacity-50"></div>
        </div>
      </div>
    );
  }
);
CyberInput.displayName = "CyberInput";

// === TEXTAREA ===
interface CyberTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
}

export const CyberTextarea = React.forwardRef<HTMLTextAreaElement, CyberTextareaProps>(
  ({ className, label, helperText, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full group">
        <div className="flex justify-between items-center">
          {label && (
            <label className="text-xs font-bold text-primary/70 tracking-widest uppercase ml-1 group-focus-within:text-primary transition-colors">
              {'>'} {label}
            </label>
          )}
          {helperText && (
            <span className="text-[10px] text-primary/40 uppercase tracking-wider">{helperText}</span>
          )}
        </div>
        <div className="relative">
          <textarea
            className={cn("cyber-input min-h-[100px] resize-y", className)}
            ref={ref}
            {...props}
          />
          <div className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-primary opacity-50"></div>
        </div>
      </div>
    );
  }
);
CyberTextarea.displayName = "CyberTextarea";

// === BUTTON ===
interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost";
  isLoading?: boolean;
}

export const CyberButton = React.forwardRef<HTMLButtonElement, CyberButtonProps>(
  ({ className, variant = "primary", isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: "bg-primary/10 border-primary text-primary hover:bg-primary hover:text-black",
      secondary: "bg-transparent border-primary/50 text-primary/70 hover:border-primary hover:text-primary hover:bg-primary/5",
      destructive: "bg-destructive/10 border-destructive text-destructive hover:bg-destructive hover:text-black shadow-[0_0_10px_rgba(239,68,68,0.2)] hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]",
      ghost: "border-transparent bg-transparent hover:bg-primary/10 text-primary/70 hover:text-primary shadow-none",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "cyber-button relative overflow-hidden group",
          variants[variant],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {children}
        </span>
        
        {/* Hover scanline effect */}
        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out pointer-events-none" />
      </button>
    );
  }
);
CyberButton.displayName = "CyberButton";
