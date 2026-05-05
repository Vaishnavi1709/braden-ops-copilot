// 12-store roster for the Braden Auto Group.
// Markets are clustered around Chillicothe, OH (HQ) — Ross County and the
// surrounding Pickaway / Pike / Scioto / Fairfield / Athens / Hocking
// footprint, plus two Columbus-metro luxury stores. Mix is tuned so the group
// has realistic brand and size variety (high-volume mass brands + a couple of
// luxury / specialty stores). Names, GMs, and baselines are illustrative.

export type Brand =
  | "Ford"
  | "Chevrolet"
  | "Toyota"
  | "Honda"
  | "Nissan"
  | "Hyundai"
  | "Kia"
  | "GMC"
  | "Mazda"
  | "Lexus"
  | "BMW"
  | "Subaru";

export type StorePersona = "high-volume" | "luxury" | "service-heavy" | "balanced";

export type Store = {
  id: string;
  name: string;
  brand: Brand;
  city: string;
  state: string;
  gm: { name: string; email: string };
  bays: number;
  persona: StorePersona;
  // Baseline daily expectations — used to scale mock data per store.
  baseline: {
    newUnitsPerDay: number;
    usedUnitsPerDay: number;
    webLeadsPerDay: number;
    roPerDay: number;
    frontGross: number;
    backGross: number;
    csi: number;
  };
};

export const STORES: readonly Store[] = [
  {
    id: "BRD-01",
    name: "Braden Ford of Chillicothe",
    brand: "Ford",
    city: "Chillicothe",
    state: "OH",
    gm: { name: "Marcus Reyes", email: "marcus.reyes@bradenauto.com" },
    bays: 18,
    persona: "high-volume",
    baseline: {
      newUnitsPerDay: 9,
      usedUnitsPerDay: 7,
      webLeadsPerDay: 38,
      roPerDay: 64,
      frontGross: 2100,
      backGross: 1850,
      csi: 91,
    },
  },
  {
    id: "BRD-02",
    name: "Braden Chevrolet Circleville",
    brand: "Chevrolet",
    city: "Circleville",
    state: "OH",
    gm: { name: "Dana Whitlock", email: "dana.whitlock@bradenauto.com" },
    bays: 16,
    persona: "high-volume",
    baseline: {
      newUnitsPerDay: 8,
      usedUnitsPerDay: 8,
      webLeadsPerDay: 34,
      roPerDay: 58,
      frontGross: 2050,
      backGross: 1780,
      csi: 89,
    },
  },
  {
    id: "BRD-03",
    name: "Braden Toyota Lancaster",
    brand: "Toyota",
    city: "Lancaster",
    state: "OH",
    gm: { name: "Priya Natarajan", email: "priya.natarajan@bradenauto.com" },
    bays: 22,
    persona: "service-heavy",
    baseline: {
      newUnitsPerDay: 11,
      usedUnitsPerDay: 9,
      webLeadsPerDay: 44,
      roPerDay: 88,
      frontGross: 1950,
      backGross: 1920,
      csi: 93,
    },
  },
  {
    id: "BRD-04",
    name: "Braden Honda Athens",
    brand: "Honda",
    city: "Athens",
    state: "OH",
    gm: { name: "Tomás Aguilar", email: "tomas.aguilar@bradenauto.com" },
    bays: 14,
    persona: "balanced",
    baseline: {
      newUnitsPerDay: 7,
      usedUnitsPerDay: 6,
      webLeadsPerDay: 30,
      roPerDay: 52,
      frontGross: 1850,
      backGross: 1700,
      csi: 90,
    },
  },
  {
    id: "BRD-05",
    name: "Braden Nissan Portsmouth",
    brand: "Nissan",
    city: "Portsmouth",
    state: "OH",
    gm: { name: "Alicia Carver", email: "alicia.carver@bradenauto.com" },
    bays: 12,
    persona: "balanced",
    baseline: {
      newUnitsPerDay: 6,
      usedUnitsPerDay: 7,
      webLeadsPerDay: 28,
      roPerDay: 48,
      frontGross: 1680,
      backGross: 1620,
      csi: 87,
    },
  },
  {
    id: "BRD-06",
    name: "Braden Hyundai Hillsboro",
    brand: "Hyundai",
    city: "Hillsboro",
    state: "OH",
    gm: { name: "Devon Park", email: "devon.park@bradenauto.com" },
    bays: 10,
    persona: "high-volume",
    baseline: {
      newUnitsPerDay: 7,
      usedUnitsPerDay: 6,
      webLeadsPerDay: 31,
      roPerDay: 42,
      frontGross: 1750,
      backGross: 1690,
      csi: 88,
    },
  },
  {
    id: "BRD-07",
    name: "Braden Kia Waverly",
    brand: "Kia",
    city: "Waverly",
    state: "OH",
    gm: { name: "Renata Salinas", email: "renata.salinas@bradenauto.com" },
    bays: 10,
    persona: "balanced",
    baseline: {
      newUnitsPerDay: 6,
      usedUnitsPerDay: 5,
      webLeadsPerDay: 26,
      roPerDay: 40,
      frontGross: 1620,
      backGross: 1580,
      csi: 86,
    },
  },
  {
    id: "BRD-08",
    name: "Braden GMC Washington Court House",
    brand: "GMC",
    city: "Washington Court House",
    state: "OH",
    gm: { name: "Kyle Henderson", email: "kyle.henderson@bradenauto.com" },
    bays: 14,
    persona: "high-volume",
    baseline: {
      newUnitsPerDay: 8,
      usedUnitsPerDay: 6,
      webLeadsPerDay: 32,
      roPerDay: 50,
      frontGross: 2400,
      backGross: 1900,
      csi: 90,
    },
  },
  {
    id: "BRD-09",
    name: "Braden Mazda Jackson",
    brand: "Mazda",
    city: "Jackson",
    state: "OH",
    gm: { name: "Sofia Chen", email: "sofia.chen@bradenauto.com" },
    bays: 8,
    persona: "balanced",
    baseline: {
      newUnitsPerDay: 4,
      usedUnitsPerDay: 4,
      webLeadsPerDay: 20,
      roPerDay: 30,
      frontGross: 1820,
      backGross: 1640,
      csi: 89,
    },
  },
  {
    id: "BRD-10",
    name: "Braden Lexus Dublin",
    brand: "Lexus",
    city: "Dublin",
    state: "OH",
    gm: { name: "Harriet Owusu", email: "harriet.owusu@bradenauto.com" },
    bays: 20,
    persona: "luxury",
    baseline: {
      newUnitsPerDay: 5,
      usedUnitsPerDay: 4,
      webLeadsPerDay: 22,
      roPerDay: 72,
      frontGross: 4200,
      backGross: 2400,
      csi: 95,
    },
  },
  {
    id: "BRD-11",
    name: "Braden BMW Easton",
    brand: "BMW",
    city: "Columbus",
    state: "OH",
    gm: { name: "Alexei Volkov", email: "alexei.volkov@bradenauto.com" },
    bays: 18,
    persona: "luxury",
    baseline: {
      newUnitsPerDay: 5,
      usedUnitsPerDay: 4,
      webLeadsPerDay: 24,
      roPerDay: 64,
      frontGross: 3900,
      backGross: 2300,
      csi: 94,
    },
  },
  {
    id: "BRD-12",
    name: "Braden Subaru Logan",
    brand: "Subaru",
    city: "Logan",
    state: "OH",
    gm: { name: "Connor McAllister", email: "connor.mcallister@bradenauto.com" },
    bays: 10,
    persona: "service-heavy",
    baseline: {
      newUnitsPerDay: 5,
      usedUnitsPerDay: 4,
      webLeadsPerDay: 22,
      roPerDay: 46,
      frontGross: 1750,
      backGross: 1660,
      csi: 92,
    },
  },
];

export function findStore(id: string): Store | undefined {
  return STORES.find((s) => s.id === id);
}
