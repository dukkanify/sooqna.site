import type { CategoryFieldDefinition } from "@/types";
import { humanizeSpecKey } from "@/shared/listings/spec-labels";
import { colorOptions } from "@/shared/constants/colors";
import {
  carBrandOptions,
  electronicsBrandOptions,
  mobileBrandOptions,
} from "@/shared/constants/product-brands";
import {
  carModelOptions,
  mobileModelOptions,
} from "@/shared/constants/product-models";
import {
  REGIONAL_SPEC_OPTIONS,
  VEHICLE_BODY_TYPE_OPTIONS,
  VEHICLE_DRIVETRAIN_OPTIONS,
  VEHICLE_FUEL_OPTIONS,
  VEHICLE_TRANSMISSION_OPTIONS,
  vehicleYearOptions,
} from "@/shared/vehicles";

const yearOptions = vehicleYearOptions();

const developerOptions = [
  { label: "إعمار (Emaar)", value: "Emaar" },
  { label: "الدار (Aldar)", value: "Aldar" },
  { label: "نخيل (Nakheel)", value: "Nakheel" },
  { label: "داماك (Damac)", value: "Damac" },
  { label: "مراس (Meraas)", value: "Meraas" },
  { label: "شوبا (Sobha)", value: "Sobha" },
  { label: "إلينغتون (Ellington)", value: "Ellington" },
  { label: "ريبورتاج (Reportage)", value: "Reportage" },
  { label: "إيغل هيلز (Eagle Hills)", value: "Eagle Hills" },
  { label: "ماجد الفطيم", value: "Majid Al Futtaim" },
  { label: "أخرى", value: "أخرى" },
];

const emirateOptions = [
  { label: "دبي", value: "دبي" },
  { label: "أبوظبي", value: "أبوظبي" },
  { label: "الشارقة", value: "الشارقة" },
  { label: "عجمان", value: "عجمان" },
  { label: "رأس الخيمة", value: "رأس الخيمة" },
  { label: "الفجيرة", value: "الفجيرة" },
  { label: "أم القيوين", value: "أم القيوين" },
];

const yesNoOptions = [
  { label: "نعم", value: "نعم" },
  { label: "لا", value: "لا" },
];

const carFeatureOptions = [
  { label: "ABS", value: "ABS" },
  { label: "مثبت سرعة", value: "مثبت سرعة" },
  { label: "حساسات ركن", value: "حساسات ركن" },
  { label: "كاميرا", value: "كاميرا" },
  { label: "مقاعد جلد", value: "مقاعد جلد" },
  { label: "فتحة سقف", value: "فتحة سقف" },
  { label: "ملاحة", value: "ملاحة" },
  { label: "بلوتوث", value: "بلوتوث" },
  { label: "Apple CarPlay", value: "Apple CarPlay" },
  { label: "Android Auto", value: "Android Auto" },
  { label: "دفع رباعي", value: "دفع رباعي" },
  { label: "تيربو", value: "تيربو" },
  { label: "قابل للتفاوض", value: "قابل للتفاوض" },
];

const carFields: CategoryFieldDefinition[] = [
  {
    key: "brand",
    label: "الماركة",
    type: "combobox",
    required: true,
    titlePart: true,
    searchable: true,
    options: carBrandOptions,
    placeholder: "ابحث عن الماركة (Toy… Nissan…)",
  },
  {
    key: "model",
    label: "الموديل",
    type: "combobox",
    required: true,
    titlePart: true,
    searchable: true,
    options: carModelOptions,
    placeholder: "ابحث عن الموديل (Patrol… Camry…)",
  },
  {
    key: "modelOther",
    label: "اقتراح موديل",
    type: "text",
    required: true,
    searchable: true,
    placeholder: "اكتب اسم الموديل إن لم تجده",
    showWhen: { key: "model", values: ["أخرى"] },
    note: "يُرسل كاقتراح لمراجعة الإدارة قبل إضافته لكتالوج الموديلات.",
  },
  {
    key: "condition",
    label: "حالة السيارة",
    type: "select",
    required: true,
    options: [
      { label: "جديدة", value: "new" },
      { label: "مستعملة", value: "used" },
    ],
  },
  { key: "year", label: "سنة الصنع", type: "combobox", required: true, titlePart: true, searchable: true, options: yearOptions, placeholder: "اختر أو اكتب السنة" },
  { key: "emirate", label: "الإمارة", type: "select", required: true, options: emirateOptions, searchable: true },
  {
    key: "city",
    label: "المدينة / المنطقة",
    type: "text",
    required: true,
    searchable: true,
    placeholder: "مثال: جميرا، مردف، الكورنيش",
    note: "اكتب الحي أو المنطقة داخل الإمارة المختارة.",
  },
  { key: "mileage", label: "العداد (كم)", type: "text", required: true, searchable: true },
  { key: "transmission", label: "ناقل الحركة", type: "select", required: true, options: VEHICLE_TRANSMISSION_OPTIONS },
  { key: "fuelType", label: "نوع الوقود", type: "select", required: true, options: VEHICLE_FUEL_OPTIONS },
  // Optional extras — collapsed under «تفاصيل إضافية» so publish stays short.
  {
    key: "bodyType",
    label: "نوع الهيكل",
    type: "select",
    required: false,
    searchable: true,
    section: "تفاصيل إضافية (اختياري)",
    options: VEHICLE_BODY_TYPE_OPTIONS,
  },
  {
    key: "drivetrain",
    label: "نظام الدفع",
    type: "select",
    required: false,
    searchable: true,
    options: VEHICLE_DRIVETRAIN_OPTIONS,
  },
  {
    key: "engineSize",
    label: "سعة المحرك",
    type: "text",
    required: false,
    placeholder: "مثال: 2.0 أو 2000 سي سي",
    note: "اختياري — لا يُعرض للسيارات الكهربائية.",
    hideWhen: [
      { key: "fuelType", values: ["كهربائي"] },
      {
        key: "subcategory",
        values: ["سيارات كهربائية", "كهربائية"],
      },
    ],
  },
  {
    key: "regionalSpecs",
    label: "المواصفات الإقليمية",
    type: "select",
    required: false,
    searchable: true,
    options: REGIONAL_SPEC_OPTIONS,
  },
  {
    key: "exteriorColor",
    label: "اللون الخارجي",
    type: "select",
    required: false,
    options: colorOptions,
  },
  {
    key: "exteriorColorOther",
    label: "اللون الخارجي (أخرى)",
    type: "text",
    required: true,
    placeholder: "اكتب اللون",
    showWhen: { key: "exteriorColor", values: ["أخرى"] },
  },
  {
    key: "interiorColor",
    label: "اللون الداخلي",
    type: "select",
    required: false,
    options: colorOptions,
  },
  {
    key: "interiorColorOther",
    label: "اللون الداخلي (أخرى)",
    type: "text",
    required: true,
    placeholder: "اكتب اللون",
    showWhen: { key: "interiorColor", values: ["أخرى"] },
  },
  { key: "warranty", label: "الضمان", type: "select", required: false, options: yesNoOptions },
  { key: "accidentHistory", label: "سجل الحوادث", type: "select", required: false, options: [
    { label: "بدون حوادث", value: "بدون حوادث" },
    { label: "حادث بسيط", value: "حادث بسيط" },
    { label: "حادث كبير", value: "حادث كبير" },
  ]},
  { key: "serviceHistory", label: "سجل الصيانة", type: "select", required: false, options: [
    { label: "وكالة كاملة", value: "وكالة كاملة" },
    { label: "صيانة دورية", value: "صيانة دورية" },
    { label: "غير متوفر", value: "غير متوفر" },
  ]},
  { key: "vin", label: "رقم الهيكل (VIN)", type: "text", required: false },
  { key: "numberOfKeys", label: "عدد المفاتيح", type: "number", required: false },
  { key: "features", label: "الميزات", type: "checkbox-group", options: carFeatureOptions },
];

const realEstateFields: CategoryFieldDefinition[] = [
  { key: "propertyType", label: "نوع العقار", type: "select", required: true, titlePart: true, searchable: true, options: [
    { label: "شقة", value: "شقة" },
    { label: "فيلا", value: "فيلا" },
    { label: "تاون هاوس", value: "تاون هاوس" },
    { label: "مكتب", value: "مكتب" },
    { label: "أرض", value: "أرض" },
  ]},
  { key: "purpose", label: "الغرض", type: "select", required: true, titlePart: true, searchable: true, options: [
    { label: "للبيع", value: "للبيع" },
    { label: "للإيجار", value: "للإيجار" },
  ]},
  {
    key: "advertiserType",
    label: "نوع المعلن",
    type: "select",
    required: true,
    searchable: true,
    options: [
      { label: "مالك العقار", value: "owner" },
      { label: "وسيط عقاري", value: "broker" },
    ],
    note: "يحدد حقول الترخيص المطلوبة حسب الجهة التنظيمية.",
  },
  { key: "bedrooms", label: "غرف النوم", type: "number", required: true, searchable: true },
  { key: "bathrooms", label: "الحمامات", type: "number", required: true },
  { key: "area", label: "المساحة (قدم²)", type: "number", required: true, searchable: true },
  { key: "parking", label: "مواقف السيارات", type: "number", required: true },
  { key: "furnished", label: "التأثيث", type: "select", required: true, options: [
    { label: "مفروش", value: "مفروش" },
    { label: "غير مفروش", value: "غير مفروش" },
    { label: "شبه مفروش", value: "شبه مفروش" },
  ]},
  { key: "completionStatus", label: "حالة الإنجاز", type: "select", required: true, options: [
    { label: "جاهز", value: "جاهز" },
    { label: "قيد الإنشاء", value: "قيد الإنشاء" },
    { label: "خطة", value: "خطة" },
  ]},
  {
    key: "availabilityTiming",
    label: "موعد التوفر / التسليم",
    type: "select",
    required: true,
    searchable: true,
    section: "موعد التوفر",
    options: [
      { label: "متاح الآن", value: "متاح الآن" },
      { label: "تاريخ محدد", value: "تاريخ محدد" },
      { label: "قيد الإنشاء", value: "قيد الإنشاء" },
    ],
    note: "اختر جاهزية العقار من القائمة — ليس نصاً حراً.",
  },
  {
    key: "availabilityDate",
    label: "تاريخ التوفر / التسليم",
    type: "date",
    required: true,
    showWhen: { key: "availabilityTiming", values: ["تاريخ محدد"] },
    note: "اختر التاريخ من التقويم.",
  },
  {
    key: "expectedHandoverDate",
    label: "تاريخ التسليم المتوقع",
    type: "date",
    required: false,
    showWhen: { key: "availabilityTiming", values: ["قيد الإنشاء"] },
    note: "اختياري — موعد التسليم المتوقع للمشروع قيد الإنشاء.",
  },
  {
    key: "buildingName",
    label: "اسم المبنى",
    type: "text",
    required: true,
    titlePart: true,
    searchable: true,
    section: "تفاصيل المبنى",
    placeholder: "مثال: برج خليفة، مارينا جيت",
    note: "اسم المبنى أو البرج كما يظهر في الموقع.",
    showWhen: {
      key: "propertyType",
      values: ["شقة", "فيلا", "تاون هاوس", "مكتب"],
    },
  },
  {
    key: "unitNumber",
    label: "رقم الوحدة",
    type: "text",
    required: false,
    searchable: true,
    placeholder: "مثال: 1204",
    note: "رقم الشقة أو المكتب داخل المبنى (اختياري).",
    showWhen: {
      key: "propertyType",
      values: ["شقة", "تاون هاوس", "مكتب"],
    },
  },
  {
    key: "totalFloors",
    label: "إجمالي الطوابق",
    type: "number",
    required: false,
    placeholder: "مثال: 40",
    note: "عدد طوابق المبنى إن وُجد (اختياري).",
    showWhen: {
      key: "propertyType",
      values: ["شقة", "مكتب", "تاون هاوس"],
    },
  },
  {
    key: "floor",
    label: "الطابق",
    type: "text",
    required: true,
    showWhen: {
      key: "propertyType",
      values: ["شقة", "فيلا", "تاون هاوس", "مكتب"],
    },
  },
  { key: "developer", label: "المطور", type: "combobox", required: true, searchable: true, options: developerOptions, placeholder: "ابحث عن اسم المطور" },
  { key: "community", label: "المجتمع", type: "text", required: true, titlePart: true, searchable: true },
  { key: "titleDeedReady", label: "سند الملكية جاهز", type: "select", required: true, options: yesNoOptions },
  { key: "emirate", label: "الإمارة", type: "select", required: true, options: emirateOptions, searchable: true },
  {
    key: "city",
    label: "المدينة / المنطقة",
    type: "text",
    required: true,
    searchable: true,
    placeholder: "مثال: جميرا، مردف، الكورنيش",
    note: "اكتب الحي أو المنطقة داخل الإمارة المختارة.",
  },
  {
    key: "regulatoryAuthority",
    label: "الجهة التنظيمية",
    type: "select",
    required: true,
    showWhen: { key: "advertiserType", values: ["broker"] },
    options: [
      { label: "DLD — دائرة الأراضي والأملاك (دبي)", value: "DLD" },
      { label: "ADREC — أبوظبي", value: "ADREC" },
      { label: "جهة تنظيمية أخرى", value: "other" },
    ],
    note: "اختر الجهة حسب إمارة الإعلان: DLD لدبي، ADREC لأبوظبي.",
  },
  {
    key: "licenseNumber",
    label: "رقم الترخيص",
    type: "text",
    required: true,
    searchable: true,
    placeholder: "مثال: 12345",
    note: "رقم الترخيص المطلوب لإعلانات العقارات (مضمون).",
    pattern: "^[A-Za-z0-9\\/\\-]{3,30}$",
    patternMessage: "رقم الترخيص: 3–30 حرفاً (أرقام/حروف و - أو /).",
  },
  {
    key: "brn",
    label: "BRN (DLD)",
    type: "text",
    required: true,
    placeholder: "مثال: 123456",
    note: "رقم تسجيل الوسيط لدى دائرة الأراضي والأملاك في دبي.",
    showWhen: [
      { key: "advertiserType", values: ["broker"] },
      { key: "regulatoryAuthority", values: ["DLD"] },
    ],
    pattern: "^\\d{5,8}$",
    patternMessage: "BRN يجب أن يكون رقماً من 5 إلى 8 خانات.",
  },
  {
    key: "bln",
    label: "BLN (ADREC)",
    type: "text",
    required: true,
    placeholder: "مثال: AD-12345",
    note: "رقم ترخيص الوسيط المسجّل لدى ADREC في أبوظبي.",
    showWhen: [
      { key: "advertiserType", values: ["broker"] },
      { key: "regulatoryAuthority", values: ["ADREC"] },
    ],
    pattern: "^[A-Za-z0-9\\-]{4,20}$",
    patternMessage: "BLN يجب أن يكون 4–20 حرفاً (أرقام/حروف و -).",
  },
];

const mobileFields: CategoryFieldDefinition[] = [
  {
    key: "brand",
    label: "الماركة",
    type: "combobox",
    required: true,
    titlePart: true,
    searchable: true,
    options: mobileBrandOptions,
    placeholder: "ابحث عن الماركة (App… Sam…)",
  },
  {
    key: "model",
    label: "الموديل",
    type: "combobox",
    required: true,
    titlePart: true,
    searchable: true,
    options: mobileModelOptions,
    placeholder: "ابحث عن الموديل (iPhone… Galaxy…)",
    hideWhen: { key: "subcategory", values: ["إكسسوارات"] },
  },
  { key: "storage", label: "التخزين", type: "select", required: true, searchable: true, hideWhen: {
    key: "subcategory",
    values: ["إكسسوارات"],
  }, options: [
    { label: "64 GB", value: "64 GB" },
    { label: "128 GB", value: "128 GB" },
    { label: "256 GB", value: "256 GB" },
    { label: "512 GB", value: "512 GB" },
    { label: "1 TB", value: "1 TB" },
  ]},
  { key: "ram", label: "الذاكرة (RAM)", type: "select", required: true, hideWhen: {
    key: "subcategory",
    values: ["إكسسوارات"],
  }, options: [
    { label: "4 GB", value: "4 GB" },
    { label: "6 GB", value: "6 GB" },
    { label: "8 GB", value: "8 GB" },
    { label: "12 GB", value: "12 GB" },
    { label: "16 GB", value: "16 GB" },
  ]},
  {
    key: "color",
    label: "اللون",
    type: "select",
    required: true,
    options: colorOptions,
  },
  { key: "batteryHealth", label: "صحة البطارية", type: "text", required: true, hideWhen: {
    key: "subcategory",
    values: ["إكسسوارات"],
  } },
  { key: "warranty", label: "الضمان", type: "select", required: true, options: yesNoOptions },
  { key: "purchaseDate", label: "تاريخ الشراء", type: "date", required: true, hideWhen: {
    key: "subcategory",
    values: ["إكسسوارات"],
  } },
  { key: "accessoriesIncluded", label: "الملحقات المرفقة", type: "textarea", required: true },
  { key: "emirate", label: "الإمارة", type: "select", required: true, options: emirateOptions, searchable: true },
  {
    key: "city",
    label: "المدينة / المنطقة",
    type: "text",
    required: true,
    searchable: true,
    placeholder: "مثال: جميرا، مردف، الكورنيش",
  },
  { key: "condition", label: "حالة المنتج", type: "select", required: true, options: [
    { label: "جديد", value: "new" },
    { label: "مستعمل", value: "used" },
  ]},
];

const electronicsFields: CategoryFieldDefinition[] = [
  {
    key: "brand",
    label: "الماركة",
    type: "combobox",
    required: true,
    titlePart: true,
    searchable: true,
    options: electronicsBrandOptions,
    placeholder: "ابحث عن الماركة (Canon… App… Son…)",
  },
  {
    key: "model",
    label: "الموديل",
    type: "combobox",
    required: true,
    titlePart: true,
    searchable: true,
    options: [
      { label: "MacBook Pro", value: "MacBook Pro" },
      { label: "MacBook Air", value: "MacBook Air" },
      { label: "iPad Pro", value: "iPad Pro" },
      { label: "PlayStation 5", value: "PlayStation 5" },
      { label: "Xbox Series X", value: "Xbox Series X" },
      { label: "Nintendo Switch", value: "Nintendo Switch" },
      { label: "EOS R6", value: "EOS R6" },
      { label: "EOS R5", value: "EOS R5" },
      { label: "A7 IV", value: "A7 IV" },
      { label: "أخرى", value: "أخرى" },
    ],
    placeholder: "ابحث أو اكتب الموديل",
  },
  {
    key: "modelOther",
    label: "حدد الموديل (أخرى)",
    type: "text",
    required: true,
    titlePart: true,
    searchable: true,
    placeholder: "اكتب الموديل إن لم تجده",
    showWhen: { key: "model", values: ["أخرى"] },
  },
  { key: "emirate", label: "الإمارة", type: "select", required: true, options: emirateOptions, searchable: true },
  {
    key: "city",
    label: "المدينة / المنطقة",
    type: "text",
    required: true,
    searchable: true,
    placeholder: "مثال: البرشاء، ديرة، الكورنيش",
  },
  { key: "condition", label: "حالة المنتج", type: "select", required: true, options: [
    { label: "جديد", value: "new" },
    { label: "مستعمل", value: "used" },
    { label: "ممتاز", value: "excellent" },
    { label: "مجدّد", value: "refurbished" },
    { label: "للقطع", value: "for_parts" },
    { label: "لا يعمل", value: "not_working" },
  ]},
  {
    key: "defects",
    label: "وصف العيوب أو الأجزاء الناقصة",
    type: "textarea",
    required: true,
    searchable: true,
    placeholder: "اشرح العيوب بوضوح (شاشة، بطارية، منافذ…)",
    showWhen: {
      key: "condition",
      values: ["used", "refurbished", "for_parts", "not_working"],
    },
    note: "مطلوب عند اختيار مستعمل أو مجدّد أو للقطع أو لا يعمل.",
  },
  {
    key: "storage",
    label: "التخزين",
    type: "select",
    required: true,
    searchable: true,
    options: [
      { label: "256 GB", value: "256 GB" },
      { label: "512 GB", value: "512 GB" },
      { label: "1 TB", value: "1 TB" },
      { label: "2 TB", value: "2 TB" },
    ],
    showWhen: { key: "subcategory", values: ["لابتوبات"] },
  },
  {
    key: "ram",
    label: "الذاكرة (RAM)",
    type: "select",
    required: true,
    options: [
      { label: "8 GB", value: "8 GB" },
      { label: "16 GB", value: "16 GB" },
      { label: "32 GB", value: "32 GB" },
      { label: "64 GB", value: "64 GB" },
    ],
    showWhen: { key: "subcategory", values: ["لابتوبات"] },
  },
  {
    key: "consoleEdition",
    label: "إصدار الجهاز",
    type: "text",
    required: false,
    searchable: true,
    placeholder: "مثال: Digital / Disc / OLED",
    showWhen: { key: "subcategory", values: ["ألعاب"] },
  },
  {
    key: "shutterCount",
    label: "عدد الشُتر",
    type: "text",
    required: true,
    searchable: true,
    placeholder: "مثال: 12000",
    showWhen: { key: "subcategory", values: ["كاميرات"] },
    note: "مهم لمشتري الكاميرات المستعملة.",
  },
  {
    key: "lensIncluded",
    label: "العدسة المرفقة",
    type: "text",
    required: true,
    searchable: true,
    placeholder: "مثال: RF 24-105mm f/4L",
    showWhen: { key: "subcategory", values: ["كاميرات"] },
  },
  {
    key: "connectivity",
    label: "الاتصال",
    type: "select",
    required: false,
    options: [
      { label: "Bluetooth", value: "Bluetooth" },
      { label: "Wi-Fi", value: "Wi-Fi" },
      { label: "سلكي", value: "سلكي" },
      { label: "Bluetooth + Wi-Fi", value: "Bluetooth + Wi-Fi" },
    ],
    showWhen: { key: "subcategory", values: ["سماعات"] },
  },
  { key: "warranty", label: "الضمان", type: "select", required: true, options: yesNoOptions },
  { key: "accessories", label: "الملحقات", type: "textarea", required: true },
];

const goodsFields: CategoryFieldDefinition[] = [
  {
    key: "itemType",
    label: "النوع",
    type: "text",
    required: true,
    titlePart: true,
    searchable: true,
    placeholder: "مثال: ساعة، عربة أطفال، دراجة…",
  },
  {
    key: "brand",
    label: "الماركة",
    type: "text",
    required: false,
    titlePart: true,
    searchable: true,
  },
  { key: "emirate", label: "الإمارة", type: "select", required: true, options: emirateOptions, searchable: true },
  {
    key: "city",
    label: "المدينة / المنطقة",
    type: "text",
    required: true,
    searchable: true,
  },
  {
    key: "condition",
    label: "حالة المنتج",
    type: "select",
    required: true,
    options: [
      { label: "جديد", value: "new" },
      { label: "مستعمل", value: "used" },
      { label: "ممتاز", value: "excellent" },
    ],
  },
  {
    key: "size",
    label: "المقاس / الحجم",
    type: "text",
    required: false,
    searchable: true,
    showWhen: { key: "subcategory", values: ["ملابس", "ملابس أطفال", "حقائب", "ساعات"] },
  },
];

const jobFields: CategoryFieldDefinition[] = [
  {
    key: "listingType",
    label: "نوع الإعلان",
    type: "select",
    required: true,
    titlePart: true,
    options: [
      { label: "توظيف (وظائف)", value: "vacancy" },
      { label: "باحثون عن عمل", value: "seeker" },
    ],
    note: "يُطابق التصنيف الفرعي: توظيف للإعلان عن شاغر، وباحثون عن عمل لمن يبحث عن وظيفة. صورة الإعلان اختيارية.",
  },
  {
    key: "company",
    label: "الشركة",
    type: "text",
    required: true,
    titlePart: true,
    searchable: true,
    showWhen: { key: "listingType", values: ["vacancy"] },
  },
  {
    key: "position",
    label: "المسمى الوظيفي",
    type: "text",
    required: true,
    titlePart: true,
    searchable: true,
  },
  {
    key: "salary",
    label: "الراتب / المتوقع",
    type: "text",
    required: true,
    searchable: true,
  },
  {
    key: "experience",
    label: "الخبرة",
    type: "text",
    required: true,
  },
  {
    key: "employmentType",
    label: "نوع التوظيف",
    type: "select",
    required: true,
    showWhen: { key: "listingType", values: ["vacancy"] },
    options: [
      { label: "دوام كامل", value: "دوام كامل" },
      { label: "دوام جزئي", value: "دوام جزئي" },
      { label: "عقد", value: "عقد" },
      { label: "عن بُعد", value: "عن بُعد" },
    ],
  },
  {
    key: "availability",
    label: "التوفر للبدء",
    type: "select",
    required: true,
    showWhen: { key: "listingType", values: ["seeker"] },
    options: [
      { label: "فوري", value: "فوري" },
      { label: "خلال أسبوعين", value: "خلال أسبوعين" },
      { label: "خلال شهر", value: "خلال شهر" },
      { label: "مرن", value: "مرن" },
    ],
  },
  {
    key: "location",
    label: "الموقع",
    type: "text",
    required: true,
    searchable: true,
  },
  {
    key: "nationality",
    label: "الجنسية",
    type: "text",
    required: false,
    showWhen: { key: "listingType", values: ["seeker"] },
  },
  {
    key: "gender",
    label: "الجنس المطلوب",
    type: "select",
    required: false,
    showWhen: { key: "listingType", values: ["vacancy"] },
    options: [
      { label: "ذكر", value: "ذكر" },
      { label: "أنثى", value: "أنثى" },
      { label: "أي", value: "أي" },
    ],
  },
];

const serviceFields: CategoryFieldDefinition[] = [
  { key: "businessName", label: "اسم النشاط", type: "text", required: true, titlePart: true, searchable: true },
  { key: "serviceCategory", label: "تصنيف الخدمة", type: "text", required: true, titlePart: true, searchable: true },
  { key: "coverageArea", label: "منطقة التغطية", type: "text", required: true, searchable: true },
  { key: "availability", label: "التوفر", type: "select", required: true, options: [
    { label: "فوري", value: "فوري" },
    { label: "خلال 24 ساعة", value: "خلال 24 ساعة" },
    { label: "حسب الموعد", value: "حسب الموعد" },
  ]},
  { key: "experience", label: "سنوات الخبرة", type: "text", required: true },
  {
    key: "pricingBasis",
    label: "طريقة احتساب السعر",
    type: "select",
    required: false,
    searchable: true,
    options: [
      { label: "للساعة", value: "hourly" },
      { label: "للزيارة", value: "visit" },
      { label: "للمهمة أو المشروع", value: "project" },
      { label: "اشتراك شهري", value: "monthly" },
      { label: "حسب عرض سعر", value: "quote" },
    ],
    note: "عند اختيار «حسب عرض سعر» لا يُطلب مبلغ بالدرهم — يظهر للمشترين طلب عرض سعر.",
  },
];

const foodFields: CategoryFieldDefinition[] = [
  {
    key: "saleType",
    label: "نوع البيع",
    type: "select",
    required: true,
    titlePart: true,
    searchable: true,
    options: [
      { label: "بالجملة", value: "wholesale" },
      { label: "تجزئة", value: "retail" },
    ],
    note: "لا يُستخدم جديد/مستعمل للطعام — اختر بالجملة أو تجزئة.",
  },
  {
    key: "unitPrice",
    label: "السعر حسب الوحدة",
    type: "text",
    required: true,
    searchable: true,
    placeholder: "مثال: AED 35 / كرتون أو AED 12 / وجبة",
    note: "يجب أن يطابق التسعير نوع البيع المختار.",
  },
  {
    key: "cuisine",
    label: "نوع المطبخ / المنتج",
    type: "select",
    required: true,
    titlePart: true,
    searchable: true,
    options: [
      { label: "إماراتي", value: "إماراتي" },
      { label: "عربي", value: "عربي" },
      { label: "آسيوي", value: "آسيوي" },
      { label: "هندي", value: "هندي" },
      { label: "غربي", value: "غربي" },
      { label: "حلويات", value: "حلويات" },
      { label: "مشروبات", value: "مشروبات" },
      { label: "أخرى", value: "أخرى" },
    ],
  },
  {
    key: "portion",
    label: "الحصة / الكمية",
    type: "text",
    required: true,
    searchable: true,
    placeholder: "مثال: كرتون 24 قطعة أو وجبة لشخصين",
  },
  {
    key: "delivery",
    label: "التوصيل",
    type: "select",
    required: true,
    options: [
      { label: "توصيل متاح", value: "توصيل متاح" },
      { label: "استلام فقط", value: "استلام فقط" },
      { label: "كلاهما", value: "كلاهما" },
    ],
  },
  {
    key: "freshness",
    label: "الطزاجة",
    type: "select",
    required: true,
    options: [
      { label: "طازج يومياً", value: "طازج يومياً" },
      { label: "محضّر عند الطلب", value: "محضّر عند الطلب" },
      { label: "مجمّد", value: "مجمّد" },
      { label: "معلّب", value: "معلّب" },
    ],
  },
  {
    key: "city",
    label: "المدينة / المنطقة",
    type: "text",
    required: true,
    searchable: true,
    placeholder: "مثال: أبوظبي — الكورنيش",
    note: "اكتب الإمارة والمنطقة.",
  },
];

const furnitureFields: CategoryFieldDefinition[] = [
  {
    key: "furnitureType",
    label: "نوع الأثاث",
    type: "select",
    required: true,
    titlePart: true,
    searchable: true,
    options: [
      { label: "غرف نوم", value: "غرف نوم" },
      { label: "كنب", value: "كنب" },
      { label: "طاولات طعام", value: "طاولات طعام" },
      { label: "أثاث خارجي", value: "أثاث خارجي" },
      { label: "أخرى", value: "other" },
    ],
    note: "يُملأ تلقائياً من التصنيف الفرعي عند اختياره في الخطوة الأولى.",
  },
  {
    key: "furnitureTypeOther",
    label: "حدد النوع (أخرى)",
    type: "text",
    required: true,
    titlePart: true,
    searchable: true,
    placeholder: "اكتب نوع الأثاث",
    showWhen: { key: "furnitureType", values: ["other", "أخرى"] },
    note: "تُحفظ كاقتراح للمراجعة الإدارية قبل إضافتها للقائمة العامة.",
  },
  {
    key: "condition",
    label: "حالة المنتج",
    type: "select",
    required: true,
    options: [
      { label: "جديد", value: "new" },
      { label: "مستعمل", value: "used" },
    ],
  },
  {
    key: "material",
    label: "الخامة",
    type: "text",
    required: false,
    searchable: true,
  },
  { key: "emirate", label: "الإمارة", type: "select", required: true, options: emirateOptions, searchable: true },
  {
    key: "city",
    label: "المدينة / المنطقة",
    type: "text",
    required: true,
    searchable: true,
  },
];

const petFields: CategoryFieldDefinition[] = [
  {
    key: "animalType",
    label: "النوع",
    type: "select",
    required: true,
    titlePart: true,
    searchable: true,
    options: [
      { label: "قطط", value: "قطط" },
      { label: "كلاب", value: "كلاب" },
      { label: "طيور", value: "طيور" },
      { label: "مستلزمات", value: "مستلزمات" },
      { label: "أخرى", value: "other" },
    ],
    note: "اختر النوع ليظهر الإعلان في التصنيف الفرعي المناسب.",
  },
  {
    key: "animalTypeOther",
    label: "حدد النوع (أخرى)",
    type: "text",
    required: true,
    titlePart: true,
    searchable: true,
    placeholder: "مثال: أرانب، سلاحف…",
    showWhen: { key: "animalType", values: ["other", "أخرى"] },
  },
  {
    key: "breed",
    label: "السلالة / الصنف",
    type: "text",
    required: false,
    titlePart: true,
    searchable: true,
    placeholder: "مثال: شيرازي، جيرمن…",
    showWhen: { key: "animalType", values: ["قطط", "كلاب", "طيور", "other", "أخرى"] },
  },
  {
    key: "age",
    label: "العمر",
    type: "text",
    required: true,
    searchable: true,
    placeholder: "مثال: 3 أشهر",
    showWhen: { key: "animalType", values: ["قطط", "كلاب", "طيور", "other", "أخرى"] },
  },
  {
    key: "gender",
    label: "الجنس",
    type: "select",
    required: false,
    options: [
      { label: "ذكر", value: "ذكر" },
      { label: "أنثى", value: "أنثى" },
      { label: "غير محدد", value: "غير محدد" },
    ],
    showWhen: { key: "animalType", values: ["قطط", "كلاب", "طيور", "other", "أخرى"] },
  },
  {
    key: "vaccinated",
    label: "التطعيمات",
    type: "select",
    required: false,
    options: yesNoOptions,
    showWhen: { key: "animalType", values: ["قطط", "كلاب", "طيور", "other", "أخرى"] },
  },
  {
    key: "condition",
    label: "حالة المستلزم",
    type: "select",
    required: true,
    options: [
      { label: "جديد", value: "new" },
      { label: "مستعمل", value: "used" },
      { label: "ممتاز", value: "excellent" },
    ],
    showWhen: { key: "animalType", values: ["مستلزمات"] },
    note: "حالة المنتج للمستلزمات فقط — لا تُطلب للحيوانات الحية.",
  },
  {
    key: "city",
    label: "المدينة / المنطقة",
    type: "text",
    required: true,
    searchable: true,
  },
];

export const DYNAMIC_CATEGORY_IDS = [
  "cars",
  "real-estate",
  "mobiles",
  "electronics",
  "jobs",
  "services",
  "food",
  "furniture",
  "pets",
  "fashion",
  "kids",
  "sports",
  "books",
] as const;

export type DynamicCategoryId = (typeof DYNAMIC_CATEGORY_IDS)[number];

const categoryFieldMap: Record<DynamicCategoryId, CategoryFieldDefinition[]> = {
  cars: carFields,
  "real-estate": realEstateFields,
  mobiles: mobileFields,
  electronics: electronicsFields,
  jobs: jobFields,
  services: serviceFields,
  food: foodFields,
  furniture: furnitureFields,
  pets: petFields,
  fashion: goodsFields,
  kids: goodsFields,
  sports: goodsFields,
  books: goodsFields,
};

export function isDynamicCategory(categoryId: string): categoryId is DynamicCategoryId {
  return (DYNAMIC_CATEGORY_IDS as readonly string[]).includes(categoryId);
}

export function getCategoryFields(categoryId: string): CategoryFieldDefinition[] {
  if (!isDynamicCategory(categoryId)) {
    return [];
  }
  return categoryFieldMap[categoryId];
}

export function getCategoryFieldLabel(categoryId: string, key: string): string {
  const field = getCategoryFields(categoryId).find((item) => item.key === key);
  return field?.label ?? humanizeSpecKey(key);
}

/** Copy showWhen/hideWhen from code defaults onto admin/remote field snapshots. */
export function mergeFieldVisibilityFromDefaults(
  categoryId: string,
  fields: CategoryFieldDefinition[],
  extraDefaults: CategoryFieldDefinition[] = [],
): CategoryFieldDefinition[] {
  const defaults =
    getCategoryFields(categoryId).length > 0
      ? getCategoryFields(categoryId)
      : extraDefaults;
  if (defaults.length === 0) return fields;
  const byKey = new Map(defaults.map((field) => [field.key, field]));
  return fields.map((field) => {
    const fallback = byKey.get(field.key);
    if (!fallback) return field;
    return {
      ...field,
      showWhen: field.showWhen ?? fallback.showWhen,
      hideWhen: field.hideWhen ?? fallback.hideWhen,
    };
  });
}
