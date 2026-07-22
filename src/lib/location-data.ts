export interface CountryData {
  id: string;
  name: string;
}

export interface StateData {
  id: string;
  countryId: string;
  name: string;
}

export interface CityData {
  id: string;
  stateId: string;
  countryId: string;
  name: string;
}

export const COUNTRIES: CountryData[] = [
  { id: 'IN', name: 'India' },
  { id: 'AU', name: 'Australia' },
  { id: 'ENG', name: 'England' },
  { id: 'NZ', name: 'New Zealand' },
  { id: 'ZA', name: 'South Africa' },
  { id: 'PK', name: 'Pakistan' },
  { id: 'SL', name: 'Sri Lanka' },
  { id: 'WI', name: 'West Indies' },
  { id: 'AE', name: 'United Arab Emirates' },
  { id: 'OTHER', name: 'Other Country' },
];

export const STATES: StateData[] = [
  // India
  { id: 'IN-TG', countryId: 'IN', name: 'Telangana' },
  { id: 'IN-MH', countryId: 'IN', name: 'Maharashtra' },
  { id: 'IN-KA', countryId: 'IN', name: 'Karnataka' },
  { id: 'IN-TN', countryId: 'IN', name: 'Tamil Nadu' },
  { id: 'IN-DL', countryId: 'IN', name: 'Delhi' },
  { id: 'IN-GJ', countryId: 'IN', name: 'Gujarat' },
  { id: 'IN-[#OTHER]', countryId: 'IN', name: 'Other State' },

  // Australia
  { id: 'AU-VIC', countryId: 'AU', name: 'Victoria' },
  { id: 'AU-NSW', countryId: 'AU', name: 'New South Wales' },
  { id: 'AU-QLD', countryId: 'AU', name: 'Queensland' },

  // Fallback
  { id: 'OTHER-STATE', countryId: 'OTHER', name: 'Other State' },
];

export const CITIES: CityData[] = [
  // Telangana
  { id: 'IN-TG-HYD', stateId: 'IN-TG', countryId: 'IN', name: 'Hyderabad' },
  { id: 'IN-TG-[#WGL]', stateId: 'IN-TG', countryId: 'IN', name: 'Warangal' },
  { id: 'IN-TG-NIZ', stateId: 'IN-TG', countryId: 'IN', name: 'Nizamabad' },

  // Maharashtra
  { id: 'IN-MH-MUM', stateId: 'IN-MH', countryId: 'IN', name: 'Mumbai' },
  { id: 'IN-MH-PUN', stateId: 'IN-MH', countryId: 'IN', name: 'Pune' },
  { id: 'IN-MH-NAG', stateId: 'IN-MH', countryId: 'IN', name: 'Nagpur' },

  // Karnataka
  { id: 'IN-KA-BLR', stateId: 'IN-KA', countryId: 'IN', name: 'Bengaluru' },
  { id: 'IN-KA-MYS', stateId: 'IN-KA', countryId: 'IN', name: 'Mysuru' },

  // Tamil Nadu
  { id: 'IN-TN-CHE', stateId: 'IN-TN', countryId: 'IN', name: 'Chennai' },

  // Delhi
  { id: 'IN-DL-NDL', stateId: 'IN-DL', countryId: 'IN', name: 'New Delhi' },

  // Gujarat
  { id: 'IN-GJ-AMD', stateId: 'IN-GJ', countryId: 'IN', name: 'Ahmedabad' },

  // Australia
  { id: 'AU-VIC-MEL', stateId: 'AU-VIC', countryId: 'AU', name: 'Melbourne' },
  { id: 'AU-NSW-SYD', stateId: 'AU-NSW', countryId: 'AU', name: 'Sydney' },

  // Fallback
  { id: 'OTHER-CITY', stateId: 'OTHER-STATE', countryId: 'OTHER', name: 'Other City' },
];

export function getCountries(): CountryData[] {
  return COUNTRIES;
}

export function getStates(countryId: string): StateData[] {
  return STATES.filter(s => s.countryId === countryId || s.countryId === 'OTHER');
}

export function getCities(stateId: string): CityData[] {
  return CITIES.filter(c => c.stateId === stateId || c.stateId === 'OTHER-STATE');
}
