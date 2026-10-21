---
project: fixflow-web
order: 2
title: FixFlow.Web
summary: "A dispatcher panel in React and TypeScript: dashboard, work orders, a drag-and-drop dispatch board, clients, devices and parts."
stack:
  - React 19
  - TypeScript 7
  - TanStack Query
  - Tailwind CSS 4
  - Vite 8
  - React Router 8
  - Playwright
decisions:
  - title: Types from the API contract
    tag: "OpenAPI → TypeScript"
    body: "The panel has no hand-written DTOs: types are generated from the OpenAPI contract, and CI fails the build when they differ from the committed ones."
  - title: One token refresh at a time
    tag: "Web Locks"
    body: "The API rotates the refresh token and reusing an old one signs the user out. Parallel requests wait for a single shared refresh, protected across tabs by a Web Locks lock."
  - title: Edit conflicts through ETag
    tag: "ETag · 412"
    body: "A form sends the version of the data the user opened. A 412 response opens a dialog that can load the current version instead of overwriting someone else's changes."
  - title: Sleeping server
    tag: "system/ready"
    body: "The panel wakes the API through system/ready instead of /health, which the EasyPrivacy list blocks, and shows a startup progress screen. The sign-in form appears only once the API responds."
  - title: Polish time regardless of the browser
    tag: "Europe/Warsaw"
    body: "Dates are shown in the Europe/Warsaw time zone, and tests run in America/New_York to catch any dependency on the browser time zone."
links:
  repository: https://github.com/mpalus-git/FixFlow.Web
  demo: https://fix-flow-web.vercel.app/?lang=en
demo: "The sign-in screen has quick sign-in buttons for the demo dispatcher and technician accounts. The demo data is shared by all visitors and reset every day."
cover:
  image: ../../../assets/projects/fixflow-web/dispatch-cover.png
  alt: "Part of the dispatch board: unassigned work orders above the weekday columns"
screenshots:
  - image: ../../../assets/projects/fixflow-web/dashboard.png
    thumbnail: ../../../assets/projects/fixflow-web/dashboard-thumb.png
    alt: "Panel dashboard: counters of work orders to assign, in progress, to invoice and overdue, parts out of stock, work orders by status and technician workload in the current week"
    caption: "Dashboard with counters and workload"
    device: desktop
  - image: ../../../assets/projects/fixflow-web/login.png
    thumbnail: ../../../assets/projects/fixflow-web/login-thumb.png
    alt: "Sign-in screen with quick sign-in buttons for the dispatcher and the technician and a list of features worth checking in the demo"
    caption: "Sign-in with demo accounts"
    device: desktop
  - image: ../../../assets/projects/fixflow-web/dispatch.png
    thumbnail: ../../../assets/projects/fixflow-web/dispatch-thumb.png
    alt: "Dispatch board: unassigned work orders above a week laid out as technician x day with cards of assigned work orders"
    caption: "Weekly dispatch board"
    device: desktop
  - image: ../../../assets/projects/fixflow-web/work-orders.png
    thumbnail: ../../../assets/projects/fixflow-web/work-orders-thumb.png
    alt: "Work order list with search, filters for status, technician and due date, and a table with priority, status and overdue labels"
    caption: "Work order list with filters"
    device: desktop
  - image: ../../../assets/projects/fixflow-web/work-order-details.png
    thumbnail: ../../../assets/projects/fixflow-web/work-order-details-thumb.png
    alt: "Details of a completed work order: client and device data, a service entry with a photo and a used part, status progress and change history"
    caption: "Work order details and history"
    device: desktop
video:
  file: dispatch-drag
  poster: ../../../assets/projects/fixflow-web/dispatch-drag-poster.png
  alt: "Dragging an unassigned work order onto a technician and a day on the dispatch board"
  caption: "Assigning a work order by dragging"
  device: desktop
---

The dispatcher needs to see which work orders are overdue, who has free slots and whom to assign a new request to. The panel brings this together on the dashboard and the dispatch board, a week laid out as technician x day with drag-and-drop assignment that also works from the keyboard.

Lists of work orders, clients, devices and parts are filtered and sorted on the server, and their state is kept in the page address. Administrators manage accounts in the panel, and technicians get a read-only view of their work orders.
