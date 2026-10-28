import { CompleteAccountContent } from "@/features/auth/components/CompleteAccountContent";
import { SiteFooter } from "@/shared/layouts/SiteFooter";
import { SiteChrome } from "@/shared/layouts/SiteChrome";

type CompleteAccountPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function CompleteAccountPage({
  searchParams,
}: CompleteAccountPageProps) {
  const params = await searchParams;

  return (
    <>
      <SiteChrome />
      <main>
        <CompleteAccountContent token={params.token} />
      </main>
      <SiteFooter />
    </>
  );
}
