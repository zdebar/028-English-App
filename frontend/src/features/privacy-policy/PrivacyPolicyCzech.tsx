import { CONTACTS } from '@/config/contacts.config';
import type { JSX } from 'react';

/**
 * PrivacyPolicyCzech component renders the privacy policy in Czech.
 * @returns  The privacy policy content.
 */
export default function PrivacyPolicyCzech(): JSX.Element {
  return (
    <div className="card-width privacy-policy px-4">
      <h1 className="pb-6 text-2xl">Zásady ochrany osobních údajů</h1>
      {/* 1. Osobní údaje, které zpracováváme */}
      <h2>1. Osobní údaje, které zpracováváme</h2>
      <ul>
        <li>
          <b>Údaje pro ověření totožnosti:</b> e-mailová adresa, jméno, profilový obrázek a
          jedinečný identifikátor účtu poskytovaný službou Google Sign-In.
        </li>
        <li>
          <b>Údaje o účtu:</b> datum vytvoření účtu.
        </li>
        <li>
          <b>Údaje o procvičování:</b> pokrok v učení jednotlivých položek.
        </li>
      </ul>
      {/* 2. Účel a právní základ zpracování */}
      <h2>2. Účel a právní základ zpracování</h2>
      <table className="mb-4 w-full border text-left text-sm">
        <caption className="sr-only">Účely a právní základy zpracování osobních údajů</caption>
        <thead>
          <tr>
            <th scope="col">Účel</th>
            <th scope="col">Právní základ</th>
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
        </tbody>
      </table>
      {/* 3. Doba uchování údajů */}
      <h2>3. Doba uchování údajů</h2>
      <ul>
        <li>Osobní údaje uchováváme pouze po dobu existence uživatelského účtu.</li>
        <li>Po smazání účtu jsou všechny osobní údaje smazány nebo nevratně anonymizovány.</li>
      </ul>
      {/* 4. Práva uživatelů */}
      <h2>4. Práva uživatelů</h2>
      <ul>
        <li>Právo na přístup ke svým osobním údajům</li>
        <li>Právo na opravu nepřesných údajů</li>
        <li>Právo na smazání účtu a osobních údajů</li>
        <li>Právo vznést námitku proti zpracování na základě oprávněného zájmu</li>
      </ul>
      {/* 5. Kontakt */}
      <h2>5. Kontakt</h2>
      <p className="text-sm">
        V případě dotazů týkajících se ochrany soukromí mě kontaktujte na adrese{' '}
        <a href={CONTACTS.mailTo} className="font-bold">
          {CONTACTS.email}
        </a>.
      </p>
    </div>
  );
}
