import type { Metadata } from "next";
import "./globals.css";
import { Provider } from "@/components/provider";
export const metadata: Metadata = {
  title: "GrandVillage | A little help. A lasting connection.",
  description:
    "Find your people, closer to home. A welcoming community connecting families and senior hosts.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
