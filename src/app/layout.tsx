import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/common/ui/Navbar";

export const metadata: Metadata = {
  title: "House Shadow Simulator - DubisoftSolutions",
  description: "Simulate the shadows cast by solar panels on my house",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased page-with-navbar">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
