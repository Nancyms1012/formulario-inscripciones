import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Copa Kids - Inscripción",
  description: "Formulario de inscripción - Copa Kids",
};

export default function KidsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* Header Verde Copa Kids */}
      <header className="bg-[#1a7a3a] text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <img
              src="/images/logo-copa-kids.jpeg"
              alt="Copa Kids"
              className="h-12 w-12 rounded-lg object-cover"
            />
            <div>
              <h1 className="text-xl font-bold">Copa Kids</h1>
              <p className="text-sm text-green-200">
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
      {children}

      {/* Footer Verde */}
      <footer className="bg-[#1a7a3a] text-white text-center py-4 mt-12">
        <p className="text-sm text-green-200">
          &copy; {new Date().getFullYear()} Copa Kids - Todos los derechos
          reservados
        </p>
      </footer>
    </>
  );
}
