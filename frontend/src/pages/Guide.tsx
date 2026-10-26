import type { JSX } from 'react';
import { Screenshot } from '@/components/UI/Screenshot';

/**
 * Renders the guide page.
 *
 * @returns A JSX element containing the guide page.
 */
export default function Guide(): JSX.Element {
  return (
    <div className="guide card-width mt-8 overflow-x-hidden">
      <h1 className="text-center">Návod</h1>
      <section>
        <h2>Úvod</h2>
        <p>
          Jednoduchá ale kompletní aplikace pro učení angličtiny. Zde v návodu se nachází pouze
          klíčové aspekty aplikace. Vše ostatní lze pochopit prostým projetím aplikace.
        </p>
        <p>
          Prvotní lekce jsou zaměřené na správnou výslovnost. Po úvodním procvičení hlásek v lekcích
          lze, a je doporučeno, procvičovat výslovnost v přehledech.
        </p>
      </section>
      <section>
        <h2>Odhalená kartička</h2>
        <Screenshot
          src={`${import.meta.env.BASE_URL}screenshots/revealed`}
          alt="Ukázka kartičky po odhalení"
        />
        <h3>Opakovat, těžké, dobře, snadné</h3>
        <p>
          Vaše vlastní hodnocení obtížnosti položky. Opakovat je pokud si nedokáže vzpomenout. Těžké
          pokud s obtížemi. Dobře je doporučené výchozí hodnocení. Aplikace dle tohoto hodnocení
          naplánuje další opakování položky.
        </p>
      </section>
      <section>
        <h2>Offline</h2>
        <p>
          Aplikace je plně funkční i offline. Data se ukládají do prohlížeče a následně se
          synchronizují s cloudem.
        </p>
        <p>
          Data se synchronizují při spuštění aplikace či jednou denně. Aplikace tedy není vhodná pro
          současné používání na více zařízeních.
        </p>
      </section>
    </div>
  );
}
