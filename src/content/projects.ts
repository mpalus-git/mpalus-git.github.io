import { getCollection, type CollectionEntry } from "astro:content";
import type { Language } from "@/i18n/i18n";

export function selectProjects(
  entries: CollectionEntry<"projects">[],
  language: Language,
): CollectionEntry<"projects">[] {
  return entries
    .filter((entry) => entry.id.startsWith(`${language}/`))
    .sort((first, second) => first.data.order - second.data.order);
}

export async function getProjects(language: Language): Promise<CollectionEntry<"projects">[]> {
  return selectProjects(await getCollection("projects"), language);
}
