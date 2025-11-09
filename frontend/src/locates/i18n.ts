import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      reset_progress: "Reset Progress",
      loading: "Loading...",
      reset_confirmation_title: "Reset Confirmation",
      reset_confirmation_description:
        "Are you sure you want to reset all progress? This action cannot be undone.",
      reset_success: "Your progress has been successfully reset.",
      reset_error:
        "An error occurred while resetting progress. Please try again later.",
    },
  },
  cs: {
    translation: {
      reset_progress: "Restartovat",
      loading: "Načítání...",
      reset_confirmation_title: "Potvrzení resetu",
      reset_confirmation_description:
        "Opravdu chcete vymazat veškerý progress? Změna již nepůjde vrátit.",
      reset_success: "Váš pokrok byl úspěšně resetován.",
      reset_error:
        "Nastala chyba při resetování pokroku. Zkuste to prosím později.",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "cs",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
