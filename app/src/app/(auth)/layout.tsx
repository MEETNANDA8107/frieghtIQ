export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-surface font-inter text-on-surface">
      {children}
    </div>
  );
}
