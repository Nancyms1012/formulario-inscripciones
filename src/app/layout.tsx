import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Copa - VII Fecha Sarapiquí",
  description: "Formulario de inscripción - VII Fecha Sarapiquí, 31 Octubre - 01 Noviembre - La Copa",
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
