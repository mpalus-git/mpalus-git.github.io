---
project: fixflow-web
order: 2
title: FixFlow.Web
summary: "Panel dyspozytora w React i TypeScript: pulpit, zlecenia, tablica dispatch z przeciąganiem, klienci, urządzenia i części."
stack:
  - React 19
  - TypeScript 7
  - Vite 8
  - React Router 8
  - TanStack Query
  - Tailwind CSS 4
  - Playwright
decisions:
  - title: Typy z kontraktu API
    body: "Panel nie ma ręcznie pisanych DTO: typy są generowane z kontraktu OpenAPI, a CI odrzuca build, gdy różnią się od zacommitowanych."
  - title: Jedno odświeżenie tokena naraz
    body: "API rotuje refresh token, a ponowne użycie starego wylogowuje. Równoległe żądania czekają na jedno wspólne odświeżenie, a między kartami chroni je blokada Web Locks."
  - title: Konflikty edycji przez ETag
    body: "Formularz wysyła wersję danych, którą użytkownik otworzył. Odpowiedź 412 otwiera dialog z możliwością wczytania aktualnej wersji zamiast nadpisywać cudze zmiany."
  - title: Uśpiony serwer
    body: "Panel budzi API przez system/ready, a nie /health, który blokuje lista EasyPrivacy, i pokazuje ekran z postępem uruchamiania. Formularz logowania pojawia się dopiero, gdy API odpowiada."
  - title: Czas polski niezależnie od przeglądarki
    body: "Daty są wyświetlane w strefie Europe/Warsaw, a testy działają w strefie America/New_York, żeby wyłapać każdą zależność od strefy przeglądarki."
links:
  repository: https://github.com/mpalus-git/FixFlow.Web
  demo: https://fix-flow-web.vercel.app
demo: "Ekran logowania ma przyciski szybkiego logowania kontami demo dyspozytora i technika. Dane demonstracyjne są wspólne dla wszystkich odwiedzających i przywracane codziennie."
---

Dyspozytor musi widzieć, które zlecenia są opóźnione, kto ma wolne terminy i komu przypisać nowe zgłoszenie. Panel zbiera to na pulpicie i na tablicy dispatch, czyli tygodniu w układzie technik x dzień z przypisywaniem przeciągnięciem, także z klawiatury.

Listy zleceń, klientów, urządzeń i części są filtrowane i sortowane po stronie serwera, a ich stan jest zapisany w adresie strony. Administrator zarządza w panelu kontami, a technik ma podgląd swoich zleceń.
