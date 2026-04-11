import { ChatContainer } from "@/components/chat/ChatContainer";
import { PreviewPanel } from "@/components/preview/PreviewPanel";

export default function BuildPage() {
  return (
    <main className="grid min-h-screen grid-cols-1 md:grid-cols-[45%_55%]">
      <ChatContainer />
      <PreviewPanel websiteId={null} />
    </main>
  );
}
