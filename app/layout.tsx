import "./globals.css";
import { PwaRegister } from "../components/PwaRegister";

export const metadata = {
  title: "Villa Aldebaran",
  description: "Cockpit multi-agents Villa Aldebaran",
  applicationName: "Villa Aldebaran",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Villa Aldebaran",
  },
};

export const viewport = {
  themeColor: "#1f4b3f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
