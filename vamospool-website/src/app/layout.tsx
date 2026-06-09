import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vamos Pool — Premier Billiard Venue & Tournament Hub",
  description:
    "Vamos Pool adalah venue billiard premium di Makassar. Nikmati fasilitas kelas dunia, ikuti turnamen bergengsi, dan jadilah bagian dari komunitas billiard terbaik.",
  keywords: "billiard, pool, snooker, turnamen, venue, Makassar, Vamos Pool",
  openGraph: {
    title: "Vamos Pool — Where Champions Are Made",
    description: "Venue billiard premium dengan fasilitas kelas dunia dan ekosistem turnamen terlengkap.",
    type: "website",
    url: "https://vamospool.id",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="grain">
        {children}
      </body>
    </html>
  );
}
