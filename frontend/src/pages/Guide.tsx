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
        <p>
          Učení cizích jazyků není ve své podstatě složité. Každý toho dosáhne u svého mateřského
          jazyka v průběhu dětství čistě množstvím opakování.
        </p>
        <p>
          Běžné učení jazyků používá příliš mnoho přemýšlení a málo praxe. Tato aplikace je naopak
          zaměřená na dril, na velké množství naposlouchaných a vyslovených opakování.
        </p>
      </section>
      <section>
        <h2>Jak aplikace funguje</h2>

        <p>
          Aplikace využívá pouze procvičování pomocí kartiček. Jak pro jednotlivá slovíčka, tak pro
          slovní spojení či celé věty.{' '}
        </p>
        <p>
          Pravidelně se střídá procvičování z češtiny do angličtiny a z angličtiny do češtiny. Z
          češtiny psaným slovíčkem, z angličtiny poslechem.
        </p>
      </section>
      <section>
        <h2>Neodhalená kartička</h2>
        <Screenshot src="/screenshots/not-revealed.webp" alt="Ukázka kartičky před odhalením" />
        <p className="text-left">
          <strong>"odhalit"</strong>Odhalí překlad kartičky{' '}
        </p>
        <p>
          <strong>"pokrok"</strong>Skóre pokroku položky
        </p>
        <p>
          <strong>"dnes / denní cíl"</strong>
          <span>Dnešní počet opakování a cíl</span>
        </p>
        <p>
          <strong>"dokončit"</strong>
          Položka se nebude nabízet k dalšímu procvičování
        </p>
        <p>
          <strong>"přehraj audio"</strong>
          Přehraje audio položky
        </p>

        <p>
          <strong>"gramatika"</strong>Vysvětlení příslušné gramatiky
        </p>
        <p>
          <strong>"nápověda"</strong>
          Postupně odhalí jednotlivá písmena správného překladu
        </p>
      </section>
      <section>
        <h2>Odhalená kartička</h2>
        <Screenshot src="/screenshots/revealed.webp" alt="Ukázka kartičky po odhalení" />

        <p>
          <strong>"neznám"</strong>
          Sníží skóre dané položky, nabídne se k dalšímu procvičování dříve
        </p>
        <p>
          <strong>"znám"</strong>
          <span>Zvýší skóre dané položky, bude se tak nabízet k dalšímu procvičování později.</span>
        </p>
        <p>
          Aplikace je postavena na drilu až do úplné automatizace, doporučujeme tedy dávat "znám"
          jen pokud je pro vás znalost zcela automatická.
        </p>
      </section>
      <section>
        <h2>Profil</h2>
        <Screenshot src="/screenshots/profile.webp" alt="Ukázka profilu uživatele" />
        <p>
          <strong>"Přehled CEFR úrovní"</strong>
          <span>Přehled postupu na jednotlivých CEFR úrovních a na jednotlivých lekcích</span>
        </p>
        <p>
          <strong>"Přehled gramatiky"</strong>
          <span>
            Přehled již započaté gramatiky, umožňuje restartovat procvičování vět příslušných k dané
            grammatice
          </span>
        </p>
        <p>
          <strong>"Přehled slovíček"</strong>
          <span>
            Přehled započatých slovíček, umožňuje restartovat procvičování každého slovíčka
          </span>
        </p>
        <p>
          <strong>"Stáhnout data"</strong>
          <span>Stáhne veškerá data do zařízení pro možnost používat aplikaci offline.</span>
        </p>
        <p>
          <strong>"Synchronizovat data"</strong>
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
          <span>Odhlásí Vás ze svého účtu.</span>
        </p>
      </section>
      <section>
        <h2>Synchronizace</h2>
        <p>
          Aplikace pravidelně ukládá cvičební data na vzdálený server. Aplikace však není určena pro
          současnou práci na více zařízeních, vzhledem k nepravidelnosti synchronizace.
        </p>
      </section>
      <section>
        <h2>Offline</h2>
        <p>
          Ve webové verzi aplikace je pro používání offline nejprve zapotřebí stáhnout veškerá data
          do zařízení. To lze udělat v profily pomocí tlačítka "Stáhnout data".
        </p>
        <p>
          V PWA aplikaci (ke stažení na vyhledávací liště) je již veškerá data stažena a aplikace je
          plně funkční i bez připojení k internetu.
        </p>
        <p>V obou případech se aplikace pokusí synchronizovat data při každém startu.</p>
      </section>
    </div>
  );
}
