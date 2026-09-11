# 🏰 The Hogwarts Library Registry

A full-stack, Hogwarts-themed Library Management System built to digitize and simplify everyday library operations.

🌐 **Live Demo:** https://hogwarts-library-management-system.vercel.app/

📦 **GitHub Repository:** https://github.com/ShineKaninwal/hogwarts-library-management-system

---

## ✨ Overview

The Hogwarts Library Registry is a full-stack web application designed around the magical world of Hogwarts.

It provides a complete interface for managing books, readers, book issues, returns, library statistics, transactions, and QR-based library tags.

The project combines a themed and interactive frontend with a REST API backend and a cloud-hosted MongoDB database.

---

## 🚀 Live Application

### 🌐 Frontend

https://hogwarts-library-management-system.vercel.app/

The application is publicly deployed and can be accessed from a laptop, desktop, or mobile device.

### ⚙️ Backend

The backend REST API is deployed using Render and communicates with MongoDB Atlas.

---

## 🎯 Key Features

### 📚 The Shelves

- Browse the complete book catalog
- Search books
- Filter books by Hogwarts House
- Add new books
- Edit book details
- Delete books
- Automatic Book IDs such as `B0001`, `B0002`, etc.
- Generate QR tags for books

### 🧙 Reader Registry

- View library members
- Search and filter readers
- Add new readers
- Edit reader information
- Delete readers when they have no active loans
- Automatic Reader IDs such as `M0001`, `M0002`, etc.
- Generate QR cards for readers

### 📖 Issue a Book

- Select or scan a book
- Select or scan a reader
- Choose a loan period
- Issue books through the system
- Prevent unavailable books from being issued
- Prevent duplicate active loans
- Prevent available copies from becoming negative

### 🔄 Return a Book

- View active loans
- Select a borrowed book
- Return books
- Automatically update available copies
- Record return date and time

### 🏛️ Headmaster's Office

The dashboard provides:

- Total volumes
- Available copies
- Currently issued books
- Overdue books
- Overdue days
- House Cup statistics
- Genre statistics
- 14-day issue activity
- Transaction registry
- CSV export
- XLSX export

### 🏷️ Library Tags

Generate QR codes for:

- Books
- Readers

QR scanning uses the device camera when available.

If camera access is unavailable, manual selection remains available.

---

## 🛠️ Technology Stack

### Frontend

- React
- Vite
- JavaScript
- HTML
- CSS

### Backend

- Node.js
- Express.js
- Mongoose
- CORS
- Morgan
- dotenv

### Database

- MongoDB
- MongoDB Atlas

### Additional Libraries

- QRCode
- html5-qrcode
- ExcelJS
- json2csv

---

## 🏗️ System Architecture

```text
                    👤 User
                      │
                      ▼
          🌐 React + Vite Frontend
                      │
                      │ REST API
                      ▼
             🚀 Node.js + Express
                      │
                      │ Mongoose
                      ▼
                🍃 MongoDB Atlas