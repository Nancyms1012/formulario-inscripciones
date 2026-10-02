import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "La Copa - VII Fecha Sarapiquí",
  description: "Formulario de inscripción - VII Fecha Sarapiquí, 31 Octubre - 01 Noviembre - La Copa",
};

export default function CopaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* Header Azul La Copa */}
      <header className="bg-[#0d2240] text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <img
              src="/images/LOGO_COPA.jpeg"
              alt="La Copa"
              className="h-12 w-12 rounded-lg object-cover"
            />
            <div>
              <h1 className="text-xl font-bold">VII Fecha Sarapiquí · 31 Octubre - 01 Noviembre</h1>
              <p className="text-sm text-blue-200">
                Inscripción a Carreras de Ciclismo
              </p>
            </div>
          </a>
          <a
            href="/"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            <span aria-hidden="true">&larr;</span>
            <span className="hidden sm:inline">Volver a la portada</span>
            <span className="sm:hidden">Volver</span>
          </a>
        </div>
      </header>

      {/* Content */}
      <main>{children}</main>

      {/* Footer Azul */}
      <footer className="bg-[#0d2240] text-white text-center py-4 mt-12">
        <p className="text-sm text-blue-200">
          &copy; {new Date().getFullYear()} La Copa - Todos los derechos
          reservados
        </p>
      </footer>
    </>
  );
}
