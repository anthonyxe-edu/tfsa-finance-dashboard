import type { Metadata, Viewport } from "next";
import { Fira_Sans, Fira_Code } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Sidebar } from "@/components/shell/Sidebar";
import { Header } from "@/components/shell/Header";
import { Providers } from "@/components/providers/Providers";
import { BootSplash } from "@/components/shell/BootSplash";

const firaSans = Fira_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-fira-sans",
  display: "swap",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fira-code",
  display: "swap",
});

// Alte Haas Grotesk — display font for headers, subheaders & titles.
const alteHaas = localFont({
  src: [
    { path: "./fonts/AlteHaasGroteskRegular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/AlteHaasGroteskBold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-alte",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Finance Dashboard",
  description: "Personal spending & budgeting dashboard",
  applicationName: "Finance",
  appleWebApp: {
    capable: true,
    title: "Finance",
    statusBarStyle: "black-translucent",
  },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0c0d0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${firaSans.variable} ${firaCode.variable} ${alteHaas.variable} h-full`}
    >
      <body className="min-h-full">
        <Providers>
          <div className="flex min-h-dvh">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <Header />
              <main className="flex-1 px-5 py-6 sm:px-8 sm:py-8">
                <div className="mx-auto w-full max-w-[1200px]">{children}</div>
              </main>
            </div>
          </div>
        </Providers>
        <BootSplash />
      </body>
    </html>
  );
}
