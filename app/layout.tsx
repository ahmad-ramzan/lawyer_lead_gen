import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LexSelf — Signal Law Group",
  description: "Legal self-service platform. AI-guided intake, attorney review on demand.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
