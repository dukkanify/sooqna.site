import { redirect } from "next/navigation";

/** Legacy /contact → canonical Contact Us page. */
export default function ContactRedirectPage() {
  redirect("/support");
}
