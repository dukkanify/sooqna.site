import Link from "next/link";
import type { ReactNode } from "react";
import { AuthBrandTitle } from "@/features/auth/components/AuthBrandTitle";
import { BrandLogo } from "@/shared/components/BrandLogo";
import { Icon } from "@/shared/ui/Icon";
import { getAuthTrustPoints } from "@/services/content";
import "./auth.css";

type AuthShellProps = {
  children: ReactNode;
  description: string;
  footerAction: {
    href: string;
    label: string;
    prompt: string;
  };
  title: string;
};

export async function AuthShell({
  children,
  description,
  footerAction,
  title,
}: AuthShellProps) {
  const trustPoints = await getAuthTrustPoints();

  return (
    <section className="auth-shell app-container page-padding">
      <aside className="auth-shell__showcase">
        <div className="auth-shell__showcase-inner">
          <BrandLogo showTagline={false} size="md" theme="dark" />

          <AuthBrandTitle title={title} />

          <p className="auth-shell__description">{description}</p>

          <ul className="auth-shell__points">
            {trustPoints.map((point) => (
              <li key={point} className="auth-shell__point">
                <span className="auth-shell__point-mark" aria-hidden>
                  <Icon name="check" size={12} />
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="auth-shell__panel">
        <div className="auth-shell__card">
          <div aria-hidden className="auth-shell__card-accent" />
          {children}
          <div className="auth-shell__footer">
            {footerAction.prompt}{" "}
            <Link href={footerAction.href}>{footerAction.label}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
