import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "./(auth)/AuthContext";
import { ThemeProvider } from "./ThemeContext";
import LayoutWrapper from "./components/layout-wrapper";

export const metadata: Metadata = {
  title: "PassUp",
  description: "A secure credentials and password manager",
  manifest: "/manifest.json"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
