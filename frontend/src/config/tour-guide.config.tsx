import config from "./config";
import { type TourStep } from "@/features/tour/use-tour-guide";

export const tour: TourStep[] = [
  {
    target: ".tour-step-1",
    content:
      "Učení cizích jazyků je především otázkou množství opakování. Během učební hodiny řeknete asi tak 5 anglických vět, v této aplikaci jich zastejnou dobu procvičíte až 900. Teď ale již k vysvětlení ..",
  },
  {
    target: ".tour-step-1",
    content:
      "Zde zobrazené bloky sdružují cvičební prvky (slovíčka či věty) po 100. Jejich jediným cílem je dát zpětnou vazbu Vašemu pokroku.",
  },
  {
    target: ".tour-step-1",
    content: `V pravé části („+“) vidíte, kolik prvků jste se dnes naučili. Prvek se označí jako naučený po "${config.progress.learnedProgress}" správných odpovědích.`,
  },
  {
    target: ".tour-step-1",
    content: `Opakovací algoritmus vrací slovíčka k opakování velice rychle. Napřed hned, poté po minutách, pak hodinách, dnech a nakonec týdnech. Pokud budete cvičit několikrát denně, lze zvládnout naučení slovíčka již během prvního dne.`,
  },
  {
    target: ".tour-step-1",
    content: `Perfektně zvládnutý prvek bude ale až zhruba po 3 měsících. Poté se již prvek nebude znovu nabízet k procvičování.`,
  },
  {
    target: ".tour-step-2",
    content: "Kde je zapotřebí, otazník ('?') nabízí kontextovou nápovědu.",
    onNextNavigateTo: "/practice",
  },
  {
    target: ".tour-step-10",
    content: "Na záložku procvičování!",
    onPreviousNavigateTo: "/",
  },
  {
    target: ".tour-step-11",
    content:
      "Karta s právě cvičeným prvkem. Kliknutím na ni přehrajete výslovnost. Výslovnost je dostupná pouze při směru z angličtiny do češtiny nebo pokud je prvek již odhalen.",
  },
  {
    target: ".tour-step-11",
    content:
      "Učení není rozděleno do lekcí. Jde o jedinou sekvenci prvků a gramatických vět. Není třeba si dělat starosti, co procvičovat příště, aplikace se o správnou posloupnost postará sama.",
  },
  {
    target: ".tour-step-11",
    content:
      "Běžný postup je například 20 podstatných jmen, 10 sloves a následné procvičování ve 20 a více větách. Pravidelně se střídá směr z češtiny do angličtiny a naopak.",
  },
  {
    target: ".tour-step-12",
    content: `Pokrok daného prvku. Čím vyšší pokrok, tím méně často se prvek opakuje. Začíná na "0" a končí na "${config.srs.intervals.length}".`,
  },
  {
    target: ".tour-step-13",
    content: (
      <>
        <p>Denní počet opakování</p>
        <p>Doporučený denní cíl.</p>
      </>
    ),
  },
  {
    target: ".tour-step-14",
    content:
      "Ovládací tlačítka. Jednoduché připomenutí jejich funkce najdete v kontextové nápovědě („?“).",
  },
  {
    target: ".tour-step-15",
    content:
      "Příslušná gramatika potřebná pro danou větu je vždy dostupná přímo u vět.",
  },
  {
    target: ".tour-step-16",
    content: `"Dokončit" označí slovíčko jako perfektně zvládnuté a již se nebude znovu opakovat.`,
  },
  {
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
    target: ".tour-step-31",
    content:
      "Přehledy umožňují prohlédnout a případně vyresetovat pokrok na slovíčkách či gramatice.",
  },
  {
    target: ".tour-step-31",
    content:
      "To je vše. Prozatím je aplikace v testovacím režimu a obsahuje pouze testovací data!",
    onNextNavigateTo: "/",
  },
];
