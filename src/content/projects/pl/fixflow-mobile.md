---
project: fixflow-mobile
order: 3
title: FixFlow.Mobile
summary: "Aplikacja technika w .NET MAUI 10 na Androida i Windows, działająca bez zasięgu: zmiany czekają w kolejce i trafiają do API po odzyskaniu sieci."
stack:
  - .NET MAUI 10
  - C#
  - SQLite
  - Refit + Polly
  - CommunityToolkit.Mvvm
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
cover:
  image: ../../../assets/projects/fixflow-mobile/offline-queue-cover.png
  alt: "Lista zleceń bez połączenia: pasek z czasem ostatniej synchronizacji i liczbą zmian do wysłania nad zaległym zleceniem"
screenshots:
  - image: ../../../assets/projects/fixflow-mobile/work-orders.png
    alt: "Lista zleceń technika z podziałem na zaległe, nadchodzące i zakończone, z plakietkami statusu i priorytetu"
    caption: "Lista zleceń technika"
    device: phone
  - image: ../../../assets/projects/fixflow-mobile/work-order-details-dark.png
    alt: "Szczegóły zlecenia w toku z klientem, osobą kontaktową i urządzeniem w trybie ciemnym"
    caption: "Szczegóły zlecenia w trybie ciemnym"
    device: phone
  - image: ../../../assets/projects/fixflow-mobile/work-order-history.png
    alt: "Wpis serwisowy ze zdjęciem i pozycją GPS oraz historia zlecenia"
    caption: "Wpis ze zdjęciem i GPS"
    device: phone
  - image: ../../../assets/projects/fixflow-mobile/service-entry.png
    alt: "Formularz wpisu serwisowego z czasem pracy i zużytą częścią"
    caption: "Formularz wpisu serwisowego"
    device: phone
  - image: ../../../assets/projects/fixflow-mobile/complete-signature.png
    alt: "Ekran zakończenia zlecenia z podpisem klienta"
    caption: "Zakończenie z podpisem klienta"
    device: phone
  - image: ../../../assets/projects/fixflow-mobile/offline-queue.png
    alt: "Lista bez połączenia z paskiem stanu i liczbą zmian do wysłania"
    caption: "Praca bez połączenia"
    device: phone
  - image: ../../../assets/projects/fixflow-mobile/conflict.png
    alt: "Ekran synchronizacji z rozpoczęciem odrzuconym po przekazaniu zlecenia innemu technikowi i wstrzymanym wpisem"
    caption: "Konflikt przy synchronizacji"
    device: phone
  - image: ../../../assets/projects/fixflow-mobile/windows.png
    alt: "Lista zleceń w wersji Windows w trybie ciemnym"
    caption: "Wersja na Windows"
    device: desktop
video:
  file: offline-sync
  poster: ../../../assets/projects/fixflow-mobile/offline-sync-poster.png
  alt: "Rozpoczęcie zlecenia i wpis serwisowy bez sieci, potem synchronizacja po odzyskaniu połączenia"
  caption: "Praca offline i synchronizacja"
  device: phone
---

Technik pracuje w terenie, gdzie zasięg bywa niepewny. Aplikacja pokazuje przypisane mu zlecenia, pozwala rozpocząć pracę, dodawać wpisy serwisowe z czasem pracy, zużytymi częściami, zdjęciami i pozycją GPS, a na końcu zamknąć zlecenie z podpisem klienta. Wszystko działa także offline.

Na Androidzie aplikacja przypomina o terminie zlecenia godzinę wcześniej, a jeden pasek stanu pokazuje, ile zmian czeka na wysłanie i co serwer odrzucił.
