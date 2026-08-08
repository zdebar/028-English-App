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
        <p>
          Učení je zde jednoduché jako mobilní hra: stačí stisknout jediné tlačítko a procvičovat.
          Slovíčka i gramatika se vám nabídnou automaticky ve správném pořadí.
        </p>
        <p>
          Každé slovíčko i věta mají audio se správnou výslovností. Vždy opakujte nahlas, ideálně
          několikrát.
        </p>
        <p>
          Aplikace přednostně vybírá procvičování. Buďte trpěliví, k novému se dostanete po
          zopakování rozučeného.
        </p>
        <h3>Stručně:</h3>
        <ul>
          <li>opakujte nahlas slyšené</li>
          <li>procvičujte alespoň 400 položek denně</li>
          <li>procvičovat můžete kdykoli a bez omezení</li>
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
          Umožňuje nainstalovat aplikaci jako PWA na vaše zařízení. Aplikace je plně funkční
          offline.
        </p>
        <h3>Denní cíl</h3>
        <p>Doporučený minimální denní cíl je 10 hvězdiček, tedy 400 procvičených položek.</p>
        <h3>Studovat</h3>
        <p>Společné učení a procvičování slovíček a gramatiky.</p>
        <h3>Výslovnost - položky</h3>
        <p>
          Volitelné procvičování výslovnosti individuálních položek. Lze přidat skrze tlačítko ve
          "Studovat" či "Přehled slovíček".
        </p>
        <p>
          Nemá vliv na pokrok v lekcích. Pokud tedy nějaké slovíčko či větu znáte, ale dělá Vám
          problém výslovnost, je vhodné přidat je sem.
        </p>
        <h3>Výslovnost - skupiny</h3>
        <p>Sdružuje slovíčka s podobnou výslovností např. bad / bed</p>
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
        <p>
          Učební skóre dané položky. Je oddělené skóre pro směr z češtiny do angličiny, a z
          angličtiny do češtiny.
        </p>
        <h3>Denní pokrok</h3>
        <p>Zobrazuje počet dosažených denních hvězdiček a číselný postup na hvězdičce.</p>
        <h3>Nápověda</h3>
        <p>Písmeno po písmenu odhaluje slovíčko či větu.</p>
        <h3>Přidat do výslovnosti</h3>
        <p>Přidá / odebere danou položku do / z "Výslovnost - položky".</p>
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
        <p>
          Pokrok v obou směrech procvičování, z češtiny do angličtiny a z angličtiny do češtiny, se
          zaznamenává samostatně. Můžete tedy např. dokončit položku v jednom směru a dále ji
          procvičovat v druhém.
        </p>
        <h3>Dokončit</h3>
        <p>
          Označí danou položku jako naučenou. Položka se dále nebude nabízet k procvičování v daném
          směru. Stále se nabízí v opačném směru.
        </p>
        <h3>Opakovat</h3>
        <p>Položka se nabídne k dalšímu procvičování dříve v daném směru.</p>
        <h3>Znám</h3>
        <p>Položka se nabídne k dalšímu procvičování později v daném směru.</p>
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
        <h2>Úvod do cvičení bloku</h2>
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
        <p>Přehled započatých tematických bloků slovíček, např. dny v týdnu, měsíce atd.</p>
        <h3>Přehled slovíček</h3>
        <p>Přehled započatých slovíček.</p>
        <h3>Smazat účet</h3>
        <p>
          Vaše údaje budou uchovány po dobu dalších 30 dní. Během této doby lze účet obnovit
          opětovným přihlášením. Po 30 dnech je účet nenávratně smazán.
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
          Vzhledem k méně časté synchronizaco není aplikace vhodná pro současné používání na více
          zařízeních.
        </p>
      </section>
    </div>
  );
}
