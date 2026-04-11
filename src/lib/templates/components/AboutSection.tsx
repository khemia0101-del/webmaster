export function AboutSection({ aboutText }: { aboutText?: string | null }) {
  return <section><p>{aboutText ?? "Helping families and businesses protect what matters most."}</p></section>;
}
