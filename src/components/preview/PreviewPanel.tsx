"use client";

export function PreviewPanel({ websiteId }: { websiteId: string | null }) {
  if (!websiteId) {
    return <section className="p-6">Preview will appear after onboarding begins.</section>;
  }

  return (
    <section className="h-screen p-2">
      <iframe className="h-full w-full rounded border" src={`/api/preview/${websiteId}`} title="Website preview" />
    </section>
  );
}
