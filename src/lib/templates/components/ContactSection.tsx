export function ContactSection({ email }: { email?: string | null }) {
  return <section><p>Contact: {email ?? "agent@example.com"}</p></section>;
}
