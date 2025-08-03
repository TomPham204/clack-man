import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
	title: 'Clack man',
	description: 'Clack man by Tom Pham',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
		<html lang='en'>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased mx-auto my-0 max-w-6xl`}
			>
				<Navbar />
				{children}
				<Footer />
			</body>
		</html>
	);
}
