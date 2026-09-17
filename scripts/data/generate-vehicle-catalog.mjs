#!/usr/bin/env node
/**
 * Generates shared/vehicles/catalog.json — canonical UAE vehicle Make→Model reference.
 * Run: node scripts/data/generate-vehicle-catalog.mjs
 *
 * Taxonomy rules (Dubizzle used as market coverage benchmark, not blind copy):
 * - Range Rover → models under Land Rover (alias Range Rover → Land Rover)
 * - SsangYong → alias of KGM (canonical KGM)
 * - Great Wall → alias of GWM (canonical GWM)
 * - Mercedes-Maybach / Maybach → alias of Mercedes-Benz (Maybach models under Benz)
 * - Popular UAE makes sorted first; remaining A–Z by English name
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const out = path.join(root, "shared/vehicles/catalog.json");

/** Popular UAE used-car demand order (sort first). Remaining makes sort A–Z. */
const POPULAR_UAE = [
  "Toyota",
  "Nissan",
  "Mercedes-Benz",
  "BMW",
  "Lexus",
  "Hyundai",
  "Kia",
  "Honda",
  "Land Rover",
  "Ford",
  "Mitsubishi",
  "Chevrolet",
  "Audi",
  "Porsche",
  "Jeep",
  "GMC",
  "Mazda",
  "Suzuki",
  "Volkswagen",
  "Infiniti",
  "Cadillac",
  "BYD",
  "Tesla",
  "MG",
  "Geely",
  "Changan",
  "Haval",
  "Jetour",
  "Chery",
  "Dodge",
  "Jaguar",
  "Bentley",
  "Rolls-Royce",
  "Volvo",
  "Peugeot",
  "Renault",
  "Isuzu",
  "MINI",
  "Genesis",
  "Zeekr",
  "Exeed",
  "Omoda",
  "Jaecoo",
];

/**
 * @typedef {{
 *   nameEn: string,
 *   nameAr: string,
 *   country?: [string, string, string],
 *   aliases?: string[],
 *   models: string[],
 * }} RawMake
 */

/** @type {RawMake[]} */
const RAW = [
  // —— Japan ——
  { nameEn: "Toyota", nameAr: "تويوتا", country: ["JP", "Japan", "اليابان"], aliases: ["تويوتا"], models: ["Yaris","Corolla","Camry","Avalon","Crown","Raize","Urban Cruiser","RAV4","Highlander","Prado","Land Cruiser","Fortuner","Hilux","Supra","GR86","86","C-HR","Corolla Cross","Sequoia","Tundra","4Runner","bZ4X","Alphard","Hiace"] },
  { nameEn: "Lexus", nameAr: "لكزس", country: ["JP", "Japan", "اليابان"], aliases: ["لكزس"], models: ["UX","NX","RX","GX","LX","ES","IS","GS","LS","RC","LC","LM","TX","LX 600"] },
  { nameEn: "Nissan", nameAr: "نيسان", country: ["JP", "Japan", "اليابان"], aliases: ["نيسان"], models: ["Sunny","Altima","Maxima","Kicks","X-Trail","Pathfinder","Patrol","Patrol Safari","Navara","GT-R","Ariya","Juke","Sentra","Terra","X-Terra","Urvan","Z","370Z","350Z"] },
  { nameEn: "Infiniti", nameAr: "إنفينيتي", country: ["JP", "Japan", "اليابان"], aliases: ["إنفينيتي"], models: ["Q50","Q60","QX50","QX55","QX60","QX80"] },
  { nameEn: "Honda", nameAr: "هوندا", country: ["JP", "Japan", "اليابان"], aliases: ["هوندا"], models: ["City","Civic","Accord","CR-V","HR-V","ZR-V","Pilot","Odyssey","e:Ny1","Elevate"] },
  { nameEn: "Acura", nameAr: "أكيورا", country: ["JP", "Japan", "اليابان"], aliases: ["أكيورا"], models: ["ADX","Integra","MDX","RDX","TLX","ZDX"] },
  { nameEn: "Mazda", nameAr: "مازدا", country: ["JP", "Japan", "اليابان"], aliases: ["مازدا"], models: ["Mazda2","Mazda3","Mazda6","CX-3","CX-30","CX-5","CX-60","CX-90","CX-9","MX-5","MX-30"] },
  { nameEn: "Mitsubishi", nameAr: "ميتسوبيشي", country: ["JP", "Japan", "اليابان"], aliases: ["ميتسوبيشي"], models: ["Attrage","Lancer","ASX","Eclipse Cross","Outlander","Pajero","Pajero Sport","L200","Montero","Xpander"] },
  { nameEn: "Subaru", nameAr: "سوبارو", country: ["JP", "Japan", "اليابان"], aliases: ["سوبارو"], models: ["Impreza","WRX","Legacy","Outback","Forester","Crosstrek","XV","BRZ","Solterra","Ascent"] },
  { nameEn: "Suzuki", nameAr: "سوزوكي", country: ["JP", "Japan", "اليابان"], aliases: ["سوزوكي"], models: ["Swift","Dzire","Ciaz","Baleno","Vitara","Grand Vitara","Jimny","Ertiga","Fronx","S-Presso","Carry"] },
  { nameEn: "Isuzu", nameAr: "إيسوزو", country: ["JP", "Japan", "اليابان"], aliases: ["إيسوزو"], models: ["D-Max","MU-X","NPR","NQR"] },
  { nameEn: "Daihatsu", nameAr: "دايهاتسو", country: ["JP", "Japan", "اليابان"], aliases: ["دايهاتسو"], models: ["Terios","Gran Max","Rocky","Sirion"] },
  { nameEn: "Hino", nameAr: "هينو", country: ["JP", "Japan", "اليابان"], aliases: ["هينو"], models: ["300 Series","500 Series"] },
  { nameEn: "Fuso", nameAr: "فوسو", country: ["JP", "Japan", "اليابان"], aliases: ["Mitsubishi Fuso","ميتسوبيشي فوسو","فوسو"], models: ["Canter","Fighter","Rosa"] },

  // —— Germany / UK / Europe ——
  {
    nameEn: "Mercedes-Benz",
    nameAr: "مرسيدس بنز",
    country: ["DE", "Germany", "ألمانيا"],
    aliases: [
      "Mercedes",
      "Mercedes Benz",
      "Benz",
      "AMG",
      "Maybach",
      "Mercedes-Maybach",
      "Mercedes Maybach",
      "مرسيدس",
      "مرسيدس بنز",
      "مايباخ",
      "مرسيدس مايباخ",
    ],
    models: [
      "A-Class","B-Class","C-Class","E-Class","S-Class","CLA","CLS",
      "GLA","GLB","GLC","GLE","GLS","G-Class","G 63","AMG GT","SL",
      "EQA","EQB","EQC","EQE","EQS","EQS SUV","V-Class","Sprinter",
      "Maybach S-Class","Maybach GLS","Maybach SL",
    ],
  },
  { nameEn: "BMW", nameAr: "بي إم دبليو", country: ["DE", "Germany", "ألمانيا"], aliases: ["بي ام دبليو","بي إم دبليو"], models: ["1 Series","2 Series","3 Series","4 Series","5 Series","7 Series","8 Series","X1","X2","X3","X4","X5","X6","X7","XM","Z4","i4","i5","i7","iX","iX1","iX3","M3","M4","M5","M8"] },
  { nameEn: "MINI", nameAr: "ميني", country: ["DE", "Germany", "ألمانيا"], aliases: ["Mini","ميني"], models: ["Cooper","Cooper S","Clubman","Countryman","Aceman","John Cooper Works"] },
  { nameEn: "Audi", nameAr: "أودي", country: ["DE", "Germany", "ألمانيا"], aliases: ["أودي"], models: ["A1","A3","A4","A5","A6","A7","A8","Q2","Q3","Q5","Q7","Q8","TT","R8","e-tron","Q4 e-tron","Q8 e-tron","e-tron GT","RS3","RS6","RS7","RS Q8"] },
  { nameEn: "Volkswagen", nameAr: "فولكس واجن", country: ["DE", "Germany", "ألمانيا"], aliases: ["VW","فولكس واجن"], models: ["Polo","Golf","Passat","Arteon","T-Roc","Tiguan","Touareg","Teramont","ID.3","ID.4","ID.6","ID.7","Caddy","Transporter","Amarok"] },
  { nameEn: "Porsche", nameAr: "بورشه", country: ["DE", "Germany", "ألمانيا"], aliases: ["بورش","بورشه"], models: ["911","718 Cayman","718 Boxster","Panamera","Cayenne","Macan","Taycan"] },
  { nameEn: "Opel", nameAr: "أوبل", country: ["DE", "Germany", "ألمانيا"], aliases: ["أوبل"], models: ["Corsa","Astra","Mokka","Crossland","Grandland","Insignia","Combo"] },
  { nameEn: "Smart", nameAr: "سمارت", country: ["DE", "Germany", "ألمانيا"], aliases: ["سمارت"], models: ["Fortwo","Forfour","#1","#3"] },
  { nameEn: "MAN", nameAr: "مان", country: ["DE", "Germany", "ألمانيا"], aliases: ["مان"], models: ["TGE","TGX"] },
  { nameEn: "BRABUS", nameAr: "برابوس", country: ["DE", "Germany", "ألمانيا"], aliases: ["Brabus","برابوس"], models: ["G-Class","Rocket 900","900 Superblack","XLP","GT"] },
  {
    nameEn: "Land Rover",
    nameAr: "لاند روفر",
    country: ["GB", "United Kingdom", "المملكة المتحدة"],
    aliases: [
      "Range Rover",
      "Rangerover",
      "Landrover",
      "لاند روفر",
      "رنج روفر",
      "رينج روفر",
    ],
    models: [
      "Defender","Discovery","Discovery Sport",
      "Range Rover","Range Rover Sport","Range Rover Velar","Range Rover Evoque",
    ],
  },
  { nameEn: "Jaguar", nameAr: "جاكوار", country: ["GB", "United Kingdom", "المملكة المتحدة"], aliases: ["جاكوار"], models: ["XE","XF","F-Type","E-Pace","F-Pace","I-Pace","F-Pace SVR"] },
  { nameEn: "Bentley", nameAr: "بنتلي", country: ["GB", "United Kingdom", "المملكة المتحدة"], aliases: ["بنتلي"], models: ["Continental GT","Flying Spur","Bentayga"] },
  { nameEn: "Rolls-Royce", nameAr: "رولز رويس", country: ["GB", "United Kingdom", "المملكة المتحدة"], aliases: ["Rolls Royce","رولز رويس"], models: ["Ghost","Phantom","Wraith","Dawn","Cullinan","Spectre"] },
  { nameEn: "Aston Martin", nameAr: "أستون مارتن", country: ["GB", "United Kingdom", "المملكة المتحدة"], aliases: ["أستون مارتن"], models: ["DB12","DBX","Vantage","DBS","Valhalla"] },
  { nameEn: "McLaren", nameAr: "مكلارين", country: ["GB", "United Kingdom", "المملكة المتحدة"], aliases: ["مكلارين"], models: ["Artura","720S","750S","GT","Senna","Elva"] },
  { nameEn: "Lotus", nameAr: "لوتس", country: ["GB", "United Kingdom", "المملكة المتحدة"], aliases: ["لوتس"], models: ["Emira","Eletre","Evija","Emeya"] },
  { nameEn: "INEOS", nameAr: "إينيوس", country: ["GB", "United Kingdom", "المملكة المتحدة"], aliases: ["Ineos","إينيوس"], models: ["Grenadier","Quartermaster"] },
  { nameEn: "MG", nameAr: "إم جي", country: ["GB", "United Kingdom", "المملكة المتحدة"], aliases: ["إم جي"], models: ["MG3","MG5","MG6","ZS","HS","RX5","RX8","Cyberster","MG4","Marvel R"] },

  // —— USA ——
  { nameEn: "Ford", nameAr: "فورد", country: ["US", "United States", "الولايات المتحدة"], aliases: ["فورد"], models: ["Fiesta","Focus","Fusion","Mustang","Escape","Edge","Explorer","Expedition","Bronco","Bronco Sport","Ranger","F-150","F-150 Lightning","Territory","Everest","Transit"] },
  { nameEn: "Lincoln", nameAr: "لينكولن", country: ["US", "United States", "الولايات المتحدة"], aliases: ["لينكولن"], models: ["Corsair","Nautilus","Aviator","Navigator"] },
  { nameEn: "Chevrolet", nameAr: "شيفروليه", country: ["US", "United States", "الولايات المتحدة"], aliases: ["Chevy","شيفروليه"], models: ["Spark","Malibu","Camaro","Corvette","Trax","Trailblazer","Equinox","Blazer","Traverse","Tahoe","Suburban","Colorado","Silverado","Captiva"] },
  { nameEn: "GMC", nameAr: "جي إم سي", country: ["US", "United States", "الولايات المتحدة"], aliases: ["جي إم سي"], models: ["Terrain","Acadia","Yukon","Yukon XL","Canyon","Sierra","Hummer EV"] },
  { nameEn: "Cadillac", nameAr: "كاديلاك", country: ["US", "United States", "الولايات المتحدة"], aliases: ["كاديلاك"], models: ["CT4","CT5","XT4","XT5","XT6","Escalade","Lyriq","Optiq","Vistiq"] },
  { nameEn: "Buick", nameAr: "بيوك", country: ["US", "United States", "الولايات المتحدة"], aliases: ["بيوك"], models: ["Enclave","Encore","Envision","LaCrosse","Regal"] },
  { nameEn: "Chrysler", nameAr: "كرايسلر", country: ["US", "United States", "الولايات المتحدة"], aliases: ["كرايسلر"], models: ["300","Pacifica","Voyager"] },
  { nameEn: "Dodge", nameAr: "دودج", country: ["US", "United States", "الولايات المتحدة"], aliases: ["دودج"], models: ["Charger","Challenger","Durango","Hornet","Ram 1500"] },
  { nameEn: "Jeep", nameAr: "جيب", country: ["US", "United States", "الولايات المتحدة"], aliases: ["جيب"], models: ["Renegade","Compass","Cherokee","Grand Cherokee","Wrangler","Gladiator","Avenger","Wagoneer"] },
  { nameEn: "Ram", nameAr: "رام", country: ["US", "United States", "الولايات المتحدة"], aliases: ["رام"], models: ["1500","2500","3500","ProMaster"] },
  { nameEn: "Tesla", nameAr: "تسلا", country: ["US", "United States", "الولايات المتحدة"], aliases: ["تسلا"], models: ["Model 3","Model Y","Model S","Model X","Cybertruck"] },
  { nameEn: "Rivian", nameAr: "ريفيان", country: ["US", "United States", "الولايات المتحدة"], aliases: ["ريفيان"], models: ["R1T","R1S","R2"] },
  { nameEn: "Lucid", nameAr: "لوسيد", country: ["US", "United States", "الولايات المتحدة"], aliases: ["لوسيد"], models: ["Air","Gravity"] },
  { nameEn: "Hummer", nameAr: "همر", country: ["US", "United States", "الولايات المتحدة"], aliases: ["همر"], models: ["H2","H3","EV Pickup","EV SUV"] },

  // —— Italy / France / Sweden / etc. ——
  { nameEn: "Ferrari", nameAr: "فيراري", country: ["IT", "Italy", "إيطاليا"], aliases: ["فيراري"], models: ["Roma","Roma Spider","SF90","296 GTB","F8 Tributo","Purosangue","12Cilindri","812"] },
  { nameEn: "Lamborghini", nameAr: "لامبورغيني", country: ["IT", "Italy", "إيطاليا"], aliases: ["لامبورغيني"], models: ["Huracán","Revuelto","Urus","Temerario"] },
  { nameEn: "Maserati", nameAr: "مازيراتي", country: ["IT", "Italy", "إيطاليا"], aliases: ["مازيراتي"], models: ["Ghibli","Quattroporte","Levante","Grecale","MC20","GranTurismo"] },
  { nameEn: "Alfa Romeo", nameAr: "ألفا روميو", country: ["IT", "Italy", "إيطاليا"], aliases: ["ألفا روميو"], models: ["Giulia","Stelvio","Tonale","Junior"] },
  { nameEn: "Fiat", nameAr: "فيات", country: ["IT", "Italy", "إيطاليا"], aliases: ["فيات"], models: ["500","500X","500e","Tipo","Panda","Doblo"] },
  { nameEn: "Abarth", nameAr: "أبارث", country: ["IT", "Italy", "إيطاليا"], aliases: ["أبارث"], models: ["595","695","500e","Pulse"] },
  { nameEn: "Pagani", nameAr: "باجاني", country: ["IT", "Italy", "إيطاليا"], aliases: ["باجاني"], models: ["Huayra","Utopia"] },
  { nameEn: "Iveco", nameAr: "إيفيكو", country: ["IT", "Italy", "إيطاليا"], aliases: ["إيفيكو"], models: ["Daily","Eurocargo"] },
  { nameEn: "Peugeot", nameAr: "بيجو", country: ["FR", "France", "فرنسا"], aliases: ["بيجو"], models: ["208","308","408","508","2008","3008","5008","Partner","Expert","Boxer"] },
  { nameEn: "Citroen", nameAr: "سيتروين", country: ["FR", "France", "فرنسا"], aliases: ["Citroën","سيتروين"], models: ["C3","C4","C5 Aircross","Berlingo","Jumpy","Jumper"] },
  { nameEn: "Renault", nameAr: "رينو", country: ["FR", "France", "فرنسا"], aliases: ["رينو"], models: ["Clio","Megane","Captur","Arkana","Austral","Koleos","Duster","Trafic","Master","Megane E-Tech"] },
  { nameEn: "DS Automobiles", nameAr: "دي إس", country: ["FR", "France", "فرنسا"], aliases: ["DS","دي إس"], models: ["DS 3","DS 4","DS 7","DS 9"] },
  { nameEn: "Bugatti", nameAr: "بوجاتي", country: ["FR", "France", "فرنسا"], aliases: ["بوجاتي"], models: ["Chiron","Mistral","Tourbillon"] },
  { nameEn: "Dacia", nameAr: "داسيا", country: ["RO", "Romania", "رومانيا"], aliases: ["داسيا"], models: ["Sandero","Duster","Jogger","Spring","Bigster"] },
  { nameEn: "Volvo", nameAr: "فولفو", country: ["SE", "Sweden", "السويد"], aliases: ["فولفو"], models: ["S60","S90","V60","V90","XC40","XC60","XC90","EX30","EX90","C40"] },
  { nameEn: "Polestar", nameAr: "بولستار", country: ["SE", "Sweden", "السويد"], aliases: ["بولستار"], models: ["2","3","4"] },
  { nameEn: "Saab", nameAr: "ساب", country: ["SE", "Sweden", "السويد"], aliases: ["ساب"], models: ["9-3","9-5","9-7X"] },
  { nameEn: "Koenigsegg", nameAr: "كوينيجسيج", country: ["SE", "Sweden", "السويد"], aliases: ["كوينيجسيج"], models: ["Jesko","Gemera","CC850","Regera"] },
  { nameEn: "Skoda", nameAr: "سكودا", country: ["CZ", "Czech Republic", "التشيك"], aliases: ["Škoda","سكودا"], models: ["Fabia","Octavia","Superb","Kamiq","Karoq","Kodiaq","Enyaq"] },
  { nameEn: "Seat", nameAr: "سيات", country: ["ES", "Spain", "إسبانيا"], aliases: ["SEAT","سيات"], models: ["Ibiza","Leon","Arona","Ateca","Tarraco"] },
  { nameEn: "Cupra", nameAr: "كوبرا", country: ["ES", "Spain", "إسبانيا"], aliases: ["كوبرا"], models: ["Leon","Formentor","Ateca","Born","Tavascan"] },
  { nameEn: "Aurus", nameAr: "أوروس", country: ["RU", "Russia", "روسيا"], aliases: ["أوروس"], models: ["Senat","Komendant"] },

  // —— Korea ——
  { nameEn: "Hyundai", nameAr: "هيونداي", country: ["KR", "South Korea", "كوريا الجنوبية"], aliases: ["هيونداي"], models: ["i10","Accent","Elantra","Sonata","Azera","Creta","Tucson","Santa Fe","Palisade","Kona","Ioniq 5","Ioniq 6","Staria","H-1","Venue"] },
  { nameEn: "Genesis", nameAr: "جينيسيس", country: ["KR", "South Korea", "كوريا الجنوبية"], aliases: ["جينيسيس"], models: ["G70","G80","G90","GV60","GV70","GV80"] },
  { nameEn: "Kia", nameAr: "كيا", country: ["KR", "South Korea", "كوريا الجنوبية"], aliases: ["كيا"], models: ["Picanto","Pegas","Cerato","K5","K8","Sportage","Sorento","Telluride","Seltos","Carnival","EV6","EV9","Niro","Rio"] },
  {
    nameEn: "KGM",
    nameAr: "كي جي إم",
    country: ["KR", "South Korea", "كوريا الجنوبية"],
    aliases: ["SsangYong", "Ssang Yong", "سانج يونج", "كي جي إم"],
    models: ["Tivoli", "Korando", "Rexton", "Torres", "Musso", "Actyon"],
  },

  // —— China (incl. emerging EV / UAE market) ——
  { nameEn: "BYD", nameAr: "بي واي دي", country: ["CN", "China", "الصين"], aliases: ["بي واي دي"], models: ["Seagull","Dolphin","Seal","Sealion 7","Atto 3","Song","Song Plus","Qin","Tang","Han","Shark"] },
  { nameEn: "YangWang", nameAr: "يانغ وانغ", country: ["CN", "China", "الصين"], aliases: ["Yangwang","يانغ وانغ"], models: ["U8","U9","U7"] },
  { nameEn: "Denza", nameAr: "دينزا", country: ["CN", "China", "الصين"], aliases: ["دينزا"], models: ["D9","N7","N8","B8"] },
  { nameEn: "Geely", nameAr: "جيلي", country: ["CN", "China", "الصين"], aliases: ["جيلي"], models: ["Emgrand","Coolray","Monjaro","Okavango","Geometry C","Preface","Galaxy E8"] },
  { nameEn: "Zeekr", nameAr: "زيكر", country: ["CN", "China", "الصين"], aliases: ["زيكر"], models: ["001","007","X","009","7X"] },
  { nameEn: "Lynk & Co", nameAr: "لينك آند كو", country: ["CN", "China", "الصين"], aliases: ["Lynk and Co","Lynk&Co","لينك آند كو"], models: ["01","03","05","08","09"] },
  { nameEn: "Chery", nameAr: "شيري", country: ["CN", "China", "الصين"], aliases: ["شيري"], models: ["Arrizo 5","Arrizo 8","Tiggo 4","Tiggo 7","Tiggo 8","Tiggo 9","eQ7"] },
  { nameEn: "Exeed", nameAr: "إكسيد", country: ["CN", "China", "الصين"], aliases: ["إكسيد"], models: ["TXL","VX","RX","LX"] },
  { nameEn: "Jetour", nameAr: "جيتور", country: ["CN", "China", "الصين"], aliases: ["جيتور"], models: ["Dashing","X70","X90","T2","T1"] },
  { nameEn: "Omoda", nameAr: "أومودا", country: ["CN", "China", "الصين"], aliases: ["أومودا"], models: ["C5","E5","C7"] },
  { nameEn: "Jaecoo", nameAr: "جايكو", country: ["CN", "China", "الصين"], aliases: ["جايكو"], models: ["J5","J7","J8"] },
  { nameEn: "Kaiyi", nameAr: "كايي", country: ["CN", "China", "الصين"], aliases: ["Cowin","كايي"], models: ["X3","X3 Pro","E5","Showjet"] },
  { nameEn: "Haval", nameAr: "هافال", country: ["CN", "China", "الصين"], aliases: ["هافال"], models: ["Jolion","H6","H9","Dargo","H6 GT"] },
  {
    nameEn: "GWM",
    nameAr: "جي دبليو إم",
    country: ["CN", "China", "الصين"],
    aliases: ["Great Wall", "Great Wall Motors", "جريت وول", "جي دبليو إم"],
    models: ["Poer", "Cannon", "Wingle", "Ora Good Cat"],
  },
  { nameEn: "Tank", nameAr: "تانك", country: ["CN", "China", "الصين"], aliases: ["تانك"], models: ["300","400","500","700"] },
  { nameEn: "WEY", nameAr: "وي", country: ["CN", "China", "الصين"], aliases: ["Wei","وي"], models: ["Coffee 01","Coffee 02","Lanshan","Gao Shan"] },
  { nameEn: "Ora", nameAr: "أورا", country: ["CN", "China", "الصين"], aliases: ["ORA","أورا"], models: ["Good Cat","Funky Cat","Lightning Cat"] },
  { nameEn: "Hongqi", nameAr: "هونغتشي", country: ["CN", "China", "الصين"], aliases: ["هونغتشي"], models: ["H5","H9","HS5","HS7","E-HS9","EH7"] },
  { nameEn: "NIO", nameAr: "نيو", country: ["CN", "China", "الصين"], aliases: ["نيو"], models: ["ET5","ET7","ES6","ES8","EC6","EC7"] },
  { nameEn: "XPeng", nameAr: "إكس بنج", country: ["CN", "China", "الصين"], aliases: ["Xpeng","إكس بنج"], models: ["G6","G9","P7","P5","X9"] },
  { nameEn: "Li Auto", nameAr: "لي أوتو", country: ["CN", "China", "الصين"], aliases: ["Li","لي أوتو"], models: ["L6","L7","L8","L9","MEGA"] },
  { nameEn: "Xiaomi", nameAr: "شاومي", country: ["CN", "China", "الصين"], aliases: ["شاومي"], models: ["SU7","SU7 Ultra","YU7"] },
  { nameEn: "Avatr", nameAr: "أفاتر", country: ["CN", "China", "الصين"], aliases: ["أفاتر"], models: ["06","07","11","12"] },
  { nameEn: "Voyah", nameAr: "فوياه", country: ["CN", "China", "الصين"], aliases: ["فوياه"], models: ["Free","Dreamer","Passion","Courage"] },
  { nameEn: "AITO", nameAr: "أيتو", country: ["CN", "China", "الصين"], aliases: ["Aito","أيتو"], models: ["M5","M7","M8","M9"] },
  { nameEn: "Seres", nameAr: "سيريس", country: ["CN", "China", "الصين"], aliases: ["SF5","سيريس"], models: ["5","7","SF5"] },
  { nameEn: "Maextro", nameAr: "مايكسترو", country: ["CN", "China", "الصين"], aliases: ["مايكسترو"], models: ["S800"] },
  { nameEn: "Changan", nameAr: "شانجان", country: ["CN", "China", "الصين"], aliases: ["شانجان"], models: ["Alsvin","Eado","CS35 Plus","CS55 Plus","CS75 Plus","UNI-T","UNI-V","UNI-K","Hunter"] },
  { nameEn: "Deepal", nameAr: "ديبال", country: ["CN", "China", "الصين"], aliases: ["ديبال"], models: ["S07","S05","L07","G318"] },
  { nameEn: "JAC", nameAr: "جاك", country: ["CN", "China", "الصين"], aliases: ["جاك"], models: ["J7","JS4","JS6","T8","iEV7S"] },
  { nameEn: "BAIC", nameAr: "بايك", country: ["CN", "China", "الصين"], aliases: ["بايك"], models: ["X55","X7","BJ40","EU5"] },
  { nameEn: "BAW", nameAr: "بي إيه دبليو", country: ["CN", "China", "الصين"], aliases: ["بي إيه دبليو"], models: ["BJ212","Warrior","Pony"] },
  { nameEn: "Dongfeng", nameAr: "دونغفينغ", country: ["CN", "China", "الصين"], aliases: ["دونغفينغ"], models: ["Shine","AX7","Mage","Huge","Boxer"] },
  { nameEn: "Forthing", nameAr: "فورثينج", country: ["CN", "China", "الصين"], aliases: ["فورثينج"], models: ["T5 EVO","U-Tour","Friday"] },
  { nameEn: "Fengon", nameAr: "فينجون", country: ["CN", "China", "الصين"], aliases: ["DFS Fengon","فينجون"], models: ["500","580","ix5","ix7"] },
  { nameEn: "DFSK", nameAr: "دي إف إس كيه", country: ["CN", "China", "الصين"], aliases: ["Dongfeng Sokon","دي إف إس كيه"], models: ["Glory 500","Glory 580","C31","C37","K01"] },
  { nameEn: "GAC", nameAr: "جي إيه سي", country: ["CN", "China", "الصين"], aliases: ["جي إيه سي"], models: ["GS3","GS4","GS8","Empow","M8"] },
  { nameEn: "Aion", nameAr: "أيون", country: ["CN", "China", "الصين"], aliases: ["أيون"], models: ["S","Y","V","LX","Hyper GT"] },
  { nameEn: "Rox", nameAr: "روكس", country: ["CN", "China", "الصين"], aliases: ["روكس"], models: ["01"] },
  { nameEn: "Leapmotor", nameAr: "ليب موتور", country: ["CN", "China", "الصين"], aliases: ["ليب موتور"], models: ["C10","C11","T03","B10"] },
  { nameEn: "Bestune", nameAr: "بستوني", country: ["CN", "China", "الصين"], aliases: ["FAW Bestune","بستوني"], models: ["T77","T99","B70","E01"] },
  { nameEn: "Brilliance", nameAr: "بريليانس", country: ["CN", "China", "الصين"], aliases: ["بريليانس"], models: ["V3","V5","V7","H530"] },
  { nameEn: "Arcfox", nameAr: "آرك فوكس", country: ["CN", "China", "الصين"], aliases: ["آرك فوكس"], models: ["Alpha S","Alpha T","Kaola"] },
  { nameEn: "Skywell", nameAr: "سكاي ويل", country: ["CN", "China", "الصين"], aliases: ["سكاي ويل"], models: ["ET5","BE11"] },
  { nameEn: "Roewe", nameAr: "رووي", country: ["CN", "China", "الصين"], aliases: ["رووي"], models: ["RX5","RX8","i5","i6","D7"] },
  { nameEn: "SAIC", nameAr: "سايك", country: ["CN", "China", "الصين"], aliases: ["SAIC Motor","سايك"], models: ["MG4","Maxus D60","Maxus G10"] },
  { nameEn: "Maxus", nameAr: "ماكسوس", country: ["CN", "China", "الصين"], aliases: ["ماكسوس"], models: ["D60","D90","G10","G50","T60","Deliver 9"] },
  { nameEn: "Foton", nameAr: "فوتون", country: ["CN", "China", "الصين"], aliases: ["فوتون"], models: ["Tunland","View","Aumark"] },
  { nameEn: "JMC", nameAr: "جيانغلينغ", country: ["CN", "China", "الصين"], aliases: ["Jiangling","جيانغلينغ"], models: ["Vigus","Yusheng","Touring"] },
  { nameEn: "ZXAUTO", nameAr: "زد إكس أوتو", country: ["CN", "China", "الصين"], aliases: ["ZX Auto","Zhongxing","زد إكس"], models: ["Grand Tiger","Terralord"] },
  { nameEn: "Karry", nameAr: "كاري", country: ["CN", "China", "الصين"], aliases: ["كاري"], models: ["Q22","Youya","K60"] },
  { nameEn: "Riddara", nameAr: "ريدارا", country: ["CN", "China", "الصين"], aliases: ["Geely Riddara","ريدارا"], models: ["RD6"] },
  { nameEn: "MHERO", nameAr: "إم هيرو", country: ["CN", "China", "الصين"], aliases: ["M-Hero","Dongfeng Mengshi","إم هيرو"], models: ["917","MHero 1"] },
  { nameEn: "Soueast", nameAr: "ساوث إيست", country: ["CN", "China", "الصين"], aliases: ["ساوث إيست"], models: ["S06","S07","DX7","DX8"] },
  { nameEn: "CMC", nameAr: "سي إم سي", country: ["TW", "Taiwan", "تايوان"], aliases: ["China Motor","سي إم سي"], models: ["Veryca","Zinger"] },
  { nameEn: "Zotye", nameAr: "زوتي", country: ["CN", "China", "الصين"], aliases: ["زوتي"], models: ["T600","Z300","SR9"] },

  // —— India / Malaysia / commercial ——
  { nameEn: "Mahindra", nameAr: "ماهيندرا", country: ["IN", "India", "الهند"], aliases: ["ماهيندرا"], models: ["XUV700","Scorpio","Thar","Bolero","XUV300"] },
  { nameEn: "Tata", nameAr: "تاتا", country: ["IN", "India", "الهند"], aliases: ["تاتا"], models: ["Nexon","Punch","Harrier","Safari","Tiago"] },
  { nameEn: "Force", nameAr: "فورس", country: ["IN", "India", "الهند"], aliases: ["Force Motors","فورس"], models: ["Gurkha","Traveller","Trax"] },
  { nameEn: "Ashok Leyland", nameAr: "أشوك ليلاند", country: ["IN", "India", "الهند"], aliases: ["أشوك ليلاند"], models: ["Dost","Partner","Boss","Captain"] },
  { nameEn: "Proton", nameAr: "بروتون", country: ["MY", "Malaysia", "ماليزيا"], aliases: ["بروتون"], models: ["Saga","Persona","X50","X70","X90"] },
  { nameEn: "Perodua", nameAr: "بيرودوا", country: ["MY", "Malaysia", "ماليزيا"], aliases: ["بيرودوا"], models: ["Myvi","Axia","Bezza","Ativa"] },
];

function slugify(name) {
  return name
    .normalize("NFKD")
    .replace(/[^\w\s&#.-]/g, "")
    .replace(/&/g, "and")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Dedupe by nameEn (last wins) — guards accidental duplicate RAW rows. */
const byName = new Map();
for (const entry of RAW) {
  byName.set(entry.nameEn, entry);
}

const popularFixed = new Map(POPULAR_UAE.map((name, i) => [name.toLowerCase(), i]));
const ordered = [...byName.values()].sort((a, b) => {
  const ai = popularFixed.has(a.nameEn.toLowerCase())
    ? popularFixed.get(a.nameEn.toLowerCase())
    : 10_000;
  const bi = popularFixed.has(b.nameEn.toLowerCase())
    ? popularFixed.get(b.nameEn.toLowerCase())
    : 10_000;
  if (ai !== bi) return ai - bi;
  return a.nameEn.localeCompare(b.nameEn);
});

const makes = [];
const models = [];
const seenMakeSlugs = new Set();
let makeSort = 0;

for (const entry of ordered) {
  const slug = slugify(entry.nameEn);
  if (seenMakeSlugs.has(slug)) {
    throw new Error(`Duplicate make slug: ${slug}`);
  }
  seenMakeSlugs.add(slug);
  const makeId = `make-${slug}`;
  makeSort += 10;
  const country = entry.country;
  makes.push({
    id: makeId,
    slug,
    nameEn: entry.nameEn,
    nameAr: entry.nameAr,
    status: "active",
    sortOrder: makeSort,
    aliases: [...new Set([...(entry.aliases ?? []), entry.nameAr, entry.nameEn])],
    ...(country
      ? {
          countryCode: country[0],
          countryNameEn: country[1],
          countryNameAr: country[2],
        }
      : {}),
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
  version: 2,
  generatedAt: new Date().toISOString(),
  source: "sooqna-uae-vehicle-reference-dubizzle-benchmark",
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
      firstPopular: makes.slice(0, 8).map((m) => m.nameEn),
      removedAsAliasOnly: ["Range Rover", "SsangYong", "Great Wall", "Mercedes-Maybach"],
    },
    null,
    2,
  ),
);
