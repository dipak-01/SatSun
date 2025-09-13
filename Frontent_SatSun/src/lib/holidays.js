// India holidays (subset) for Sep–Dec 2025, provided by user
// Utilities to query by local date and by month

const RAW_HOLIDAYS = [
  {
    date: "2025-09-05",
    name: "Milad un-Nabi/Id-e-Milad",
    type: "Gazetted Holiday",
    isGazetted: true,
  },
  {
    date: "2025-09-05",
    name: "Onam",
    type: "Restricted Holiday",
    isGazetted: false,
  },
  {
    date: "2025-09-22",
    name: "First Day of Sharad Navratri",
    type: "Hinduism",
    isGazetted: false,
  },
  {
    date: "2025-09-22T23:49:22+05:30",
    name: "September Equinox",
    type: "Season",
    isGazetted: false,
  },
  {
    date: "2025-09-28",
    name: "First Day of Durga Puja Festivities",
    type: "Hinduism",
    isGazetted: false,
  },
  {
    date: "2025-09-29",
    name: "Maha Saptami",
    type: "Restricted Holiday",
    isGazetted: false,
  },
  {
    date: "2025-09-30",
    name: "Maha Ashtami",
    type: "Restricted Holiday",
    isGazetted: false,
  },
  {
    date: "2025-10-01",
    name: "Maha Navami",
    type: "Restricted Holiday",
    isGazetted: false,
  },
  {
    date: "2025-10-02",
    name: "Mahatma Gandhi Jayanti",
    type: "Gazetted Holiday",
    isGazetted: true,
  },
  {
    date: "2025-10-02",
    name: "Dussehra",
    type: "Gazetted Holiday",
    isGazetted: true,
  },
  {
    date: "2025-10-07",
    name: "Maharishi Valmiki Jayanti",
    type: "Restricted Holiday",
    isGazetted: false,
  },
  {
    date: "2025-10-10",
    name: "Karaka Chaturthi (Karva Chauth)",
    type: "Restricted Holiday",
    isGazetted: false,
  },
  {
    date: "2025-10-20",
    name: "Naraka Chaturdasi",
    type: "Restricted Holiday",
    isGazetted: false,
  },
  {
    date: "2025-10-20",
    name: "Diwali/Deepavali",
    type: "Gazetted Holiday",
    isGazetted: true,
  },
  {
    date: "2025-10-22",
    name: "Govardhan Puja",
    type: "Restricted Holiday",
    isGazetted: false,
  },
  {
    date: "2025-10-23",
    name: "Bhai Duj",
    type: "Restricted Holiday",
    isGazetted: false,
  },
  {
    date: "2025-10-28",
    name: "Chhat Puja (Pratihar Sashthi/Surya Sashthi)",
    type: "Restricted Holiday",
    isGazetted: false,
  },
  {
    date: "2025-10-31",
    name: "Halloween",
    type: "Observance",
    isGazetted: false,
  },
  {
    date: "2025-11-05",
    name: "Guru Nanak Jayanti",
    type: "Gazetted Holiday",
    isGazetted: true,
  },
  {
    date: "2025-11-24",
    name: "Guru Tegh Bahadur's Martyrdom Day",
    type: "Restricted Holiday",
    isGazetted: false,
  },
  {
    date: "2025-12-15",
    name: "First Day of Hanukkah",
    type: "Observance",
    isGazetted: false,
  },
  {
    date: "2025-12-21T20:33:05+05:30",
    name: "December Solstice",
    type: "Season",
    isGazetted: false,
  },
  {
    date: "2025-12-22",
    name: "Last day of Hanukkah",
    type: "Observance",
    isGazetted: false,
  },
  {
    date: "2025-12-24",
    name: "Christmas Eve",
    type: "Restricted Holiday",
    isGazetted: false,
  },
  {
    date: "2025-12-25",
    name: "Christmas",
    type: "Gazetted Holiday",
    isGazetted: true,
  },
  {
    date: "2025-12-31",
    name: "New Year's Eve",
    type: "Observance",
    isGazetted: false,
  },
];

function pad2(n) {
  return String(n).padStart(2, "0");
}
export function localKeyFromDate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseToLocalKey(dateStr) {
  // Accept YYYY-MM-DD and ISO with timezone
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return localKeyFromDate(d);
}

export const HOLIDAYS = RAW_HOLIDAYS.map((h) => ({ ...h }));

export function holidaysByLocalKey() {
  const map = new Map();
  for (const h of HOLIDAYS) {
    const key = parseToLocalKey(h.date);
    if (!key) continue;
    (map.get(key) || map.set(key, []).get(key)).push(h);
  }
  return map;
}

export function holidaysInMonth(year, monthIndex) {
  // monthIndex: 0..11
  return HOLIDAYS.map((h) => ({ h, d: new Date(h.date) }))
    .filter(
      ({ d }) =>
        !isNaN(d) && d.getFullYear() === year && d.getMonth() === monthIndex
    )
    .sort((a, b) => a.d - b.d)
    .map(({ h, d }) => ({ ...h, dateObj: d, localKey: localKeyFromDate(d) }));
}

export function holidaysBetween(startIso, endIso) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  if (isNaN(s) || isNaN(e)) return [];
  const sKey = +new Date(s.getFullYear(), s.getMonth(), s.getDate());
  const eKey = +new Date(e.getFullYear(), e.getMonth(), e.getDate());
  return HOLIDAYS.map((h) => ({ h, d: new Date(h.date) }))
    .filter(({ d }) => !isNaN(d))
    .filter(({ d }) => {
      const k = +new Date(d.getFullYear(), d.getMonth(), d.getDate());
      return k >= sKey && k <= eKey;
    })
    .sort((a, b) => a.d - b.d)
    .map(({ h, d }) => ({ ...h, dateObj: d, localKey: localKeyFromDate(d) }));
}

export default HOLIDAYS;
