import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Eye, EyeOff, Save, Play, Square, 
  FolderOpen, X, Plus, Upload
} from "lucide-react";
import { cn } from "@/lib/utils";

import { 
  useAutomationStatus, useStartAutomation, 
  useStopAutomation, useConfigs, useSaveConfig, 
  useDeleteConfig, useUploadImages
} from "@/hooks/use-automation";
import { CyberCard, CyberInput, CyberTextarea, CyberButton } from "@/components/CyberComponents";
import { Terminal } from "@/components/Terminal";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// Schema for the form
const formSchema = z.object({
  name: z.string().min(1, "Config name required"),
  token: z.string().min(1, "Discord user token required"),
  message: z.string().min(1, "Message content required"),
  channelIds: z.string().min(1, "Target channel IDs required"),
  delaySeconds: z.coerce.number().min(5, "Min 5s").max(3600, "Max 3600s"),
  imageUrls: z.array(z.string()).default([]),
});

type FormData = z.infer<typeof formSchema>;

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [showToken, setShowToken] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: statusData } = useAutomationStatus();
  const { data: configs } = useConfigs();
  const startMutation = useStartAutomation();
  const stopMutation = useStopAutomation();
  const saveMutation = useSaveConfig();
  const deleteMutation = useDeleteConfig();
  const uploadMutation = useUploadImages();

  const isRunning = statusData?.isRunning ?? false;
  const logs = statusData?.logs ?? [];
  const isOwner = user?.email === "platisthere@gmail.com";

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "Default Config",
      token: "",
      message: "",
      channelIds: "",
      delaySeconds: 60,
      imageUrls: [],
    },
  });

  const handleStart = async (data: FormData) => {
    // Split comma separated IDs and clean them
    const channelIdArray = data.channelIds
      .split(/[,;\n\s]+/)
      .map(id => id.trim())
      .filter(id => id.length > 0);

    if (channelIdArray.length === 0) {
      toast({ 
        title: "INVALID INPUT", 
        description: "No valid channel IDs provided.",
        variant: "destructive",
        className: "bg-black border-destructive text-destructive font-mono" 
      });
      return;
    }

    startMutation.mutate({
      token: data.token,
      message: data.message,
      channelIds: channelIdArray,
      delaySeconds: data.delaySeconds,
      imageUrls: data.imageUrls,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const { urls } = await uploadMutation.mutateAsync(Array.from(files));
      form.setValue("imageUrls", [...form.getValues("imageUrls"), ...urls]);
      toast({ 
        title: "UPLOAD COMPLETE", 
        description: `${files.length} assets integrated.`,
        className: "bg-black border-primary text-primary font-mono"
      });
    } catch (err) {
      // Error handled by hook
    } finally {
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    const current = form.getValues("imageUrls");
    form.setValue("imageUrls", current.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen p-4 lg:p-8 relative">
      <div className="scanline" />
      
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        
        {/* === HEADER === */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-primary/20 pb-6 mb-8">
          <div className="text-center sm:text-left group cursor-default">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50 glitch-text" data-text="AUTO_SENDER_V2">
              AUTO_SENDER_V2
            </h1>
            <div className="flex items-center justify-center sm:justify-start gap-3 mt-2">
              <span className="text-[10px] uppercase tracking-[0.3em] text-primary/60 border border-primary/30 px-2 py-0.5 rounded-sm">
                PROTOCOL: STABLE
              </span>
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px]", isRunning ? "bg-primary shadow-primary animate-ping" : "bg-primary/20")} />
                <span className={cn("text-[10px] uppercase tracking-widest", isRunning ? "text-primary animate-pulse" : "text-primary/40")}>
                  {isRunning ? "SYSTEM ONLINE" : "SYSTEM STANDBY"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full sm:w-auto items-center">
            <div className="hidden md:flex flex-col items-end mr-2 text-[10px] font-mono text-primary/60">
              <span className="uppercase tracking-tighter">{user?.email}</span>
              <span className="text-[8px] opacity-50">{isOwner ? "PRIVILEGED_ACCESS" : "STANDARD_USER"}</span>
            </div>

            <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
              <DialogTrigger asChild>
                <CyberButton variant="secondary" className="flex-1 sm:flex-none">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  LOAD CONFIG
                </CyberButton>
              </DialogTrigger>
              <DialogContent className="bg-black/95 border-primary text-primary font-mono">
                <DialogHeader>
                  <DialogTitle className="tracking-widest border-b border-primary/30 pb-2">USER_SAVED_CONFIGS</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 mt-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {configs?.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 border border-primary/10 bg-white/5 hover:bg-primary/10 hover:border-primary/50 transition-all group">
                      <button 
                        className="flex-1 text-left font-mono text-sm truncate mr-4"
                        onClick={() => {
                          form.reset({
                            name: c.name,
                            token: c.token,
                            message: c.message,
                            channelIds: c.channelIds,
                            delaySeconds: c.delaySeconds,
                            imageUrls: c.imageUrls ? c.imageUrls.split(",") : [],
                          });
                          setLoadDialogOpen(false);
                          toast({ title: "CONFIG LOADED", className: "bg-black border-primary text-primary font-mono" });
                        }}
                      >
                        <span className="text-primary/50 mr-2 group-hover:text-primary">&gt;</span>
                        {c.name}
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(c.id);
                        }} 
                        className="text-destructive/50 hover:text-destructive hover:scale-110 transition-transform p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {(!configs || configs.length === 0) && (
                    <p className="text-center py-8 text-primary/30 text-xs tracking-widest border border-dashed border-primary/20">NO_DATA_FOUND</p>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {isOwner && (
              <CyberButton 
                variant="primary" 
                className="flex-1 sm:flex-none"
                onClick={form.handleSubmit(data => {
                  saveMutation.mutate({
                    ...data,
                    userEmail: user?.email || "",
                    channelIds: data.channelIds,
                    imageUrls: data.imageUrls.join(",")
                  });
                })}
                isLoading={saveMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                SAVE CONFIG
              </CyberButton>
            )}

            <CyberButton 
              variant="outline" 
              className="px-3 border-primary/30 text-primary/50 hover:text-primary"
              onClick={() => (window.location.href = "/api/logout")}
            >
              <LogOut className="w-4 h-4" />
            </CyberButton>
          </div>
        </header>

        {/* === MAIN CONTENT === */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel - Controls */}
          <div className="lg:col-span-5 space-y-6">
            <CyberCard title="CONTROL_PANEL">
              <form className="space-y-6">
                
                {/* Config Name */}
                <CyberInput
                  label="CONFIG_ID"
                  {...form.register("name")}
                  placeholder="Enter configuration name..."
                />

                {/* Token Input */}
                <div className="relative">
                  <CyberInput
                    label="ACCESS_TOKEN"
                    type={showToken ? "text" : "password"}
                    {...form.register("token")}
                    placeholder="Discord User Token"
                    className="pr-12"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowToken(!showToken)} 
                    className="absolute right-3 top-[26px] text-primary/40 hover:text-primary transition-colors"
                  >
                    {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Message Content */}
                <CyberTextarea 
                  label="PAYLOAD_CONTENT" 
                  rows={4} 
                  {...form.register("message")}
                  placeholder="Type your message content here..." 
                />

                {/* Target Channels */}
                <CyberTextarea 
                  label="TARGET_NODES" 
                  rows={2} 
                  helperText="DELIMITER: COMMA / NEWLINE" 
                  {...form.register("channelIds")} 
                  placeholder="Channel ID 1, Channel ID 2, ..."
                />
                
                {/* Delay Slider */}
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-end border-b border-primary/10 pb-1">
                    <label className="text-xs font-bold text-primary/70 tracking-widest uppercase ml-1">
                      {'>'} INTERVAL_DELAY
                    </label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number"
                        {...form.register("delaySeconds")}
                        className="bg-transparent border-none text-primary font-bold text-lg font-mono tracking-widest w-20 text-right focus:outline-none"
                      />
                      <span className="text-xs text-primary/50">SEC</span>
                    </div>
                  </div>
                  <input 
                    type="range" min="5" max="3600" 
                    className="w-full h-2 bg-primary/10 rounded-none appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                      [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_10px_#00ff00]
                      hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
                    value={form.watch("delaySeconds")}
                    onChange={e => form.setValue("delaySeconds", Number(e.target.value))}
                  />
                  <div className="flex justify-between text-[10px] text-primary/30 font-mono">
                    <span>MIN: 5S</span>
                    <span>MAX: 3600S</span>
                  </div>
                </div>

                {/* Attachments */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                    <label className="text-xs font-bold text-primary/70 tracking-widest uppercase ml-1">
                      {'>'} ATTACHMENTS
                    </label>
                    <CyberButton 
                      type="button" 
                      variant="secondary" 
                      className="px-3 py-1 text-[10px] h-auto border-dashed"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadMutation.isPending}
                    >
                      {uploadMutation.isPending ? <span className="animate-pulse">UPLOADING...</span> : <><Plus className="w-3 h-3 mr-1" /> ADD_ASSET</>}
                    </CyberButton>
                    <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  </div>
                  
                  {/* Image Grid */}
                  <div className="grid grid-cols-4 gap-3 min-h-[80px] bg-black/30 p-2 border border-primary/10">
                    {form.watch("imageUrls").length === 0 && (
                      <div className="col-span-4 flex items-center justify-center text-[10px] text-primary/20 italic h-full">
                        NO_ASSETS_LOADED
                      </div>
                    )}
                    {form.watch("imageUrls").map((url, i) => (
                      <div key={i} className="relative aspect-square border border-primary/30 group bg-black overflow-hidden">
                        <img src={url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0" alt="Asset" />
                        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <button 
                          type="button"
                          onClick={() => removeImage(i)} 
                          className="absolute top-0 right-0 bg-black text-destructive p-1 hover:bg-destructive hover:text-black transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <CyberButton 
                    type="button"
                    variant="primary" 
                    className="py-4 h-auto text-sm" 
                    onClick={form.handleSubmit(handleStart)} 
                    disabled={isRunning || startMutation.isPending}
                    isLoading={startMutation.isPending}
                  >
                    <Play className="w-4 h-4 mr-2" /> 
                    {isRunning ? "RUNNING..." : "INITIATE"}
                  </CyberButton>
                  
                  <CyberButton 
                    type="button"
                    variant="destructive" 
                    className="py-4 h-auto text-sm" 
                    onClick={() => stopMutation.mutate()} 
                    disabled={!isRunning || stopMutation.isPending}
                    isLoading={stopMutation.isPending}
                  >
                    <Square className="w-4 h-4 mr-2" /> 
                    ABORT
                  </CyberButton>
                </div>
              </form>
            </CyberCard>
          </div>

          {/* Right Panel - Terminal */}
          <div className="lg:col-span-7 h-[500px] lg:h-auto min-h-[500px] flex flex-col">
            <div className="relative flex-1 flex flex-col cyber-border bg-black/90">
              <Terminal logs={logs} isRunning={isRunning} />
            </div>
            
            {/* Decorative Status Bar below terminal */}
            <div className="mt-4 grid grid-cols-3 gap-4 text-[10px] font-mono text-primary/40 uppercase tracking-widest">
              <div className="border border-primary/20 p-2 text-center">
                MEM: {Math.floor(Math.random() * 40) + 10}%
              </div>
              <div className="border border-primary/20 p-2 text-center">
                NET: CONNECTED
              </div>
              <div className="border border-primary/20 p-2 text-center">
                SEC: ENCRYPTED
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
