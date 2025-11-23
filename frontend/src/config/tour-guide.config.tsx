import config from "./config";
import { type TourStep } from "@/hooks/use-tour-guide";

export const tour: TourStep[] = [
  {
    id: 0,
    target: ".tour-step-1",
    content: "Učení cizích jazyků není složité.",
  },
  {
    id: 1,
    target: ".tour-step-1",
    content: "Vše je otázkou dostatečného množství opakování.",
  },
  {
    id: 2,
    target: ".tour-step-1",
    content: "Tato aplikace maximalizuje denní počet opakování.",
  },
  {
    id: 3,
    target: ".tour-step-1",
    content: "Soustředí se pouze na nejlepší metodu: memorizační kartičky.",
  },
  {
    id: 4,
    target: ".tour-step-1",
    content: "Učení probíhá v jediné plynulé sekvenci.",
  },
  {
    id: 5,
    target: ".tour-step-1",
    content:
      "Napřed vždy několik slovíček a poté jednoduchý gramatický princip procvičovaný ve větách.",
  },
  {
    id: 6,
    target: ".tour-step-1",
    content:
      "Dle Vašeho sebehodnocení znalosti algoritmus zvolí příští dobu opakování.",
  },
  {
    id: 7,
    target: ".tour-step-1",
    content:
      "Není třeba se stresovat zda něco umíte lépe či hůře. Ohodnoťte pravdivě svou znalost a aplikace se o vše postará.",
  },
  {
    id: 8,
    target: ".tour-step-1",
    content:
      "Rychlým tempem lze během 20 minut procvičit až 400 slovíček či vět.",
  },
  {
    id: 9,
    target: ".tour-step-1",
    content:
      "Můžete ale cvičit i třeba 10 hodin denně. Vždy je připraven další prvek k procvičování.",
  },
  {
    id: 10,
    target: ".tour-step-1",
    content: "Teď už ale k vysvětlení...",
  },
  {
    id: 11,
    target: ".tour-step-1",
    content:
      "Zde zobrazené bloky sdružují cvičební prvky (slovíčka či věty) po 100.",
  },
  {
    id: 12,
    target: ".tour-step-1",
    content: "Jejich jediným cílem je dát zpětnou vazbu Vašemu pokroku.",
  },
  {
    id: 13,
    target: ".tour-step-1",
    content: "V pravé části („+“) vidíte, kolik prvků jste se dnes naučili.",
  },
  {
    id: 14,
    target: ".tour-step-1",
    content: `Prvek se označí jako naučený po "${config.progress.learnedProgress}" správných odpovědích.`,
  },
  {
    id: 15,
    target: ".tour-step-1",
    content: `Opakovací algoritmus vrací slovíčka k opakování velice rychle. Napřed hned, poté po minutách, pak hodinách, dnech a nakonec týdnech.`,
  },
  {
    id: 16,
    target: ".tour-step-1",
    content: `Pokud budete cvičit několikrát denně, lze zvládnout naučení slovíčka již během prvního dne.`,
  },
  {
    id: 17,
    target: ".tour-step-1",
    content: `Perfektně zvládnutý prvek bude ale až zhruba po 3 měsících.`,
  },
  {
    id: 18,
    target: ".tour-step-1",
    content: `Poté se již prvek nebude znovu nabízet k procvičování.`,
  },
  {
    id: 19,
    target: ".tour-step-2",
    content: "Kde je zapotřebí, otazník ('?') nabízí kontextovou nápovědu.",
    onNextNavigateTo: "/practice",
  },
  {
    id: 20,
    target: ".tour-step-10",
    content: "Na záložku procvičování!",
    onPreviousNavigateTo: "/",
  },
  {
    id: 21,
    target: ".tour-step-11",
    content:
      "Karta s právě cvičeným prvkem. Kliknutím na ni přehrajete výslovnost. Výslovnost je dostupná pouze při směru z angličtiny do češtiny nebo pokud je prvek již odhalen.",
  },
  {
    id: 22,
    target: ".tour-step-11",
    content:
      "Učení není rozděleno do lekcí. Jde o jedinou sekvenci prvků a gramatických vět. Není třeba si dělat starosti, co procvičovat příště, aplikace se o správnou posloupnost postará sama.",
  },
  {
    id: 23,
    target: ".tour-step-11",
    content:
      "Běžný postup je například 20 podstatných jmen, 10 sloves a následné procvičování ve 20 a více větách. Pravidelně se střídá směr z češtiny do angličtiny a naopak.",
  },
  {
    id: 24,
    target: ".tour-step-12",
    content: `Pokrok daného prvku. Čím vyšší pokrok, tím méně často se prvek opakuje. Začíná na "0" a končí na "${config.srs.intervals.length}".`,
  },
  {
    id: 25,
    target: ".tour-step-13",
    content: (
      <>
        <p>Denní počet opakování</p>
        <p>Doporučený denní cíl.</p>
      </>
    ),
  },
  {
    id: 26,
    target: ".tour-step-14",
    content:
      "Ovládací tlačítka. Jednoduché připomenutí jejich funkce najdete v kontextové nápovědě („?“).",
  },
  {
    id: 27,
    target: ".tour-step-15",
    content:
      "Příslušná gramatika potřebná pro danou větu je vždy dostupná přímo u vět.",
  },
  {
    id: 28,
    target: ".tour-step-16",
    content: `"Dokončit" označí slovíčko jako perfektně zvládnuté a již se nebude znovu opakovat.`,
  },
  {
    id: 29,
    target: ".tour-step-17",
    content: `"Nápověda" odhalí při každém stisknutí další písmeno ze správné odpovědi.`,
  },
  {
    id: 30,
    target: ".tour-step-18",
    content: `"Odhalit" odhalí správný překlad.`,
  },
  {
    id: 31,
    target: ".tour-step-19",
    content: `Po odhalení prvku se nabízí tlačítka sebehodnocení. Sebehodnocení řídí opakovací algoritmus.`,
  },
  {
    id: 32,
    target: ".tour-step-20",
    content: `"Neznám" ubere "${
      config.progress.minusProgress * -1
    }" z pokroku.`,
  },
  {
    id: 33,
    target: ".tour-step-21",
    content: `"Znám" přidá "${config.progress.plusProgress}" k pokroku.`,
    onNextNavigateTo: "/profile",
  },
  {
    id: 34,
    target: ".tour-step-30",
    content: "Na záložku profilu!",
    onPreviousNavigateTo: "/practice",
  },
  {
    id: 35,
    target: ".tour-step-31",
    content:
      "Přehledy umožňují prohlédnout a případně vyresetovat pokrok na slovíčkách či gramatice.",
  },
  {
    id: 36,
    target: ".tour-step-31",
    content:
      "To je vše. Prozatím je aplikace v testovacím režimu a obsahuje pouze testovací data!",
    onNextNavigateTo: "/",
  },
];
