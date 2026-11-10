import type { JSX } from 'react';

/**
 * Renders the guide page.
 *
 * @returns A JSX element containing the guide page.
 */
export default function Guide(): JSX.Element {
  return (
    <div className="guide card-width overflow-x-hidden landscape:mt-8">
      <h1 className="text-center">Návod</h1>
      <section>
        <h2>Úvod</h2>
        <p>
          Jednoduchá ale kompletní aplikace pro učení angličtiny. Zde v návodu se nachází pouze
          klíčové aspekty aplikace. Vše ostatní lze pochopit prostým prozkoumáním aplikace.
        </p>
        <p>
          Prvotní lekce jsou zaměřené na správnou výslovnost. Po úvodním procvičení hlásek v lekcích
          lze, a je doporučeno, procvičovat výslovnost v Cvičení výslovnosti.
        </p>
      </section>
      <section>
        <h2>Odhalená kartička</h2>
        <h3>Opakovat, znám, snadné</h3>
        <p>
          Po odhalení vyberte, jak jste si vedli. Opakovat sníží postup o jeden krok, Znám jej
          posune o jeden krok a Snadné o čtyři kroky. Aplikace podle postupu naplánuje další
          opakování.
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
