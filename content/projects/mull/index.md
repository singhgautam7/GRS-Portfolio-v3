---
title: 'Mull'
date: '2026-09-15'
type: 'Personal'
featured: false
tech: ['Flutter', 'Dart', 'Riverpod', 'Drift', 'SQLite', 'Python', 'Android']
external: 'https://play.google.com/store/apps/details?id=com.grs.dictionary'
github: 'https://github.com/singhgautam7/Mull'
excerpt: 'An offline English (UK) dictionary and vocabulary app for Android: look words up or swipe through curated collections, with zero network calls.'
points:
  - 'Built a fully offline dictionary app in Flutter with no INTERNET permission, shipping a prebuilt SQLite dictionary with FTS5 search.'
  - 'Designed a two-database architecture: a read-only, wholesale-replaceable dictionary DB and a separate Drift user DB for notes, bookmarks and lists.'
  - 'Wrote an LLM-assisted Python pipeline to build and curate the dictionary dataset and vocabulary collections.'
timeline: true
major: false
---

An offline English (UK) dictionary and vocabulary app for Android built in Flutter.
Look a word up, or open the Mull tab and swipe through curated collections one word
card at a time. The dictionary ships as a prebuilt, read-only SQLite file with FTS5
search, kept fully separate from the user database for notes, bookmarks and custom
lists. Everything is local: no account, no sync, no network call, ever.
