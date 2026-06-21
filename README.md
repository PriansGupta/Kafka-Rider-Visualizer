Markdown
# 🏍️ Kafka Rider Visualizer (Kafka Eats Delivery)

A production-grade, event-driven microservices architecture simulating a live food delivery system. This project demonstrates how **Apache Kafka** orchestrates asynchronous event communication among independent services, paired with a **React + WebSockets** frontend for real-time spatial simulation and system telemetry.

---

## 🏗️ System Architecture & Workflow

The system consists of an independent event broker, four backend services/consumers, and a modern single-page frontend:

                    +---------------------------------------+
                    |        Docker: Apache Kafka           |
                    |      Topic: `delivery-events`         |
                    +---------------------------------------+
                               ▲                │
    (1) Trigger Simulation     │                │ (3) Multi-Group Fan-Out
+-------------------------------+                v
│                                     +----------------------+
│  +------------------------+         |   Distance Service   | -> Calculates ETA
│  |  Rider Producer API    |         |  (Group: distance)   |    (IN_TRANSIT)
│  |      (Port 3001)       |         +----------------------+
│  +------------------------+         |   Payment Service    | -> Processes Payouts
│                                     |  (Group: payment)    |    (DELIVERED)
▼                                     +----------------------+
+--------------------+                   |  UI Updater Service  |
|    React Client    |                   |  (Group: ui-updater) |
|    (Vite Dev)      |                   +----------------------+
+--------------------+                              │
▲                                                │ (4) Broadcast Updates
└────────────────── WebSocket (Port 8080) ───────┘
(2) Real-Time Visual State Updates


1. **Frontend Request**: The React user interface issues an HTTP `POST` request to the Producer API to place a simulated delivery order.
2. **Event Production**: The **Rider Producer** generates an order ID and simulates the courier moving on a step-by-step vector trajectory. It publishes tracking events into the `delivery-events` Kafka topic every 3 seconds.
3. **Decoupled Processing**: Kafka handles high-throughput message storage and streams updates out concurrently using distinct **Consumer Groups**:
   * **Distance Service**: Processes `IN_TRANSIT` events to calculate dynamic ETAs.
   * **Payment Service**: Listens specifically for the `DELIVERED` status flag to trigger a secure transactional mockup (payouts to riders/customer invoicing).
   * **UI Updater Service**: Captures every delivery event and bridges it immediately onto a downstream network socket.
4. **Real-time Visualization**: The **UI Updater Server** pushes telemetry out over active WebSockets to keep the UI progress track fully synchronized with backend microservice activity.

---

## 🛠️ Tech Stack

* **Event Streaming:** Apache Kafka (Apache image configured in KRaft mode)
* **Backend Runtime:** Node.js (Express, Kafkajs, Native WebSockets `ws`)
* **Frontend Library:** React 19, Vite, Lucide React (Icons), Custom Tailwind/CSS layout

---

## 🚀 Prerequisites

Before starting up the platform, ensure you have the following installed on your machine:
* **Node.js** (v18.x or above recommended)
* **Docker** & **Docker Compose**
* **NPM** or **Yarn**

---

## ⚙️ Setup & Running Instructions

Follow these steps sequentially to launch the complete system cluster. Ensure you leave each terminal window running.

### Step 1: Initialize the Kafka Infrastructure
Open a terminal window, navigate into your backend directory, and use Docker Compose to spin up the single-node Kafka broker operating in KRaft mode.
```bash
cd backend
docker compose up -d
(Verify it works by running docker ps to ensure the kafka-broker container is running and exposed on port 9092)

Step 2: Install Dependencies & Launch Backend Services
Open multiple terminal tabs or split windows inside your terminal to run each service simultaneously:

Install Backend Nodes:

Bash
cd backend
npm install
Start the Producer API (Terminal Tab 1):

Bash
node rider-producer.js
Start the Distance Calculation Consumer (Terminal Tab 2):

Bash
node distance-service.js
Start the Payment Handler Consumer (Terminal Tab 3):

Bash
node payment-service.js
Start the WebSocket UI Gateway Service (Terminal Tab 4):

Bash
node ui-updater-service.js
Step 3: Launch the React Client App
With all data pipes established, open a separate terminal instance to compile and serve the user interface:

Bash
cd frontend
npm install
npm run dev
Click the local development address provided by Vite (typically http://localhost:5173) to open the frontend web dashboard.

🕹️ Testing the Ecosystem
Open your browser to the web tracking dashboard. You should see a terminal log statement stating: 🟢 Connected to UI Updater WebSocket.

Click the 🍔 Place Order action button.

Observe your running terminal instances to see event processing in action:

Producer App: Logs the target path mapping steps 1-10.

Distance Service: Output prints calculations for sequential GPS coordinates.

UI Service: Broadcasts data structures down to the WebSocket pipeline.

React Dashboard: The bike marker progresses linearly down the vector map, changing the active countdown timestamp.

Payment Service: Remains completely silent until Step 10 hits (DELIVERED), instantly firing an alert confirming rider payout processing and transactional completion.
