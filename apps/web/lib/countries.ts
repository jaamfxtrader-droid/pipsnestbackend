const countryDialCodes = [
  { code: "AF", dialCode: "+93" },
  { code: "AX", dialCode: "+358 18" },
  { code: "AL", dialCode: "+355" },
  { code: "DZ", dialCode: "+213" },
  { code: "AS", dialCode: "+1 684" },
  { code: "AD", dialCode: "+376" },
  { code: "AO", dialCode: "+244" },
  { code: "AI", dialCode: "+1 264" },
  { code: "AQ", dialCode: "+672" },
  { code: "AG", dialCode: "+1 268" },
  { code: "AR", dialCode: "+54" },
  { code: "AM", dialCode: "+374" },
  { code: "AW", dialCode: "+297" },
  { code: "AU", dialCode: "+61" },
  { code: "AT", dialCode: "+43" },
  { code: "AZ", dialCode: "+994" },
  { code: "BS", dialCode: "+1 242" },
  { code: "BH", dialCode: "+973" },
  { code: "BD", dialCode: "+880" },
  { code: "BB", dialCode: "+1 246" },
  { code: "BY", dialCode: "+375" },
  { code: "BE", dialCode: "+32" },
  { code: "BZ", dialCode: "+501" },
  { code: "BJ", dialCode: "+229" },
  { code: "BM", dialCode: "+1 441" },
  { code: "BT", dialCode: "+975" },
  { code: "BO", dialCode: "+591" },
  { code: "BQ", dialCode: "+599" },
  { code: "BA", dialCode: "+387" },
  { code: "BW", dialCode: "+267" },
  { code: "BR", dialCode: "+55" },
  { code: "IO", dialCode: "+246" },
  { code: "BN", dialCode: "+673" },
  { code: "BG", dialCode: "+359" },
  { code: "BF", dialCode: "+226" },
  { code: "BI", dialCode: "+257" },
  { code: "CV", dialCode: "+238" },
  { code: "KH", dialCode: "+855" },
  { code: "CM", dialCode: "+237" },
  { code: "CA", dialCode: "+1" },
  { code: "KY", dialCode: "+1 345" },
  { code: "CF", dialCode: "+236" },
  { code: "TD", dialCode: "+235" },
  { code: "CL", dialCode: "+56" },
  { code: "CN", dialCode: "+86" },
  { code: "CX", dialCode: "+61" },
  { code: "CC", dialCode: "+61" },
  { code: "CO", dialCode: "+57" },
  { code: "KM", dialCode: "+269" },
  { code: "CG", dialCode: "+242" },
  { code: "CD", dialCode: "+243" },
  { code: "CK", dialCode: "+682" },
  { code: "CR", dialCode: "+506" },
  { code: "CI", dialCode: "+225" },
  { code: "HR", dialCode: "+385" },
  { code: "CU", dialCode: "+53" },
  { code: "CW", dialCode: "+599" },
  { code: "CY", dialCode: "+357" },
  { code: "CZ", dialCode: "+420" },
  { code: "DK", dialCode: "+45" },
  { code: "DJ", dialCode: "+253" },
  { code: "DM", dialCode: "+1 767" },
  { code: "DO", dialCode: "+1 809" },
  { code: "EC", dialCode: "+593" },
  { code: "EG", dialCode: "+20" },
  { code: "SV", dialCode: "+503" },
  { code: "GQ", dialCode: "+240" },
  { code: "ER", dialCode: "+291" },
  { code: "EE", dialCode: "+372" },
  { code: "SZ", dialCode: "+268" },
  { code: "ET", dialCode: "+251" },
  { code: "FK", dialCode: "+500" },
  { code: "FO", dialCode: "+298" },
  { code: "FJ", dialCode: "+679" },
  { code: "FI", dialCode: "+358" },
  { code: "FR", dialCode: "+33" },
  { code: "GF", dialCode: "+594" },
  { code: "PF", dialCode: "+689" },
  { code: "GA", dialCode: "+241" },
  { code: "GM", dialCode: "+220" },
  { code: "GE", dialCode: "+995" },
  { code: "DE", dialCode: "+49" },
  { code: "GH", dialCode: "+233" },
  { code: "GI", dialCode: "+350" },
  { code: "GR", dialCode: "+30" },
  { code: "GL", dialCode: "+299" },
  { code: "GD", dialCode: "+1 473" },
  { code: "GP", dialCode: "+590" },
  { code: "GU", dialCode: "+1 671" },
  { code: "GT", dialCode: "+502" },
  { code: "GG", dialCode: "+44 1481" },
  { code: "GN", dialCode: "+224" },
  { code: "GW", dialCode: "+245" },
  { code: "GY", dialCode: "+592" },
  { code: "HT", dialCode: "+509" },
  { code: "HN", dialCode: "+504" },
  { code: "HK", dialCode: "+852" },
  { code: "HU", dialCode: "+36" },
  { code: "IS", dialCode: "+354" },
  { code: "IN", dialCode: "+91" },
  { code: "ID", dialCode: "+62" },
  { code: "IR", dialCode: "+98" },
  { code: "IQ", dialCode: "+964" },
  { code: "IE", dialCode: "+353" },
  { code: "IM", dialCode: "+44 1624" },
  { code: "IL", dialCode: "+972" },
  { code: "IT", dialCode: "+39" },
  { code: "JM", dialCode: "+1 876" },
  { code: "JP", dialCode: "+81" },
  { code: "JE", dialCode: "+44 1534" },
  { code: "JO", dialCode: "+962" },
  { code: "KZ", dialCode: "+7" },
  { code: "KE", dialCode: "+254" },
  { code: "KI", dialCode: "+686" },
  { code: "KP", dialCode: "+850" },
  { code: "KR", dialCode: "+82" },
  { code: "KW", dialCode: "+965" },
  { code: "KG", dialCode: "+996" },
  { code: "LA", dialCode: "+856" },
  { code: "LV", dialCode: "+371" },
  { code: "LB", dialCode: "+961" },
  { code: "LS", dialCode: "+266" },
  { code: "LR", dialCode: "+231" },
  { code: "LY", dialCode: "+218" },
  { code: "LI", dialCode: "+423" },
  { code: "LT", dialCode: "+370" },
  { code: "LU", dialCode: "+352" },
  { code: "MO", dialCode: "+853" },
  { code: "MG", dialCode: "+261" },
  { code: "MW", dialCode: "+265" },
  { code: "MY", dialCode: "+60" },
  { code: "MV", dialCode: "+960" },
  { code: "ML", dialCode: "+223" },
  { code: "MT", dialCode: "+356" },
  { code: "MH", dialCode: "+692" },
  { code: "MQ", dialCode: "+596" },
  { code: "MR", dialCode: "+222" },
  { code: "MU", dialCode: "+230" },
  { code: "YT", dialCode: "+262" },
  { code: "MX", dialCode: "+52" },
  { code: "FM", dialCode: "+691" },
  { code: "MD", dialCode: "+373" },
  { code: "MC", dialCode: "+377" },
  { code: "MN", dialCode: "+976" },
  { code: "ME", dialCode: "+382" },
  { code: "MS", dialCode: "+1 664" },
  { code: "MA", dialCode: "+212" },
  { code: "MZ", dialCode: "+258" },
  { code: "MM", dialCode: "+95" },
  { code: "NA", dialCode: "+264" },
  { code: "NR", dialCode: "+674" },
  { code: "NP", dialCode: "+977" },
  { code: "NL", dialCode: "+31" },
  { code: "NC", dialCode: "+687" },
  { code: "NZ", dialCode: "+64" },
  { code: "NI", dialCode: "+505" },
  { code: "NE", dialCode: "+227" },
  { code: "NG", dialCode: "+234" },
  { code: "NU", dialCode: "+683" },
  { code: "NF", dialCode: "+672" },
  { code: "MK", dialCode: "+389" },
  { code: "MP", dialCode: "+1 670" },
  { code: "NO", dialCode: "+47" },
  { code: "OM", dialCode: "+968" },
  { code: "PK", dialCode: "+92" },
  { code: "PW", dialCode: "+680" },
  { code: "PS", dialCode: "+970" },
  { code: "PA", dialCode: "+507" },
  { code: "PG", dialCode: "+675" },
  { code: "PY", dialCode: "+595" },
  { code: "PE", dialCode: "+51" },
  { code: "PH", dialCode: "+63" },
  { code: "PN", dialCode: "+64" },
  { code: "PL", dialCode: "+48" },
  { code: "PT", dialCode: "+351" },
  { code: "PR", dialCode: "+1 787" },
  { code: "QA", dialCode: "+974" },
  { code: "RE", dialCode: "+262" },
  { code: "RO", dialCode: "+40" },
  { code: "RU", dialCode: "+7" },
  { code: "RW", dialCode: "+250" },
  { code: "BL", dialCode: "+590" },
  { code: "SH", dialCode: "+290" },
  { code: "KN", dialCode: "+1 869" },
  { code: "LC", dialCode: "+1 758" },
  { code: "MF", dialCode: "+590" },
  { code: "PM", dialCode: "+508" },
  { code: "VC", dialCode: "+1 784" },
  { code: "WS", dialCode: "+685" },
  { code: "SM", dialCode: "+378" },
  { code: "ST", dialCode: "+239" },
  { code: "SA", dialCode: "+966" },
  { code: "SN", dialCode: "+221" },
  { code: "RS", dialCode: "+381" },
  { code: "SC", dialCode: "+248" },
  { code: "SL", dialCode: "+232" },
  { code: "SG", dialCode: "+65" },
  { code: "SX", dialCode: "+1 721" },
  { code: "SK", dialCode: "+421" },
  { code: "SI", dialCode: "+386" },
  { code: "SB", dialCode: "+677" },
  { code: "SO", dialCode: "+252" },
  { code: "ZA", dialCode: "+27" },
  { code: "GS", dialCode: "+500" },
  { code: "SS", dialCode: "+211" },
  { code: "ES", dialCode: "+34" },
  { code: "LK", dialCode: "+94" },
  { code: "SD", dialCode: "+249" },
  { code: "SR", dialCode: "+597" },
  { code: "SJ", dialCode: "+47" },
  { code: "SE", dialCode: "+46" },
  { code: "CH", dialCode: "+41" },
  { code: "SY", dialCode: "+963" },
  { code: "TW", dialCode: "+886" },
  { code: "TJ", dialCode: "+992" },
  { code: "TZ", dialCode: "+255" },
  { code: "TH", dialCode: "+66" },
  { code: "TL", dialCode: "+670" },
  { code: "TG", dialCode: "+228" },
  { code: "TK", dialCode: "+690" },
  { code: "TO", dialCode: "+676" },
  { code: "TT", dialCode: "+1 868" },
  { code: "TN", dialCode: "+216" },
  { code: "TR", dialCode: "+90" },
  { code: "TM", dialCode: "+993" },
  { code: "TC", dialCode: "+1 649" },
  { code: "TV", dialCode: "+688" },
  { code: "UG", dialCode: "+256" },
  { code: "UA", dialCode: "+380" },
  { code: "AE", dialCode: "+971" },
  { code: "GB", dialCode: "+44" },
  { code: "US", dialCode: "+1" },
  { code: "UM", dialCode: "+1" },
  { code: "UY", dialCode: "+598" },
  { code: "UZ", dialCode: "+998" },
  { code: "VU", dialCode: "+678" },
  { code: "VA", dialCode: "+39 06" },
  { code: "VE", dialCode: "+58" },
  { code: "VN", dialCode: "+84" },
  { code: "VG", dialCode: "+1 284" },
  { code: "VI", dialCode: "+1 340" },
  { code: "WF", dialCode: "+681" },
  { code: "EH", dialCode: "+212" },
  { code: "YE", dialCode: "+967" },
  { code: "ZM", dialCode: "+260" },
  { code: "ZW", dialCode: "+263" },
  { code: "XK", dialCode: "+383" }
] as const;

const countryNameOverrides: Record<string, string> = {
  BQ: "Caribbean Netherlands",
  CI: "Cote d'Ivoire",
  XK: "Kosovo"
};

const countryNameFormatter =
  typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["en"], { type: "region" }) : null;

function countryName(code: string) {
  return countryNameOverrides[code] ?? countryNameFormatter?.of(code) ?? code;
}

export function countryFlag(code: string) {
  const normalized = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return "";
  return String.fromCodePoint(...normalized.split("").map((char) => 127397 + char.charCodeAt(0)));
}

export const countries = countryDialCodes
  .map((country) => ({
    ...country,
    name: countryName(country.code),
    flag: countryFlag(country.code)
  }))
  .sort((left, right) => left.name.localeCompare(right.name));

const timezoneCountry: Record<string, string> = {
  "Asia/Karachi": "PK",
  "Asia/Dubai": "AE",
  "Asia/Riyadh": "SA",
  "Asia/Kolkata": "IN",
  "Asia/Dhaka": "BD",
  "Asia/Kabul": "AF",
  "Europe/London": "GB",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Toronto": "CA",
  "Australia/Sydney": "AU",
  "Europe/Berlin": "DE",
  "Europe/Paris": "FR",
  "Europe/Madrid": "ES",
  "Europe/Rome": "IT",
  "Europe/Amsterdam": "NL"
};

export function detectCountryCode() {
  if (typeof window === "undefined") return "US";

  const localeCountry = navigator.languages
    ?.map((locale) => locale.replace("_", "-").split("-").at(-1)?.toUpperCase())
    .find((code) => code && countries.some((country) => country.code === code));
  if (localeCountry) return localeCountry;

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return timezoneCountry[timezone] ?? "US";
}

export function getOrCreateRegistrationDeviceId() {
  const key = "pipnest_registration_device_id";
  if (typeof window === "undefined") return "server-device-id";

  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const id = window.crypto?.randomUUID?.() ?? `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(key, id);
  return id;
}

export function getOrCreateTrustedDeviceId() {
  const key = "pipnest_trusted_2fa_device_id";
  if (typeof window === "undefined") return "server-trusted-device";

  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const id = window.crypto?.randomUUID?.() ?? `trusted-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(key, id);
  return id;
}
