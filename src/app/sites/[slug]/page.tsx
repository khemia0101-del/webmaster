import { notFound } from "next/navigation";

export default async function SitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug) notFound();

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">Published Site</h1>
      <p className="mt-2">This route will render site content for slug: {slug}</p>
    </main>
  );
}
