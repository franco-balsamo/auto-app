#!/usr/bin/env node
// Busca talleres reales vía OpenStreetMap (Nominatim para geocodificar la
// zona + Overpass para los POIs) y genera el SQL de carga (reemplazo de
// db/seed_workshops.sql, que era data de prueba fija en Palermo/Almagro).
// Gratis, sin API key ni billing — a diferencia de Google Places, que pide
// tarjeta incluso para el free tier. No inserta directo en Supabase — arma
// el SQL para correrlo a mano en el SQL editor, mismo patrón que el resto
// de db/*.sql.
//
// Uso:
//   node scripts/fetch_workshops.mjs "San Vicente, Buenos Aires, Argentina" [radio_metros]
//
// Ojo con nombres ambiguos: "San Vicente" existe 5 veces en la provincia de
// Buenos Aires (Pergamino, Olavarría, Bahía Blanca, Chacabuco y el propio
// Partido de San Vicente) — Nominatim resuelve a UNO sin avisar si está
// mal. El script imprime "Zona resuelta: ..." en stderr; si no es la zona
// esperada, pasar el nombre completo del partido, ej. "San Vicente,
// Partido de San Vicente, Buenos Aires, Argentina".
//
// ponytail: cobertura y calidad de datos dependen de qué tan mapeada esté
// la zona en OSM (buena en CABA/GBA, variable en el interior) — sin
// paginación ni reintentos, una sola pasada. Si la zona sale con pocos
// resultados, no es bug del script, es falta de datos en OSM ahí.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const NOMINATIM_UA = 'auto-app-workshop-seed/1.0 (contacto: balsamote96@gmail.com)';

const zone = process.argv[2];
const radius = Number(process.argv[3] ?? 6000);

if (!zone) {
  console.error('Uso: node scripts/fetch_workshops.mjs "<zona>" [radio_metros]');
  process.exit(1);
}

function escapeSql(value) {
  return value == null ? null : value.replace(/'/g, "''");
}

async function geocodeZone(query) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  const res = await fetch(url, { headers: { 'User-Agent': NOMINATIM_UA } });
  const json = await res.json();
  if (!json.length) throw new Error(`No se pudo geocodificar "${query}"`);

  // Nombres de zona ambiguos (ej. "San Vicente" existe 5 veces en la
  // provincia de Buenos Aires) pueden resolver al lugar equivocado sin
  // ningún error — mostrar qué eligió Nominatim para poder detectarlo.
  console.error(`Zona resuelta: ${json[0].display_name}`);

  return { lat: Number(json[0].lat), lng: Number(json[0].lon) };
}

async function fetchOverpass(lat, lng) {
  const query = `
    [out:json][timeout:25];
    (
      node["shop"="car_repair"](around:${radius},${lat},${lng});
      way["shop"="car_repair"](around:${radius},${lat},${lng});
      node["shop"="tyres"](around:${radius},${lat},${lng});
      way["shop"="tyres"](around:${radius},${lat},${lng});
      node["amenity"="car_wash"](around:${radius},${lat},${lng});
      way["amenity"="car_wash"](around:${radius},${lat},${lng});
    );
    out center tags;
  `;

  // curl en vez de fetch: en algunos entornos sandboxeados el fetch nativo
  // de Node no llega a overpass-api.de (timeout) aunque curl sí — mismo
  // host, mismo dato, transporte distinto.
  const { stdout } = await execFileAsync('curl', [
    '-sS',
    '--max-time',
    '30',
    '-X',
    'POST',
    '--data',
    query,
    'https://overpass-api.de/api/interpreter',
  ]);

  const json = JSON.parse(stdout);
  if (!json.elements) throw new Error(`Overpass API: respuesta inesperada — ${stdout.slice(0, 200)}`);
  return json.elements;
}

function classify(tags) {
  const name = (tags.name ?? '').toLowerCase();
  if (/lubricentro|lubri/.test(name)) return 'lubricentro';
  if (/escape|silenciador/.test(name)) return 'casa_de_escape';
  if (tags.shop === 'tyres' || /gomer/.test(name)) return 'gomeria';
  if (tags.amenity === 'car_wash' || /lavadero|car.?wash/.test(name)) return 'lavadero';
  if (tags.shop === 'car_repair') return 'mecanico';
  return null;
}

function toAddress(tags) {
  const street = tags['addr:street'];
  const number = tags['addr:housenumber'];
  const city = tags['addr:city'];
  const parts = [street && number ? `${street} ${number}` : street, city].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

const { lat: centerLat, lng: centerLng } = await geocodeZone(zone);
const elements = await fetchOverpass(centerLat, centerLng);

const seen = new Map();
for (const el of elements) {
  const tags = el.tags ?? {};
  const category = classify(tags);
  if (!category || !tags.name) continue;

  const key = `${el.type}/${el.id}`;
  const point = el.type === 'node' ? el : el.center;
  if (!point) continue;

  seen.set(key, {
    name: tags.name,
    category,
    address: toAddress(tags),
    lat: point.lat,
    lng: point.lon,
    phone: tags.phone ?? tags['contact:phone'] ?? null,
  });
}

const workshops = [...seen.values()];
if (!workshops.length) {
  console.error('Sin resultados — revisar la zona, el radio, o falta de datos en OSM ahí.');
  process.exit(1);
}

const values = workshops
  .map((w) => {
    const name = escapeSql(w.name);
    const address = w.address ? `'${escapeSql(w.address)}'` : 'null';
    const phone = w.phone ? `'${escapeSql(w.phone)}'` : 'null';
    return `  ('${name}', '${w.category}', ${address}, ${w.lat}, ${w.lng}, ${phone}, 'osm')`;
  })
  .join(',\n');

const sql = `-- =========================================================
-- Seed de talleres vía OpenStreetMap — generado por
-- scripts/fetch_workshops.mjs "${zone}" (radio ${radius}m). Correr DESPUÉS
-- de schema.sql.
-- =========================================================
-- source = 'osm' (agregar valor si el check constraint de la columna lo
-- pide — el schema hoy solo documenta 'google_places' | 'manual' como
-- convención, no hay constraint que lo fuerce).

insert into workshops (name, category, address, lat, lng, phone, source) values
${values};
`;

process.stdout.write(sql);
console.error(`\n${workshops.length} talleres — SQL en stdout.`);
