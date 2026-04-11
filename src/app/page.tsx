import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold">Create Your Insurance Website in Minutes</h1>
      <p className="mt-4 text-gray-700">
        Guided chatbot onboarding with live preview and one-click publish.
      </p>
      <Link
        href="/build"
        className="mt-8 inline-block rounded bg-blue-600 px-4 py-2 text-white"
      >
        Get Started
      </Link>
    </main>
  );
}
