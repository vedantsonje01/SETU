/* Lightweight multilingual strings — EN / HI / MR.
   Operator-facing labels only; case data stays as captured. */

export type Lang = "EN" | "HI" | "MR";
export const LANGS: Lang[] = ["EN", "HI", "MR"];
export const LANG_LABEL: Record<Lang, string> = { EN: "English", HI: "हिंदी", MR: "मराठी" };

type Dict = Record<string, Record<Lang, string>>;

export const STR: Dict = {
  appName: { EN: "Kumbh Setu", HI: "कुंभ सेतु", MR: "कुंभ सेतू" },
  online: { EN: "Online", HI: "ऑनलाइन", MR: "ऑनलाइन" },
  offline: { EN: "Offline", HI: "ऑफ़लाइन", MR: "ऑफलाइन" },
  pending: { EN: "open", HI: "लंबित", MR: "प्रलंबित" },

  who: { EN: "Who are you helping?", HI: "आप किसकी मदद कर रहे हैं?", MR: "तुम्ही कोणाला मदत करत आहात?" },
  found: { EN: "Missing person brought in", HI: "लापता व्यक्ति लाया गया", MR: "हरवलेली व्यक्ती आणली" },
  foundSub: { EN: "Register a person and search for their family", HI: "व्यक्ति दर्ज करें और परिवार खोजें", MR: "व्यक्ती नोंदवा आणि कुटुंब शोधा" },
  family: { EN: "Family reporting someone missing", HI: "परिवार किसी के गुम होने की सूचना दे रहा है", MR: "कुटुंब हरवल्याची तक्रार करत आहे" },
  familySub: { EN: "Take details and search all centers", HI: "विवरण लें और सभी केंद्र खोजें", MR: "तपशील घ्या आणि सर्व केंद्रे शोधा" },
  tokenLookup: { EN: "Check a token", HI: "टोकन जांचें", MR: "टोकन तपासा" },
  tokenSub: { EN: "Look up case status by 6-digit token", HI: "6-अंकीय टोकन से स्थिति देखें", MR: "6-अंकी टोकनने स्थिती पहा" },
  dashboard: { EN: "Case dashboard", HI: "केस डैशबोर्ड", MR: "केस डॅशबोर्ड" },
  dashboardSub: { EN: "Open cases, aging & escalation", HI: "खुले केस, पुराने व आगे बढ़ाना", MR: "खुली प्रकरणे, जुनी व पुढे पाठवणे" },
  smartSearch: { EN: "Smart search", HI: "स्मार्ट खोज", MR: "स्मार्ट शोध" },
  smartSearchSub: { EN: "Find similar records by description, ranked by %", HI: "विवरण से समान रिकॉर्ड खोजें, % से क्रमबद्ध", MR: "वर्णनावरून समान नोंदी शोधा, % नुसार" },
  band: { EN: "Safety band (QR)", HI: "सुरक्षा बैंड (QR)", MR: "सुरक्षा बँड (QR)" },
  bandSub: { EN: "Scan a child / elder safety band QR", HI: "बच्चे / बुज़ुर्ग सुरक्षा बैंड QR स्कैन करें", MR: "मूल / ज्येष्ठ सुरक्षा बँड QR स्कॅन करा" },

  back: { EN: "Back", HI: "वापस", MR: "मागे" },
  findMatch: { EN: "Find match", HI: "मिलान खोजें", MR: "जुळणी शोधा" },
  search: { EN: "Search all centers", HI: "सभी केंद्र खोजें", MR: "सर्व केंद्रे शोधा" },
};

export function t(key: keyof typeof STR, lang: Lang): string {
  return STR[key]?.[lang] ?? STR[key]?.EN ?? String(key);
}
