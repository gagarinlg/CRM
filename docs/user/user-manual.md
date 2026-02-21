# CRM System — User Manual

> **Audience:** All CRM users — sales representatives, managers, and anyone using the system day-to-day.

---

## Table of Contents

1. [Logging In](#1-logging-in)
2. [Changing Your Password](#2-changing-your-password)
3. [Your Profile](#3-your-profile)
   - 3.1 [Updating Profile Information](#31-updating-profile-information)
   - 3.2 [Two-Factor Authentication (2FA)](#32-two-factor-authentication-2fa)
4. [Dashboard](#4-dashboard)
   - 4.1 [Understanding Widgets](#41-understanding-widgets)
   - 4.2 [Customising the Dashboard](#42-customising-the-dashboard)
5. [Companies](#5-companies)
   - 5.1 [Viewing Companies](#51-viewing-companies)
   - 5.2 [Creating a Company](#52-creating-a-company)
   - 5.3 [Editing a Company](#53-editing-a-company)
   - 5.4 [Deleting a Company](#54-deleting-a-company)
   - 5.5 [Company Detail View](#55-company-detail-view)
6. [Contacts](#6-contacts)
   - 6.1 [Viewing Contacts](#61-viewing-contacts)
   - 6.2 [Creating a Contact](#62-creating-a-contact)
   - 6.3 [Editing a Contact](#63-editing-a-contact)
   - 6.4 [Phone Numbers](#64-phone-numbers)
   - 6.5 [Recording a Contact Interaction](#65-recording-a-contact-interaction)
   - 6.6 [Contact Detail View](#66-contact-detail-view)
7. [Projects](#7-projects)
   - 7.1 [Viewing Projects](#71-viewing-projects)
   - 7.2 [Creating a Project](#72-creating-a-project)
   - 7.3 [Project Visibility](#73-project-visibility)
   - 7.4 [Managing Project Members & Contacts](#74-managing-project-members--contacts)
8. [Leads](#8-leads)
   - 8.1 [Viewing Leads](#81-viewing-leads)
   - 8.2 [Creating a Lead](#82-creating-a-lead)
   - 8.3 [Lead Visibility](#83-lead-visibility)
   - 8.4 [Moving a Lead Through the Sales Funnel](#84-moving-a-lead-through-the-sales-funnel)
   - 8.5 [Converting a Lead to a Project](#85-converting-a-lead-to-a-project)
   - 8.6 [Lead Statistics](#86-lead-statistics)
9. [Tags / Labels](#9-tags--labels)
10. [File Attachments](#10-file-attachments)
11. [Notes](#11-notes)
    - 11.1 [Adding a Note](#111-adding-a-note)
    - 11.2 [Editing and Deleting Notes](#112-editing-and-deleting-notes)
12. [Calendar](#12-calendar)
    - 12.1 [Views (Month / Week / Day)](#121-views-month--week--day)
    - 12.2 [Creating an Event](#122-creating-an-event)
    - 12.3 [Editing and Deleting Events](#123-editing-and-deleting-events)
    - 12.4 [Recurring Events](#124-recurring-events)
13. [Contact Reminders](#13-contact-reminders)
14. [Reports & CSV Export](#14-reports--csv-export)
15. [Global Search](#15-global-search)
16. [Searching & Filtering](#16-searching--filtering)
17. [Bulk Delete](#17-bulk-delete)
18. [Keyboard Shortcuts](#18-keyboard-shortcuts)
19. [Frequently Asked Questions](#19-frequently-asked-questions)

---

## 1. Logging In

1. Open the CRM URL in your browser (e.g. `https://crm.yourdomain.com`).
2. Enter your **Username** or **Email** and your **Password**.
3. Click **Sign In**.

### If Two-Factor Authentication is enabled on your account

After entering your password you will see a second screen asking for a **6-digit code**. Open your authenticator app (Google Authenticator, Authy, Bitwarden, etc.), find the CRM entry, and enter the current code.

### Forgot your password?

Contact your system administrator to reset your password. They can set a temporary password and force a password change on your next login.

---

## 2. Changing Your Password

You will be asked to change your password when:
- You log in for the first time (admin-set accounts have the password `changeme`).
- An administrator has reset your password.

To change your password at any other time:
1. Click your name or avatar in the top-right corner.
2. Select **Change Password**.
3. Enter your **Current Password**, then your **New Password** twice.
4. Click **Save**.

Password requirements: at least 8 characters, one uppercase letter, one lowercase letter, and one number.

---

## 3. Your Profile

### 3.1 Updating Profile Information

1. Click your name or avatar → **Profile**.
2. Edit your **First Name**, **Last Name**, or **Email**.
3. Click **Save**.

### 3.2 Two-Factor Authentication (2FA)

Protect your account with a time-based one-time password (TOTP).

**Enabling 2FA:**
1. Go to **Profile → Two-Factor Authentication**.
2. Click **Enable 2FA**.
3. Scan the QR code with your authenticator app, or type the text secret manually.
4. Enter the 6-digit code displayed by the app to confirm.
5. **Write down the backup codes** shown — store them in a safe place. Each code can be used once if you lose access to your authenticator.

**Disabling 2FA:**
1. Go to **Profile → Two-Factor Authentication**.
2. Click **Disable 2FA** and confirm with your current password.

---

## 4. Dashboard

The dashboard is the first page you see after logging in. It gives you a live overview of your business data.

### 4.1 Understanding Widgets

| Widget | What it shows |
|--------|---------------|
| **Total Companies** | Number of companies in the system |
| **Total Contacts** | Number of active contacts |
| **Open Projects** | Projects with status *in progress* or *planning* |
| **Active Leads** | Leads not yet won or lost |
| **Revenue Pipeline** | Bar chart of estimated deal value by month |
| **Lead Conversion** | Funnel chart showing conversion rates at each stage |
| **Project Status** | Pie chart of projects by status |
| **Activity Metrics** | Recent actions (notes, calls, meetings) over time |
| **Overdue Contacts** | Contacts you haven't been in touch with recently |
| **Recent Activity** | Latest changes across the system |

### 4.2 Customising the Dashboard

1. Click the **Customise** (pencil/settings) button on the dashboard.
2. Drag widgets to reorder them, or toggle individual widgets on/off.
3. Click **Save Layout** to persist your configuration.

Each user has their own dashboard layout — changes you make do not affect other users.

---

## 5. Companies

### 5.1 Viewing Companies

Click **Companies** in the left sidebar. The list shows all companies with search, filter, and sort options.

- **Search:** Type in the search box to filter by name, email, or phone.
- **Filter by industry:** Use the Industry dropdown.
- **Filter by size:** Use the Size dropdown.
- **Sort:** Click any column header to sort ascending or descending.

### 5.2 Creating a Company

1. Click **Companies → Add Company**.
2. Fill in the details:

   | Field | Required | Notes |
   |-------|----------|-------|
   | **Name** | Yes | |
   | **Email** | No | Must be a valid email address |
   | **Phone** | No | |
   | **Website** | No | Must be a valid URL |
   | **Address** | No | |
   | **Industry** | No | |
   | **Size** | No | e.g. *1–10*, *11–50*, *51–200*, *201–500*, *500+* |
   | **Notes** | No | Internal notes about the company |

3. Click **Save**.

### 5.3 Editing a Company

1. Click the company name in the list.
2. Click the **Edit** (pencil) button.
3. Make changes and click **Save**.

### 5.4 Deleting a Company

1. Click the company name → **Edit** → **Delete Company**.
2. Confirm the deletion in the dialog.

> Deleted companies are soft-deleted (recoverable by an administrator via the database) but no longer appear in the UI.

### 5.5 Company Detail View

The company detail page shows:
- **Contacts** — all contacts associated with this company
- **Projects** — projects linked to this company
- **Leads** — leads for this company
- **Notes** — all notes attached to this company

Click on any item to navigate to it directly.

---

## 6. Contacts

### 6.1 Viewing Contacts

Click **Contacts** in the sidebar. Search by name, email, or phone. Filter by company or sort by any column.

### 6.2 Creating a Contact

1. Click **Contacts → Add Contact**.
2. Fill in the required fields:

   | Field | Required | Notes |
   |-------|----------|-------|
   | **First Name** | Yes | |
   | **Last Name** | Yes | |
   | **Email** | Yes | Must be a valid email address |
   | **Company** | No | Associate with a company |
   | **Position / Title** | No | |
   | **Notes** | No | |

3. Add at least one phone number (see [6.4](#64-phone-numbers)).
4. Click **Save**.

### 6.3 Editing a Contact

1. Click the contact name.
2. Click **Edit**.
3. Make changes and click **Save**.

### 6.4 Phone Numbers

A contact can have multiple phone numbers. For each number:
- Enter the **phone number**.
- Choose a **label**: *Mobile*, *Work*, *Home*, *Fax*, or *Other*.
- Mark one number as **Primary** — this is the number shown in list views.

**To add a number:** Click **+ Add Phone**.  
**To remove a number:** Click the **×** button next to the phone row.

### 6.5 Recording a Contact Interaction

When you have spoken to or emailed a contact, update the **Last Contact** date to track when they were last reached:

1. Open the contact's detail page.
2. Click **Update Last Contact** (or use the **Mark as Contacted** button).
3. The current date is recorded automatically.

This date is used by the [Contact Reminders](#11-contact-reminders) system to alert you when a contact has not been reached for too long.

### 6.6 Contact Detail View

Shows:
- All phone numbers with labels
- Associated company (with link)
- Notes
- Projects the contact is involved in
- Last contact date

---

## 7. Projects

### 7.1 Viewing Projects

Click **Projects** in the sidebar. Filter by **Status** or **Company**, or search by project name.

Project statuses: *Planning* → *In Progress* → *On Hold* → *Completed* → *Cancelled*

### 7.2 Creating a Project

1. Click **Projects → Add Project**.
2. Fill in:

   | Field | Required | Notes |
   |-------|----------|-------|
   | **Name** | Yes | |
   | **Description** | No | |
   | **Status** | Yes | Default: *Planning* |
   | **Visibility** | Yes | *Public* or *Restricted* (see below) |
   | **Company** | No | Link to a customer company |
   | **Start Date** | No | |
   | **End Date** | No | |
   | **Budget** | No | Numeric value |

3. Click **Save**.

### 7.3 Project Visibility

| Setting | Who can see the project |
|---------|------------------------|
| **Public** | All users with `projects.read` permission |
| **Restricted** | Only members of the selected groups, direct project members, and Admins/Managers |

To restrict a project, set **Visibility** to *Restricted* and choose one or more **Groups** from the multi-select. Only members of those groups will be able to find and open the project.

> Restricted projects do not appear in lists for users without access — they return "not found" rather than "forbidden" to avoid revealing the existence of confidential projects.

### 7.4 Managing Project Members & Contacts

On the project detail page:

- **Team Members tab:** Click **Add Member** → select a user → choose their role on the project.
- **Contacts tab:** Click **Add Contact** → search for and select a contact to link.

---

## 8. Leads

Leads represent potential sales opportunities at various stages of the sales funnel.

### 8.1 Viewing Leads

Click **Leads** in the sidebar. Switch between:
- **List view** — sortable table of all leads
- **Kanban view** — cards arranged by stage (drag to move)

### 8.2 Creating a Lead

1. Click **Leads → Add Lead**.
2. Fill in:

   | Field | Required | Notes |
   |-------|----------|-------|
   | **Title** | Yes | Short name for the opportunity |
   | **Company** | No | Associated customer |
   | **Contact** | No | Main contact person |
   | **Value** | No | Estimated deal value |
   | **Probability** | No | 0–100% |
   | **Stage** | Yes | Default: *New* |
   | **Visibility** | Yes | *Public* or *Restricted* (see below) |
   | **Source** | No | Where the lead came from |
   | **Assigned To** | No | User responsible |

3. Click **Save**.

### 8.3 Lead Visibility

Leads support the same visibility model as projects. Set **Visibility** to *Restricted* and select **Groups** to limit who can see the lead.

### 8.4 Moving a Lead Through the Sales Funnel

**Lead stages** (in order):

```
New → Qualified → Proposal → Negotiation → Won / Lost
```

**In List view:** Open the lead → change the **Stage** dropdown → Save.  
**In Kanban view:** Drag the lead card to the target column.

### 8.5 Converting a Lead to a Project

When a lead is won, you can convert it directly into a project:

1. Open the lead's detail page.
2. Click **Convert to Project**.
3. The system creates a new project pre-filled with the lead's name, company, contacts, team members, and notes.
4. The lead is marked as **Won** and linked to the new project.

> The original lead is preserved — it is not deleted after conversion.

### 8.6 Lead Statistics

On the **Leads** page, click the **Pipeline Stats** or **Conversion Stats** tab to see:
- Pipeline value broken down by stage
- Conversion rates between stages
- Won vs. Lost ratio

---

## 9. Tags / Labels

Tags are colour-coded labels you can attach to companies, contacts, projects, and leads to help categorise and filter records.

### Adding tags to a record

1. Open any company, contact, project, or lead detail page.
2. Scroll to the **Tags** section (or look for the tag chip row near the top).
3. Click the tag input, type to search existing tags, or type a new name and press Enter to create it.
4. Tags are saved immediately.

### Removing a tag

Click the **×** on a tag chip to remove it from the record.

### Filtering by tag

On list pages, use the **Tags** filter to show only records with a specific tag.

---

## 10. File Attachments

You can attach files to companies, contacts, projects, and leads (e.g. contracts, proposals, scans).

### Uploading a file

1. Open the detail page of any company, contact, project, or lead.
2. Scroll to the **Attachments** section.
3. Click **Upload File** (or drag and drop a file onto the upload area).
4. The file is saved and listed immediately.

### Downloading a file

Click the file name or the **Download** icon next to it.

### Deleting a file

Click the **Delete** (trash) icon next to the file. Confirm in the dialog. Only the uploader and Admins can delete files.

---

## 11. Notes

Notes can be attached to **Companies**, **Contacts**, **Projects**, and **Leads**.

### 9.1 Adding a Note

From any detail page (company, contact, project, or lead):
1. Scroll to the **Notes** section.
2. Click **Add Note**.
3. Type your note (rich text is supported).
4. Click **Save**.

Notes are timestamped and show which user created them.

### 9.2 Editing and Deleting Notes

- **Edit:** Click the pencil icon on a note. Only the note's author and admins can edit it.
- **Delete:** Click the trash icon. Only the note's author and admins can delete it.

---

## 10. Calendar

The calendar shows all events linked to your account. Events can also be linked to contacts, companies, projects, or leads.

### 10.1 Views (Month / Week / Day)

Use the **Month / Week / Day** buttons at the top of the calendar page to switch views. Use the **<** and **>** arrows to navigate to previous or next periods. Click **Today** to return to the current date.

### 10.2 Creating an Event

1. Click a time slot on the calendar, or click **+ New Event**.
2. Fill in:

   | Field | Required | Notes |
   |-------|----------|-------|
   | **Title** | Yes | |
   | **Start Date/Time** | Yes | |
   | **End Date/Time** | Yes | |
   | **All Day** | No | Tick for full-day events |
   | **Description** | No | |
   | **Location** | No | |
   | **Related to** | No | Link to a contact, company, project, or lead |
   | **Reminder** | No | Minutes before the event |

3. Click **Save**.

### 10.3 Editing and Deleting Events

- **Edit:** Click the event on the calendar, then click **Edit**.
- **Delete:** Click the event → **Delete**, confirm in the dialog.

### 10.4 Recurring Events

When creating or editing an event, tick **Repeat** and choose a recurrence rule:
- **Daily**, **Weekly**, **Monthly**, or **Yearly**
- Optionally set an **end date** for the recurrence

When deleting a recurring event you can choose to delete:
- **This event only**
- **This and all following events**
- **All events in the series**

---

## 11. Contact Reminders

The CRM tracks the **Last Contact Date** for each contact. When that date is older than your configured threshold, the system reminds you.

### Configuring your reminder threshold

1. Click your avatar → **Profile → Reminder Settings**.
2. Set the number of days after which you want to be reminded (default: 30 days).
3. Toggle **Email reminders** and **In-app reminders** on or off.
4. Click **Save**.

### Viewing overdue contacts

- On the **Dashboard**, the **Overdue Contacts** widget lists contacts you haven't reached recently.
- Click any contact in the widget to open their detail page.

### Marking a contact as reached

Open the contact → click **Update Last Contact**. The reminder clock resets.

---

## 12. Reports

> **Requires:** `reports.read` permission (Manager or Admin role by default).  
> **Exporting** requires `reports.generate`.

1. Click **Reports** in the sidebar.
2. Select the report type:
   - **Sales** — revenue, won deals
   - **Lead Pipeline** — current pipeline value by stage
   - **Project Status** — projects by status
   - **Contact Activity** — contacts by last-contact date
3. Set the date range using the **From** and **To** date pickers.
4. Click **Run Report** to view results in the browser.
5. To export, click **Export CSV** or **Export PDF**.

---

## 13. Searching & Filtering

Every list page (Companies, Contacts, Projects, Leads) has a search box at the top. Typing searches across the most relevant fields for that entity.

Additional filters are available in a filter panel (click **Filters**):
- **Companies:** Industry, Size
- **Contacts:** Company
- **Projects:** Status, Company
- **Leads:** Stage, Assigned user, Company

Click **Clear Filters** to reset all filters.

---

## 14. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `?` | Show keyboard shortcuts |
| `g c` | Go to Companies |
| `g t` | Go to Contacts |
| `g p` | Go to Projects |
| `g l` | Go to Leads |
| `g d` | Go to Dashboard |
| `Esc` | Close dialog / cancel |
| `Ctrl + S` | Save current form |

> Keyboard shortcuts are available when no input field has focus.

---

## 15. Frequently Asked Questions

**Q: I cannot see the Admin menu.**  
A: The Admin section is only visible to users with the **Admin** or **Manager** role. Contact your system administrator.

**Q: I cannot delete a record.**  
A: Delete permissions are role-based. Your role may only allow reading and editing. Ask an admin to adjust your permissions or perform the deletion.

**Q: I lost my 2FA device — how do I log in?**  
A: On the 2FA code screen, click **Use a backup code** and enter one of the backup codes you saved when you enabled 2FA. If you did not save backup codes, ask your administrator to disable 2FA on your account.

**Q: Why are some contacts highlighted in the Overdue Contacts widget?**  
A: These contacts have not been reached for longer than your configured reminder threshold (default: 30 days). Update the Last Contact date after speaking with them.

**Q: Can I export a list of contacts to Excel?**  
A: Yes. Go to **Reports → Contact Activity**, set the date range, and click **Export CSV**. Open the CSV file in Excel or any spreadsheet application.

**Q: How do I link a contact to multiple companies?**  
A: Currently, a contact can be linked to one primary company. To indicate other relationships, use the Notes field or link the contact to shared projects.

**Q: Where can I see all emails sent through the CRM?**  
A: Admins can view the email log at **Admin → Settings → Email Log**. Managers with the appropriate permission can also view it.

**Q: Can I use the calendar on my phone?**  
A: Yes — the CRM calendar is accessible via CalDAV. Contact your administrator for the CalDAV sync URL and credentials. You can then add it to any standard calendar app (Apple Calendar, Thunderbird, Google Calendar via CalDAV, etc.).

**Q: How do I import companies and contacts in bulk?**  
A: Bulk import is done by an administrator via database import. Export your data to CSV, ask an administrator to run the import script, or use the API directly if you have developer access.
