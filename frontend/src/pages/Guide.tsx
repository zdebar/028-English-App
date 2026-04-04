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
        <p className="text-center">
          Běžné učení jazyků používá příliš mnoho teorie a málo praxe. Tato aplikace je naopak
          zaměřená na dril, na velké množství naposlouchaných a vyslovených opakování.
        </p>
      </section>
      <section>
        <h2>Používání</h2>
        <p className="text-center">
          Klikněte na tlačítko "Procvičovat" na horní liště a začněte procvičovat. Aplikace vám bude
          nabízet slovíčka, slovní spojení či věty v ideálním pořadí pro učení. 
        </p>
      </section>
      <section>
        <h2>Neodhalená kartička</h2>
        <Screenshot src="/screenshots/not-revealed.webp" alt="Ukázka kartičky před odhalením" />
        <p>
          <strong>"dnes / denní cíl"</strong>
          <span>Doporučený denní počet opakování. Snažte se ho každý den splnit. Ostatní můžete pustit z hlavy.</span>
        </p>
        <p>
          <strong>"dokončit"</strong>
          <span>Položka se nebude nabízet k dalšímu procvičování. Použijte k přeskočení položky, pokud ji již znáte z dřívějška.</span>
        </p>
        <p>
          <strong>"gramatika"</strong>
          <span>Vysvětlení příslušné gramatiky ke každé větě či slovnímu spojení.</span>
        </p>
      </section>
      <section>
        <h2>Odhalená kartička</h2>
        <Screenshot src="/screenshots/revealed.webp" alt="Ukázka kartičky po odhalení" />
        <p>
          <strong>"neznám"</strong>
          <span>Sníží skóre dané položky. Položka se nabídne k dalšímu procvičování dříve. Pokud pro vás není znalost zcela automatická, dávejte vždy "neznám".</span>
        </p>
        <p>
          <strong>"znám"</strong>
          <span>
            Zvýší skóre dané položky. Položka se bude tak nabízet k dalšímu procvičování později.
          </span>
        </p>
      </section>
      <section>
        <h2>Profil</h2>
        <Screenshot src="/screenshots/profile.webp" alt="Ukázka profilu uživatele" />
        <p>
          <strong>"Přehled CEFR úrovní"</strong>
          <span>Přehled postupu na jednotlivých CEFR úrovních a na jednotlivých lekcích.</span>
        </p>
        <p>
          <strong>"Přehled gramatiky"</strong>
          <span>
            Přehled již započaté gramatiky, umožňuje restartovat procvičování vět příslušných k dané
            gramatice.
          </span>
        </p>
        <p>
          <strong>"Přehled slovíček"</strong>
          <span>
            Přehled započatých slovíček, umožňuje restartovat procvičování každého slovíčka.
          </span>
        </p>
        <p>
          <strong>"Stáhnout data"</strong>
          <span>Stáhne všechna data do zařízení, abyste mohli aplikaci používat offline.</span>
        </p>
        <p>
          <strong>"Opravit data"</strong>
          <span>
            Aplikace se běžně synchronizuje při každém spuštění nebo alespoň jednou za 24 hodin. Tato manuální synchronizace je určena pouze pro opravu poškozených dat.
          </span>
        </p>
        <p>
          <strong>"Smazat účet"</strong>
          <span>
            Smaže uživatelský účet včetně všech vašich dat. V této fázi vývoje je smazání účtu nevratné a data budou nenávratně odstraněna.
          </span>
        </p>
        <p>
          <strong>"Odhlásit se"</strong>
          <span>Odhlásí vás z vašeho uživatelského účtu.</span>
        </p>
      </section>
      <section>
        <h2>Offline</h2>
        <p className="text-center">
          Ve webové verzi aplikace je pro používání offline nejprve potřeba stáhnout všechna data do zařízení. To provedete v profilu tlačítkem "Stáhnout data".
        </p>
        <p className="text-center">
          Ve stažené aplikaci jsou všechna data již obsažena a aplikace je plně funkční i bez připojení k internetu.
        </p>
      </section>
            <section>
        <h2>Synchronizace</h2>
        <p className="text-center">
          Vaše data se každý den synchronizují s cloudem, aby byla bezpečně zálohována.
        </p>
        <p className="text-center">
          Aplikace není určena pro současné používání na více zařízeních. V takovém případě může dojít k neaktuálním datům.
        </p>
      </section>
    </div>
  );
}
