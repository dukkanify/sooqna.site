import {
  SOCIAL_LINK_LABELS_AR,
  type SocialLinkPlatform,
} from "@/shared/constants/social-links";
import { listFilledSocialLinks } from "@/shared/validation/social-links";
import type { SocialLinks } from "@/types";

type SellerSocialLinksProps = {
  links?: SocialLinks | null;
  publicVisible?: boolean;
};

export function SellerSocialLinks({
  links,
  publicVisible,
}: SellerSocialLinksProps) {
  if (!publicVisible) return null;
  const filled = listFilledSocialLinks(links);
  if (filled.length === 0) return null;

  return (
    <div className="mt-4" aria-label="روابط التواصل">
      <p className="text-xs font-bold text-muted">التواصل الاجتماعي</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {filled.map(({ platform, url }) => (
          <li key={platform}>
            <a
              className="inline-flex items-center rounded-full bg-surface-muted px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary-soft"
              href={url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {labelFor(platform)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function labelFor(platform: SocialLinkPlatform): string {
  return SOCIAL_LINK_LABELS_AR[platform];
}
