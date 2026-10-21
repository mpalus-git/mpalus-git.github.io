---
project: fixflow-api
order: 1
title: FixFlow.Api
summary: "Backend .NET 10 z PostgreSQL, źródło prawdy dla reguł biznesowych i kontraktu API całego systemu."
stack:
  - .NET 10
  - ASP.NET Core Minimal API
  - PostgreSQL 18
  - EF Core
  - HybridCache + Redis
  - Quartz
  - QuestPDF
decisions:
  - title: Vertical Slice zamiast warstw
    tag: "endpoint · handler · walidator"
    body: "Każda funkcja ma własny folder z endpointem, handlerem, walidatorem i kontraktem. Reguły biznesowe są w encjach domeny, a handler przekazuje im potrzebną wiedzę jako argument, więc da się je testować jednostkowo."
  - title: Błędy biznesowe bez wyjątków
    tag: "ErrorOr → ProblemDetails"
    body: "Odrzucone przejście statusu czy brak części to oczekiwany wynik operacji, więc metody zwracają ErrorOr, a mapowanie na ProblemDetails i kody HTTP jest w jednym miejscu."
  - title: Reguły zabezpieczone także w bazie
    tag: "indeks · CHECK · 409"
    body: "Jedno zlecenie w toku na technika, stan magazynu nie poniżej zera i unikalne numery seryjne mają odpowiednik w indeksie, ograniczeniu CHECK lub tokenie współbieżności, więc równoległe żądania kończą się błędem 409 zamiast błędnymi danymi."
  - title: Bezpieczne ponawianie dla klienta offline
    tag: "idempotencja"
    body: "Wpisy i zdjęcia mają identyfikatory nadawane przez aplikację, a ponowiony start lub zakończenie zlecenia zwraca 200 z bieżącym stanem, więc kolejka offline może ponawiać żądania bez duplikatów."
  - title: Kontrakt pilnowany w CI
    tag: "OpenAPI · CI"
    body: "Dokument OpenAPI jest generowany przy buildzie i commitowany, a CI odrzuca zmianę, jeśli wygenerowana wersja się różni, więc każda zmiana kontraktu jest widoczna w review."
links:
  repository: https://github.com/mpalus-git/FixFlow.Api
  docs: https://fixflow-api-us2p.onrender.com/scalar
demo: "Dokumentację i klienta API (Scalar) można wypróbować na instancji demo. Konta demo i sposób logowania opisuje README repozytorium, a dane demonstracyjne są przywracane codziennie."
architectureDiagram: true
---

Firma serwisująca klimatyzację i urządzenia biurowe potrzebuje jednego miejsca, w którym dyspozytor prowadzi klientów, urządzenia i części, tworzy zlecenia i przypisuje je technikom, a technik raportuje pracę w terenie.

FixFlow.Api pilnuje reguł biznesowych: przejść statusów zlecenia, stanów magazynowych i uprawnień ról, niezależnie od tego, czy żądanie przychodzi z panelu webowego, czy z aplikacji mobilnej działającej offline. Zwraca błędy w formacie ProblemDetails z kodem błędu, generuje protokół serwisowy w PDF i udostępnia kontrakt OpenAPI, z którego klienci generują swoje typy.
