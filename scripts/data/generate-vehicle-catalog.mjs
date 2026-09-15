#!/usr/bin/env node
/**
 * Generates shared/vehicles/catalog.json — canonical UAE vehicle Make→Model reference.
 * Run: node scripts/data/generate-vehicle-catalog.mjs
 * Idempotent: overwrites catalog.json with the same deterministic content.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const out = path.join(root, "shared/vehicles/catalog.json");

/** @type {Array<{ nameEn: string, nameAr: string, models: string[] }>} */
const RAW = [
  { nameEn: "Toyota", nameAr: "تويوتا", models: ["Yaris","Corolla","Camry","Avalon","Crown","RAV4","Highlander","Prado","Land Cruiser","Fortuner","Hilux","Supra","C-HR","Corolla Cross","Sequoia","Tundra","4Runner","bZ4X","Alphard","Hiace"] },
  { nameEn: "Lexus", nameAr: "لكزس", models: ["UX","NX","RX","GX","LX","ES","IS","GS","LS","RC","LC","LM","TX","LX 600"] },
  { nameEn: "Nissan", nameAr: "نيسان", models: ["Sunny","Altima","Maxima","Kicks","X-Trail","Pathfinder","Patrol","Patrol Safari","Navara","GT-R","Ariya","Juke","Sentra","Terra","Urvan"] },
  { nameEn: "Infiniti", nameAr: "إنفينيتي", models: ["Q50","Q60","QX50","QX55","QX60","QX80"] },
  { nameEn: "Honda", nameAr: "هوندا", models: ["City","Civic","Accord","CR-V","HR-V","ZR-V","Pilot","Odyssey","e:Ny1"] },
  { nameEn: "Acura", nameAr: "أكيورا", models: ["ADX","Integra","MDX","RDX","TLX","ZDX"] },
  { nameEn: "Mazda", nameAr: "مازدا", models: ["Mazda2","Mazda3","Mazda6","CX-3","CX-30","CX-5","CX-60","CX-90","CX-9","MX-5","MX-30"] },
  { nameEn: "Mitsubishi", nameAr: "ميتسوبيشي", models: ["Attrage","Lancer","ASX","Eclipse Cross","Outlander","Pajero","Pajero Sport","L200","Montero","Xpander"] },
  { nameEn: "Subaru", nameAr: "سوبارو", models: ["Impreza","WRX","Legacy","Outback","Forester","Crosstrek","XV","BRZ","Solterra","Ascent"] },
  { nameEn: "Suzuki", nameAr: "سوزوكي", models: ["Swift","Dzire","Ciaz","Baleno","Vitara","Grand Vitara","Jimny","Ertiga","Fronx","S-Presso","Carry"] },
  { nameEn: "Isuzu", nameAr: "إيسوزو", models: ["D-Max","MU-X","NPR","NQR"] },
  { nameEn: "Daihatsu", nameAr: "دايهاتسو", models: ["Terios","Gran Max","Rocky","Sirion"] },
  { nameEn: "Mercedes-Benz", nameAr: "مرسيدس بنز", models: ["A-Class","B-Class","C-Class","E-Class","S-Class","CLA","CLS","GLA","GLB","GLC","GLE","GLS","G-Class","G 63","AMG GT","SL","EQA","EQB","EQC","EQE","EQS","EQS SUV","V-Class","Sprinter","Maybach S-Class","Maybach GLS"] },
  { nameEn: "BMW", nameAr: "بي إم دبليو", models: ["1 Series","2 Series","3 Series","4 Series","5 Series","7 Series","8 Series","X1","X2","X3","X4","X5","X6","X7","XM","Z4","i4","i5","i7","iX","iX1","iX3","M3","M4","M5","M8"] },
  { nameEn: "MINI", nameAr: "ميني", models: ["Cooper","Cooper S","Clubman","Countryman","Aceman","John Cooper Works"] },
  { nameEn: "Audi", nameAr: "أودي", models: ["A1","A3","A4","A5","A6","A7","A8","Q2","Q3","Q5","Q7","Q8","TT","R8","e-tron","Q4 e-tron","Q8 e-tron","e-tron GT","RS3","RS6","RS7","RS Q8"] },
  { nameEn: "Volkswagen", nameAr: "فولكس واجن", models: ["Polo","Golf","Passat","Arteon","T-Roc","Tiguan","Touareg","Teramont","ID.3","ID.4","ID.6","ID.7","Caddy","Transporter","Amarok"] },
  { nameEn: "Porsche", nameAr: "بورشه", models: ["911","718 Cayman","718 Boxster","Panamera","Cayenne","Macan","Taycan"] },
  { nameEn: "Opel", nameAr: "أوبل", models: ["Corsa","Astra","Mokka","Crossland","Grandland","Insignia","Combo"] },
  { nameEn: "Smart", nameAr: "سمارت", models: ["Fortwo","Forfour","#1","#3"] },
  { nameEn: "Land Rover", nameAr: "لاند روفر", models: ["Defender","Discovery","Discovery Sport","Range Rover","Range Rover Sport","Range Rover Velar","Range Rover Evoque"] },
  { nameEn: "Range Rover", nameAr: "رنج روفر", models: ["Range Rover","Range Rover Sport","Range Rover Velar","Range Rover Evoque"] },
  { nameEn: "Jaguar", nameAr: "جاكوار", models: ["XE","XF","F-Type","E-Pace","F-Pace","I-Pace","F-Pace SVR"] },
  { nameEn: "Bentley", nameAr: "بنتلي", models: ["Continental GT","Flying Spur","Bentayga"] },
  { nameEn: "Rolls-Royce", nameAr: "رولز رويس", models: ["Ghost","Phantom","Wraith","Dawn","Cullinan","Spectre"] },
  { nameEn: "Aston Martin", nameAr: "أستون مارتن", models: ["DB12","DBX","Vantage","DBS","Valhalla"] },
  { nameEn: "McLaren", nameAr: "مكلارين", models: ["Artura","720S","750S","GT","Senna","Elva"] },
  { nameEn: "Lotus", nameAr: "لوتس", models: ["Emira","Eletre","Evija","Emeya"] },
  { nameEn: "MG", nameAr: "إم جي", models: ["MG3","MG5","MG6","ZS","HS","RX5","RX8","Cyberster","MG4","Marvel R"] },
  { nameEn: "Ford", nameAr: "فورد", models: ["Fiesta","Focus","Fusion","Mustang","Escape","Edge","Explorer","Expedition","Bronco","Bronco Sport","Ranger","F-150","F-150 Lightning","Territory","Everest","Transit"] },
  { nameEn: "Lincoln", nameAr: "لينكولن", models: ["Corsair","Nautilus","Aviator","Navigator"] },
  { nameEn: "Chevrolet", nameAr: "شيفروليه", models: ["Spark","Malibu","Camaro","Corvette","Trax","Trailblazer","Equinox","Blazer","Traverse","Tahoe","Suburban","Colorado","Silverado","Captiva"] },
  { nameEn: "GMC", nameAr: "جي إم سي", models: ["Terrain","Acadia","Yukon","Yukon XL","Canyon","Sierra","Hummer EV"] },
  { nameEn: "Cadillac", nameAr: "كاديلاك", models: ["CT4","CT5","XT4","XT5","XT6","Escalade","Lyriq","Optiq","Vistiq"] },
  { nameEn: "Chrysler", nameAr: "كرايسلر", models: ["300","Pacifica","Voyager"] },
  { nameEn: "Dodge", nameAr: "دودج", models: ["Charger","Challenger","Durango","Hornet","Ram 1500"] },
  { nameEn: "Jeep", nameAr: "جيب", models: ["Renegade","Compass","Cherokee","Grand Cherokee","Wrangler","Gladiator","Avenger","Wagoneer"] },
  { nameEn: "Ram", nameAr: "رام", models: ["1500","2500","3500","ProMaster"] },
  { nameEn: "Tesla", nameAr: "تسلا", models: ["Model 3","Model Y","Model S","Model X","Cybertruck"] },
  { nameEn: "Rivian", nameAr: "ريفيان", models: ["R1T","R1S","R2"] },
  { nameEn: "Lucid", nameAr: "لوسيد", models: ["Air","Gravity"] },
  { nameEn: "Ferrari", nameAr: "فيراري", models: ["Roma","Roma Spider","SF90","296 GTB","F8 Tributo","Purosangue","12Cilindri","812"] },
  { nameEn: "Lamborghini", nameAr: "لامبورغيني", models: ["Huracán","Revuelto","Urus","Temerario"] },
  { nameEn: "Maserati", nameAr: "مازيراتي", models: ["Ghibli","Quattroporte","Levante","Grecale","MC20","GranTurismo"] },
  { nameEn: "Alfa Romeo", nameAr: "ألفا روميو", models: ["Giulia","Stelvio","Tonale","Junior"] },
  { nameEn: "Fiat", nameAr: "فيات", models: ["500","500X","500e","Tipo","Panda","Doblo"] },
  { nameEn: "Abarth", nameAr: "أبارث", models: ["595","695","500e","Pulse"] },
  { nameEn: "Pagani", nameAr: "باجاني", models: ["Huayra","Utopia"] },
  { nameEn: "Peugeot", nameAr: "بيجو", models: ["208","308","408","508","2008","3008","5008","Partner","Expert","Boxer"] },
  { nameEn: "Citroen", nameAr: "سيتروين", models: ["C3","C4","C5 Aircross","Berlingo","Jumpy","Jumper"] },
  { nameEn: "Renault", nameAr: "رينو", models: ["Clio","Megane","Captur","Arkana","Austral","Koleos","Duster","Trafic","Master","Megane E-Tech"] },
  { nameEn: "Dacia", nameAr: "داسيا", models: ["Sandero","Duster","Jogger","Spring","Bigster"] },
  { nameEn: "DS Automobiles", nameAr: "دي إس", models: ["DS 3","DS 4","DS 7","DS 9"] },
  { nameEn: "Bugatti", nameAr: "بوجاتي", models: ["Chiron","Mistral","Tourbillon"] },
  { nameEn: "Volvo", nameAr: "فولفو", models: ["S60","S90","V60","V90","XC40","XC60","XC90","EX30","EX90","C40"] },
  { nameEn: "Polestar", nameAr: "بولستار", models: ["2","3","4"] },
  { nameEn: "Saab", nameAr: "ساب", models: ["9-3","9-5","9-7X"] },
  { nameEn: "Koenigsegg", nameAr: "كوينيجسيج", models: ["Jesko","Gemera","CC850","Regera"] },
  { nameEn: "Hyundai", nameAr: "هيونداي", models: ["i10","Accent","Elantra","Sonata","Azera","Creta","Tucson","Santa Fe","Palisade","Kona","Ioniq 5","Ioniq 6","Staria","H-1","Venue"] },
  { nameEn: "Genesis", nameAr: "جينيسيس", models: ["G70","G80","G90","GV60","GV70","GV80"] },
  { nameEn: "Kia", nameAr: "كيا", models: ["Picanto","Pegas","Cerato","K5","K8","Sportage","Sorento","Telluride","Seltos","Carnival","EV6","EV9","Niro","Rio"] },
  { nameEn: "KGM", nameAr: "كي جي إم", models: ["Tivoli","Korando","Rexton","Torres","Musso"] },
  { nameEn: "BYD", nameAr: "بي واي دي", models: ["Seagull","Dolphin","Seal","Sealion 7","Atto 3","Song Plus","Tang","Han","Yangwang U8","Shark"] },
  { nameEn: "Geely", nameAr: "جيلي", models: ["Emgrand","Coolray","Monjaro","Okavango","Geometry C","Preface","Galaxy E8"] },
  { nameEn: "Zeekr", nameAr: "زيكر", models: ["001","007","X","009","7X"] },
  { nameEn: "Chery", nameAr: "شيري", models: ["Arrizo 5","Arrizo 8","Tiggo 4","Tiggo 7","Tiggo 8","Tiggo 9","eQ7"] },
  { nameEn: "Exeed", nameAr: "إكسيد", models: ["TXL","VX","RX","LX"] },
  { nameEn: "Jetour", nameAr: "جيتور", models: ["Dashing","X70","X90","T2","T1"] },
  { nameEn: "Haval", nameAr: "هافال", models: ["Jolion","H6","H9","Dargo","H6 GT"] },
  { nameEn: "GWM", nameAr: "جي دبليو إم", models: ["Poer","Cannon","Tank 300","Tank 500","Ora Good Cat"] },
  { nameEn: "Tank", nameAr: "تانك", models: ["300","400","500","700"] },
  { nameEn: "Hongqi", nameAr: "هونغتشي", models: ["H5","H9","HS5","HS7","E-HS9","EH7"] },
  { nameEn: "NIO", nameAr: "نيو", models: ["ET5","ET7","ES6","ES8","EC6","EC7"] },
  { nameEn: "XPeng", nameAr: "إكس بنج", models: ["G6","G9","P7","P5","X9"] },
  { nameEn: "Li Auto", nameAr: "لي أوتو", models: ["L6","L7","L8","L9","MEGA"] },
  { nameEn: "Changan", nameAr: "شانجان", models: ["Alsvin","Eado","CS35 Plus","CS55 Plus","CS75 Plus","UNI-T","UNI-V","UNI-K","Hunter"] },
  { nameEn: "Deepal", nameAr: "ديبال", models: ["S07","S05","L07","G318"] },
  { nameEn: "JAC", nameAr: "جاك", models: ["J7","JS4","JS6","T8","iEV7S"] },
  { nameEn: "BAIC", nameAr: "بايك", models: ["X55","X7","BJ40","EU5"] },
  { nameEn: "Dongfeng", nameAr: "دونغفينغ", models: ["Shine","AX7","Mage","Huge","Boxer"] },
  { nameEn: "Forthing", nameAr: "فورثينج", models: ["T5 EVO","U-Tour","Friday"] },
  { nameEn: "GAC", nameAr: "جي إيه سي", models: ["GS3","GS4","GS8","Empow","M8"] },
  { nameEn: "Aion", nameAr: "أيون", models: ["S","Y","V","LX","Hyper GT"] },
  { nameEn: "Rox", nameAr: "روكس", models: ["01"] },
  { nameEn: "Jaecoo", nameAr: "جايكو", models: ["J5","J7","J8"] },
  { nameEn: "Omoda", nameAr: "أومودا", models: ["C5","E5","C7"] },
  { nameEn: "Leapmotor", nameAr: "ليب موتور", models: ["C10","C11","T03","B10"] },
  { nameEn: "Mahindra", nameAr: "ماهيندرا", models: ["XUV700","Scorpio","Thar","Bolero","XUV300"] },
  { nameEn: "Tata", nameAr: "تاتا", models: ["Nexon","Punch","Harrier","Safari","Tiago"] },
  { nameEn: "Proton", nameAr: "بروتون", models: ["Saga","Persona","X50","X70","X90"] },
  { nameEn: "Perodua", nameAr: "بيرودوا", models: ["Myvi","Axia","Bezza","Ativa"] },
  { nameEn: "Skoda", nameAr: "سكودا", models: ["Fabia","Octavia","Superb","Kamiq","Karoq","Kodiaq","Enyaq"] },
  { nameEn: "Seat", nameAr: "سيات", models: ["Ibiza","Leon","Arona","Ateca","Tarraco"] },
  { nameEn: "Cupra", nameAr: "كوبرا", models: ["Leon","Formentor","Ateca","Born","Tavascan"] },
  { nameEn: "Hummer", nameAr: "همر", models: ["H2","H3","EV Pickup","EV SUV"] },
  { nameEn: "Iveco", nameAr: "إيفيكو", models: ["Daily","Eurocargo"] },
  { nameEn: "MAN", nameAr: "مان", models: ["TGE","TGX"] },
  { nameEn: "Hino", nameAr: "هينو", models: ["300 Series","500 Series"] },
  { nameEn: "Foton", nameAr: "فوتون", models: ["Tunland","View","Aumark"] },
  { nameEn: "Maxus", nameAr: "ماكسوس", models: ["D60","D90","G10","G50","T60","Deliver 9"] },
  { nameEn: "Great Wall", nameAr: "جريت وول", models: ["Wingle","Poer","Cannon"] },
  { nameEn: "SsangYong", nameAr: "سانج يونج", models: ["Tivoli","Korando","Rexton","Musso","Actyon"] },
];

function slugify(name) {
  return name
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

const makes = [];
const models = [];
const seenMakeSlugs = new Set();
let makeSort = 0;

for (const entry of RAW) {
  const slug = slugify(entry.nameEn);
  if (seenMakeSlugs.has(slug)) {
    throw new Error(`Duplicate make slug: ${slug}`);
  }
  seenMakeSlugs.add(slug);
  const makeId = `make-${slug}`;
  makeSort += 10;
  makes.push({
    id: makeId,
    slug,
    nameEn: entry.nameEn,
    nameAr: entry.nameAr,
    status: "active",
    sortOrder: makeSort,
  });

  const seenModelSlugs = new Set();
  let modelSort = 0;
  for (const modelName of entry.models) {
    const modelSlug = slugify(modelName);
    if (seenModelSlugs.has(modelSlug)) continue;
    seenModelSlugs.add(modelSlug);
    modelSort += 10;
    models.push({
      id: `model-${slug}-${modelSlug}`,
      makeId,
      makeSlug: slug,
      slug: modelSlug,
      nameEn: modelName,
      nameAr: modelName,
      active: true,
      sortOrder: modelSort,
    });
  }
}

const catalog = {
  version: 1,
  generatedAt: "2026-09-15T00:00:00.000Z",
  source: "sooqna-uae-vehicle-reference",
  makes,
  models,
};

writeFileSync(out, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(
  JSON.stringify(
    {
      out: path.relative(root, out),
      makes: makes.length,
      models: models.length,
      activeMakes: makes.filter((m) => m.status === "active").length,
    },
    null,
    2,
  ),
);
