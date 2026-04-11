export function Header({ name, phone }: { name?: string | null; phone?: string | null }) {
  return (
    <header>
      <h1>{name ?? "Your Insurance Agent"}</h1>
      <p>{phone ?? "(000) 000-0000"}</p>
    </header>
  );
}
