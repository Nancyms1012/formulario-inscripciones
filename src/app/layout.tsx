import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Copa - VI Fecha 13-14 Setiembre",
  description: "Formulario de inscripción - VI Fecha 13-14 Setiembre - La Copa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}
