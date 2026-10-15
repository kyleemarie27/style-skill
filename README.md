# Bloom: a private cycle & fertility tracker

No ads, no pop-ups, no notifications. You log in on your phone or computer and see:

- **A daily note** for where you are in your cycle: what to expect, your superpowers, watch-outs, self-care, how to make the most of the phase, and a trying-to-conceive focus. There's also a short personal line written by AI from yesterday's log.
- **A quick check-in** for yesterday or today: flow, ♥ intercourse, cervical mucus, symptoms and mood. Every tap saves.
- **LH strip reading:** snap a photo, AI suggests a reading on **Premom's scale** (T/C ratio; Low < 0.5, High 0.5–0.99, Peak ≥ 1.0), and you confirm or adjust it.
- **Calendar, insights and an LH curve:** period, fertile window, ovulation (LH-confirmed or estimated), ♥ days, and cycle history.
- **A step-by-step import of your Clue and Premom history**, so predictions are smart from day one. You can undo it at any time.

## Pregnancy mode

Tap **I got a positive test** (on Today during the two-week wait, in Settings, or by choosing *Positive* in a day's pregnancy test). Bloom works out your due date from your own data (LH-confirmed ovulation + 38 weeks when it has one, otherwise last period + 40 weeks adjusted for your cycle length) and you can change it any time. Then everything switches over:

- **Today** is five calm sections: baby's size next to a fruit (with weeks, due date and a trimester progress bar), today's line and your AI note with a countdown to the next milestone, **Today's bites** (three swipeable insights and three small to-dos you can expand and check off), a one-tap **check-in** (Good, Okay, Queasy, Wiped, Worried, plus your prenatal), and a **Week** card with today's read and links into the guide. Warning signs appear right under the baby card when there are any.
- **How big is baby?** A drawing of the baby that changes with each gestational day, next to the fruit or vegetable it matches (with an everyday object and an animal as extra comparisons), plus today's length and weight. Before 14 weeks you can see baby at roughly actual size on screen.
- **The week guide** (Weeks tab, or a link from Today) has four tabs: Read (today's deep dive) · Baby · You (body and mind changes over time, symptoms you've logged, food and self-care, reference tables) · Plan (to-dos, decisions, partner, FAQ). *When to call your doctor* sits under every tab. Every week has long-form explainers of the baby's development and your body and hormones, "is this normal?" FAQs, and decisions coming up. Symptoms you've logged get their own "why it happens / what helps / when to call" cards. There's also a reference library: nutrient targets, food and medicine safety, hCG ranges and weight-gain guidance.
- **Daily deep dive**: a 4-minute read written fresh each day by AI for your exact gestational day, in a chatty, friend-who's-an-OB-nurse voice with question-style headings. It covers a different angle each day of the week (development, body, nutrition, tests and decisions, emotions, preparation, myths), uses what you've logged, and ends with a teaser for tomorrow.
- **Symptom check-in** built around what doctors ask: nausea and vomiting, bleeding, cramping (and whether it's one-sided), symptoms, mood and your prenatal vitamin. The Day page adds weight, blood pressure, temperature, water, medications, and later kick counts and contractions.
- **Warning signs** from your logs (bleeding, one-sided pain, fever, severe vomiting, high blood pressure after 20 weeks, fluid, contractions, fewer movements) show as clear "call now" or "call today" banners.
- **Doctor**: your appointments, the typical prenatal schedule with your dates, a running list of questions, and a **visit summary** to print or show on your phone.
- **Weeks**: every week from 4 to 42, to read ahead or look back. The calendar shows pregnancy weeks and appointments instead of predicted periods.
- **Ask** is its own tab. Tell Bloom how you feel or what happened, and it offers one-tap buttons to save it to your log, add a question for your doctor, or add an appointment. Nothing saves until you tap. You can also turn any of your own messages into a doctor question.
- **Bloom remembers you.** After each chat, Bloom picks up lasting details you mention (first pregnancy, diet, your partner's name, a worry about an upcoming test) and uses them in later chats, the daily line and the deep dive. See, add or remove them in Settings → *What Bloom remembers*.

If a pregnancy ends, Settings → Pregnancy → *My pregnancy has ended* switches Bloom back to cycle tracking. Nothing is deleted.

## What's in this folder

```
api/            Vercel serverless functions (login, logs, LH, AI, import, export)
shared/         Cycle engine + LH scale (used by both the app and the API)
src/            The web app (React). Installs like an app on phone and desktop
  content/phases.ts   ← all the daily-note wording. Edit freely
  content/pregnancy/  ← the week-by-week pregnancy guide (weeks 4–42), deep*.ts explainers, library.ts
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
   | `SESSION_SECRET` | any long random string (e.g. mash the keyboard for 40+ characters) |
   | `ANTHROPIC_API_KEY` | `sk-ant-…` (optional; turns on strip reading, the personal daily line and smart import) |

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
