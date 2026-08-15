"use client";

import { usePathname } from "next/navigation";

// Pages that should NOT show Navbar + Footer
const FULL_PAGE_ROUTES = ["/seller-register"];

export default function ConditionalLayout({
  children,
  navbar,
  footer,
}: {
  children: React.ReactNode;
  navbar: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();
  const isFullPage = FULL_PAGE_ROUTES.some((r) => pathname.startsWith(r));

  if (isFullPage) return <>{children}</>;

  return (
    <>
      {navbar}
      {children}
      {footer}
    </>
  );
}
