import { createContext, useContext, useMemo, useState } from "react";

const LanguageContext = createContext(null);
const KEY = "agrilens.language";

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try { return localStorage.getItem(KEY) === "rw" ? "rw" : "en"; } catch { return "en"; }
  });
  const setLanguage = (next) => {
    setLanguageState(next);
    try { localStorage.setItem(KEY, next); } catch { /* Language still changes for this visit. */ }
  };
  const value = useMemo(() => ({ language, setLanguage, isRw: language === "rw" }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);

export const COPY = {
  en: {
    homeEyebrow: "NISR Agricultural Household Survey 2024",
    homeTitle: "Better harvest decisions, district by district",
    homeIntro: "Explore what Rwanda’s farmers grow today and what a practical input scenario could mean for the next season.",
    askPrompt: "Ask AgriLens about crops, harvests, water or soil…",
    current: "Current productivity",
    next: "Next season scenario",
    district: "District",
    crop: "Crop",
    usualHarvest: "Survey median harvest",
    scenarioHarvest: "With-input scenario",
    surveyPlots: "survey plots",
    advice: "What farmers can do",
    weatherContext: "Season planning context",
    waterRisk: "Plots report no nearby water",
    irrigation: "Plots irrigated",
    decrease: "Production fell vs previous season",
    noForecast: "The survey has no rainfall forecast. These district water and production indicators are planning context, not a weather prediction.",
    explore: "Explore district",
    askAi: "Ask AgriLens AI",
    assistant: "AgriLens AI",
    assistantIntro: "Ask about farming, crops, harvests, water, soil or storage. I’ll use Rwanda’s 2024 farm survey and ask a few short questions when I need more detail.",
    typeQuestion: "Type your question…",
    send: "Send",
    close: "Close assistant",
    welcome: "Murakaza neza kuri AgriLens AI. Baza ku buhinzi, ibihingwa, umusaruro, amazi, ubutaka cyangwa kubika imyaka.",
    currentLabel: "Iby'umusaruro ubu",
    nextLabel: "Iteganyagihe ry'ibikorwa mu gihembwe gitaha",
    medianLabel: "Umusaruro wo hagati mu bushakashatsi",
    scenarioLabel: "Umusaruro ushoboka hakozwe ibi",
    actionLabel: "Ibyo umuhinzi yakora",
    location: "Ntibashoboye kubona aho uherereye. Hitamo akarere.",
    nextAction: "Next district",
    previousAction: "Previous district",
    selectDistrict: "Select a district",
  },
  rw: {
    homeEyebrow: "Ubushakashatsi bwa NISR ku ngo z’ubuhinzi 2024",
    homeTitle: "Fata ibyemezo byongera umusaruro, akarere ku kandi",
    homeIntro: "Reba ibyo abahinzi bo mu Rwanda bahinga n’icyo gukoresha inyongeramusaruro bishobora kumarira igihembwe gitaha.",
    askPrompt: "Baza AgriLens ku bihingwa, umusaruro, amazi cyangwa ubutaka…",
    current: "Umusaruro ushingiye ku bushakashatsi",
    next: "Iteganyagihe ry'ibikorwa mu gihembwe gitaha",
    district: "Akarere",
    crop: "Igihingwa",
    usualHarvest: "Umusaruro wo hagati mu bushakashatsi",
    scenarioHarvest: "Umusaruro ushoboka hakozwe ibi",
    surveyPlots: "imirima yabajijwe",
    advice: "Ibyo umuhinzi yakora",
    weatherContext: "Amakuru yo gufasha gutegura igihembwe",
    waterRisk: "Imirima ivuga ko nta mazi ayegereye",
    irrigation: "Imirima ivomererwa",
    decrease: "Umusaruro wagabanutse ugereranyije n'igihembwe cyabanje",
    noForecast: "Ubushakashatsi ntibufite iteganyagihe ry'imvura. Aya makuru ku mazi n'umusaruro ni ayo gufasha gutegura, si iteganyagihe.",
    explore: "Reba akarere",
    askAi: "Baza AgriLens AI",
    assistant: "AgriLens AI",
    assistantIntro: "Baza ku buhinzi, ibihingwa, umusaruro, amazi, ubutaka cyangwa kubika imyaka. Nkoresha ubushakashatsi bw’abahinzi bo mu Rwanda bwa 2024; nshobora kukubaza ibibazo bigufi.",
    typeQuestion: "Andika ikibazo…",
    send: "Ohereza",
    close: "Funga umufasha",
    welcome: "Murakaza neza kuri AgriLens AI. Baza ku buhinzi, ibihingwa, umusaruro, amazi, ubutaka cyangwa kubika imyaka.",
    currentLabel: "Iby'umusaruro ubu",
    nextLabel: "Iteganyagihe ry'ibikorwa mu gihembwe gitaha",
    medianLabel: "Umusaruro wo hagati mu bushakashatsi",
    scenarioLabel: "Umusaruro ushoboka hakozwe ibi",
    actionLabel: "Ibyo umuhinzi yakora",
    location: "Ntibashoboye kubona aho uherereye. Hitamo akarere.",
    nextAction: "Akarere gakurikira",
    previousAction: "Akarere kabanje",
    selectDistrict: "Hitamo akarere",
  },
};
