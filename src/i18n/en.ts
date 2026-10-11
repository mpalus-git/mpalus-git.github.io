import type { Dictionary } from "@/i18n/dictionary";

export const en: Dictionary = {
  personName: "Mateusz Palus",
  role: "Full-stack Developer (.NET, Web)",
  homeTitle: "Mateusz Palus - Full-stack Developer (.NET, Web)",
  heroDescription:
    "I design and build applications from the database to the user interface. This site presents FixFlow, a field service management system whose three parts I built: a .NET 10 backend with PostgreSQL, a dispatcher panel in React and TypeScript, and a technician app in .NET MAUI that works without coverage. I care about what is not visible at first glance: business rules enforced in the database, offline work without duplicates, tests and accessibility.",
  heroBadgeBackend: ".NET 10",
  heroBadgeWeb: "React + TypeScript",
  heroBadgeMobile: ".NET MAUI",
  heroGitHub: "GitHub",
  heroDemo: "FixFlow panel demo",
  fixflowHeading: "FixFlow",
  fixflowIntro:
    "FixFlow is a field service management system for a company that repairs air conditioning and office equipment. The dispatcher creates work orders and assigns them to technicians in the web panel, and technicians carry them out in the mobile app, even without coverage. Both apps use one API that enforces the business rules.",
  diagramTitle: "FixFlow system architecture",
  diagramDescription:
    "The dispatcher panel (FixFlow.Web) and the technician app (FixFlow.Mobile) connect to FixFlow.Api, which stores data in PostgreSQL and is the single source of truth for the business rules. The technician app sends changes from an offline queue.",
  diagramWebName: "FixFlow.Web",
  diagramWebRole: "Dispatcher panel",
  diagramMobileName: "FixFlow.Mobile",
  diagramMobileRole: "Technician app",
  diagramApiName: "FixFlow.Api",
  diagramApiRole: "Business rules and OpenAPI contract",
  diagramDatabase: "PostgreSQL",
  diagramRest: "REST API",
  diagramOfflineQueue: "offline queue",
  skipToContent: "Skip to content",
  languageSwitchLabel: "Language",
  languageName: "English",
  opensInNewTab: "(opens in a new tab)",
  footerGitHub: "GitHub",
  footerSourceCode: "Source code of this site",
  footerRights: "All rights reserved.",
  notFoundTitle: "Page not found",
  notFoundText: "The page you are looking for does not exist or has been moved.",
  notFoundLink: "Back to the home page",
};
