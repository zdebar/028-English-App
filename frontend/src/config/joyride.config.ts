import config from "./config";

export const stepsHome = [
  {
    target: ".joyride-step-1",
    content:
      "Aplikace je zaměřená na intenzivní drill. Bez zbytečného rozptylování. Bez stresu co dělat příště.",
    disableBeacon: true,
  },
  {
    target: ".joyride-step-1",
    content:
      "Zde zobrazené bloky sdružují cvičební prvky (slovíčka či věty) po 100. Jejich jediným cílem je dát zpětnou vazbu Vašemu pokroku.",
    disableBeacon: true,
  },
  {
    target: ".joyride-step-1",
    content: "V pravé části („+“) vidíte, kolik prvků jste se dnes naučili.",
    disableBeacon: true,
  },
  {
    target: ".joyride-step-1",
    content: `Prvek se označí jako naučený po "${config.progress.learnedProgress}" správných odpovědích. To se dá zvládnout během jednoho dne.`,
    disableBeacon: true,
  },
  {
    target: ".joyride-step-1",
    content: `Perfektně zvládnutý prvek bude ale až zhruba po 3 měsících. Poté se již prvek nebude znovu nabízet k procvičování.`,
    disableBeacon: true,
  },
  {
    target: ".joyride-step-2",
    content: "Kde je zapotřebí, otazník ('?') nabízí kontextovou nápovědu.",
    disableBeacon: true,
  },
];

export const stepsPractice = [
  {
    target: ".joyride-step-10",
    content: "Na druhou záložku!",
    disableBeacon: true,
  },
  {
    target: ".joyride-step-11",
    content:
      "Karta s právě cvičeným prvkem. Kliknutím na ni přehrajete výslovnost. Výslovnost je dostupná pouze při směru z angličtiny do češtiny nebo pokud je prvek již odhalen.",
    disableBeacon: true,
  },
  {
    target: ".joyride-step-11",
    content:
      "Učení není rozděleno do lekcí. Jde o jedinou sekvenci prvků a gramatických vět. Není třeba si dělat starosti, co procvičovat příště, aplikace se o správnou posloupnost postará sama.",
    disableBeacon: true,
  },
  {
    target: ".joyride-step-11",
    content:
      "Běžný postup je například 10 zájmen, 10 podstatných jmen, 10 sloves a následné procvičování ve 20 a více větách. Pravidelně se střídá směr z češtiny do angličtiny a naopak.",
    disableBeacon: true,
  },
  {
    target: ".joyride-step-12",
    content: `Pokrok daného prvku. Čím vyšší pokrok, tím méně často se prvek opakuje. Začíná na "0" a končí na "${config.srs.intervals.length}".`,
    disableBeacon: true,
  },
  {
    target: ".joyride-step-13",
    content: `Denní počet opakování / doporučený minimální denní cíl.`,
    disableBeacon: true,
  },
  {
    target: ".joyride-step-14",
    content:
      "Ovládací tlačítka. Jednoduché připomenutí jejich funkce najdete v kontextové nápovědě („?“).",
    disableBeacon: true,
  },
  {
    target: ".joyride-step-15",
    content:
      "Příslušná gramatika potřebná pro danou větu je vždy dostupná přímo u vět.",
    disableBeacon: true,
  },
  {
    target: ".joyride-step-16",
    content: `"Dokončit" označí slovíčko jako perfektně zvládnuté a již se nebude znovu opakovat.`,
    disableBeacon: true,
  },
  {
    target: ".joyride-step-17",
    content: `"Nápověda" odhalí při každém stisknutí další písmeno ze správné odpovědi.`,
    disableBeacon: true,
  },
  {
    target: ".joyride-step-18",
    content: `"Odhalit" odhalí správný překlad.`,
    disableBeacon: true,
  },
  {
    target: ".joyride-step-19",
    content: `Po odhalení prvku se nabízí tlačítka sebehodnocení. Sebehodnocení řídí opakovací algoritmus.`,
    disableBeacon: true,
  },
  {
    target: ".joyride-step-20",
    content: `"Neznám" ubere "${
      config.progress.minusProgress * -1
    }" z pokroku.`,
    disableBeacon: true,
  },
  {
    target: ".joyride-step-21",
    content: `"Znám" ("+") přidá "${config.progress.plusProgress}" k pokroku.`,
    disableBeacon: true,
  },
];

export const stepsProfile = [
  {
    target: ".joyride-step-30",
    content: "Na poslední záložku!",
    disableBeacon: true,
  },
  {
    target: ".joyride-step-31",
    content:
      "Přehledy umožňují prohlédnout a případně vyresetovat pokrok na slovíčkách či gramatice.",
    disableBeacon: true,
  },
  {
    target: ".joyride-step-31",
    content:
      "To je vše. Prozatím je aplikace v testovacím režimu a obsahuje pouze testovací data!",
    disableBeacon: true,
  },
];
