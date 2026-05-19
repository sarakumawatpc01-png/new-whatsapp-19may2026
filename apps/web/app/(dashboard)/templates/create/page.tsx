"use client";

import { useState } from "react";
import { 
  ChevronLeft, 
  Save, 
  Send, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  FileText, 
  Type, 
  Smartphone,
  Info,
  Type as TextIcon,
  Video as VideoIcon,
  File as DocumentIcon
} from "lucide-react";
import { 
  Button, 
  Input, 
  Card, 
  Badge, 
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Label,
  Switch
} from "@repo/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@repo/ui";

export default function CreateTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState("MARKETING");
  const [language, setLanguage] = useState("en_US");
  
  // Template Components
  const [headerType, setHeaderType] = useState<"NONE" | "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT">("NONE");
  const [headerText, setHeaderText] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [buttons, setButtons] = useState<any[]>([]);

  const handleCreate = async (submitToMeta = false) => {
    if (!name || !bodyText) {
      toast.error("Please fill in the template name and body");
      return;
    }

    setLoading(true);
    try {
      const components: any[] = [];

      // Header
      if (headerType !== "NONE") {
        const header: any = { type: "HEADER", format: headerType };
        if (headerType === "TEXT") header.text = headerText;
        components.push(header);
      }

      // Body
      components.push({ type: "BODY", text: bodyText });

      // Footer
      if (footerText) {
        components.push({ type: "FOOTER", text: footerText });
      }

      // Buttons
      if (buttons.length > 0) {
        components.push({ type: "BUTTONS", buttons });
      }

      const res = await api.post("/templates", {
        name: name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
        displayName,
        category,
        language,
        components,
      });

      if (submitToMeta) {
        await api.post(`/templates/${res.data.data.id}/submit`);
        toast.success("Template created and submitted to Meta");
      } else {
        toast.success("Template saved as draft");
      }

      router.push("/templates");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to create template");
    } finally {
      setLoading(false);
    }
  };

  const addButton = () => {
    if (buttons.length >= 3) {
      toast.error("Maximum 3 buttons allowed");
      return;
    }
    setButtons([...buttons, { type: "QUICK_REPLY", text: "New Button" }]);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Link href="/templates">
          <Button variant="ghost" className="gap-2 text-gray-400 hover:text-white rounded-xl">
            <ChevronLeft size={20} />
            Back to Templates
          </Button>
        </Link>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="gap-2 border-white/10 hover:bg-white/5 rounded-xl h-11"
            onClick={() => handleCreate(false)}
            disabled={loading}
          >
            <Save size={18} /> Save as Draft
          </Button>
          <Button 
            className="gap-2 rounded-xl h-11 px-6 shadow-xl shadow-primary/20"
            onClick={() => handleCreate(true)}
            disabled={loading}
          >
            <Send size={18} /> Submit to Meta
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Editor */}
        <div className="col-span-7 space-y-8">
          <Card className="glass border-white/5 p-8 rounded-[32px] space-y-8">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Internal Name</Label>
                  <Input 
                    placeholder="e.g. welcome_message" 
                    className="bg-white/5 border-white/10 h-12 rounded-xl"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <p className="text-[10px] text-gray-600 px-1">Lowercase, underscores and numbers only.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Display Name</Label>
                  <Input 
                    placeholder="e.g. Welcome Message" 
                    className="bg-white/5 border-white/10 h-12 rounded-xl"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10">
                      <SelectItem value="MARKETING">Marketing</SelectItem>
                      <SelectItem value="UTILITY">Utility</SelectItem>
                      <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10">
                      <SelectItem value="en_US">English (US)</SelectItem>
                      <SelectItem value="en_GB">English (UK)</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <hr className="border-white/5" />

            <div className="space-y-8">
              {/* Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Header (Optional)</Label>
                  <div className="flex gap-2 bg-white/5 p-1 rounded-lg">
                    {[
                      { id: "NONE", icon: XCircle },
                      { id: "TEXT", icon: TextIcon },
                      { id: "IMAGE", icon: ImageIcon },
                      { id: "VIDEO", icon: VideoIcon },
                      { id: "DOCUMENT", icon: DocumentIcon },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setHeaderType(t.id as any)}
                        className={cn(
                          "p-2 rounded-md transition-all",
                          headerType === t.id ? "bg-primary text-white" : "text-gray-500 hover:text-white"
                        )}
                      >
                        <t.icon size={14} />
                      </button>
                    ))}
                  </div>
                </div>
                {headerType === "TEXT" && (
                  <Input 
                    placeholder="Enter header text..." 
                    className="bg-white/5 border-white/10 h-12 rounded-xl"
                    value={headerText}
                    onChange={(e) => setHeaderText(e.target.value)}
                  />
                )}
                {["IMAGE", "VIDEO", "DOCUMENT"].includes(headerType) && (
                  <div className="h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-gray-600 gap-2">
                    <p className="text-sm">Media will be uploaded per campaign</p>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Body Text (Required)</Label>
                <Textarea 
                  placeholder="Hello {{1}}, welcome to our store! Here is your code: {{2}}" 
                  className="bg-white/5 border-white/10 min-h-[160px] rounded-[24px] p-6 focus:ring-primary/20"
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                />
                <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-primary/5 p-2 rounded-lg border border-primary/10">
                  <Info size={12} className="text-primary" />
                  Use variable placeholders like {"{{1}}"}, {"{{2}}"} to personalize your message.
                </div>
              </div>

              {/* Footer */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Footer (Optional)</Label>
                <Input 
                  placeholder="Enter footer text..." 
                  className="bg-white/5 border-white/10 h-12 rounded-xl"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                />
              </div>

              {/* Buttons */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Buttons (Optional)</Label>
                  <Button variant="ghost" size="sm" className="text-primary gap-1" onClick={addButton}>
                    <Plus size={14} /> Add Button
                  </Button>
                </div>
                <div className="space-y-3">
                  {buttons.map((btn, idx) => (
                    <div key={idx} className="flex gap-3 animate-in slide-in-from-left-4">
                      <Select 
                        value={btn.type} 
                        onValueChange={(val) => {
                          const newBtns = [...buttons];
                          newBtns[idx].type = val;
                          setButtons(newBtns);
                        }}
                      >
                        <SelectTrigger className="w-48 bg-white/5 border-white/10 h-12 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass border-white/10">
                          <SelectItem value="QUICK_REPLY">Quick Reply</SelectItem>
                          <SelectItem value="PHONE_NUMBER">Call Phone</SelectItem>
                          <SelectItem value="URL">Visit Website</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input 
                        placeholder="Button text" 
                        className="flex-1 bg-white/5 border-white/10 h-12 rounded-xl"
                        value={btn.text}
                        onChange={(e) => {
                          const newBtns = [...buttons];
                          newBtns[idx].text = e.target.value;
                          setButtons(newBtns);
                        }}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-12 w-12 text-rose-500"
                        onClick={() => setButtons(buttons.filter((_, i) => i !== idx))}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Preview */}
        <div className="col-span-5">
          <div className="sticky top-8 space-y-6">
            <h3 className="text-sm font-bold text-white px-2">Live Preview</h3>
            
            <div className="relative mx-auto w-[320px] aspect-[9/18] bg-[#0b141a] rounded-[48px] border-[12px] border-gray-800 shadow-2xl overflow-hidden p-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-gray-800 rounded-b-2xl z-20" />
              
              <div className="h-full w-full bg-[url('https://i.pinimg.com/originals/ab/ab/60/abab60f38ab5221053703c19e5989d97.jpg')] bg-cover bg-center rounded-[32px] p-4 flex flex-col pt-8">
                <div className="bg-[#1f2c34] rounded-2xl p-0 overflow-hidden shadow-lg animate-in zoom-in-95 duration-300 max-w-[90%]">
                  {headerType === "TEXT" && (
                    <div className="p-3 bg-black/10 border-b border-white/5 font-bold text-white text-xs">
                      {headerText || "Header Text"}
                    </div>
                  )}
                  {["IMAGE", "VIDEO", "DOCUMENT"].includes(headerType) && (
                    <div className="aspect-video bg-white/5 flex items-center justify-center text-gray-500">
                      {headerType === "IMAGE" && <ImageIcon size={24} />}
                      {headerType === "VIDEO" && <VideoIcon size={24} />}
                      {headerType === "DOCUMENT" && <DocumentIcon size={24} />}
                    </div>
                  )}
                  
                  <div className="p-3 space-y-1">
                    <p className="text-white text-[13px] leading-relaxed whitespace-pre-wrap">
                      {bodyText || "Body text content goes here..."}
                    </p>
                    {footerText && (
                      <p className="text-gray-400 text-[10px] uppercase tracking-wide pt-1">
                        {footerText}
                      </p>
                    )}
                  </div>
                  
                  {buttons.length > 0 && (
                    <div className="border-t border-white/5">
                      {buttons.map((btn, i) => (
                        <div key={i} className={cn(
                          "p-3 text-center text-[#53bdeb] text-xs font-medium border-white/5 transition-colors",
                          i !== buttons.length - 1 && "border-b"
                        )}>
                          {btn.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="mt-2 ml-1 text-[#8696a0] text-[10px]">
                  10:42 AM
                </div>
              </div>
            </div>

            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Smartphone size={18} className="text-primary" />
                Mobile Render
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                This is a close representation of how your message will appear on WhatsApp. Actual rendering may vary slightly based on the recipient's device and OS.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function XCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}
