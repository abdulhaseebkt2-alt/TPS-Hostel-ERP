# TPS HOSTEL IRP - Supabase Database Setup Guide

## Overview
This directory contains the SQL migration scripts and configuration required to set up the **Thaiba Public School – Hostel Integrated Resource & Management Platform** on Supabase.

**Project URL:** `https://cnknmmysyifgplwxicmz.supabase.co`

---

## Migration Steps in Supabase Dashboard

1. **Login to Supabase Dashboard:**
   Go to [https://supabase.com/dashboard/project/cnknmmysyifgplwxicmz](https://supabase.com/dashboard/project/cnknmmysyifgplwxicmz)

2. **Run Schema Script:**
   - Open the **SQL Editor** tab from the left sidebar.
   - Click **New query**.
   - Copy and paste the contents of `schema.sql`.
   - Click **Run** (or `Ctrl + Enter`).
   - Confirm that all tables, indexes, stored procedures, and triggers are created successfully.

3. **Run Row Level Security (RLS) Policies:**
   - Create a new query in the **SQL Editor**.
   - Copy and paste the contents of `rls_policies.sql`.
   - Click **Run**.
   - This activates granular security rules for Super Admin, Admin, Warden, Teacher, Parent, and Student.

4. **Run Master Seed Data:**
   - Create a new query in the **SQL Editor**.
   - Copy and paste the contents of `seed.sql`.
   - Click **Run**.
   - This sets up default hostels (Boys & Girls), rooms, beds, teachers, class groups, fine rules, and sample student profiles.

5. **Storage Buckets Setup (for Photos & Documents):**
   - Go to the **Storage** tab in Supabase dashboard.
   - Create a new bucket named `hostel-documents` (Public or Restricted with RLS).
   - Set allowed MIME types: `image/png, image/jpeg, image/webp, application/pdf`.

6. **Connecting in Frontend:**
   - Enter your Supabase `anon` / `publishable` key in the frontend Settings page or in `config.js`.
   - The application automatically switches to live Supabase synchronization while providing an offline-friendly local state engine when working without internet.
