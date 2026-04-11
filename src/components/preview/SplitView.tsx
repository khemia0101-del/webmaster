export function SplitView({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2">{left}{right}</div>;
}
