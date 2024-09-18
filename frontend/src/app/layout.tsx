import type { Metadata } from "next";
import "./globals.css";
import { StarknetProvider } from "~/StarknetProvider";
import Footer from "./components/internal/Footer";

export const metadata: Metadata = {
  title: "STRKloop",
  description:
    "STRKloop",
  openGraph: {
    title: "STRKloop",
    description:
      "",
    url: "",
  },
  twitter: {
    card: "summary_large_image",
    title: "STRKloop",
    description:
      "",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-coolvetica text-sm text-text-primary md:text-md">
        <StarknetProvider>{children}</StarknetProvider>
        <Footer />
      </body>
    </html>
  );
}
