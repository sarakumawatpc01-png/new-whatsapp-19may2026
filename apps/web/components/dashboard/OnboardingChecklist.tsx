"use client";

import { useState } from "react";
import { 
  CheckCircle2, 
  Circle, 
  MessageSquare, 
  Users, 
  FileText, 
  Zap,
  ChevronRight,
  X
} from "lucide-react";
import { Progress, Button } from "@repo/ui";
import { cn } from "@repo/ui";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  {
    id: "connect_whatsapp",
    title: "Connect WhatsApp",
    description: "Link your WhatsApp Business API or phone to start messaging.",
    icon: MessageSquare,
    cta: "Connect Now",
  },
  {
    id: "invite_team",
    title: "Invite Team",
    description: "Add your agents and managers to the shared inbox.",
    icon: Users,
    cta: "Invite Members",
  },
  {
    id: "create_template",
    title: "Create Template",
    description: "Design your first message template for campaigns.",
    icon: FileText,
    cta: "Create Template",
  },
  {
    id: "launch_campaign",
    title: "Launch Campaign",
    description: "Start your first AI-powered broadcast campaign.",
    icon: Zap,
    cta: "Start Campaign",
  },
];

export function OnboardingChecklist() {
  const [visible, setVisible] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  if (!visible) return null;

  const progress = (completedSteps.length / steps.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-white/10 overflow-hidden mb-8"
    >
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Getting Started</h2>
          <p className="text-sm text-gray-400 mt-1">Complete these steps to unlock the full potential of PLATFORM.</p>
        </div>
        <button onClick={() => setVisible(false)} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-300 font-medium">{Math.round(progress)}% Complete</span>
              <span className="text-gray-500">{completedSteps.length} of {steps.length} steps</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step) => {
            const isCompleted = completedSteps.includes(step.id);
            return (
              <div 
                key={step.id}
                className={cn(
                  "p-4 rounded-xl border transition-all duration-200",
                  isCompleted 
                    ? "bg-emerald-500/5 border-emerald-500/20" 
                    : "bg-white/5 border-white/10 hover:border-primary/50"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    isCompleted ? "bg-emerald-500/20 text-emerald-500" : "bg-primary/10 text-primary"
                  )}>
                    <step.icon size={20} />
                  </div>
                  {isCompleted ? (
                    <CheckCircle2 size={20} className="text-emerald-500" />
                  ) : (
                    <Circle size={20} className="text-gray-600" />
                  )}
                </div>
                <h3 className="font-semibold text-white mb-1">{step.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">{step.description}</p>
                <Button 
                  size="sm" 
                  variant={isCompleted ? "secondary" : "default"}
                  className="w-full text-xs h-8"
                  disabled={isCompleted}
                  onClick={() => {
                    if (step.id === "connect_whatsapp") window.location.href = "/whatsapp";
                    if (step.id === "invite_team") window.location.href = "/settings/team";
                    if (step.id === "create_template") window.location.href = "/templates";
                    if (step.id === "launch_campaign") window.location.href = "/campaigns";
                  }}
                >
                  {isCompleted ? "Completed" : step.cta}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
