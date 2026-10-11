---
project: fixflow-web
order: 2
title: FixFlow.Web
summary: "A dispatcher panel in React and TypeScript: dashboard, work orders, a drag-and-drop dispatch board, clients, devices and parts."
stack:
  - React 19
  - TypeScript 7
  - Vite 8
  - React Router 8
  - TanStack Query
  - Tailwind CSS 4
  - Playwright
decisions:
  - title: Types from the API contract
    body: "The panel has no hand-written DTOs: types are generated from the OpenAPI contract, and CI fails the build when they differ from the committed ones."
  - title: One token refresh at a time
    body: "The API rotates the refresh token and reusing an old one signs the user out. Parallel requests wait for a single shared refresh, protected across tabs by a Web Locks lock."
  - title: Edit conflicts through ETag
    body: "A form sends the version of the data the user opened. A 412 response opens a dialog that can load the current version instead of overwriting someone else's changes."
  - title: Sleeping server
    body: "The panel wakes the API through system/ready instead of /health, which the EasyPrivacy list blocks, and shows a startup progress screen. The sign-in form appears only once the API responds."
  - title: Polish time regardless of the browser
    body: "Dates are shown in the Europe/Warsaw time zone, and tests run in America/New_York to catch any dependency on the browser time zone."
links:
  repository: https://github.com/mpalus-git/FixFlow.Web
  demo: https://fix-flow-web.vercel.app/?lang=en
demo: "The sign-in screen has quick sign-in buttons for the demo dispatcher and technician accounts. The demo data is shared by all visitors and reset every day."
---

The dispatcher needs to see which work orders are overdue, who has free slots and whom to assign a new request to. The panel brings this together on the dashboard and the dispatch board, a week laid out as technician x day with drag-and-drop assignment that also works from the keyboard.

Lists of work orders, clients, devices and parts are filtered and sorted on the server, and their state is kept in the page address. Administrators manage accounts in the panel, and technicians get a read-only view of their work orders.
