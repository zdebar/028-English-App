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
          Jednoduchá aplikace pro učení angličtiny, ve které nemusíte přemýšlet, co dál. Slovíčka i
          gramatika se vám automaticky nabídnou ve správném pořadí.
        </p>
        <p>
          Aplikace nejprve nabízí procvičování. Buďte proto trpěliví, k novým položkám se dostanete
          až po zopakování těch rozpracovaných.
        </p>
        <p>
          Každé slovíčko i věta jsou doplněny audiem se správnou výslovností. Vždy je opakujte
          nahlas, ideálně několikrát.
        </p>
        <h3>Doporučení</h3>
        <ul>
          <li>Slyšené výrazy vždy několikrát zopakujte nahlas.</li>
          <li>Každý den přidejte alespoň 48 nových položek.</li>
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
          Tato možnost vám umožní nainstalovat aplikaci jako PWA na vaše zařízení, kde pak bude plně
          funkční i offline.
        </p>
        <h3>Nové</h3>
        <p>Umožňuje učit se nový blok slovíček v obou směrech, a to v pevném i náhodném pořadí.</p>
        <h3>Opakování</h3>
        <p>Slouží k procvičování již započatých položek a podle výsledku upravuje jejich pokrok.</p>
        <h3>Přehled lekcí</h3>
        <p>Zobrazuje přehled lekcí, kterým jste se dnes věnovali.</p>
      </section>
      <section>
        <h2>Neodhalená kartička</h2>
        <Screenshot
          src={`${import.meta.env.BASE_URL}screenshots/not-revealed`}
          alt="Ukázka kartičky před odhalením"
        />
        <h3>Nápověda</h3>
        <p>Postupně odhaluje slovíčko či větu písmeno po písmenu.</p>
        <h3>Gramatika</h3>
        <p>Zobrazí vysvětlení gramatiky, která se k dané položce vztahuje.</p>
        <h3>Poznámka</h3>
        <p>Zobrazí další informace, které se k dané položce vztahují.</p>
      </section>
      <section>
        <h2>Odhalená kartička</h2>
        <Screenshot
          src={`${import.meta.env.BASE_URL}screenshots/revealed`}
          alt="Ukázka kartičky po odhalení"
        />
        <h3>Dokončit</h3>
        <p>Označí danou položku jako naučenou, takže se už nebude nabízet k procvičování.</p>
        <h3>Opakovat</h3>
        <p>Položka se v daném směru nabídne k dalšímu procvičování dříve.</p>
        <h3>Znám</h3>
        <p>Položka se v daném směru nabídne k dalšímu procvičování později.</p>
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
        <h2>Offline</h2>
        <p>
          Aplikace je plně funkční i offline. Data se ukládají do prohlížeče a následně se
          synchronizují s cloudem.
        </p>
      </section>
      <section>
        <h2>Synchronizace</h2>
        <p>
          Data se synchronizují při spuštění aplikace. Pokud ji necháváte otevřenou, proběhne
          synchronizace nejvýše jednou denně.
        </p>
        <p>
          Protože synchronizace neprobíhá často, není aplikace vhodná pro současné používání na více
          zařízeních.
        </p>
      </section>
    </div>
  );
}
