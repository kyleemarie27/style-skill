# Bloom: a private cycle & fertility tracker

No ads, no pop-ups, no notifications. You log in on your phone or computer and see:

- **What to do today**, in one line at the top: "Nothing to time yet", "LH is rising. Today counts.", "One of your best days", "Your part is done." It follows your LH strips and mucus first, then the predicted window.
- **Today's invitation**: every cycle day has a part of yourself it's good for (The Hermit, The Beginner, The Flirt, The Nester, The Observer…) with one small ritual, so the wait has something in it too. All the wording is in `src/content/invitations.ts`.
- **Protect the wait**: your own list of things to skip from ovulation until your period (no alcohol, no hot yoga or sauna, acetaminophen in place of ibuprofen…). It shows on Today from ovulation day, gives you a heads-up a few days before, and Ask and the daily line know it. Edit it in Settings → Trying to conceive.
- **Your signals** at a glance: mucus, LH (with the trend), Oura temperature, and timing (♥ days in the window and how many of the 3 best days you covered), plus the fertile window as seven little cells.
- **Your plan this cycle**: the three signs to watch (mucus, LH, temperature), the timing rule, LH start date and test date, all in one card. Open early in the cycle, folded later.
- **A quiet two-week wait** (on by default): no days-past-ovulation countdown, just "your part is done" and your test date. Turn it off in Settings.
- **A daily note** for where you are in your cycle: what to expect, superpowers, watch-outs, self-care, and a trying-to-conceive focus. There's also a short personal line written by AI from yesterday's log, your signals and today's invitation.
- **A quick check-in** for yesterday or today: flow, ♥ intercourse, cervical mucus, symptoms and mood. Every tap saves.
- **LH strip reading:** snap a photo, AI suggests a reading on **Premom's scale** (T/C ratio; Low < 0.5, High 0.5–0.99, Peak ≥ 1.0), and you confirm or adjust it.
- **Calendar, insights and an LH curve:** period, fertile window, ovulation (LH-confirmed, temperature-confirmed or estimated), ♥ days, and cycle history.
- **A step-by-step import of your Clue and Premom history**, so predictions are smart from day one. You can undo it at any time.

## Your partner's view (trying to conceive)

Your partner logs in with their own password (Settings → Security) and gets their own Today, written to them:

- **Is today a timing day?** "Today counts. Kylee's LH is rising…", "Not a timing day yet. The window opens in 3 days", "Your part is done. Test day is Nov 26."
- **The window**: dates, best days and the seven-day strip (♥, LH), plus the next window once this one has passed.
- **How you're doing** from your check-in, with how to help with each thing you logged.
- **Protect the wait, together**: your wait list, with easy ways to join in.
- **A guide to this phase** for them: what to expect from you, how to support, what to go easy on, and one idea for the two of you (`src/content/partnerCycle.ts`). A gentle note in the first cycle after a loss.
- **Timing, simply**: how the window works and their side of it (heat, alcohol, how often).
- **Ask** answers them as your partner; their chats don't go into Bloom's memory about you. Calendar days are read-only for them.

Set both first names in Settings → Trying to conceive, and preview their page from *See what … sees* on Today.

## Oura

Settings → Oura connects your ring. Bloom pulls three numbers per night (skin temperature deviation, lowest resting heart rate, average HRV) when you open the app and once a day on a schedule. A temperature rise of at least 0.2 °C over the 6 nights before, held for 3 nights in a row, confirms ovulation (the day before the first high night). An LH peak still sets the ovulation date when there is one; the temperature then confirms it. Oura only has last night once the ring has synced to the Oura app.

Where it shows: the **Temperature tile** on Today (last night, a 10-night sparkline, and "ovulation confirmed" once the rise holds); **Insights → Temperature**, a chart for the cycle you pick with the baseline, the 0.2 °C line, the high nights shaded, the LH peak (▲) and ♥ days; and **Your pattern** under it, which learns how many days after your LH peak your temperature rises, how big your rise is, and how much your resting heart rate lifts after ovulation. Cycle history marks ovulation as (LH), (LH + temp), (temp) or (est.).

Setup, once: register an app at cloud.ouraring.com/oauth/applications with the redirect URI `https://<your Bloom address>/api/oura/callback` and the *daily* and *personal* scopes, then add `OURA_CLIENT_ID`, `OURA_CLIENT_SECRET` and `CRON_SECRET` in Vercel and redeploy. The Settings card walks you through it and shows the exact redirect URI.

## After a pregnancy loss

When a pregnancy ends with a loss (Settings → Pregnancy → *My pregnancy has ended*), the day it ended becomes day 1 of a new cycle, unless you logged a period within 10 days of it. For that first cycle:

- **LH strips wait for a negative pregnancy test.** Leftover hCG can make LH strips read positive, so peaks before you log a *Negative* test are set aside (and the LH signal says "On hold").
- **Temperature counts most.** An Oura temperature rise confirms ovulation even without a trusted LH peak.
- **Averages skip it.** Neither the cycle the pregnancy was in nor the first one after counts toward your average cycle, luteal or period length.
- Today's invitations are gentler for the first week.

## Pregnancy mode

Tap **I got a positive test** (on Today during the two-week wait, in Settings, or by choosing *Positive* in a day's pregnancy test). Bloom works out your due date from your own data (LH-confirmed ovulation + 38 weeks when it has one, otherwise last period + 40 weeks adjusted for your cycle length) and you can change it any time. Then everything switches over:

- **Today** follows the shape of a day, and each thing lives in one place:
  1. **Baby's size** next to a fruit, with weeks, due date, a trimester progress bar and a countdown to the next milestone. Warning signs appear right under it when there are any.
  2. **Today:** today's line, your personal AI note, and a link to today's 4-minute read.
  3. **How are you feeling?** Five moods, your symptoms and your prenatal, one tap each. *Details* opens the full log.
  4. **Little things for today:** three small to-dos (one from the week's list, two habits), with a streak.
  5. **Today's question:** something to answer in a few lines, plus this week's **bump photo**. On set days it's a *moment* instead: a letter to the baby, a time capsule, a date with your partner, a lullaby. Everything is kept on the **Memories** page (a week-by-week bump flip-book and all your answers).
- **Symptoms:** the ten most common ones in pregnancy are always there. Tap *+ Add your own* for anything else; log it on 3 different days and it becomes one of your regular options. Bleeding, cramping, warning signs and vitals live on the Log page.
- **Your partner gets their own login and view.** Bloom opens to a page for them: how you're doing today (from your check-in) with how to help with each thing you logged, one thing to do today, their role this week, what they might be feeling, your next appointment, and their own daily question. You each see the other's answer only once you've written yours that day (the server enforces it). The partner can read your check-ins and add doctor questions or appointments, but can't change your logs, settings, imports or what Bloom remembers. Their Ask answers are written to them, and their chats don't go into Bloom's memory about you.
- **How big is baby?** A drawing of the baby that changes with each gestational day, next to the fruit or vegetable it matches (with an everyday object and an animal as extra comparisons), plus today's length and weight. Before 14 weeks you can see baby at roughly actual size on screen.
- **The week guide** (Weeks tab, or a link from Today) has four tabs: Read (today's deep dive) · Baby · You (body and mind changes over time, symptoms you've logged, food and self-care, reference tables) · Plan (to-dos, decisions, FAQ, and a link to your partner's page). *When to call your doctor* sits under every tab. Every week has long-form explainers of the baby's development and your body and hormones, "is this normal?" FAQs, and decisions coming up. Symptoms you've logged get their own "why it happens / what helps / when to call" cards. There's also a reference library: nutrient targets, food and medicine safety, hCG ranges and weight-gain guidance.
- **Daily deep dive**: a 4-minute read written fresh each day by AI for your exact gestational day, in a chatty, friend-who's-an-OB-nurse voice with question-style headings. It covers a different angle each day of the week (development, body, nutrition, tests and decisions, emotions, preparation, myths), uses what you've logged, and ends with a teaser for tomorrow.
- **The Log page** is built around what doctors ask: symptoms (with nausea severity and vomiting), bleeding, cramping (and whether it's one-sided), warning signs, mood and your prenatal vitamin, plus weight, blood pressure, temperature, water, medications, and later kick counts and contractions.
- **Warning signs** from your logs (bleeding, one-sided pain, fever, severe vomiting, high blood pressure after 20 weeks, fluid, contractions, fewer movements) show as clear "call now" or "call today" banners.
- **Scans & results** (Doctor tab): add an ultrasound by typing the numbers, pasting or snapping the report, or just telling Ask. Bloom shows how baby measures against your dates and explains each result as *typical for this stage*, *good to know* or *worth asking about* (never a diagnosis). Dating follows ACOG: only baby's length (CRL) before 14 weeks can change the due date, by more than 5 days before 9 weeks or 7 days after; the sac alone and later scans never do. When a scan points to a new date, one tap updates it, and every size, milestone and week then follows it. The latest scan shows on Today for both of you for ten days, a follow-up like "recheck in 12 days" can go straight onto your appointments, and the AI note, plan, reads and Ask all know your results.
- **Two timelines: by my dates, or by my body.** Under the weeks on Today, a toggle switches between the medical timeline (from your last period, or the due date your doctor or a dating scan set) and where your body actually measured on your scans. Whichever you pick, the other is always shown on the line below it. *By my body* follows your most reliable early scan (baby's length beats the report's estimate beats the sac; the newest wins among equals), so every scan you add updates it. It moves baby's size, the day-by-day lines, the week guide and the Weeks dates. The due date, appointments, screening windows and warning signs always stay on your medical dates. The AI note, today's read and to-dos are written for your body timeline whenever a scan gives one, so flipping the toggle doesn't rewrite them. Your partner's view follows the same choice.
- **Doctor**: your appointments, the typical prenatal schedule with your dates, a running list of questions, and a **visit summary** to print or show on your phone.
- **Weeks**: every week from 4 to 42, to read ahead or look back. The calendar shows pregnancy weeks and appointments instead of predicted periods.
- **Ask** is its own tab. Tell Bloom how you feel or what happened, and it offers one-tap buttons to save it to your log, add a question for your doctor, or add an appointment. Nothing saves until you tap. You can also turn any of your own messages into a doctor question.
- **Bloom remembers you.** After each chat, Bloom picks up lasting details you mention (first pregnancy, diet, your partner's name, a worry about an upcoming test) and uses them in later chats, the daily line and the deep dive. See, add or remove them in Settings → *What Bloom remembers*.

If a pregnancy ends, Settings → Pregnancy → *My pregnancy has ended* switches Bloom back to cycle tracking. Nothing is deleted.

## What's in this folder

```
api/            Vercel serverless functions (login, logs + Oura, LH, AI, import, export, memories)
shared/         Cycle engine + LH scale (used by both the app and the API)
src/            The web app (React). Installs like an app on phone and desktop
  content/phases.ts   ← all the daily-note wording. Edit freely
  content/invitations.ts ← today's invitation for every cycle day
  content/pregnancy/  ← the week-by-week pregnancy guide (weeks 4–42), deep*.ts explainers, library.ts,
                        journal.ts (daily questions and moments), partner.ts (the partner view)
  components/art/     ← the baby and size-comparison illustrations
  lib/importers/      ← Clue + Premom file readers
tests/          Unit tests (npm test)
```

## Deploy to Vercel (about 10 minutes)

1. **Import the repo.** Go to [vercel.com](https://vercel.com) → *Add New… → Project* → pick this GitHub repo. Vercel detects Vite automatically. Click **Deploy** (the first deploy will show a login screen that doesn't work yet; that's expected).
2. **Add a database.** In the project, open **Storage → Create Database → Neon (Postgres)** → Free plan → *Connect to project*. This sets `DATABASE_URL` for you. Bloom creates its own tables on first use.
3. **Add your settings.** Go to **Settings → Environment Variables** and add:

   | Name | Value |
   |------|-------|
   | `APP_PASSWORD` | the password you'll log in with |
   | `SESSION_SECRET` | any long random string (no longer used by new versions; harmless to keep) |
   | `ANTHROPIC_API_KEY` | `sk-ant-…` (optional; turns on strip reading, the personal daily line and smart import) |
   | `OURA_CLIENT_ID`, `OURA_CLIENT_SECRET` | optional; from your Oura app (see *Oura* above) |
   | `CRON_SECRET` | optional; any long random string. Lets the daily Oura sync run on its own |

4. **Redeploy.** Go to Deployments → ⋯ on the latest → **Redeploy**.
5. **Open your site and log in.** The import wizard walks you through getting your Clue and Premom files.

### Put it on your phone and computer
- **iPhone:** open the site in Safari → Share → **Add to Home Screen**.
- **Android:** Chrome menu ⋮ → **Install app**.
- **Mac/PC:** in Chrome or Edge, click the install icon in the address bar. Bloom opens in its own window with a dock/taskbar icon.

## Importing your history

Settings → *Import more history* (or the button on the first screen):

- **Clue:** Profile → Settings → Data export. You get a password-protected `.zip`; Bloom asks for the password and opens it in your browser.
- **Premom:** Me → Settings → Export data (CSV/Excel). PDF reports and screenshots also work, read by AI.
- **Anything else:** spreadsheets, JSON, PDFs or screenshots. If the built-in readers don't recognise a file, AI extracts the dates. You always see a preview first.

Imports never overwrite what you've logged yourself, and each import can be undone in Settings.

## Security

- **Two logins.** The main account and the partner each have a password (stored as salted scrypt hashes). Until you set your own in Settings → Security, the `APP_PASSWORD` from setup works as yours; once you do, it stops working and anyone logged in with it is signed out. Set or reset the partner's password, or remove it, in the same place.
- **Real sessions.** Each signed-in device is a row in the database (only a hash of the cookie is stored). Logging out ends it for good. Settings → Security lists every device and can log any of them out, or all of them at once. Sessions end after 60 days without use.
- **Guessing is blocked.** After 8 wrong passwords from one place (or 30 overall) in 15 minutes, logins pause for 15 minutes.
- **Browser protections.** A strict Content Security Policy, HTTPS-only (HSTS), no framing, no referrers, `noindex`, and API responses that are never cached. Changes must come from Bloom's own pages.
- **What still leaves your database:** questions, daily notes, strip photos and imports are sent to Anthropic's API to answer them. Fonts load from Google Fonts.

## Notes
- **AI model:** Claude (`claude-opus-5-5`) via the Anthropic API, called only from the server. The daily line is cached, so AI runs at most once a day for it, plus once per strip photo.
- **Privacy:** data lives in your own Neon database. Strip photos are resized in the browser and stored in the database.
- **Not medical advice.** Bloom gives general information. Talk to your doctor about anything that worries you.

## Local development

```bash
npm install
cp .env.example .env.local     # point DATABASE_URL at any Postgres; add BLOOM_FAKE_AI=1 to try AI screens without a key
npm run dev                    # app on http://localhost:5173
npm test                       # cycle engine, LH scale and importer tests
```
