# Hyperlocal Event Discovery App

A high-performance, geospatial-aware event discovery platform designed to provide personalized event recommendations based on user engagement signals. This project implements a microservices-based architecture to solve the "Cold Start" problem in event discovery.

---

## 🏗️ Architecture Overview

The system is engineered for scalability and low-latency response times using containerized microservices:

* **Frontend:** React Native (Expo) utilizing `FlashList` for optimized mobile performance.
* **Backend:** Node.js (Express) handling RESTful API routes and signal processing.
* **Search Engine:** Typesense, delivering sub-millisecond search and geospatial distance filtering.
* **Data Persistence:** * **SQLite:** Stores implicit user interaction signals (dwell time, category preferences).
    * **Typesense:** Maintains the searchable event index.
* **Orchestration:** Docker Compose provides a consistent, production-ready environment across different development machines.



## 🚀 Key Features

* **Geospatial Precision:** Real-time event discovery using Typesense’s native geo-indexing.
* **Implicit Personalization Engine:** An autonomous recommendation system that identifies user interests via engagement metrics (dwell-time signals), eliminating the need for explicit user profiling.
* **High Performance:** Optimized for low latency and smooth UI interaction using React Native best practices.
* **Deployability:** Full project containerization via Docker, ensuring seamless environment setup.

## 🛠️ Getting Started

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.
* [Node.js](https://nodejs.org/) (LTS version) for local frontend development.

### Setup Instructions

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/sunil-polupalli/hyperlocal-event-discovery-app.git
    cd hyperlocal-event-discovery-app
    ```

2.  **Configure Environment Variables:**
    Copy the example file and update it with your configuration:
    ```bash
    cp .env.example .env
    ```

3.  **Deploy Infrastructure:**
    Launch the backend and search services via Docker:
    ```bash
    docker-compose up -d
    ```

4.  **Start Frontend:**
    ```bash
    cd mobile
    npm install
    npx expo start
    ```

## 📂 Project Structure

* `/mobile`: React Native source code and Expo configuration.
* `/backend`: Express.js API, signal logging logic, and recommendation algorithms.
* `/docs`: Technical documentation and personalization strategy analysis.
* `docker-compose.yml`: Infrastructure orchestration.

## 🧠 Personalization Engine
This application addresses the "Cold Start" challenge through **implicit category filtering**. The system captures user view events as signals, storing them in a local SQLite database. When the "For You" feed is requested, the backend aggregates these signals to identify the user's top categories, which are then passed as dynamic filters to Typesense. This provides instantaneous, privacy-centric recommendations without the heavy computational overhead of collaborative filtering.

---
