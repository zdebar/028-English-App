import type { JSX } from 'react';
import { Screenshot } from '@/components/UI/Screenshot';

/**
 * Renders the guide page.
 *
 * @returns A JSX element containing the guide page.
 */
export default function Guide(): JSX.Element {


  return (
    <div className="guide card-width overflow-x-hidden">
      <h1 className="text-center">Návod</h1>
      <section>
        <h2>Představení</h2>
        <p>
          Aplikace stojí na velkém množství naposlouchaných a nahlas zopakovaných položek. Není
          třeba přemýšlet, co dělat dál. Aplikace sama volí procvičování i učení nového.
        </p>
      </section>
      <section>
        <h2>Domácí stránka</h2>
        <Screenshot
          src={`${import.meta.env.BASE_URL}screenshots/mobile`}
          alt="Domácí stránka aplikace"
        />
        <h3>Nainstalovat aplikaci</h3>
        <p>
          Umožňuje nainstalovat aplikaci na plochu vašeho zařízení. Aplikace je plně funkční
          offline.
        </p>
        <h3>Denní cíl</h3>
        <p>Doporučený minimální denní cíl je 10 hvězdiček, tedy 400 procvičovaných položek.</p>
        <h3>Slovíčka</h3>
        <p>Základní učení a procvičování slovíček. Tlačítko je vždy k dispozici.</p>
        <h3>Nová gramatika</h3>
        <p>
          Základní učení a procvičování nové gramatiky. Tlačítko je k dispozici po rozučení všech
          slovíček z dané lekce.
        </p>
        <h3>Gramatika</h3>
        <p>
          Následné procvičování rozučené gramatiky. Tlačítko je k dispozici, pokud je co
          procvičovat.
        </p>
        <h3>Přehled lekcí</h3>
        <p>
          Přehled dnes dotčených lekcí. Lze přepínat mezi rozučenými a naučenými položkami.
          Naučené jsou zhruba po 3 měsících.
        </p>
      </section>
      <section>
        <h2>Neodhalená kartička</h2>
        <Screenshot
          src={`${import.meta.env.BASE_URL}screenshots/not-revealed`}
          alt="Ukázka kartičky před odhalením"
        />
        <h3>Pokrok</h3>
        <p>Učební skóre dané položky.</p>
        <h3>Denní pokrok</h3>
        <p>Zobrazuje počet dosažených denních hvězdiček a číselný postup na hvězdičce.</p>
        <h3>Nápověda</h3>
        <p>Písmeno po písmeně odhaluje slovíčko či větu.</p>
        <h3>Gramatika</h3>
        <p>Zobrazí vysvětlení příslušné gramatiky.</p>
        <h3>Poznámka</h3>
        <p>Zobrazí dodatečné informace k položce.</p>
      </section>
      <section>
        <h2>Odhalená kartička</h2>
        <Screenshot
          src={`${import.meta.env.BASE_URL}screenshots/revealed`}
          alt="Ukázka kartičky po odhalení"
        />
        <h3>Dokončit</h3>
        <p>Označí danou položku jako naučenou. Položka se dále nebude nabízet k procvičování.</p>
        <h3>Opakovat</h3>
        <p>Položka se nabídne k dalšímu procvičování dříve.</p>
        <h3>Znám</h3>
        <p>Položka se nabídne k dalšímu procvičování později.</p>
        <h3>Zkratky</h3>
        <p>
          <span className="inline-block w-20">zkr.</span>zkrácená varianta
        </p>
        <p>
          <span className="inline-block w-20">sg.</span>jednotné číslo
        </p>
        <p>
          <span className="inline-block w-20">pl.</span>množné číslo
        </p>
      </section>
      <section>
        <h2>Doporučujeme</h2>
        <ul className="text-left">
          <li>Každé slovíčko či větu nahlas zopakovat</li>
          <li>Preferovat "Opakovat" před "Znám", pokud ještě není znalost zcela automatická</li>
          <li>Procvičit každý den min. 400 opakování, tedy 10 hvězdiček</li>
        </ul>
      </section>
      <section>
        <h2>Profil</h2>
        <Screenshot
          src={`${import.meta.env.BASE_URL}screenshots/profile`}
          alt="Ukázka profilu uživatele"
        />
        <h3>Přehled CEFR úrovní</h3>
        <p>Přehled postupu na jednotlivých CEFR úrovních a na jednotlivých lekcích.</p>
        <h3>Přehled gramatiky</h3>
        <p>Přehled započaté gramatiky.</p>
        <h3>Přehled témat</h3>
        <p>Přehled započatých tematických skupin slovíček, např. dny v týdnu, měsíce atd.</p>
        <h3>Přehled slovíček</h3>
        <p>Přehled započatých slovíček.</p>
        <h3>Smazat účet</h3>
        <p>
          Vaše údaje budou uchovány dalších 30 dní. Během této doby lze účet obnovit opětovným
          přihlášením. Po 30 dnech je účet nenávratně smazán.
        </p>
        <h3>Odhlásit se</h3>
        <p>Odhlásí vás z vašeho uživatelského účtu.</p>
      </section>
      <section>
        <h2>Offline</h2>
        <p>
          Aplikace je plně funkční offline. Data se ukládají do prohlížeče a synchronizují se s
          cloudem, když jste online.
        </p>
      </section>
      <section>
        <h2>Synchronizace</h2>
        <p>
          Data se synchronizují pouze při startu aplikace či jednou denně, pokud aplikaci necháváte
          otevřenou.
        </p>
        <p>
          Vzhledem k méně častému synchronizování není aplikace vhodná pro současné používání na
          více zařízeních.
        </p>
      </section>
    </div>
  );
}
