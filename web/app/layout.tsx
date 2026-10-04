import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import { SITE } from "../data/site";
import "./globals.css";

const sans = Schibsted_Grotesk({ subsets: ["latin"], display: "swap", variable: "--font-sans" });

export const metadata: Metadata = {
    title: `${SITE.name}, l'étude de rendement en brouillon`,
    description: SITE.description,
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="fr" className={sans.variable}>
            <body>{children}</body>
        </html>
    );
}
