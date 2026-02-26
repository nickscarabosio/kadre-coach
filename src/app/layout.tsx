import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kadre Coach",
  description: "The coaching platform where programs forge real results",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
