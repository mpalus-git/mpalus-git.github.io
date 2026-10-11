---
project: fixflow-mobile
order: 3
title: FixFlow.Mobile
summary: "Aplikacja technika w .NET MAUI 10 na Androida i Windows, działająca bez zasięgu: zmiany czekają w kolejce i trafiają do API po odzyskaniu sieci."
stack:
  - .NET MAUI 10
  - C#
  - CommunityToolkit.Mvvm
  - SQLite
  - Refit + Polly
  - xUnit
decisions:
  - title: Kolejka operacji offline
    body: "Każda zmiana zapisuje się w tabeli kolejki w jednej transakcji SQLite z danymi lokalnymi i jest wysyłana w kolejności powstania. ViewModele nigdy nie wołają API przy zmianach stanu."
  - title: Ponowne wysłanie bez duplikatów
    body: "Identyfikatory wpisów i zdjęć nadaje aplikacja, więc gdy odpowiedź się zgubi i kolejka wyśle wpis jeszcze raz, API go rozpoznaje i nie zdejmuje części ze stanu drugi raz."
  - title: Zmiany do wyjaśnienia
    body: "Błędy przejściowe są ponawiane z narastającym odstępem, a zmiana odrzucona przez serwer, np. po przekazaniu zlecenia innemu technikowi, trafia na ekran „Do wyjaśnienia”, gdzie technik ją ponawia albo odrzuca."
  - title: Podpis klienta w kolejce
    body: "Podpis to zdjęcie wysyłane przed zakończeniem zlecenia, więc działa offline tak jak inne zdjęcia i trafia do protokołu PDF. Pole podpisu powstało bez zewnętrznej biblioteki."
  - title: Logika bez MAUI
    body: "ViewModele, synchronizacja i dostęp do SQLite są w projekcie net10.0 bez zależności od MAUI, więc cała logika jest testowana zwykłymi testami jednostkowymi, bez emulatora."
links:
  repository: https://github.com/mpalus-git/FixFlow.Mobile
  release: https://github.com/mpalus-git/FixFlow.Mobile/releases/latest
demo: "Wydanie zawiera plik APK na Androida i wersję Windows do uruchomienia bez instalacji. Aplikacja łączy się z instancją demo, a konto technika i logowanie kontem demo opisuje README repozytorium. Dane demonstracyjne są przywracane codziennie."
---

Technik pracuje w terenie, gdzie zasięg bywa niepewny. Aplikacja pokazuje przypisane mu zlecenia, pozwala rozpocząć pracę, dodawać wpisy serwisowe z czasem pracy, zużytymi częściami, zdjęciami i pozycją GPS, a na końcu zamknąć zlecenie z podpisem klienta. Wszystko działa także offline.

Na Androidzie aplikacja przypomina o terminie zlecenia godzinę wcześniej, a jeden pasek stanu pokazuje, ile zmian czeka na wysłanie i co serwer odrzucił.
