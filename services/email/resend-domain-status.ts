import { resolveResendApiKey } from "@/services/auth/production-config";

const PRIMARY_DOMAIN = "sooqnauae.com";

export type ResendDnsRecordStatus = {
  record: string;
  name: string;
  type: string;
  status: string;
};

export type ResendDomainStatus = {
  queried: boolean;
  domain: string;
  found: boolean;
  domainId: string | null;
  status: string | null;
  region: string | null;
  sending: string | null;
  dkim: string | null;
  spf: string | null;
  records: ResendDnsRecordStatus[];
  error: string | null;
};

type ResendDomainListItem = {
  id?: string;
  name?: string;
  status?: string;
  region?: string;
};

type ResendDomainDetail = {
  id?: string;
  name?: string;
  status?: string;
  region?: string;
  capabilities?: { sending?: string; receiving?: string };
  records?: Array<{
    record?: string;
    name?: string;
    type?: string;
    status?: string;
  }>;
};

function pickRecordStatus(
  records: ResendDnsRecordStatus[],
  kind: string,
): string | null {
  const match = records.find(
    (item) => item.record.toUpperCase() === kind.toUpperCase(),
  );
  return match?.status ?? null;
}

/** Lists Resend domains and returns sooqnauae.com verification (no secrets). */
export async function getResendPrimaryDomainStatus(): Promise<ResendDomainStatus> {
  const empty: ResendDomainStatus = {
    queried: false,
    domain: PRIMARY_DOMAIN,
    found: false,
    domainId: null,
    status: null,
    region: null,
    sending: null,
    dkim: null,
    spf: null,
    records: [],
    error: null,
  };

  const { value: apiKey } = resolveResendApiKey();
  if (!apiKey) {
    return { ...empty, error: "RESEND_API_KEY_MISSING" };
  }

  try {
    const listResponse = await fetch("https://api.resend.com/domains", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(12_000),
    });
    const listBody = (await listResponse.json()) as {
      data?: ResendDomainListItem[];
      message?: string;
      name?: string;
    };
    if (!listResponse.ok) {
      return {
        ...empty,
        queried: true,
        error: listBody.message ?? listBody.name ?? `HTTP_${listResponse.status}`,
      };
    }

    const domains = Array.isArray(listBody.data) ? listBody.data : [];
    const match = domains.find(
      (item) =>
        typeof item.name === "string" &&
        item.name.replace(/^www\./, "").toLowerCase() === PRIMARY_DOMAIN,
    );
    if (!match?.id) {
      return {
        ...empty,
        queried: true,
        error: "DOMAIN_NOT_FOUND_IN_RESEND",
      };
    }

    // Trigger verification so freshly-added DNS is re-checked.
    await fetch(`https://api.resend.com/domains/${match.id}/verify`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(12_000),
    }).catch(() => null);

    const detailResponse = await fetch(
      `https://api.resend.com/domains/${match.id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(12_000),
      },
    );
    const detail = (await detailResponse.json()) as ResendDomainDetail;
    if (!detailResponse.ok) {
      return {
        ...empty,
        queried: true,
        found: true,
        domainId: match.id,
        status: match.status ?? null,
        error: detail.name ?? `HTTP_${detailResponse.status}`,
      };
    }

    const records: ResendDnsRecordStatus[] = (detail.records ?? [])
      .filter((item) => item.record && item.name && item.type && item.status)
      .map((item) => ({
        record: String(item.record),
        name: String(item.name),
        type: String(item.type),
        status: String(item.status),
      }));

    return {
      queried: true,
      domain: PRIMARY_DOMAIN,
      found: true,
      domainId: detail.id ?? match.id,
      status: detail.status ?? match.status ?? null,
      region: detail.region ?? match.region ?? null,
      sending: detail.capabilities?.sending ?? null,
      dkim: pickRecordStatus(records, "DKIM"),
      spf: pickRecordStatus(records, "SPF"),
      records,
      error: null,
    };
  } catch (error) {
    return {
      ...empty,
      queried: true,
      error: error instanceof Error ? error.message : "RESEND_DOMAIN_QUERY_FAILED",
    };
  }
}
