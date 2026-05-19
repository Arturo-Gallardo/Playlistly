import type { Metadata } from "next";
import { AuthProvider } from "./components/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Playlistly",
  description: "Look at YouTube playlists in a figma style visual grid.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
