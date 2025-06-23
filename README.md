# 🌱 LearnIQ

A full-stack web application built with **Node.js**, **Express**, **MongoDB**, and a modern **Vite + React + shadcn/ui** frontend.

---

## 🚀 Installation Guide

### 🧰 Prerequisites

Make sure the following are installed:

* **Node.js** (v18+ recommended)
* **npm**
* **MongoDB** running locally or via cloud (e.g. MongoDB Atlas)
* **Git**

---

## 🖥️ Clone the Repository

```bash
git clone https://github.com/SohamMhatre09/LearnIQ.git
cd LearnIQ
```

---

## 📦 Install Dependencies

### 1. Backend (Express API)

```bash
cd user-api
npm install
```

> ⚠️ If you get peer dependency errors, use:

```bash
npm install --legacy-peer-deps
```

### 2. Frontend (Vite + React)

```bash
cd ..
npm install --legacy-peer-deps
```

---

## ⚙️ Environment Setup

### 1. Backend

Create a `.env` file inside the `user-api` folder:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### 2. Frontend

No environment variables are required by default. Vite supports `.env` files if needed.

---

## ▶️ Running the Project

### 1. Start Backend Server

```bash
cd user-api
node index.js
```

> ✅ Server will run on `https://learniq.handjobs.co.in`

### 2. Start Frontend Dev Server

Open a new terminal and run:

```bash
npm run dev
```

> ✅ Frontend will be live at `http://localhost:8080`

---

## 🧪 Optional: MongoDB Setup

* You can use **MongoDB Atlas** or run MongoDB locally:

```bash
mongod
```

---

## 🛠 Common Issues

* ❌ **npm ERR! ERESOLVE**: Use `npm install --legacy-peer-deps`
* ❌ **crypto.createCipher is deprecated**: Warning is safe to ignore or update the code to use `crypto.createCipheriv`

## For Code Execution Api Run this :
install_code_execution_api.sh # LearnIQ
