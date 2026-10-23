---
project: fixflow-mobile
order: 3
title: FixFlow.Mobile
summary: "A technician app in .NET MAUI 10 for Android and Windows that works without coverage: changes wait in a queue and reach the API once the connection is back."
stack:
  - .NET MAUI 10
  - C#
  - SQLite
  - Refit + Polly
  - CommunityToolkit.Mvvm
  - xUnit
decisions:
  - title: Offline operation queue
    body: "Every change is written to a queue table in the same SQLite transaction as the local data and sent in the order it was made. ViewModels never call the API to change state."
  - title: Retries without duplicates
    body: "The app assigns identifiers to entries and photos, so when a response is lost and the queue sends an entry again, the API recognizes it and does not take the parts off stock twice."
  - title: Changes to resolve
    body: 'Transient errors are retried with increasing delays, and a change the server rejects, for example after the work order was handed to another technician, goes to a "To resolve" screen where the technician retries or discards it.'
  - title: Client signature in the queue
    body: "The signature is a photo sent before the work order is completed, so it works offline like any other photo and ends up in the PDF report. The signature pad uses no external library."
  - title: Logic without MAUI
    body: "ViewModels, synchronization and SQLite access live in a plain net10.0 project with no MAUI dependency, so all the logic is covered by ordinary unit tests without an emulator."
links:
  repository: https://github.com/mpalus-git/FixFlow.Mobile
  release: https://github.com/mpalus-git/FixFlow.Mobile/releases/latest
demo: "The release includes an Android APK and a Windows version that runs without installation. The app connects to the demo instance, and the technician account and demo sign-in are described in the repository README. The demo data is reset every day."
cover:
  image: ../../../assets/projects/fixflow-mobile/offline-queue-cover.png
  alt: "Work order list without a connection: a bar with the last sync time and the number of changes to send above an overdue work order"
screenshots:
  - image: ../../../assets/projects/fixflow-mobile/work-orders.png
    alt: "Technician's work order list split into overdue, upcoming and completed, with status and priority badges"
    caption: "Technician's work order list"
    device: phone
  - image: ../../../assets/projects/fixflow-mobile/work-order-details-dark.png
    alt: "Details of a work order in progress with the client, contact person and device in dark mode"
    caption: "Work order details in dark mode"
    device: phone
  - image: ../../../assets/projects/fixflow-mobile/work-order-history.png
    alt: "Service entry with a photo and GPS position, and the work order history"
    caption: "Entry with photo and GPS"
    device: phone
  - image: ../../../assets/projects/fixflow-mobile/service-entry.png
    alt: "Service entry form with work time and a used part"
    caption: "Service entry form"
    device: phone
  - image: ../../../assets/projects/fixflow-mobile/complete-signature.png
    alt: "Work order completion screen with the client's signature"
    caption: "Completion with client's signature"
    device: phone
  - image: ../../../assets/projects/fixflow-mobile/offline-queue.png
    alt: "List without a connection, with a status bar and the number of changes to send"
    caption: "Working without a connection"
    device: phone
  - image: ../../../assets/projects/fixflow-mobile/conflict.png
    alt: "Sync screen with a start rejected after the work order was handed to another technician and a held service entry"
    caption: "Conflict during synchronization"
    device: phone
  - image: ../../../assets/projects/fixflow-mobile/windows.png
    alt: "Work order list in the Windows version in dark mode"
    caption: "Windows version"
    device: desktop
video:
  file: offline-sync
  poster: ../../../assets/projects/fixflow-mobile/offline-sync-poster.png
  alt: "Starting a work order and adding a service entry without a network, then synchronization once the connection is back"
  caption: "Offline work and synchronization"
  device: phone
---

Technicians work in the field, where coverage is not guaranteed. The app shows their assigned work orders, lets them start work, add service entries with work time, used parts, photos and GPS position, and finally complete the work order with the client's signature. All of it also works offline.

On Android the app reminds about a work order an hour before it is due, and a single status bar shows how many changes are waiting to be sent and what the server rejected.
