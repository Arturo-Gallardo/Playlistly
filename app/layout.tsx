import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { AuthProvider } from "./components/AuthProvider";
import { michroma, nunito, saira } from "./fonts";
import { authOptions } from "./lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Playlistly",
  description: "Look at YouTube playlists in a figma style visual grid.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html
      className={`${nunito.variable} ${saira.variable} ${michroma.variable}`}
      lang="en"
    >
      <head>
        <link rel="preconnect" href="https://lh3.googleusercontent.com" />
        <link
          as="image"
          href="/PlaylistlyLogo.png"
          rel="preload"
          type="image/png"
        />
      </head>
      <body>
        <AuthProvider session={session}>{children}</AuthProvider>
      </body>
    </html>
  );
}
