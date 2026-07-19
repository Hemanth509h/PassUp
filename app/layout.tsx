import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "./(auth)/AuthContext";
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
        <AuthProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
