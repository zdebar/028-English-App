/**
 * Footer component displaying the current year and a link to the privacy policy.
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full text-sm py-4 text-center flex gap-2 justify-center items-center">
      <p>&copy; {currentYear}</p>
      <a href="/privacy-policy" className="hover:underline">
        Zásady ochrany osobních údajů
      </a>
    </footer>
  );
}
