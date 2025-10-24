export default function Footer({ className }: { className?: string }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`w-full py-4 text-center ${className}`}>
      <p className="text-sm">&copy; {currentYear} zdenekbarth.cz</p>
    </footer>
  );
}
