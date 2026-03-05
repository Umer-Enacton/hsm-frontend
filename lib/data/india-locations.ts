/**
 * India States/UTs and Cities Data
 * Used for business location selection
 */

export interface IndiaLocation {
  state: string;
  cities: string[];
}

export const INDIA_LOCATIONS: IndiaLocation[] = [
  {
    state: "Andhra Pradesh",
    cities: [
      "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool",
      "Kakinada", "Tirupati", "Anantapur", "Kadapa", "Vizianagaram",
      "Eluru", "Ongole", "Nandyal", "Machilipatnam", "Adoni", "Tenali",
      "Chittoor", "Hindupur", "Proddatur", "Bhimavaram", "Madanapalle",
      "Guntakal", "Dharmavaram", "Rajahmundry", "Tadepalligudem", "Chirala"
    ]
  },
  {
    state: "Arunachal Pradesh",
    cities: [
      "Itanagar", "Naharlagun", "Pasighat", "Tezu", "Bomdila",
      "Ziro", "Along", "Daporijo", "Roing", "Khonsa",
      "Basar", "Seppa", "Yingkiong", "Tawang", "Changlang"
    ]
  },
  {
    state: "Assam",
    cities: [
      "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon",
      "Tinsukia", "Tezpur", "Bongaigaon", "Karimganj", "Sivasagar",
      "Lakhimpur", "Nalbari", "Barpeta", "Goalpara", "Dhubri",
      "Diphu", "Golaghat", "Kokrajhar", "Majuli", "Marigaon"
    ]
  },
  {
    state: "Bihar",
    cities: [
      "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia",
      "Darbhanga", "Bihar Sharif", "Ara", "Begusarai", "Katihar",
      "Munger", "Chapra", "Hajipur", "Dehri", "Sasaram",
      "Nawada", "Jamalpur", "Kishanganj", "Sitamarhi", "Motihari"
    ]
  },
  {
    state: "Chhattisgarh",
    cities: [
      "Raipur", "Bhilai", "Korba", "Bilaspur", "Durg",
      "Rajnandgaon", "Raigarh", "Jagdalpur", "Ambikapur", "Dhamtari",
      "Mahasamund", "Dalli-Rajhara", "Chirmiri", "Bhatapara", "Sakti",
      "Naila Janjgir", "Kanker", "Balod", "Akaltara", "Baikunthpur"
    ]
  },
  {
    state: "Delhi",
    cities: [
      "New Delhi", "Delhi", "North Delhi", "South Delhi", "East Delhi",
      "West Delhi", "Central Delhi", "North East Delhi", "North West Delhi", "South West Delhi",
      "Shahdara", "Dwarka", "Rohini", "Pitampura", "Mayur Vihar",
      "Laxmi Nagar", "Saket", "Vasant Kunj", "Greater Kailash", "Defence Colony"
    ]
  },
  {
    state: "Goa",
    cities: [
      "Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda",
      "Bicholim", "Curchorem", "Madgaon", "Sanquelim", "Cortalim",
      "Quepem", "Sanguem", "Pernem", "Canacona", "Dharbandora"
    ]
  },
  {
    state: "Gujarat",
    cities: [
      "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar",
      "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Navsari",
      "Bharuch", "Morbi", "Surendranagar", "Bhuj", "Porbandar",
      "Godhra", "Veraval", "Palanpur", "Valsad", "Vapi",
      "Mehsana", "Amreli", "Navsari", "Ankleshwar", "Gandhidham"
    ]
  },
  {
    state: "Haryana",
    cities: [
      "Gurugram", "Faridabad", "Panipat", "Ambala", "Yamunanagar",
      "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula",
      "Bhiwani", "Sirsa", "Bahadurgarh", "Jhajjar", "Palwal",
      "Rewari", "Kaithal", "Kurukshetra", "Mahendragarh", "Nuh"
    ]
  },
  {
    state: "Himachal Pradesh",
    cities: [
      "Shimla", "Dharamshala", "Solan", "Mandi", "Palampur",
      "Baddi", "Kullu", "Manali", "Chamba", "Hamirpur",
      "Una", "Kangra", "Bilaspur", "Sirmaur", "Kinnaur",
      "Kullu", "Lahaul and Spiti", "Rampur", "Nahan", "Sundarnagar"
    ]
  },
  {
    state: "Jharkhand",
    cities: [
      "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar",
      "Hazaribagh", "Giridih", "Ramgarh", "Dumka", "Chaibasa",
      "Hazaribag", "Medininagar", "Chirkunda", "Phusro", "Sahibganj",
      "Daltonganj", "Gomoh", "Silampur", "Jamtara", "Giridih"
    ]
  },
  {
    state: "Karnataka",
    cities: [
      "Bangalore", "Mysore", "Hubli-Dharwad", "Kalaburagi", "Mangalore",
      "Belgaum", "Davanagere", "Ballari", "Vijayapura", "Shivamogga",
      "Tumakuru", "Raichur", "Bidar", "Hassan", "Mandya",
      "Udupi", "Ramanagara", "Chikmagalur", "Dharwad", "Kolar",
      "Bengaluru Rural", "Bagalkot", "Chitradurga", "Koppal", "Chikkaballapura"
    ]
  },
  {
    state: "Kerala",
    cities: [
      "Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam",
      "Palakkad", "Alappuzha", "Malappuram", "Kannur", "Kottayam",
      "Kasaragod", "Idukki", "Pathanamthitta", "Wayanad", "Ernakulam",
      "Kollam", "Thiruvananthapuram", "Kozhikode", "Malappuram", "Palakkad"
    ]
  },
  {
    state: "Madhya Pradesh",
    cities: [
      "Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain",
      "Sagar", "Rewa", "Satna", "Morena", "Dewas",
      "Murwara", "Burhanpur", "Ratlam", "Ashoknagar", "Mandsaur",
      "Neemuch", "Shivpuri", "Chhindwara", "Guna", "Sehore",
      "Vidisha", "Singrauli", "Itarsi", "Sarni", "Mhow"
    ]
  },
  {
    state: "Maharashtra",
    cities: [
      "Mumbai", "Pune", "Nagpur", "Thane", "Nashik",
      "Kalyan-Dombivli", "Vasai-Virar", "Aurangabad", "Navi Mumbai", "Solapur",
      "Mira-Bhayandar", "Bhiwandi", "Amravati", "Nanded", "Kolhapur",
      "Sangli", "Jalgaon", "Latur", "Akola", "Ahmednagar",
      "Ichalkaranji", "Chandrapur", "Parbhani", "Ratnagiri", "Yavatmal"
    ]
  },
  {
    state: "Manipur",
    cities: [
      "Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Kakching",
      "Ukhrul", "Senapati", "Tamenglong", "Chandel", "Jiribam",
      "Moreh", "Mao", "Kangpokpi", "Phoubakchao", "Andro"
    ]
  },
  {
    state: "Meghalaya",
    cities: [
      "Shillong", "Tura", "Cherrapunji", "Jowai", "Baghmara",
      "Nongpoh", "Williamnagar", "Resubelpara", "Ampati", "Mawsynram",
      "Shella", "Mairang", "Nongstoin", "Khliehriat", "Rongjeng"
    ]
  },
  {
    state: "Mizoram",
    cities: [
      "Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib",
      "Serchhip", "Mamit", "Lawngtlai", "Saitual", "Khawzawl",
      "Biate", "Vaphai", "Thenzawl", "Lengpui", "Sihir"
    ]
  },
  {
    state: "Nagaland",
    cities: [
      "Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha",
      "Zunheboto", "Kiphire", "Longleng", "Phek", "Peren",
      "Tseminyu", "Chumoukedima", "Niuland", "Tobu", "Meluri"
    ]
  },
  {
    state: "Odisha",
    cities: [
      "Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur",
      "Puri", "Cuttack", "Brahmapur", "Rourkela", "Puri",
      "Angul", "Talcher", "Jharsuguda", "Baleshwar", "Baripada",
      "Balangir", "Bhawanipatna", "Dhenkanal", "Kendujhar", "Koraput"
    ]
  },
  {
    state: "Puducherry",
    cities: [
      "Puducherry", "Karaikal", "Mahe", "Yanam", "Ariyankuppam",
      "Bahour", "Mannadipet", "Nettapakkam", "Puducherry", "Villianur"
    ]
  },
  {
    state: "Punjab",
    cities: [
      "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda",
      "Mohali", "Firozpur", "Pathankot", "Batala", "Moga",
      "Malerkotla", "Khanna", "Faridkot", "Gurdaspur", "Barnala",
      "Kapurthala", "Hoshiarpur", "Fazilka", "Kotkapura", "Zirakpur",
      "Sunam", "Tarn Taran", "Phagwara", "Nawanshahr", "Malout"
    ]
  },
  {
    state: "Rajasthan",
    cities: [
      "Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer",
      "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sikar",
      "Sri Ganganagar", "Pali", "Churu", "Tonk", "Kishangarh",
      "Beawar", "Hanumangarh", "Barmer", "Mount Abu", "Sawai Madhopur",
      "Nagaur", "Bundi", "Jhalawar", "Dungarpur", "Jaisalmer"
    ]
  },
  {
    state: "Sikkim",
    cities: [
      "Gangtok", "Namchi", "Geyzing", "Mangan", "Rangpo",
      "Jorethang", "Pelling", "Singtam", "Namthang", "Ravangla"
    ]
  },
  {
    state: "Tamil Nadu",
    cities: [
      "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem",
      "Erode", "Tiruppur", "Tirunelveli", "Vellore", "Thoothukudi",
      "Dindigul", "Thanjavur", "Ranipet", "Sivakasi", "Karur",
      "Udhagamandalam", "Hosur", "Rajapalayam", "Tiruvannamalai", "Nagercoil",
      "Kanchipuram", "Kumbakonam", "Cuddalore", "Kanyakumari", "Dharmapuri"
    ]
  },
  {
    state: "Telangana",
    cities: [
      "Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar",
      "Ramagundam", "Mahbubnagar", "Nalgonda", "Miryalaguda", "Suryapet",
      "Adilabad", "Peddapalli", "Jagtial", "Kothagudem", "Bodhan",
      "Kamareddy", "Sangareddy", "Medak", "Nirmal", "Bellampalli"
    ]
  },
  {
    state: "Tripura",
    cities: [
      "Agartala", "Dharmanagar", "Udaipur", "Kailasahar", "Belonia",
      "Khowai", "Pratapgarh", "Ranirbazar", "Melaghar", "Sabroom"
    ]
  },
  {
    state: "Uttar Pradesh",
    cities: [
      "Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut",
      "Prayagraj", "Ghaziabad", "Noida", " Bareilly", "Aligarh",
      "Moradabad", "Saharanpur", "Gorakhpur", "Jhansi", "Firozabad",
      "Jhansi", "Mathura", "Ayodhya", "Muzaffarnagar", "Sultanpur",
      "Unnao", "Etawah", "Mainpuri", "Rampur", "Bulandshahr"
    ]
  },
  {
    state: "Uttarakhand",
    cities: [
      "Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur",
      "Kashipur", "Rishikesh", "Kotdwar", "Ramnagar", "Pauri",
      "Srinagar", "Pithoragarh", "Almora", "Nainital", "Bageshwar",
      "Chamoli", "Uttarkashi", "Tehri", "Dehradun", "Haridwar"
    ]
  },
  {
    state: "West Bengal",
    cities: [
      "Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri",
      "Bardhaman", "Malda", "Midnapore", "Kharagpur", "Shantipur",
      "Kolkata", "Habra", "Krishnanagar", "Berhampore", "Serampore",
      "Bally", "Raiganj", "English Bazar", "Habara", "Kanchrapara"
    ]
  },
  {
    state: "Andaman and Nicobar Islands",
    cities: [
      "Port Blair", "Car Nicobar", "Great Nicobar", "Little Andaman", "Mayabunder"
    ]
  },
  {
    state: "Chandigarh",
    cities: [
      "Chandigarh", "Sector 1", "Sector 17", "Sector 22", "Sector 35"
    ]
  },
  {
    state: "Dadra and Nagar Haveli and Daman and Diu",
    cities: [
      "Daman", "Diu", "Silvassa", "Dadra", "Naroli"
    ]
  },
  {
    state: "Jammu and Kashmir",
    cities: [
      "Srinagar", "Jammu", "Anantnag", "Baramulla", "Sopore",
      "Kathua", "Udhampur", "Pulwama", "Ganderbal", "Kulgam",
      "Bandipora", "Budgam", "Rajouri", "Poonch", "Leh",
      "Kargil", "Kupwara", "Reasi", "Kathua", "Doda"
    ]
  },
  {
    state: "Ladakh",
    cities: [
      "Leh", "Kargil", "Zanskar", "Nubra Valley", "Pangong"
    ]
  },
  {
    state: "Lakshadweep",
    cities: [
      "Kavaratti", "Agatti", "Minicoy", "Amini", "Andrott"
    ]
  }
];

/**
 * Get all states/UTs
 */
export function getAllStates(): string[] {
  return INDIA_LOCATIONS.map(loc => loc.state);
}

/**
 * Get cities for a specific state (deduplicated)
 */
export function getCitiesByState(state: string): string[] {
  const location = INDIA_LOCATIONS.find(loc => loc.state === state);
  if (!location) return [];
  // Remove duplicates using Set while preserving order
  return Array.from(new Set(location.cities));
}

/**
 * Check if a city exists in a state
 */
export function isValidCityForState(city: string, state: string): boolean {
  const cities = getCitiesByState(state);
  return cities.includes(city);
}
