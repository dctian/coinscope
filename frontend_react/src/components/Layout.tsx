import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

/** Top-level layout wrapper with consistent padding and max width. */
export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 to-gray-50">
      <div className="mx-auto max-w-lg">{children}</div>
    </div>
  );
}
