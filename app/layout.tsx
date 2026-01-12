import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "Newsletter Management System",
  description: "Manage and schedule newsletters with AWS and Strapi CMS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
