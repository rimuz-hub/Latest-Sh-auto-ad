import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-primary font-mono">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">AUTHENTICATING...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-primary font-mono p-4 text-center">
        <h1 className="text-4xl mb-8 tracking-tighter">AUTO AD SYSTEM</h1>
        <p className="mb-8 text-muted-foreground uppercase tracking-widest">Secure Access Required</p>
        <a 
          href="/api/login" 
          className="px-8 py-3 bg-primary text-black font-bold rounded-sm hover:bg-primary/90 transition-colors"
        >
          LOGIN WITH GOOGLE
        </a>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
