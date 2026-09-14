/** Real UAE emirate → area lists used by the live catalog. Not decorative placeholders. */

export const EMIRATE_AREAS: Record<string, readonly string[]> = {
  دبي: ["دبي مارينا", "الخليج التجاري", "جميرا", "البرشاء", "ند الشبا"],
  أبوظبي: ["جزيرة ياس", "الخالدية", "الريم", "المشرف", "البطين"],
  الشارقة: ["الناصرية", "المجاز", "الفلج", "المجاز 3", "القلعة"],
  عجمان: ["الراشدية", "النعيمية", "الجرف", "المويهات"],
  "أم القيوين": ["المدينة القديمة", "الراشدية", "السلمة"],
  "رأس الخيمة": ["النخيل", "الحمرانية", "خزام", "الجزيرة الحمراء"],
  الفجيرة: ["مدينة الفجيرة", "الفسيل", "الحيل", "قدفع"],
};

export function areasForEmirate(emirate: string | undefined): readonly string[] {
  if (!emirate) return [];
  return EMIRATE_AREAS[emirate.trim()] ?? [];
}
