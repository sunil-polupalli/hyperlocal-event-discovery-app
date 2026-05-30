# Hyperlocal Event Discovery App

A high-performance, geospatial-aware event discovery platform designed to provide personalized event recommendations based on user engagement signals. This project features a robust containerized architecture using Express.js, Typesense, and SQLite.

## 🚀 Architecture Overview

The system is designed for scalability and low-latency response times:

* **Frontend:** React Native (Expo) with `FlashList` for high-performance rendering.
* **Backend:** Node.js (Express) managing API routes and signal processing.
* **Search & Geo-Indexing:** Typesense, providing sub-millisecond search and spatial distance filtering.
* **Analytics:** SQLite for lightweight, persistent collection of user interaction signals.
* **Orchestration:** Docker Compose to ensure a consistent, reproducible environment.



## 📋 Features

* **Geospatial Search:** Find events within a specified radius using Typesense geo-filtering.
* **Implicit Personalization:** An automated recommendation engine that learns user interests through dwell-time engagement signals (5-second view trigger).
* **Performance-First:** Optimized for smooth scrolling and rapid data retrieval using Typesense’s indexing engine.
* **Containerized Environment:** Simple, one-command deployment using Docker Compose.

## 🛠️ Getting Started

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.
* [Node.js](https://nodejs.org/) (LTS version) for local development.

### Setup Instructions

1.  **Clone the Repository:**
    ```bash
    git clone <your-repository-url>
    cd hyperlocal-event-discovery-app
    ```

2.  **Configure Environment Variables:**
    Copy the example file and update it with your configuration:
    ```bash
    cp .env.example .env
    ```

3.  **Spin Up Services:**
    Launch the backend and search infrastructure:
    ```bash
    docker-compose up -d
    ```

4.  **Start Frontend:**
    ```bash
    cd app
    npm install
    npx expo start
    ```

## 📂 Project Structure

* `/app`: React Native source code (Expo).
* `/backend`: Node.js/Express API and signal logging logic.
* `/docs`: Technical documentation, including personalization strategy.
* `docker-compose.yml`: Infrastructure orchestration.

## 📈 Personalization Logic
This application avoids the "Cold Start" problem by utilizing implicit category filtering. The system aggregates user interactions stored in SQLite to determine top-performing categories, which are then passed as dynamic filters to Typesense. This provides instantaneous, privacy-first recommendations without the complexity of collaborative filtering.

---
*Built as part of an end-to-end software engineering submission.*