import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-2xl font-bold text-[#0d2240] mb-2">VI Fecha 13-14 Setiembre</h1>
        <p className="text-gray-600 mb-8">Seleccioná tu categoría para inscribirte</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* La Copa */}
          <Link href="/inscripcion/copa"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-[#0d2240]">
            <img src="/images/LOGO_COPA.jpeg" alt="La Copa"
              className="h-24 w-24 mx-auto rounded-xl object-cover mb-4" />
            <h2 className="text-lg font-bold text-[#0d2240]">La Copa</h2>
            <p className="text-sm text-gray-500 mt-1">XCO · XCC · XCE</p>
          </Link>

          {/* Copa Kids */}
          <Link href="/inscripcion/kids"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-green-600">
            <img src="/images/logo-copa-kids.jpeg" alt="Copa Kids"
              className="h-24 w-24 mx-auto rounded-xl object-contain mb-4" />
            <h2 className="text-lg font-bold text-green-700">Copa Kids</h2>
            <p className="text-sm text-gray-500 mt-1">Balance · Niños · Preinfantil</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
