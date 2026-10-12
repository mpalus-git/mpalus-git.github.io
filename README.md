# mpalus-git.github.io

[![CI](https://github.com/mpalus-git/mpalus-git.github.io/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/mpalus-git/mpalus-git.github.io/actions/workflows/deploy.yml)
[![Astro](https://img.shields.io/github/package-json/dependency-version/mpalus-git/mpalus-git.github.io/astro?label=Astro&logo=astro&logoColor=white&color=0d736a)](https://astro.build)
[![TypeScript](https://img.shields.io/github/package-json/dependency-version/mpalus-git/mpalus-git.github.io/dev/typescript?label=TypeScript&logo=typescript&logoColor=white&color=0d736a)](https://www.typescriptlang.org)

Strona: **[mpalus-git.github.io](https://mpalus-git.github.io)**

Portfolio z projektami systemu FixFlow do obsługi zleceń serwisowych w terenie:

- [FixFlow.Api](https://github.com/mpalus-git/FixFlow.Api) - backend .NET 10, źródło prawdy dla panelu i aplikacji mobilnej.
- [FixFlow.Web](https://github.com/mpalus-git/FixFlow.Web) - panel dyspozytora w React i TypeScript ([wersja demo](https://fix-flow-web.vercel.app)).
- [FixFlow.Mobile](https://github.com/mpalus-git/FixFlow.Mobile) - aplikacja technika w .NET MAUI 10 działająca bez zasięgu ([najnowsze wydanie](https://github.com/mpalus-git/FixFlow.Mobile/releases/latest)).

## Co zawiera strona

- Stronę główną z krótkim opisem, diagramem trzech części systemu i kartami projektów.
- Strony projektów: rozwiązywany problem, stack, najważniejsze decyzje techniczne, zrzuty ekranu, krótkie wideo i linki do demo, repozytorium i wydania.
- Wersję polską pod `/` i angielską pod `/en/`, także dla strony 404.

## Stack

| Obszar         | Technologie                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| Podstawa       | Astro 7 (wyjście statyczne), TypeScript 6 (`astro/tsconfigs/strictest`), Node.js 24, pnpm 12         |
| Treść          | Content collections ze schematem Zod (Markdown osobno po polsku i angielsku), i18n wbudowane w Astro |
| UI             | Tailwind CSS 4, czcionki systemowe, ikony jako inline SVG (@lucide/astro)                            |
| Obrazy         | astro:assets (AVIF i WebP w kilku rozmiarach), wideo MP4 i WebM zamiast GIF                          |
| Jakość         | ESLint 10 z typescript-eslint, eslint-plugin-astro i jsx-a11y, Prettier, @astrojs/check              |
| Testy          | Vitest, Playwright, axe-core                                                                         |
| CI i wdrożenie | GitHub Actions, GitHub Pages                                                                         |

## Decyzje techniczne

### Generowanie statyczne

Wszystkie strony powstają przy buildzie jako gotowy HTML z wbudowanym arkuszem stylów. Do przeglądarki trafiają tylko dwa skrypty: wykrywanie języka i budzenie API. Diagramy są w SVG bez JavaScriptu, a sekcję otwierającą tworzy sam tekst, więc to on jest elementem LCP, a nie obraz.

### Ciche budzenie API

API działa na darmowym planie Render, który usypia instancję po 15 minutach bezczynności, a jej start trwa 35-40 s. Żeby rekruter po kliknięciu w demo panelu nie czekał na serwer, strona zaraz po załadowaniu wysyła w tle żądanie `GET /api/v1/system/ready`. Ten adres sprawdza też połączenie z bazą, więc budzi również bazę danych. Żądanie powtarza się najwyżej raz na 5 minut: po powrocie do karty oraz po najechaniu albo przejściu fokusem na link do panelu, dzięki czemu serwer nie zaśnie nawet przy dłuższym czytaniu strony.

- `fetch` z `mode: "no-cors"`: odpowiedź nie jest potrzebna, liczy się tylko to, że żądanie dotrze do serwera. Dzięki temu nie trzeba było zmieniać konfiguracji CORS w API.
- `system/ready` zamiast `/health`: lista EasyPrivacy (Brave Shields, uBlock Origin) blokuje adresy `onrender.com/health`. Adres budzenia jest sprawdzony na listach EasyList, EasyPrivacy, uBlock Origin, Brave i polskich filtrach.
- Budzenie nie pokazuje żadnego komunikatu ani wskaźnika, a każdy błąd (brak sieci, bloker) jest pomijany.

### Język strony

GitHub Pages nie przekazuje nagłówka `Accept-Language`, więc język wybiera mały skrypt inline na początku `<body>`, uruchamiany przed wyświetleniem treści. Pierwszeństwo ma język wybrany wcześniej przełącznikiem (zapisany w `localStorage`), potem preferowane języki przeglądarki: polski na dowolnej pozycji listy oznacza wersję polską, w przeciwnym razie angielską. Przekierowanie działa tylko przy wejściu na stronę z zewnątrz, używa `location.replace` (przycisk Wstecz nie wraca do złej wersji) i pomija roboty wyszukiwarek, żeby obie wersje były indeksowane pod własnymi adresami. Przełącznik PL/EN w nagłówku prowadzi do odpowiednika bieżącej strony, a bez JavaScriptu działa jak zwykły link.

### Jeden motyw

Strona ma jeden jasny motyw z kolorem przewodnim teal `#0D736A`, tym samym co w panelu i aplikacji mobilnej. `color-scheme: only light` zapobiega przemalowaniu strony przez wymuszony tryb ciemny w Chrome i Brave.

### GitHub Pages i jego ograniczenia

Strona jest hostowana jako strona użytkownika GitHub Pages, więc adres w CV jest krótki i nie zależy od zewnętrznej usługi. Kosztem jest brak kontroli nad nagłówkami HTTP:

- Content Security Policy jest ustawiana przez znacznik `<meta>` generowany przez Astro, z hashami skryptów i stylów oraz domeną API w `connect-src`.
- Dyrektywa `frame-ancestors` nie działa w `<meta>`, więc strony nie da się zabezpieczyć przed osadzeniem w ramce.
- Nie da się ustawić czasu przechowywania plików w pamięci podręcznej (GitHub Pages wysyła stałe 10 minut) ani własnych nagłówków bezpieczeństwa, takich jak HSTS czy COOP.

## Lighthouse

Pomiar PageSpeed Insights na produkcji (mobile, 2026-10-11) dla strony głównej po polsku i angielsku oraz strony projektu: 100 w kategoriach wydajność, dostępność, dobre praktyki i SEO.

## Uruchomienie lokalne

Wymagany jest Node.js 24 i pnpm 12.

```bash
pnpm install
pnpm dev
```

Strona działa pod http://localhost:4321.

### Skrypty

| Skrypt                | Działanie                                                                   |
| --------------------- | --------------------------------------------------------------------------- |
| `pnpm build`          | build statyczny do katalogu `dist`                                          |
| `pnpm preview`        | podgląd zbudowanej strony                                                   |
| `pnpm lint`           | ESLint i Prettier                                                           |
| `pnpm check`          | kontrola typów (`astro check`)                                              |
| `pnpm check:comments` | kontrola braku komentarzy w CSS, Markdown, YAML i plikach konfiguracyjnych  |
| `pnpm test`           | testy jednostkowe Vitest                                                    |
| `pnpm e2e`            | testy Playwright na zbudowanej stronie (wymaga wcześniejszego `pnpm build`) |
| `pnpm check:links`    | sprawdzenie linków zewnętrznych w zbudowanej stronie                        |

## Testy

- Vitest: logika budzenia API (limit wywołań, powrót do karty, link do demo, brak sieci, niedostępny magazyn, parametry żądania), decyzja o języku, słowniki i odpowiedniki stron w drugim języku, komplet treści projektów w obu językach, komponenty renderowane przez Astro Container API.
- Playwright: wykrywanie języka dla różnych ustawień przeglądarki, zapamiętany wybór z przełącznika, wyłączony JavaScript i zablokowany magazyn, linki wewnętrzne i obrazy, żądanie budzenia (bez prawdziwego API), brak błędów konsoli i naruszeń CSP, wygląd przy wymuszonym trybie ciemnym.
- axe-core: każda strona w obu językach przy szerokości 360 px i 1440 px, bez naruszeń poziomu serious i critical.

CI uruchamia lint, kontrolę typów, kontrolę komentarzy, testy jednostkowe, build i testy e2e na każdym pull requeście. Wdrożenie na GitHub Pages następuje tylko z gałęzi `main`, po przejściu tych samych kroków. Osobny workflow raz w tygodniu sprawdza linki zewnętrzne i adres budzenia API.

## Licencja

Wszelkie prawa zastrzeżone. Kod jest udostępniony wyłącznie do wglądu; wykorzystanie, kopiowanie lub modyfikacja wymagają zgody autora.

Ikona GitHub pochodzi z [Octicons](https://github.com/primer/octicons) (licencja MIT).
