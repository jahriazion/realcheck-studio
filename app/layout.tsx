export const metadata = {
  title: "RealCheck • AI Studio",
  description: "AI SaaS",
};
import "./globals.css";
import Nav from "@/components/Nav";
import { brand } from "@/lib/brand";
import { SessionProvider } from "next-auth/react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ ['--brand' as any]: brand.primary, ['--accent' as any]: brand.accent }}>
        <SessionProvider>
          <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_-10%,rgba(34,197,94,.18),transparent_70%)]" />
          <Nav />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
