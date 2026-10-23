---
project: fixflow-api
order: 1
title: FixFlow.Api
summary: "A .NET 10 backend with PostgreSQL that is the source of truth for the business rules and the API contract of the whole system."
stack:
  - .NET 10
  - ASP.NET Core Minimal API
  - PostgreSQL 18
  - EF Core
  - HybridCache + Redis
  - Quartz
  - QuestPDF
decisions:
  - title: Vertical slices instead of layers
    body: "Each feature has its own folder with the endpoint, handler, validator and contract. Business rules live in domain entities, and the handler passes them whatever they need as arguments, so the rules can be unit tested."
  - title: Business errors without exceptions
    body: "A rejected status transition or a missing part is an expected outcome, so methods return ErrorOr and the mapping to ProblemDetails and HTTP codes lives in one place."
  - title: Rules enforced in the database too
    body: "One work order in progress per technician, stock that never drops below zero and unique serial numbers are backed by an index, a CHECK constraint or a concurrency token, so parallel requests end with a 409 instead of inconsistent data."
  - title: Safe retries for offline clients
    body: "Service entries and photos use identifiers assigned by the app, and a repeated start or completion returns 200 with the current state, so the offline queue can retry requests without creating duplicates."
  - title: Contract guarded in CI
    body: "The OpenAPI document is generated during the build and committed, and CI rejects a change when the generated version differs, so every contract change shows up in code review."
links:
  repository: https://github.com/mpalus-git/FixFlow.Api
  docs: https://fixflow-api-us2p.onrender.com/scalar
demo: "The API documentation and client (Scalar) can be tried on the demo instance. Demo accounts and how to sign in are described in the repository README, and the demo data is reset every day."
architectureDiagram: true
---

A company servicing air conditioning and office equipment needs one place where the dispatcher manages clients, devices and parts, creates work orders and assigns them to technicians, and where technicians report work done in the field.

FixFlow.Api enforces the business rules (work order status transitions, stock levels and role permissions) whether a request comes from the web panel or from the mobile app working offline. It returns errors as ProblemDetails with an error code, generates a PDF service report and publishes the OpenAPI contract that clients generate their types from.
