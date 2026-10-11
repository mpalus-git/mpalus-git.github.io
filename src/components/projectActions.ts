import ArrowUpRight from "@lucide/astro/icons/arrow-up-right";
import BookOpen from "@lucide/astro/icons/book-open";
import Code from "@lucide/astro/icons/code";
import Download from "@lucide/astro/icons/download";
import type { CollectionEntry } from "astro:content";
import { t, type Language } from "@/i18n/i18n";

export type ProjectAction = {
  href: string;
  label: string;
  icon: typeof ArrowUpRight;
  wakesApi: boolean;
};

export function getProjectActions(
  links: CollectionEntry<"projects">["data"]["links"],
  language: Language,
): ProjectAction[] {
  const candidates: (ProjectAction | null)[] = [
    links.demo
      ? {
          href: links.demo,
          label: t(language, "projectLinkDemo"),
          icon: ArrowUpRight,
          wakesApi: true,
        }
      : null,
    links.release
      ? {
          href: links.release,
          label: t(language, "projectLinkRelease"),
          icon: Download,
          wakesApi: false,
        }
      : null,
    links.docs
      ? { href: links.docs, label: t(language, "projectLinkDocs"), icon: BookOpen, wakesApi: true }
      : null,
    {
      href: links.repository,
      label: t(language, "projectLinkRepository"),
      icon: Code,
      wakesApi: false,
    },
  ];
  return candidates.filter((action): action is ProjectAction => action !== null);
}
