import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Copa - Inscripciones",
  description: "Formulario de inscripción para carreras de ciclismo - La Copa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-[#0d2240] text-white shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
            <img
              src="/images/logo-la-copa.png"
              alt="La Copa"
              className="h-12 w-12 rounded-lg object-cover"
            />
            <div>
              <h1 className="text-xl font-bold">La Copa</h1>
              <p className="text-sm text-blue-200">Inscripción a Carreras de Ciclismo</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>{children}</main>

        {/* Footer */}
        <footer className="bg-[#0d2240] text-white text-center py-4 mt-12">
          <p className="text-sm text-blue-200">
            &copy; {new Date().getFullYear()} La Copa - Todos los derechos reservados
          </p>
        </footer>
      </body>
    </html>
  );
}
