export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="mb-8 text-center text-sm font-semibold tracking-[0.08em] text-foreground">
          advisorhub
        </p>
        {children}
      </div>
    </div>
  );
}
