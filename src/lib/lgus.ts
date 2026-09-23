export type Lgu = {
  slug: string;
  name: string;
  type: "City" | "Municipality";
};

// The 23 cities/municipalities of the Province of Cavite.
export const LGUS: Lgu[] = [
  // Cities (6)
  { slug: "bacoor", name: "Bacoor City", type: "City" },
  { slug: "cavite-city", name: "Cavite City", type: "City" },
  { slug: "dasmarinas", name: "Dasmariñas City", type: "City" },
  { slug: "imus", name: "Imus City", type: "City" },
  { slug: "tagaytay", name: "Tagaytay City", type: "City" },
  { slug: "trece-martires", name: "Trece Martires City", type: "City" },

  // Municipalities (17)
  { slug: "alfonso", name: "Alfonso", type: "Municipality" },
  { slug: "amadeo", name: "Amadeo", type: "Municipality" },
  { slug: "carmona", name: "Carmona", type: "Municipality" },
  { slug: "gen-mariano-alvarez", name: "General Mariano Alvarez", type: "Municipality" },
  { slug: "gen-emilio-aguinaldo", name: "General Emilio Aguinaldo", type: "Municipality" },
  { slug: "general-trias", name: "General Trias", type: "Municipality" },
  { slug: "indang", name: "Indang", type: "Municipality" },
  { slug: "kawit", name: "Kawit", type: "Municipality" },
  { slug: "magallanes", name: "Magallanes", type: "Municipality" },
  { slug: "maragondon", name: "Maragondon", type: "Municipality" },
  { slug: "mendez", name: "Mendez", type: "Municipality" },
  { slug: "naic", name: "Naic", type: "Municipality" },
  { slug: "noveleta", name: "Noveleta", type: "Municipality" },
  { slug: "rosario", name: "Rosario", type: "Municipality" },
  { slug: "silang", name: "Silang", type: "Municipality" },
  { slug: "tanza", name: "Tanza", type: "Municipality" },
  { slug: "ternate", name: "Ternate", type: "Municipality" },
];

export function getLguBySlug(slug: string): Lgu | undefined {
  return LGUS.find((l) => l.slug === slug);
}

export function getLguByName(name: string): Lgu | undefined {
  return LGUS.find((l) => l.name.toLowerCase() === name.toLowerCase());
}
