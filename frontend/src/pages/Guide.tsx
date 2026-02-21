import type { JSX } from 'react';
import { Screenshot } from '@/components/UI/Screenshot';

/**
 * A React component that renders the Grammar overview page.
 *
 * @returns A JSX element containing the GrammarOverview component.
 */
export default function Guide(): JSX.Element {
  return (
    <div className="guide max-w-hero p-4">
      <h1 className="text-center">Návod</h1>
      <section>
        <p>Učení cizích jazyků není ve své podstatě složité.</p>
        <p>
          Stačí pár tisíc slovíček a několik gramatických pravidel, které se dokola opakují. Obtížné
          je přirozené používání jazyka, kdy vše do sebe zapadá zcela automaticky, bez přemýšlení.
          Každý toho dosáhne u svého mateřského jazyka v průběhu dětství čistě množstvím opakování.
        </p>
        <p>
          Běžné učení jazyků znamená příliš mnoho přemýšlení a málo praxe. Tato aplikace je naopak
          zaměřená na dril, na velké množství naposlouchaných a vyslovených opakování.
        </p>
      </section>
      <section>
        <h2>Jak aplikace funguje</h2>

        <p>Aplikace využívá pouze procvičování pomocí kartiček.</p>
        <p>
          V aplikaci nejsou žádné lekce. Slovíčka i gramatika se postupně samy nabízejí k
          procvičování v kartičkách.
        </p>
        <p>
          Pravidelně se střídá procvičování z češtiny do angličtiny a z angličtiny do češtiny. Z
          češtiny psaným slovíčkem, z angličtiny poslechem.
        </p>
      </section>
      <section>
        <h2>Neodhalená kartička</h2>
        <Screenshot src="/screenshot-not-revealed.png" alt="Ukázka kartičky před odhalením" />
        <p>
          <strong>"audio"</strong>
          <span>Pokud je k dispozici, můžete kdykoliv znovu přehrát poklepáním na kartičku.</span>
        </p>

        <p>
          <strong>"gramatika"</strong>{' '}
          <span>
            Tlačítko s vysvětlením gramatiky se zpřístupní, pokud jde o gramatické cvičení.
          </span>
        </p>
        <p>
          <strong>"nápověda"</strong>
          <span>Tlačítko nápovědy postupně odhalí jednotlivá písmena správného překladu.</span>
        </p>
        <p>
          <strong>"dokončit"</strong>
          <span>
            Pokud nějaké slovíčko již znáte z dřívějška, tlačítko umožní přeskočit aktuální slovíčko
            nebo větu. Položka se ukončí a již se nebude znovu nabízet k opakování.
          </span>
        </p>
        <p>
          <strong>"odhalit"</strong>
          <span>Tlačítko odhalí správný překlad kartičky.</span>
        </p>
      </section>
      <section>
        <h2>Odhalená kartička</h2>
        <Screenshot src="/screenshot-revealed.png" alt="Ukázka kartičky po odhalení" />
        <p>
          <strong>"pokrok"</strong>
          <span>Označuje skóre procvičení jednotlivých položek.</span>
        </p>
        <p>
          <strong>"dnes / denní cíl"</strong>
          <span>Zobrazuje dnešní počet opakování a denní cíl.</span>
        </p>
        <p>
          <strong>"neznám"</strong>
          <span>
            Sníží skóre dané položky a způsobí, že se znovu objeví k procvičování mnohem dříve.
          </span>
        </p>
        <p>
          <strong>"znám"</strong>
          <span>
            Tlačítko zvýší skóre dané položky a způsobí, že se znovu objeví k procvičování později.
            Aplikace je postavena na drilu až do úplné automatizace, doporučujeme tedy dávat "znám"
            jen pokud je pro vás znalost zcela automatická.
          </span>
        </p>
      </section>
      <section>
        <h2>Profil</h2>
        <Screenshot src="/screenshot-profile.png" alt="Ukázka profilu uživatele" />
        <p>
          <strong>"Přehled gramatiky"</strong>
          <span>
            Zobrazuje přehled již započaté gramatiky a umožňuje restartovat procvičování příslušných
            vět.
          </span>
        </p>
        <p>
          <strong>"Přehled slovíček"</strong>
          <span>
            Zobrazuje přehled započatých slovíček a umožňuje restartovat procvičování každého
            slovíčka.
          </span>
        </p>
        <p>
          <strong>"Restartovat celý svůj pokrok"</strong>
          <span>Umožňuje začít úplně od začátku.</span>
        </p>
        <p>
          <strong>"Smazat účet"</strong>
          <span>
            Smazat uživatelský účet, včetně všech vašich dat. V této fázi vývoje je každé smazání
            účtu nevratné a data budou nenávratně ztracena.
          </span>
        </p>
        <p>
          <strong>"Odhlásit se"</strong>
          <span>Odhlásit se ze svého účtu.</span>
        </p>
      </section>
    </div>
  );
}
