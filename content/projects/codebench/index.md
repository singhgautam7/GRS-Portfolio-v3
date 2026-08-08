---
title: 'CodeBench'
date: '2026-03-02'
type: 'Personal'
featured: true
tech: ['Go', 'Docker', 'CLI']
github: 'https://github.com/singhgautam7/Code-Bench---Language-Benchmarking-CLI-Tool'
excerpt: 'A CLI tool built in Go that benchmarks algorithm performance across programming languages in isolated Docker containers.'
points:
  - 'Measures compile time and execution time separately inside reproducible Docker environments.'
  - 'Supports parallel execution of language benchmarks with concurrent goroutines and peak memory tracking.'
  - 'Exports execution metrics and host system diagnostics to JSON and CSV formats.'
timeline: true
major: true
---

An isolated CLI benchmarking tool written in Go that evaluates code execution across languages using Docker containers. It measures compile and runtime separately, tracks peak memory usage, enforces execution timeouts, and exports clean JSON and CSV reports.
