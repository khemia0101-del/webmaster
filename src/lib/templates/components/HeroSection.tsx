export function HeroSection({ headline }: { headline?: string | null }) {
  return <section><h2>{headline ?? "Personalized Insurance Guidance"}</h2></section>;
}
