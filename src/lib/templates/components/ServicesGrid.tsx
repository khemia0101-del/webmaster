export function ServicesGrid({ services }: { services?: string[] }) {
  return <section><p>Services: {(services ?? ["Auto", "Home"]).join(", ")}</p></section>;
}
