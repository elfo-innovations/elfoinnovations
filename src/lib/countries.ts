export type Country = {
  name: string;
  code: string;
  dial: string;
  flag: string;
  minLen: number;
  maxLen: number;
};

export const COUNTRIES: Country[] = [
  { name: "Pakistan", code: "PK", dial: "+92", flag: "🇵🇰", minLen: 10, maxLen: 10 },
  { name: "United States", code: "US", dial: "+1", flag: "🇺🇸", minLen: 10, maxLen: 10 },
  { name: "Canada", code: "CA", dial: "+1", flag: "🇨🇦", minLen: 10, maxLen: 10 },
  { name: "United Kingdom", code: "GB", dial: "+44", flag: "🇬🇧", minLen: 10, maxLen: 11 },
  { name: "United Arab Emirates", code: "AE", dial: "+971", flag: "🇦🇪", minLen: 9, maxLen: 9 },
  { name: "Saudi Arabia", code: "SA", dial: "+966", flag: "🇸🇦", minLen: 9, maxLen: 9 },
  { name: "India", code: "IN", dial: "+91", flag: "🇮🇳", minLen: 10, maxLen: 10 },
  { name: "Australia", code: "AU", dial: "+61", flag: "🇦🇺", minLen: 9, maxLen: 9 },
  { name: "Japan", code: "JP", dial: "+81", flag: "🇯🇵", minLen: 10, maxLen: 11 },
  { name: "Germany", code: "DE", dial: "+49", flag: "🇩🇪", minLen: 10, maxLen: 12 },
  { name: "France", code: "FR", dial: "+33", flag: "🇫🇷", minLen: 9, maxLen: 9 },
  { name: "China", code: "CN", dial: "+86", flag: "🇨🇳", minLen: 11, maxLen: 11 },
  { name: "Turkey", code: "TR", dial: "+90", flag: "🇹🇷", minLen: 10, maxLen: 10 },
  { name: "Netherlands", code: "NL", dial: "+31", flag: "🇳🇱", minLen: 9, maxLen: 9 },
  { name: "Spain", code: "ES", dial: "+34", flag: "🇪🇸", minLen: 9, maxLen: 9 },
  { name: "Italy", code: "IT", dial: "+39", flag: "🇮🇹", minLen: 9, maxLen: 11 },
  { name: "Brazil", code: "BR", dial: "+55", flag: "🇧🇷", minLen: 10, maxLen: 11 },
  { name: "Mexico", code: "MX", dial: "+52", flag: "🇲🇽", minLen: 10, maxLen: 10 },
  { name: "Singapore", code: "SG", dial: "+65", flag: "🇸🇬", minLen: 8, maxLen: 8 },
  { name: "South Africa", code: "ZA", dial: "+27", flag: "🇿🇦", minLen: 9, maxLen: 9 },
  { name: "Nigeria", code: "NG", dial: "+234", flag: "🇳🇬", minLen: 10, maxLen: 10 },
  { name: "Egypt", code: "EG", dial: "+20", flag: "🇪🇬", minLen: 10, maxLen: 10 },
  { name: "Qatar", code: "QA", dial: "+974", flag: "🇶🇦", minLen: 8, maxLen: 8 },
  { name: "Kuwait", code: "KW", dial: "+965", flag: "🇰🇼", minLen: 8, maxLen: 8 },
  { name: "Bangladesh", code: "BD", dial: "+880", flag: "🇧🇩", minLen: 10, maxLen: 10 },
  { name: "Malaysia", code: "MY", dial: "+60", flag: "🇲🇾", minLen: 9, maxLen: 10 },
  { name: "Indonesia", code: "ID", dial: "+62", flag: "🇮🇩", minLen: 9, maxLen: 12 },
  { name: "Sweden", code: "SE", dial: "+46", flag: "🇸🇪", minLen: 9, maxLen: 9 },
  { name: "Norway", code: "NO", dial: "+47", flag: "🇳🇴", minLen: 8, maxLen: 8 },
  { name: "Poland", code: "PL", dial: "+48", flag: "🇵🇱", minLen: 9, maxLen: 9 },
];
