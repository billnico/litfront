// "none" is a reserved value meaning "not at a university or college".
// It is always offered by the UI and must be accepted by the backend.
export const NONE_ID = "none";

// Fallback only. The backend is the source of truth (GET /universities);
// this list is used if that request fails and by demo mode.
export const FALLBACK_UNIVERSITIES = [
  { id: "unima", name: "University of Malawi (UNIMA)", short_name: "UNIMA" },
  { id: "must", name: "Malawi University of Science and Technology (MUST)", short_name: "MUST" },
  { id: "luanar", name: "Lilongwe University of Agriculture and Natural Resources (LUANAR)", short_name: "LUANAR" },
  { id: "mzuni", name: "Mzuzu University (MZUNI)", short_name: "MZUNI" },
  { id: "mubas", name: "Malawi University of Business and Applied Sciences (MUBAS)", short_name: "MUBAS" },
  { id: "kuhes", name: "Kamuzu University of Health Sciences (KUHeS)", short_name: "KUHeS" },
  { id: "unilia", name: "University of Livingstonia (UNILIA)", short_name: "UNILIA" },
  { id: "cunima", name: "Catholic University of Malawi (CUNIMA)", short_name: "CUNIMA" },
  { id: "daeyang", name: "Daeyang University", short_name: "Daeyang" },
  { id: "adventist", name: "Malawi Adventist University", short_name: "MAU" },
  { id: "nkhoma", name: "Nkhoma University", short_name: "Nkhoma" },
  { id: "exploits", name: "Exploits University", short_name: "Exploits" },
  { id: "magu", name: "Malawi Assemblies of God University (MAGU)", short_name: "MAGU" },
  { id: "abc", name: "African Bible College", short_name: "ABC" },
  { id: "biu", name: "Blantyre International University", short_name: "BIU" },
  { id: "shareworld", name: "Shareworld Open University", short_name: "Shareworld" },
  { id: "domasi", name: "Domasi College of Education", short_name: "Domasi" },
  { id: "nrc", name: "Natural Resources College", short_name: "NRC" },
  { id: "mca", name: "Malawi College of Accountancy", short_name: "MCA" },
];
