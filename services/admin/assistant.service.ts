import {
  ADMIN_ASSISTANT_ARTICLES,
  type AdminAssistantArticle,
  type AdminAssistantLink,
} from "./assistant-knowledge";

export type AdminAssistantReply = {
  answer: string;
  articleId: string | null;
  links: AdminAssistantLink[];
  related: { id: string; title: string }[];
  mode: "knowledge" | "fallback";
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((token) => token.length >= 2);
}

function tokenMatches(hay: string, token: string): boolean {
  if (!token || !hay) return false;
  if (hay.includes(token) || token.includes(hay)) return true;
  // Light Arabic stem overlap (اعلان / اعلانا / الاعلانات)
  if (token.length >= 4 && hay.length >= 4) {
    const a = token.slice(0, 4);
    const b = hay.slice(0, 4);
    if (a === b) return true;
  }
  return false;
}

function scoreArticle(article: AdminAssistantArticle, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const title = normalize(article.title);
  const keywordNorms = article.keywords.map((keyword) => normalize(keyword));
  const haystack = normalize(
    [article.title, article.summary, ...article.keywords, ...article.steps].join(
      " ",
    ),
  );
  let score = 0;
  for (const token of tokens) {
    if (keywordNorms.some((keyword) => tokenMatches(keyword, token))) {
      score += 5;
    } else if (tokenMatches(title, token)) {
      score += 3;
    } else if (haystack.split(" ").some((part) => tokenMatches(part, token))) {
      score += 1;
    }
  }
  // Prefer specific desks over the generic getting-started guide.
  if (article.id === "getting-started") score -= 1;
  return score;
}

function formatAnswer(article: AdminAssistantArticle): string {
  const steps = article.steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
  return `${article.summary}\n\nالخطوات:\n${steps}`;
}

function fallbackAnswer(message: string): AdminAssistantReply {
  const starters = ADMIN_ASSISTANT_ARTICLES.slice(0, 4).map((article) => ({
    id: article.id,
    title: article.title,
  }));
  return {
    answer:
      message.trim().length === 0
        ? "اكتب سؤالك عن أي قسم في لوحة التحكم — مثلاً: كيف أراجع إعلاناً؟ أو وين الضمان؟"
        : "ما لقيت مطابقة قوية بعد. جرّب سؤالاً أوضح عن قسم معيّن (الإعلانات، المستخدمون، الضمان، التصنيفات…) أو اختر اقتراحاً جاهزاً.",
    articleId: null,
    links: [
      { href: "/admin", label: "الرئيسية" },
      { href: "/admin/listings", label: "الإعلانات" },
      { href: "/admin/assistant", label: "دليل المساعد" },
    ],
    related: starters,
    mode: "fallback",
  };
}

export function answerAdminAssistantQuery(message: string): AdminAssistantReply {
  const tokens = tokenize(message);
  if (tokens.length === 0) return fallbackAnswer(message);

  const ranked = ADMIN_ASSISTANT_ARTICLES.map((article) => ({
    article,
    score: scoreArticle(article, tokens),
  }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < 3) return fallbackAnswer(message);

  const related = ranked
    .slice(1, 4)
    .map((entry) => ({ id: entry.article.id, title: entry.article.title }));

  return {
    answer: formatAnswer(best.article),
    articleId: best.article.id,
    links: best.article.links,
    related,
    mode: "knowledge",
  };
}

export function getAdminAssistantArticle(
  id: string,
): AdminAssistantArticle | undefined {
  return ADMIN_ASSISTANT_ARTICLES.find((article) => article.id === id);
}
