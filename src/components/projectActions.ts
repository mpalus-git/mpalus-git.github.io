import type { CollectionEntry } from "astro:content";
import type { IconName } from "@/components/icons";
import { t, type Language } from "@/i18n/i18n";

export type ProjectAction = {
  href: string;
  label: string;
  icon: IconName;
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
          icon: "arrow-up-right",
          wakesApi: true,
        }
      : null,
    links.release
      ? {
          href: links.release,
          label: t(language, "projectLinkRelease"),
          icon: "download",
          wakesApi: false,
        }
      : null,
    links.docs
      ? {
          href: links.docs,
          label: t(language, "projectLinkDocs"),
          icon: "book-open",
          wakesApi: true,
        }
      : null,
    {
      href: links.repository,
      label: t(language, "projectLinkRepository"),
      icon: "code",
      wakesApi: false,
    },
  ];
  return candidates.filter((action): action is ProjectAction => action !== null);
}
