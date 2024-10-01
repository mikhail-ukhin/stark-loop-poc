import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import Navbar from "@/components/Navigation"; // Importing the Navbar component
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "STRK Loop",
  description: "STRK Loop",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {/* Full-width Navbar */}
          <header className="w-full">
            <Navbar />
          </header>
          {/* Main content */}
          <main className="flex-grow">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}