import type { Metadata } from "next";
import "./globals.css";
import { AuthBootstrap } from "@/components/layout/AuthBootstrap";

export const metadata: Metadata = {
  title: "ISP Task & Operations Management System",
  description: "Internal ERP-style operational control panel"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthBootstrap />
        {children}
      </body>
    </html>
  );
}
