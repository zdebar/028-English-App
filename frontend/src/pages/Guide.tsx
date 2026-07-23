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
        <h2>Úvod</h2>
        <p>Aplikace je určena pro všechny, kteří se chtějí naučit mluvit anglicky.</p>
        <p>
          I pokud nejste úplný začátečník, musíte projít všechny lekce. Jen si tak budete jisti že
          jste se naučili vše potřebné. Můžete ale velice rychle přeskakovat vám známá slovíčka.
        </p>
        <p>
          Je zde jediný cvičební postup, slovíčka i gramatika se vám budou nabízet sama k učení ve
          správném pořadí. Napřed se vždy procvičuje rozučené, a až poté se učí nové.
        </p>
        <h3>Důležité je:</h3>
        <ul>
          <li>opakovat každý den</li>
          <li>snažit se napodobit správnou výslovnost</li>
        </ul>
      </section>
      <section>
        <h2>Domácí stránka</h2>
        <Screenshot
          src={`${import.meta.env.BASE_URL}screenshots/mobile`}
          alt="Domácí stránka aplikace"
        />
        <h3>Nainstalovat aplikaci</h3>
        <p>
          Umožňuje nainstalovat PWA aplikaci na vaše zařízení. Aplikace je plně funkční offline.
        </p>
        <h3>Denní cíl</h3>
        <p>Doporučený minimální denní cíl je 10 hvězdiček, tedy 400 procvičovaných položek.</p>
        <h3>Procvičovat</h3>
        <p>Společné učení a procvičování slovíček a gramatiky.</p>
        <h3>Přehled lekcí</h3>
        <p>Přehled dnes dotčených lekcí. Lze přepínat mezi rozučenými a naučenými položkami.</p>
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
        <h3>Zkratky položek</h3>
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
        <h2>Úvod cvičení bloku</h2>
        <Screenshot
          src={`${import.meta.env.BASE_URL}screenshots/intro`}
          alt="Ukázka kartičky s úvodem bloku"
        />
        <p>
          Některé položky jsou sdruženy do tematických bloků. Bez dokončení celého bloku vás
          aplikace nepustí dále.
        </p>
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
          cloudem.
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
