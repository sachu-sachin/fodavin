# Form submissions — setup

The site is static (GitHub Pages), so form submissions are handled by a Google
Apps Script that writes into a Google Sheet and emails you. One-time setup,
about ten minutes.

## 1. Create the Sheet

1. Go to <https://sheets.new> and name it something like `Fodavin Submissions`.
2. **Extensions → Apps Script**. An editor opens in a new tab.

## 2. Add the script

1. Delete whatever is in `Code.gs`.
2. Paste the entire contents of [`Code.gs`](Code.gs) from this folder.
3. Edit the two settings at the top:

   ```js
   var ADMIN_PASSWORD = 'CHANGE-ME-to-a-long-random-password';
   var NOTIFY_EMAIL   = 'fodavintechnologies@gmail.com';
   ```

   Use a long random password — it is the only thing protecting the dashboard.

4. Save (Ctrl+S).

## 3. Deploy it

1. **Deploy → New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
4. **Deploy**, then **Authorize access** and allow the permissions. Google will
   warn that the app is unverified — that is expected for your own script.
   Choose *Advanced → Go to (project name)*.
5. Copy the **Web app URL**. It ends in `/exec`.

> "Who has access: Anyone" means anyone can *post* a form submission, which is
> what a public contact form needs. It does **not** expose stored submissions —
> reading requires the password, which is checked inside the script.

## 4. Point the site at it

Open [`assets/js/fodavin-config.js`](../assets/js/fodavin-config.js) and paste
the URL:

```js
window.FODAVIN_CONFIG = {
  formsEndpoint: 'https://script.google.com/macros/s/AKfycb.../exec',
  fallbackEmail: 'fodavintechnologies@gmail.com'
};
```

Commit and push. Done.

## 5. Check it works

1. Open the live contact page and send yourself a test message.
2. A row should appear in the Sheet and an email should arrive.
3. Open `/html/admin_dashboard.html`, enter the password, and the submission
   should be listed.

## What you get

- **Contact form** (home + contact page) → name, email, phone, message
- **Newsletter form** (every page footer) → email
- Both land in the same Sheet, tagged by type, and email you on arrival
- Dashboard: search, filter by type/status, mark read/replied/archived, delete,
  export CSV

## Before it is set up

`formsEndpoint` empty is a valid state. Forms fall back to opening the
visitor's email client with the message pre-filled, so enquiries are never
silently dropped. The dashboard shows a setup notice instead of a login.

## Security, honestly

This is proportionate to a small agency's contact leads, not to sensitive
personal data.

- The endpoint URL is public — unavoidable on a static site. It is not a secret,
  and knowing it does not grant read access.
- Reading, editing, and deleting all require the password, checked server-side
  in Apps Script. The password is typed at login and held in `sessionStorage`
  for that tab only; it is never written into any file in this repo.
- Failed password attempts sleep ~700ms, which slows guessing but is not a
  proper lockout. Use a long random password.
- Anyone who knows the endpoint can POST *new* submissions — i.e. spam. A
  honeypot field and a 60-second per-email throttle catch the lazy cases. If it
  ever becomes a problem, add a CAPTCHA or move to a real backend.
- Apps Script quotas on a free account are roughly 100 emails/day and 20,000
  URL calls/day — far above what this site will see.

If you later need proper accounts, audit logs, or you start collecting anything
sensitive, move the API to Cloudflare Workers + D1 and keep the site on Pages.

## Changing the password later

Edit `ADMIN_PASSWORD` in the Apps Script editor, then
**Deploy → Manage deployments → edit → Version: New version → Deploy**.
Editing the code alone does not update the live deployment.
