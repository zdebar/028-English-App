import type { JSX } from 'react';
import { Screenshot } from '@/components/UI/Screenshot';

/**
 * A React component that renders the Grammar overview page.
 *
 * @returns A JSX element containing the GrammarOverview component.
 */
export default function Guide(): JSX.Element {
  return (
    <div className="guide max-w-hero overflow-x-hidden p-4">
      <h1 className="text-center">Návod</h1>
      <section>
        <p>Učení cizích jazyků není ve své podstatě složité.</p>
        <p>
          Obtížné je přirozené znalosti jazyka, kdy vše do sebe zapadá zcela automaticky, bez
          přemýšlení. Každý toho dosáhne u svého mateřského jazyka v průběhu dětství čistě množstvím
          opakování.
        </p>
        <p>
          Běžné učení jazyků znamená příliš mnoho přemýšlení a málo praxe. Tato aplikace je naopak
          zaměřená na dril, na velké množství naposlouchaných a vyslovených opakování.
        </p>
      </section>
      <section>
        <h2>Jak aplikace funguje</h2>

        <p>
          Aplikace využívá pouze procvičování pomocí kartiček. Slovíčka i gramatika se postupně samy
          nabízejí k procvičování v kartičkách.
        </p>
        <p>
          Pravidelně se střídá procvičování z češtiny do angličtiny a z angličtiny do češtiny. Z
          češtiny psaným slovíčkem, z angličtiny poslechem.
        </p>
      </section>
      <section>
        <h2>Neodhalená kartička</h2>
        <Screenshot src="/screenshot-not-revealed.webp" alt="Ukázka kartičky před odhalením" />
        <p className="text-left">
          <strong>"odhalit"</strong> odhalí překlad kartičky{' '}
        </p>
        <p>
          <strong>"pokrok"</strong> skóre pokroku položky
        </p>
        <p>
          <strong>"dnes / denní cíl"</strong>
          <span>dnešní počet opakování a cíl</span>
        </p>
        <p>
          <strong>"dokončit"</strong>
          dokončí položku, ta se již nebude nabízet k dalšímu procvičování
        </p>
        <p>
          <strong>"přehraj audio"</strong>
          přehraje audio položky
        </p>

        <p>
          <strong>"gramatika"</strong> vysvětlení příslušné gramatiky
        </p>
        <p>
          <strong>"nápověda"</strong>
          postupně odhalí jednotlivá písmena správného překladu
        </p>
      </section>
      <section>
        <h2>Odhalená kartička</h2>
        <Screenshot src="/screenshot-revealed.webp" alt="Ukázka kartičky po odhalení" />

        <p>
          <strong>"neznám"</strong>
          sníží skóre dané položky, nabídne se k dalšímu procvičování dříve
        </p>
        <p>
          <strong>"znám"</strong>
          <span>zvýší skóre dané položky, bude se tak nabízet k dalšímu procvičování později.</span>
        </p>
        <p>
          Aplikace je postavena na drilu až do úplné automatizace, doporučujeme tedy dávat "znám"
          jen pokud je pro vás znalost zcela automatická.
        </p>
      </section>
      <section>
        <h2>Profil</h2>
        <Screenshot src="/screenshot-profile.webp" alt="Ukázka profilu uživatele" />
        <p>
          <strong>"Přehled gramatiky"</strong>
          <span>
            přehled již započaté gramatiky, umožňuje restartovat procvičování vět příslušných k dané
            grammatice
          </span>
        </p>
        <p>
          <strong>"Přehled slovíček"</strong>
          <span>
            přehled započatých slovíček, umožňuje restartovat procvičování každého slovíčka
          </span>
        </p>
        <p>
          <strong>"Restartovat vše"</strong>
          <span>vynuluje veškerý pokrok</span>
        </p>
        <p>
          <strong>"Smazat účet"</strong>
          <span>
            smaže uživatelský účet, včetně všech vašich dat. V této fázi vývoje je každé smazání
            účtu nevratné a data budou nenávratně smazána.
          </span>
        </p>
        <p>
          <strong>"Odhlásit se"</strong>
          <span>odhlásí Vás ze svého účtu.</span>
        </p>
      </section>
    </div>
  );
}
