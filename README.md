# JSON Reshaper

A modern JSON restructuring tool built with React, TypeScript, and Vite.

This app lets you:

- View the original JSON (read only)
- Visually restructure JSON with drag and drop
- Rename keys and move nodes between objects and arrays
- Generate an updated JSON output
- Manage multiple JSON files
- Import and export `.json` files
- Automatically persist files in browser storage

---

## How It Works

- **Left Panel** → Original JSON snapshot (never modified automatically)
- **Middle Panel** → Visual structure editor
- **Right Panel** → Updated JSON output (editable)

Click **Save Changes** to write the middle structure into the updated JSON.  
Click **Rebuild from Updated** to regenerate the structure from the updated JSON.

---

# 🚀 How To Run (Follow Exactly)

### 1️⃣ Install Node.js
Make sure Node is installed:

```bash
node -v
```

If not installed, download from:
https://nodejs.org

---

### 2️⃣ Clone The Project

```bash
git clone <YOUR_REPO_URL>
cd json-reshaper
```

---

### 3️⃣ Install Dependencies

```bash
npm install
```

Wait until it finishes successfully.

---

### 4️⃣ Start The App

```bash
npm run dev
```

Open the URL shown in the terminal, usually:

```
http://localhost:5173
```

---

# 📦 Build For Production

```bash
npm run build
npm run preview
```

---

## Notes

- Files are saved in your browser’s local storage.
- Clearing browser storage will remove saved files.
- Large JSON files are supported.
- Canceling “New JSON” will NOT create a file.
- Panels scroll independently and fit the viewport.

---

Enjoy 🚀