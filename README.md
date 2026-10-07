# TPS HOSTEL IRP
## Thaiba Public School – Hostel Integrated Resource & Management Platform

**TPS Hostel IRP** is a complete, production-ready, highly responsive web application designed for **Thaiba Public School** to manage all boys' and girls' hostel operations, student admissions, attendance, leave passes, fines, discipline, timetables, and reporting.

---

## 🌟 Key Features & Modules

### 1. Multi-Hostel Infrastructure
- **Boys Hostel (Al-Farooq Block)** & **Girls Hostel (Khadija Block)**.
- Extensible multi-hostel support with live bed occupancy rack (Available, Occupied, Reserved, Maintenance).
- Live **Currently Outside Hostel** perimeter tracking and **Digital Warden Diary**.

### 2. Student Admissions & Comprehensive Profiles
- Full admission form wizard capturing student demographics, parent details (Father, Mother, WhatsApp, Occupations), emergency contacts, address, medical conditions & allergies.
- **13-Tab Detailed Student Profile** covering overview, personal data, bed allocations, attendance stats, leave history, fines, black marks, and documents.
- Instant **Printable Student Hostel ID Card** generation.

### 3. Dynamic Class Assignment & Timetable Engine
- Independent assignment for:
  - **School Class** (e.g. Grade 8)
  - **Moral Class** (Boys Moral Group A/B, Girls Moral Class)
  - **Hostel Coaching** (Boys Coaching Grp 1/2, Girls Coaching)
  - **School Coaching** (Mixed boys & girls academic categories)
- Automated **Double Booking & Conflict Detection** for teachers, rooms, and overlapping time slots.

### 4. Specialized Attendance Engine
- **Attendance Time-Window Control**: Restricts attendance marking to scheduled class hours with grace period & countdown timers.
- **Automatic Teacher Absence Flagging**: Audits and records unsubmitted sessions without manual entry overwrite.
- Large touch-friendly status buttons (Present, Absent, Leave, Late, Excused) with bulk action shortcuts.
- Approved leaves automatically excluded from unexcused absence calculations.

### 5. Leave & Late Return Management
- **Batch Leave Cards** for group vacations + **Individual Leave Passes**.
- **Date-Based Late Fine Calculation**: Strictly computed as `(Actual Date - Expected Date) × Rate per day`.
- **Time-Based Black Marks**: Separate penalty if returned late on the scheduled calendar date.
- Instant **Printable Leave Pass / Card**.

### 6. Student Conduct, Discipline & Fine Slips
- Comprehensive violation register (Unauthorized Exit, Property Damage, Mobile Phone Possession, Fighting/Misconduct, etc.).
- Black marks audit ledger and severity tags.
- Official **Printable Fine Slip** containing school crest, student photo, violation breakdown, late days, payable amount, and signature fields.

### 7. Central Report Center & Exports
- Realtime statistical aggregation for student attendance percentages, teacher class completion, leave records, and bed occupancy.
- One-click export to **CSV**, **Excel (.xls)**, and pixel-perfect **Print Layouts**.

### 8. Role-Based Access Control (RBAC)
- Full support for 6 distinct roles:
  1. `Super Admin` (Full institutional governance, settings, audit logs)
  2. `Admin` (Day-to-day operations)
  3. `Hostel Warden / Mentor` (Assigned hostel, bed rack, leave, entry/exit, diary)
  4. `Teacher` (Assigned timetable, mobile-first class attendance)
  5. `Parent` (Linked child overview, attendance, leave status, notices)
  6. `Student` (Personal hostel desk, timetable, notices, fines)
- Built-in instant **Role Switcher** in the top navigation bar for testing.

---

## 🗄️ Supabase Backend & Database Setup

**Supabase Project URL:** `https://cnknmmysyifgplwxicmz.supabase.co`

### SQL Scripts (Root Directory):
1. `schema.sql` – PostgreSQL schema, UUID extensions, foreign keys, performance indexes, and stored procedures (`calculate_leave_fine`, `check_timetable_conflicts`, `sync_bed_occupancy`).
2. `rls_policies.sql` – Granular Row Level Security policies for all tables.
3. `seed.sql` – Initial master data, hostel rooms, beds, teachers, class groups, fine rules, and sample students.
4. `SUPABASE_README.md` – Supabase migration and deployment guide.

---

## 🚀 Running the Web Application

### Option A: Local Node Server (Port 3000)
Run the following command in the workspace directory:
```powershell
agy-node server.js
```
Then open your browser to [http://localhost:3000](http://localhost:3000).

### Option B: Direct Browser / Static Hosting
Open `index.html` directly in any modern desktop or mobile browser.

---

## 📱 Progressive Web App (PWA)
- Standalone installable app (`manifest.json`).
- Service worker (`sw.js`) caching core UI shell and assets.
- Mobile-first responsive layouts with bottom navigation drawer for touchscreens.
