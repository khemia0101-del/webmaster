export type StepName =
  | "welcome"
  | "identity"
  | "services"
  | "tone"
  | "about"
  | "disclaimer"
  | "review";

export type ChatStep = {
  id: number;
  name: StepName;
  label: string;
  fields: string[];
  fallbackPrompt: string;
};

export const STEPS: ChatStep[] = [
  { id: 1, name: "welcome", label: "Welcome", fields: [], fallbackPrompt: "Welcome! Ready to build your website in 7 steps?" },
  { id: 2, name: "identity", label: "About You", fields: ["name", "officeLocation", "phone", "email"], fallbackPrompt: "What is your full name, office location, and best phone or email for clients?" },
  { id: 3, name: "services", label: "Your Services", fields: ["services"], fallbackPrompt: "What types of insurance do you help clients with? For example: auto, home, life, health, or business." },
  { id: 4, name: "tone", label: "Website Style", fields: ["tone"], fallbackPrompt: "Which style do you want for your website copy: friendly or professional?" },
  { id: 5, name: "about", label: "Your Story", fields: ["headline", "aboutText"], fallbackPrompt: "Tell me 2-3 short points about your experience and how you help clients." },
  { id: 6, name: "disclaimer", label: "Final Details", fields: ["disclaimerText"], fallbackPrompt: "Please confirm this disclaimer text or share edits." },
  { id: 7, name: "review", label: "Review & Publish", fields: [], fallbackPrompt: "Everything looks good. Would you like to publish your demo site now?" }
];

export function getStep(step: number): ChatStep {
  return STEPS.find((s) => s.id === step) ?? STEPS[0];
}
