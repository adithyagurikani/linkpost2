import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import Nav from "@/components/Nav";
import { ToastProvider } from "@/components/Toast";
import { ConfirmProvider } from "@/components/ConfirmModal";

export const metadata: Metadata = {
  title: "InkPost - LinkedIn Scheduler",
  description: "Schedule and post content to LinkedIn",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen antialiased font-sans">
        <SessionProvider>
          <ToastProvider>
            <ConfirmProvider>
              <Nav />
              {children}
            </ConfirmProvider>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
