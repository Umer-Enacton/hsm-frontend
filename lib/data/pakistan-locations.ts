/**
 * Pakistan States/Provinces and Cities Data
 * Used for business location selection
 */

export interface PakistanLocation {
  state: string;
  cities: string[];
}

export const PAKISTAN_LOCATIONS: PakistanLocation[] = [
  {
    state: "Punjab",
    cities: [
      "Lahore", "Faisalabad", "Rawalpindi", "Multan", "Gujranwala",
      "Sialkot", "Sargodha", "Bahawalpur", "Gujrat", "Sheikhupura",
      "Jhang", "Sahiwal", "Okara", "Rahim Yar Khan", "Kasur",
      "Mianwali", "Bhakkar", "Khanewal", "Muzaffargarh", "Dera Ghazi Khan",
      "Vehari", "Hafizabad", "Narowal", "Mandi Bahauddin", "Chiniot",
      "Attock", "Jhelum", "Chakwal", "Khushab", "Mianwali", "Pakpattan",
      "Toba Tek Singh", "Khanewal", "Lodhran", "Bahawalnagar", "Rajanpur"
    ]
  },
  {
    state: "Sindh",
    cities: [
      "Karachi", "Hyderabad", "Sukkur", "Larkana", "Mirpurkhas",
      "Jacobabad", "Shikarpur", "Nawabshah", "Umerkot", "Thatta",
      "Badin", "Khairpur", "Dadu", "Naushahro Feroze", "Ghotki",
      "Kandhkot", "Shahdadkot", "Matiari", "Tando Allahyar", "Tando Muhammad Khan"
    ]
  },
  {
    state: "Khyber Pakhtunkhwa",
    cities: [
      "Peshawar", "Mardan", "Swat", "Abbottabad", "Kohat",
      "Dera Ismail Khan", "Bannu", "Charsadda", "Nowshera", "Mansehra",
      "Haripur", "Swabi", "Malakand", "Chitral", "Dir",
      "Buner", "Shangla", "Batagram", "Karak", "Lakki Marwat",
      "Tank", "Hangu", "Lower Dir", "Upper Dir", "Torghar"
    ]
  },
  {
    state: "Balochistan",
    cities: [
      "Quetta", "Gwadar", "Turbat", "Sibi", "Loralai",
      "Zhob", "Chaman", "Jafarabad", "Lasbela", "Kech",
      "Kharan", "Khuzdar", "Awaran", "Panjgur", "Washuk",
      "Dera Bugti", "Kohlu", "Bolan", "Mastung", "Kalat",
      "Pishin", "Qila Abdullah", "Qila Saifullah", "Jhal Magsi", "Nushki"
    ]
  },
  {
    state: "Azad Kashmir",
    cities: [
      "Muzaffarabad", "Mirpur", "Rawalakot", "Kotli", "Bagh",
      "Bhimber", "Palandri", "Hattian Bala", "Hajira", "Sudhanoti",
      "Kathi", "Sehnsa", "Nellum", "Neelum Valley", "Leepa Valley"
    ]
  },
  {
    state: "Gilgit-Baltistan",
    cities: [
      "Gilgit", "Skardu", "Hunza", "Ghizer", "Ghakuch",
      "Danyore", "Nagar", "Shigar", "Kharmang", "Ghanche",
      "Roundu", "Astoor", "Astore", "Diamer", "Chilas"
    ]
  },
  {
    state: "Islamabad Capital Territory",
    cities: [
      "Islamabad"
    ]
  }
];

/**
 * Get all states/provinces
 */
export function getAllStates(): string[] {
  return PAKISTAN_LOCATIONS.map(loc => loc.state);
}

/**
 * Get cities for a specific state
 */
export function getCitiesByState(state: string): string[] {
  const location = PAKISTAN_LOCATIONS.find(loc => loc.state === state);
  return location?.cities || [];
}

/**
 * Check if a city exists in a state
 */
export function isValidCityForState(city: string, state: string): boolean {
  const cities = getCitiesByState(state);
  return cities.includes(city);
}
