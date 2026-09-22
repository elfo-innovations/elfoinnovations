import { COUNTRIES, type Country } from "@/lib/countries";

export type PhoneValue = { country: Country; local: string; full: string; valid: boolean };

export const defaultPhone = (): PhoneValue => ({
  country: COUNTRIES[0],
  local: "",
  full: "",
  valid: false,
});
