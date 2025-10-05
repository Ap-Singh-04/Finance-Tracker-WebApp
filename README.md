## 🧾 Personal Finance Tracker (Web App)

A *browser-based personal finance dashboard* built with *HTML, CSS, and JavaScript*, designed to help users visualize, manage, and analyze their income and expenses effortlessly.

### 🚀 Features

* 📂 *Excel Upload & Parsing:* Upload your .xlsx file (up to 100+ rows) and automatically process it using the SheetJS library.
* 🧩 *Column Mapping:* Supports files in any format — easily map columns (Date, Type, Category, Amount) via a user-friendly mapping modal.
* 📊 *Interactive Charts:* Visualize data through dynamic *Pie and Bar charts* using Chart.js.
* 💰 *Finance Summary:* Automatically computes *total income, **total expenses, **savings, **profit/loss, and **expense percentages*.
* 💾 *Persistent Storage:* Stores your data locally using *LocalStorage*, so it’s available even after a page reload.
* 🧮 *Error Handling:* Skips and lists invalid rows with line numbers for easy debugging.
* 🧠 *Sample Data Support:* Load sample transactions instantly to test the app’s functionality.

### 🧱 Tech Stack

* *Frontend:* HTML, CSS, Vanilla JavaScript
* *Libraries:* [SheetJS (XLSX)](https://sheetjs.com/), [Chart.js](https://www.chartjs.org/)
* *Storage:* Browser LocalStorage
* *Data Handling:* JSON and FileReader API

### 🎨 Highlights

* Clean, responsive layout for seamless desktop usage.
* Uses DOM manipulation and event listeners extensively for interactivity.
* Validates and normalizes imported data to ensure accuracy.

### 📘 How to Use

1. Clone or download this repository.
2. Open index.html in your browser.
3. Upload your Excel file or use the *“Use Sample Data”* button (double-click).
4. View your financial summary, charts, and transaction details.

---

### 🧩 Future Enhancements (optional section)

* Add backend (Node.js + MongoDB) for multi-user support.
* Integrate authentication and cloud storage for uploaded files.
* Export reports as PDF or CSV.

---
