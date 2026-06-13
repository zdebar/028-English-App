import type { JSX } from 'react';
import { Screenshot } from '@/components/UI/Screenshot';


/**
 * A React component that renders the Grammar overview page.
 *
 * @returns A JSX element containing the GrammarOverview component.
 */
export default function Guide(): JSX.Element {
  return (
    <div className="guide card-width overflow-x-hidden">
      <h1 className="text-center">Návod</h1>
      <section>
        <p className="text-center">
          Tato učební aplikace je zaměřena na dril, na velké množství naposlouchaných a vyslovených
          opakování.
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
        <h2>Doporučujeme</h2>
        <ul className="text-left">
          <li>každé slovíčko či větu nahlas zopakovat</li>
          <li>preferovat "Opakovat" před "Znám", pokud není znalost zcela automatické</li>
          <li>procvičit každý den min. 400 opakování tedy 10 hvězdiček</li>
        </ul>
      </section>

      <section>
        <h2>Neodhalená kartička</h2>
        <Screenshot src="/screenshots/not-revealed" alt="Ukázka kartičky před odhalením" />
        <p>
          <strong>"Denní pokrok"</strong>
          <span>10 bronzových hvězd po 40 opakováních je doporučené minimální procvičování.</span>
        </p>
        <p>
          <strong>"Dokončit"</strong>
          <span>
            Položka se označí jako naučená. Použijte k přeskočení položky, pokud ji již znáte z
            dřívějška.
          </span>
        </p>
        <p>
          <strong>"Gramatika"</strong>
          <span>Vysvětlení příslušné gramatiky.</span>
        </p>
      </section>
      <section>
        <h2>Odhalená kartička</h2>
        <Screenshot src="/screenshots/revealed" alt="Ukázka kartičky po odhalení" />
        <p>
          <strong>"Opakovat"</strong>
          <span>Položka se nabídne k dalšímu procvičování dříve.</span>
        </p>
        <p>
          <strong>"Znám"</strong>
          <span>Položka se nabídne k dalšímu procvičování později.</span>
        </p>
        <p>
          <strong>"Poznámka"</strong>
          <span>
            Některé položky mají poznámku, která podrobněji vysvětluje použití daného slovíčka v
            angličtině.
          </span>
        </p>
      </section>
      <section>
        <h2>Profil</h2>
        <Screenshot src="/screenshots/profile" alt="Ukázka profilu uživatele" />
        <p>
          <strong>"Přehled CEFR úrovní"</strong>
          <span>Přehled postupu na jednotlivých CEFR úrovních a na jednotlivých lekcích.</span>
        </p>
        <p>
          <strong>"Přehled gramatiky"</strong>
          <span>
            Přehled již započaté gramatiky umožňuje restartovat procvičování vět příslušných k dané
            gramatice.
          </span>
        </p>
        <p>
          <strong>"Přehled slovíček"</strong>
          <span>
            Přehled započatých slovíček umožňuje restartovat procvičování každého slovíčka.
          </span>
        </p>
        <p>
          <strong>"Přehled témat"</strong>
          <span>Přehled započatých tematických skupin slovíček např. dny v týdnu, měsíce atd.</span>
        </p>
        <p>
          <strong>"Smazat účet"</strong>
          <span>
            Smaže uživatelský účet včetně všech vašich dat. Smazání účtu nevratné a data budou
            nenávratně odstraněna.
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
          Aplikace je plně funkční offline. Data se ukládají do prohlížeče a synchronizují se s
          cloudem, když jste online.
        </p>
      </section>
      <section>
        <h2>Synchronizace</h2>
        <p className="text-center">
          Data se synchronizují pouze při startu aplikace, či jednou denně, pokud aplikaci necháváte
          otevřenou. Vzhledem k méně častému synchronizování není aplikace vhodná pro současné
          používání na více zařízeních.
        </p>
      </section>
    </div>
  );
}
