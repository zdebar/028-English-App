export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-4 text-center flex gap-2 justify-center items-center">
      <p className="text-sm">&copy; {currentYear}</p>
      <a href="/privacy-policy" className="text-sm hover:underline">
        Zásady ochrany osobních údajů
      </a>
    </footer>
  );
}
