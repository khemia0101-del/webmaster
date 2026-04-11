export function ChatMessage({ role, content }: { role: "assistant" | "user"; content: string }) {
  const isAssistant = role === "assistant";
  return (
    <div className={`my-2 flex ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[80%] rounded px-3 py-2 ${isAssistant ? "bg-blue-100" : "bg-gray-200"}`}>{content}</div>
    </div>
  );
}
