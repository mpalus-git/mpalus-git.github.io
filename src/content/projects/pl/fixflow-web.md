---
project: fixflow-web
order: 2
title: FixFlow.Web
summary: "Panel dyspozytora w React i TypeScript: pulpit, zlecenia, tablica dispatch z przeciąganiem, klienci, urządzenia i części."
stack:
  - React 19
  - TypeScript 7
  - TanStack Query
  - Tailwind CSS 4
  - Vite 8
  - React Router 8
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
cover:
  image: ../../../assets/projects/fixflow-web/dispatch-cover.png
  alt: "Fragment tablicy dispatch: nieprzypisane zlecenia nad kolumnami dni tygodnia"
screenshots:
  - image: ../../../assets/projects/fixflow-web/dashboard.png
    thumbnail: ../../../assets/projects/fixflow-web/dashboard-thumb.png
    alt: "Pulpit panelu: liczniki zleceń do przypisania, w realizacji, do zafakturowania, opóźnionych i części bez stanu, zlecenia według statusu i obciążenie techników w bieżącym tygodniu"
    caption: "Pulpit z licznikami i obciążeniem"
    device: desktop
  - image: ../../../assets/projects/fixflow-web/login.png
    thumbnail: ../../../assets/projects/fixflow-web/login-thumb.png
    alt: "Ekran logowania z przyciskami szybkiego logowania jako dyspozytor lub technik i listą funkcji wartych sprawdzenia w demo"
    caption: "Logowanie kontami demo"
    device: desktop
  - image: ../../../assets/projects/fixflow-web/dispatch.png
    thumbnail: ../../../assets/projects/fixflow-web/dispatch-thumb.png
    alt: "Tablica dispatch: nieprzypisane zlecenia nad tygodniem w układzie technik x dzień z kartami przypisanych zleceń"
    caption: "Tygodniowa tablica dispatch"
    device: desktop
  - image: ../../../assets/projects/fixflow-web/work-orders.png
    thumbnail: ../../../assets/projects/fixflow-web/work-orders-thumb.png
    alt: "Lista zleceń z wyszukiwaniem i filtrami statusu, technika i terminu oraz tabelą z priorytetem, statusem i oznaczeniem zleceń po terminie"
    caption: "Lista zleceń z filtrami"
    device: desktop
  - image: ../../../assets/projects/fixflow-web/work-order-details.png
    thumbnail: ../../../assets/projects/fixflow-web/work-order-details-thumb.png
    alt: "Szczegóły zakończonego zlecenia: dane klienta i urządzenia, wpis serwisowy ze zdjęciem i zużytą częścią, przebieg statusów i historia zmian"
    caption: "Szczegóły i historia zlecenia"
    device: desktop
video:
  file: dispatch-drag
  poster: ../../../assets/projects/fixflow-web/dispatch-drag-poster.png
  alt: "Przeciągnięcie nieprzypisanego zlecenia na technika i dzień na tablicy dispatch"
  caption: "Przypisanie zlecenia przeciągnięciem"
  device: desktop
---

Dyspozytor musi widzieć, które zlecenia są opóźnione, kto ma wolne terminy i komu przypisać nowe zgłoszenie. Panel zbiera to na pulpicie i na tablicy dispatch, czyli tygodniu w układzie technik x dzień z przypisywaniem przeciągnięciem, także z klawiatury.

Listy zleceń, klientów, urządzeń i części są filtrowane i sortowane po stronie serwera, a ich stan jest zapisany w adresie strony. Administrator zarządza w panelu kontami, a technik ma podgląd swoich zleceń.
