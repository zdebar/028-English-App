export default function PrivacyPolicy() {
  return (
    <div className="px-2">
      <h1 className="pb-6 text-2xl">Zásady ochrany osobních údajů</h1>
      {/* 1. Osobní údaje, které zpracováváme */}
      <h2>1. Osobní údaje, které zpracováváme</h2>
      <ul>
        <li>
          <b>Údaje pro ověření totožnosti:</b> e-mailová adresa, jméno a jedinečný identifikátor
          účtu poskytovaný službou Google Sign-In.
        </li>
        <li>
          <b>Údaje o účtu:</b> datum vytvoření účtu, datum posledního přihlášení.
        </li>
        <li>
          <b>Údaje o procvičování:</b> pokrok v učení jednotlivých položek.
        </li>
      </ul>
      {/* 2. Účel a právní základ zpracování */}
      <h2>2. Účel a právní základ zpracování</h2>
      <table className="mb-4 w-full border text-left text-sm">
        <thead>
          <tr>
            <th>Účel</th>
            <th>Právní základ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Vytvoření a ověření účtu</td>
            <td>Čl. 6 odst. 1 písm. b&#41; GDPR – plnění smlouvy</td>
          </tr>
          <tr>
            <td>Poskytování jazykových funkcí</td>
            <td>Čl. 6 odst. 1 písm. b&#41; GDPR</td>
          </tr>
          <tr>
            <td>Zlepšování funkcí aplikace na základě agregovaných údajů o procvičování</td>
            <td>Čl. 6 odst. 1 písm. f&#41; GDPR – oprávněný zájem</td>
          </tr>
        </tbody>
      </table>
      <p className="text-sm">
        Náš oprávněný zájem spočívá ve zlepšování kvality, přesnosti a efektivity výuky.
      </p>
      {/* 3. Analytika */}
      <h2>3. Analytika</h2>
      <ul>
        <li>
          Analyzujeme údaje o procvičování a používání pouze za účelem zlepšení funkcí aplikace.
        </li>
        <li>Údaje nepoužíváme pro marketing ani reklamu.</li>
        <li>Analytická data nesdílíme s třetími stranami.</li>
        <li>Analytická data jsou využívána pouze v agregované nebo interní podobě.</li>
      </ul>
      {/* 4. Doba uchování údajů */}
      <h2>4. Doba uchování údajů</h2>
      <ul>
        <li>Osobní údaje uchováváme pouze po dobu existence uživatelského účtu.</li>
        <li>Po smazání účtu jsou všechny osobní údaje smazány nebo nevratně anonymizovány.</li>
        <li>Anonymizovaná statistická data mohou být uchována za účelem zlepšování produktu.</li>
      </ul>
      {/* 5. Práva uživatelů */}
      <h2>5. Práva uživatelů</h2>
      <ul>
        <li>Právo na přístup ke svým osobním údajům</li>
        <li>Právo na opravu nepřesných údajů</li>
        <li>Právo na smazání účtu a osobních údajů</li>
        <li>Právo vznést námitku proti zpracování na základě oprávněného zájmu</li>
      </ul>
      {/* 6. Kontakt */}
      <h2>6. Kontakt</h2>
      <p className="text-sm">
        V případě dotazů týkajících se ochrany soukromí mě kontaktujte na adrese{' '}
        <a href="mailto:zdebarth@gmail.com" className="font-bold">
          zdebarth@gmail.com
        </a>
        .
      </p>
    </div>
  );
}
