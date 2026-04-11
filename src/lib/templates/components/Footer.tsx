export function Footer({ disclaimer }: { disclaimer?: string | null }) {
  return <footer><small>{disclaimer ?? "Coverage and eligibility may vary by state and policy."}</small></footer>;
}
