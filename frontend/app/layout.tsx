import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { RouteProvider } from "@/providers/route-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "@/styles/globals.css";

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "MVP Scaffold",
    description: "One-click scaffold with Untitled UI",
};

export const viewport: Viewport = {
    colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" className={`${inter.variable} scroll-smooth`} suppressHydrationWarning>
            <body className="bg-primary text-primary antialiased">
                <RouteProvider>
                    <ThemeProvider>{children}</ThemeProvider>
                </RouteProvider>
            </body>
        </html>
    );
}
