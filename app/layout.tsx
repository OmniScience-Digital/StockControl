import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import AmplifyProvider from "./amplify-provider";

const inter = Inter({ subsets: ["latin"] });
const oswald = Oswald({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Omni-Nexos",
  description: "Omni-Nexos Masskg App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={oswald.className}>
      <body className={oswald.className}>
        <AmplifyProvider>
          {children}
        </AmplifyProvider>
      </body>
    </html>
  );
}