import { Navbar } from "./Navbar";

export function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100">
      <Navbar />
      
      {/* Conteúdo Principal */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 animate-fade-in">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-600 text-xs border-t border-gray-800 mt-8">
        <p>© {new Date().getFullYear()} Finance App. Uso Pessoal.</p>
      </footer>
    </div>
  );
}