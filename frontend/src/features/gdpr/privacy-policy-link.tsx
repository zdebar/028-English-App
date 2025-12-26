export default function PrivacyPolicyLink({
  className = "",
}: {
  className?: string;
}) {
  return (
    <a href="/privacy-policy" className={`text-link ${className}`}>
      Zásady ochrany osobních údajů
    </a>
  );
}
