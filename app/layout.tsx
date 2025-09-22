import type { Metadata } from "next";
import ConfigureAmplify from "@/utils/configureAmplify";
import { Inter ,Oswald } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const oswald = Oswald({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: "Stock Control",
  description: "Stock Control Masskg App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={oswald.className}>
      <body className={oswald.className}>
      <ConfigureAmplify />
        {children}
        </body>
    </html>
  );
}
