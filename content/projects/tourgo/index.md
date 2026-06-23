---
title: 'A Tour of Go'
date: '2026-05-01'
type: 'Personal'
featured: true
tech: ['Android', 'Flutter', 'Go Playground']
external: 'https://play.google.com/store/apps/details?id=com.grs.tourgo'
excerpt: 'Mobile-first Go learning companion: offline Tour + Go by Example, a live sandbox via the official Playground API, and instant search.'
points:
  - 'Built a mobile companion app for learning Go, bringing the official Go Tour (go.dev/tour) and Go by Example (gobyexample.com) into a clean, mobile-first experience.'
  - 'Implemented offline-first content sync that fetches lessons from official sources once and caches them locally for full offline reading.'
  - 'Integrated the official Go Playground API to run Go programs in a live sandbox directly from the app, with replayable stdout/stderr output.'
  - 'Built a custom HTML parser and Go syntax highlighter from scratch with zero external dependencies to keep the app lightweight.'
  - 'Added instant full-text search across all chapters, lessons, and examples with relevance-weighted ranking and excerpt highlighting.'
  - 'Designed a progress tracking system that persists across both the Tour and Go by Example, with chapter completion animations.'
  - 'Implemented a background download manager for Go by Example with live progress UI, sequential fetching, and per-example status indicators.'
timeline: true
major: false
---

A mobile-first companion for learning Go: the offline Tour of Go and Go by
Example, a live code sandbox backed by the official Go Playground API, and
instant search across lessons.
