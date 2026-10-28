# BookNest: Library Management & Book Circulation Portal

A complete, production-grade university capstone web application built with **React**, **Vite**, **React Router DOM**, **CSS** (Dark Magenta & Pure White theme), and **JSON Server** as the persistent backend.

---

## 🎨 Design Vision & Aesthetics
- **Primary Color:** Dark Magenta (`#861657`)
- **Hover State:** Deep Magenta (`#6B1045`)
- **Active Navigation & Highlights:** Lighter Magenta (`#A52A70`)
- **Sidebar:** Dark Magenta (`#861657`) with crisp white branding, navigation text, and icons
- **Main Content Background:** Pure White (`#FFFFFF`) & Soft Light (`#FAF6F9`)
- **Borders & Dividers:** Subtle borders (`#E9DFE6`)
- **Typography:** Refined, modern sans-serif (*Plus Jakarta Sans*)
- **Status Badges:**
  - `Available`: Soft Green (`#E8F5E9` / `#1E4620`)
  - `Issued`: Soft Yellow / Amber (`#FFF3D6` / `#7C4A03`)
  - `Returned`: Soft Lavender-Magenta (`#FAF0F5` / `#861657`)
  - `Error / Overdue`: Soft Red (`#FDE8E8` / `#9B1C1C`)

---

## 🚀 How to Run the Application

Both the **Backend (JSON Server)** and **Frontend (Vite Dev Server)** run independently:

### 1. Start JSON Server (Port 3000)
```bash
npx json-server db.json --port 3000
```
*API Base URL:* `http://localhost:3000`

### 2. Start React + Vite Frontend (Port 5173)
```bash
npm run dev
```
*Frontend URL:* [http://localhost:5173](http://localhost:5173)

---

## 📂 Project Architecture

```
├── db.json                      # Root database (books, members, transactions)
├── package.json                 # Dependencies & startup scripts
├── index.html                   # HTML entrypoint with metadata
└── src/
    ├── services/
    │   └── api.js               # Centralized API service layer with async/await
    ├── components/
    │   ├── Sidebar.jsx          # University logo & active route navigation
    │   ├── Header.jsx           # Clean page title, description & actions
    │   ├── StatCard.jsx         # Live KPI dashboard metric cards
    │   ├── StatusBadge.jsx      # Available / Issued / Returned indicators
    │   ├── SearchBar.jsx        # Real-time search input component
    │   └── ConfirmDialog.jsx    # Accessible modal for delete & circulation confirm
    ├── pages/
    │   ├── Dashboard.jsx        # Live metrics, circulation summary & quick actions
    │   ├── Books.jsx            # Books catalog CRUD, search, filter, validation
    │   ├── Members.jsx          # Member accounts CRUD, email/phone check, loans count
    │   ├── IssueBook.jsx        # Issue desk, available book picker, due date validator
    │   ├── ReturnBook.jsx       # Return desk, active loan check-in & restock
    │   └── Transactions.jsx     # Audit logs, member/book lookup, status filter
    ├── App.jsx                  # React Router DOM configuration
    ├── App.css                  # Layout styling
    ├── index.css                # Global design system & theme tokens
    └── main.jsx                 # React root renderer
```

---

## 📌 Core Modules & Business Logic Implemented

1. **Dashboard (`/`)**:
   - Calculates **live statistics** directly from API: *Total Books*, *Available Books*, *Currently Issued*, and *Registered Members*.
   - Displays recent circulation transactions with patron and title details.
   - Live circulation health indicators and quick shortcut to circulation desks.

2. **Books Management (`/books`)**:
   - **GET /books**, **GET /books/:id**, **POST /books**, **PUT /books/:id**, **DELETE /books/:id**.
   - Search by title, author, or ISBN.
   - Filter by category and availability status.
   - **Data Consistency Rules**:
     - Prevents duplicate ISBNs.
     - Protects active books: Books currently marked as `Issued` **cannot** be deleted until returned.

3. **Members Management (`/members`)**:
   - Complete CRUD endpoints for patron records (**GET, POST, PUT, DELETE /members**).
   - Validates email formats and phone numbers.
   - Duplicate email prevention.
   - **Protection Rule**: Members with active unreturned books cannot be deleted.

4. **Issue Book Desk (`/issue-book`)**:
   - Selects from registered patrons and only currently `Available` books.
   - Validates that `Due Date` cannot be earlier than `Issue Date`.
   - Real-time book and patron summary preview card.
   - Double-checks book availability before posting to avoid race conditions.
   - Creates a transaction record (`POST /transactions`) with `status: "Issued"` and `returnDate: null`.
   - Atomically updates book status to `"Issued"` (`PUT /books/:id`).

5. **Return Book Desk (`/return-book`)**:
   - Lists only currently `Issued` loans.
   - Overdue highlight indicator.
   - Confirms return action:
     - Updates existing transaction (`PUT /transactions/:id`) to `status: "Returned"` with today's `returnDate`.
     - Updates book (`PUT /books/:id`) back to `"Available"`.
     - Prevents duplicate returns.

6. **Transactions & Audit History (`/transactions`)**:
   - Full transaction history sorted **newest first**.
   - Correlates `bookId` and `memberId` to display human-readable book titles and patron names.
   - Search by book title or patron name.
   - Filter by `Issued` or `Returned`.
