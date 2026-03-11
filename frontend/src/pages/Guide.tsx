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
          Běžné učení jazyků používá příliš mnoho teori a málo praxe. Tato aplikace je naopak
          zaměřená na dril, na velké množství naposlouchaných a vyslovených opakování.
        </p>
        <p className="text-center">
          Zatímco běžně během sezení hodiny angličtiny namluvíte přinejlepším pár desítek slovíček,
          zde jich za stejnou dobu zvládnete procvičit stovky.
        </p>
      </section>
      <section>
        <h2>Používání</h2>
        <p className="text-center">
          Klikněte na tlačítko "Procvičovat" na horní liště a začněte procvičovat. Aplikace vám bude
          nabízet slovíčka, slovní spojení či věty v ideálním pořadí pro učení.
        </p>
        <p className="text-center">
          Pravidelně se střídá procvičování z češtiny do angličtiny a z angličtiny do češtiny. Z
          češtiny psaným slovíčkem, z angličtiny poslechem.
        </p>
        <p className="text-center">
          Každý den se počítá doporučený minimální denní cíl opakování. Najdete ho jak na titulní
          stránce tak na kartičce procvičování.
        </p>
      </section>
      <section>
        <h2>Neodhalená kartička</h2>
        <Screenshot src="/screenshots/not-revealed.webp" alt="Ukázka kartičky před odhalením" />
        <p>
          <strong>"odhalit"</strong>
          <span>Odhalí překlad kartičky</span>
        </p>

        <p>
          <strong>"pokrok"</strong>
          <span>Skóre pokroku položky</span>
        </p>
        <p>
          <strong>"dnes / denní cíl"</strong>
          <span>Dnešní počet opakování a cíl</span>
        </p>
        <p>
          <strong>"dokončit"</strong>
          <span>Položka se nebude nabízet k dalšímu procvičování</span>
        </p>
        <p>
          <strong>"přehraj audio"</strong>
          <span>Přehraje audio položky</span>
        </p>

        <p>
          <strong>"gramatika"</strong>
          <span>Vysvětlení příslušné gramatiky</span>
        </p>
        <p>
          <strong>"nápověda"</strong>
          <span>Postupně odhalí jednotlivá písmena správného překladu</span>
        </p>
      </section>
      <section>
        <h2>Odhalená kartička</h2>
        <Screenshot src="/screenshots/revealed.webp" alt="Ukázka kartičky po odhalení" />
        <p>
          <strong>"neznám"</strong>
          <span>Sníží skóre dané položky. Položka se nabídne k dalšímu procvičování dříve.</span>
        </p>
        <p>
          <strong>"znám"</strong>
          <span>
            Zvýší skóre dané položky. Položka se bude tak nabízet k dalšímu procvičování později.
          </span>
        </p>
        <p>
          <strong>"DOPORUČUJEME"</strong>
          <span>Dávat "znám" jen pokud je pro vás znalost zcela automatická!</span>
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
            grammatice.
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
          <span>Stáhne veškerá data do zařízení pro možnost používat aplikaci offline.</span>
        </p>
        <p>
          <strong>"Opravit data"</strong>
          <span>
            Aplikace je běžně synchronizována při každém startu aplikace či minimálně každých 24
            hodin. Tato manuální synchronizace je určena pouze pro opravu poškozených dat.
          </span>
        </p>
        <p>
          <strong>"Smazat účet"</strong>
          <span>
            Smaže uživatelský účet, včetně všech vašich dat. V této fázi vývoje je každé smazání
            účtu nevratné a data budou nenávratně smazána.
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
          Ve webové verzi aplikace je pro používání offline nejprve zapotřebí stáhnout veškerá data
          do zařízení. To lze udělat v profilu pomocí tlačítka "Stáhnout data".
        </p>
        <p className="text-center">
          Ve stažené aplikaci jsou již veškerá data stažena a aplikace je plně funkční i bez
          připojení k internetu.
        </p>
      </section>
    </div>
  );
}
