# ⚙️ CPU Scheduling Simulator

An interactive web-based tool designed to visualize and analyze various Operating System CPU scheduling algorithms. This project bridges the gap between theoretical OS concepts and practical web implementation.

## 🚀 Live Demo
[cpu-scheduling-simulator](https://pakayca.github.io/cpu-scheduling-simulator/)

## ✨ Features
- **Real-time Visualization:** Dynamic Gantt chart generation based on user input.
- **Multiple Algorithms:** - First-Come, First-Served (FCFS)
  - Shortest Job First (SJF - Non-Preemptive)
  - Shortest Remaining Time First (SRTF - Preemptive)
  - Round Robin (RR)
- **Performance Metrics:** Automatically calculates Average Waiting Time and Average Turnaround Time.
- **Responsive UI:** Minimalist, dark-themed dashboard inspired by modern IDEs.

## 🛠️ Tech Stack
- **Frontend:** HTML5, CSS3 (Custom Grid & Flexbox), JavaScript (Vanilla ES6+)
- **Architecture:** Procedural logic for scheduling engines and DOM manipulation for real-time rendering.

## 🧠 How it Works
The simulator uses a custom scheduling engine that handles:
1. **Preemption:** Managing process interruptions (specifically for SRTF and RR).
2. **Idle State:** Detecting and visualizing CPU idle periods when no processes are ready.
3. **Proportional Rendering:** Gantt chart blocks are scaled relative to their execution time for accurate representation.
