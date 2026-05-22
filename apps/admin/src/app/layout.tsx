import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

import "../index.css";
import { APP_NAME } from "@my-better-t-app/ui/lib/brand";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/components/providers";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: `${APP_NAME} Admin`,
	description: `${APP_NAME} Admin`,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<ClerkProvider>
					<Providers>{children}</Providers>
				</ClerkProvider>
			</body>
		</html>
	);
}
