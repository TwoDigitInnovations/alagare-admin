/**
 * Place search for bus From/To — cities + main local areas (not tiny colonies/schools).
 * Uses curated India bus hubs + OpenStreetMap Nominatim.
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/** Major boarding / drop areas by city (bus-relevant) */
export const BUS_AREA_HUBS = {
  lucknow: [
    'Alambagh',
    'Charbagh',
    'Hazratganj',
    'Gomti Nagar',
    'Aliganj',
    'Aminabad',
    'Kaiserbagh',
    'Transport Nagar',
    'Chowk',
    'Indira Nagar',
  ],
  kanpur: [
    'Rawatpur',
    'Kakadeo',
    'Fazalganj',
    'Govind Nagar',
    'Kidwai Nagar',
    'Kalyanpur',
  ],
  delhi: [
    'Kashmere Gate',
    'Anand Vihar',
    'Sarai Kale Khan',
    'ISBT Kashmiri Gate',
    'Connaught Place',
    'Dwarka',
    'Rohini',
  ],
  'new delhi': [
    'Kashmere Gate',
    'Anand Vihar',
    'Sarai Kale Khan',
    'Connaught Place',
  ],
  agra: ['Idgah Bus Stand', 'Taj Ganj', 'Sadar Bazaar', 'Fatehabad Road'],
  mathura: ['Masani', 'Bhuteshwar', 'Krishna Nagar', 'Railway Station'],
  etawah: ['Bus Stand', 'Railway Station', 'Civil Lines'],
  varanasi: ['Cantt', 'Lahurabir', 'Sigra', 'Godowlia', 'Banaras Hindu University'],
  allahabad: ['Civil Lines', 'Zero Road', 'Rambagh', 'Leader Road'],
  prayagraj: ['Civil Lines', 'Zero Road', 'Rambagh', 'Leader Road'],
  jaipur: ['Sindhi Camp', 'Narayan Singh Circle', 'Tonk Phatak', 'Vaishali Nagar'],
  mumbai: ['Dadar', 'Borivali', 'Andheri', 'Kurla', 'Sion', 'Parel'],
  pune: ['Swargate', 'Shivajinagar', 'Hadapsar', 'Wakad', 'Pimpri'],
  hyderabad: ['MGBS', 'Jubilee Bus Station', 'Secunderabad', 'Koti', 'Mehdipatnam'],
  bangalore: ['Kempegowda Bus Station', 'Mysore Road', 'Electronic City', 'Silk Board'],
  bengaluru: ['Kempegowda Bus Station', 'Mysore Road', 'Electronic City', 'Silk Board'],
  chennai: ['Koyambedu', 'Tambaram', 'Guindy', 'Central'],
  kolkata: ['Esplanade', 'Howrah', 'Salt Lake', 'Santragachi'],
};

const PLACE_TYPES = new Set([
  'city',
  'town',
  'village',
  'hamlet',
  'municipality',
  'suburb',
  'neighbourhood',
  'neighborhood',
  'quarter',
  'city_district',
  'district',
  'borough',
  'locality',
  'bus_station',
  'station',
]);

const titleCase = (s) =>
  String(s || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

const hubMatches = (query) => {
  const q = String(query || '').trim().toLowerCase();
  if (q.length < 2) return [];

  const out = [];
  const seen = new Set();

  const push = (name, parentCity, country = 'India') => {
    const key = `${name}|${parentCity}`.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const label = parentCity ? `${name}, ${parentCity}, ${country}` : `${name}, ${country}`;
    out.push({
      id: `hub-${key}`,
      name,
      city: name,
      parentCity: parentCity || '',
      country,
      label,
      type: parentCity ? 'locality' : 'city',
    });
  };

  for (const [cityKey, hubs] of Object.entries(BUS_AREA_HUBS)) {
    const cityName = titleCase(cityKey);
    const cityHit = cityKey.startsWith(q) || (q.length >= 3 && cityKey.includes(q));

    if (cityHit) {
      push(cityName, '', 'India');
      hubs.forEach((h) => push(h, cityName));
      continue;
    }

    hubs.forEach((h) => {
      if (h.toLowerCase().includes(q)) {
        push(h, cityName);
      }
    });
  }

  return out;
};

const formatNominatim = (item) => {
  const addr = item.address || {};
  const type = item.type || item.class || '';
  const name =
    item.name ||
    addr.suburb ||
    addr.neighbourhood ||
    addr.quarter ||
    addr.city_district ||
    addr.bus_station ||
    addr.city ||
    addr.town ||
    addr.village ||
    String(item.display_name || '').split(',')[0]?.trim() ||
    '';

  if (!name) return null;

  const parentCity =
    [addr.city, addr.town, addr.municipality, addr.state_district]
      .map((v) => (v || '').trim())
      .find((v) => v && v.toLowerCase() !== name.toLowerCase()) || '';

  const state = addr.state || '';
  const country = addr.country || '';
  const parts = [name, parentCity, state, country].filter(
    (v, i, arr) => v && arr.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i,
  );

  return {
    id: String(item.place_id || `${item.lat},${item.lon}`),
    name,
    city: name,
    parentCity,
    state,
    country,
    label: parts.join(', '),
    type,
  };
};

const isUsefulPlace = (item) => {
  const type = String(item.type || '').toLowerCase();
  const cls = String(item.class || '').toLowerCase();
  if (PLACE_TYPES.has(type)) return true;
  if (cls === 'place' && PLACE_TYPES.has(type)) return true;
  if (cls === 'highway' && type === 'bus_stop') return true;
  if (cls === 'amenity' && (type === 'bus_station' || type === 'ferry_terminal')) return true;
  if (cls === 'railway' && type === 'station') return true;
  // Nominatim sometimes returns administrative boundaries for cities
  if (cls === 'boundary' && type === 'administrative' && Number(item.place_rank) <= 16) {
    return true;
  }
  return false;
};

async function searchNominatim(query, limit, axios) {
  const res = await axios.get(NOMINATIM_URL, {
    params: {
      q: query,
      format: 'json',
      addressdetails: 1,
      limit: Math.max(limit, 15),
      dedupe: 1,
    },
    headers: {
      'User-Agent': 'AlagareBusBooking/1.0 (admin+mobile place search)',
      Accept: 'application/json',
    },
    timeout: 10000,
  });

  const seen = new Set();
  const places = [];

  for (const item of res.data || []) {
    if (!isUsefulPlace(item) && !PLACE_TYPES.has(String(item.type || ''))) {
      // still allow if display looks like a named place with city context
      if (!item.address?.suburb && !item.address?.city && !item.address?.town) continue;
    }
    const place = formatNominatim(item);
    if (!place?.name) continue;
    const key = place.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    places.push(place);
    if (places.length >= limit) break;
  }

  return places;
}

/**
 * @param {string} query
 * @param {number} limit
 * @param {import('axios').AxiosStatic} axios
 */
export async function searchBusPlaces(query, limit = 12, axios) {
  const q = String(query || '').trim();
  if (q.length < 2) return [];

  const hubs = hubMatches(q);
  let remote = [];
  try {
    remote = await searchNominatim(q, limit, axios);
  } catch {
    remote = [];
  }

  const seen = new Set();
  const merged = [];

  for (const p of [...hubs, ...remote]) {
    const key = (p.label || p.name || '').toLowerCase();
    if (!key || seen.has(key)) continue;
    // skip tiny noise: schools/colleges if Nominatim leaked them
    const lower = key;
    if (
      lower.includes('school') ||
      lower.includes('college') ||
      lower.includes('university') ||
      lower.includes('hospital') ||
      lower.includes('temple') ||
      lower.includes('mosque') ||
      lower.includes('church')
    ) {
      continue;
    }
    seen.add(key);
    merged.push(p);
    if (merged.length >= limit) break;
  }

  return merged;
}

export default { searchBusPlaces, BUS_AREA_HUBS };
