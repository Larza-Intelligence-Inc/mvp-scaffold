import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, JetBrains_Mono, Newsreader } from "next/font/google";
import { RouteProvider } from "@/providers/route-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "@/styles/globals.css";

const hanken = Hanken_Grotesk({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-hanken",
});

const newsreader = Newsreader({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-newsreader",
});

const jetbrains = JetBrains_Mono({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-jetbrains",
});

export const metadata: Metadata = {
    title: "Larza",
    description: "Personalized preventative care",
};

export const viewport: Viewport = {
    colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html
            lang="en"
            className={`${hanken.variable} ${newsreader.variable} ${jetbrains.variable} scroll-smooth`}
            suppressHydrationWarning
        >
            <body className="bg-secondary font-body text-primary antialiased">
                <RouteProvider>
                    <ThemeProvider>{children}</ThemeProvider>
                </RouteProvider>
            </body>
        </html>
    );
}
