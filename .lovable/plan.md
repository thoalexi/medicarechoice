# Feedback button & submission form

Add a "Give feedback" button so visitors can report issues and share ideas, with your message front and center:

> "We are a work in progress! We can't grow and be better without your help. Please let us know things you've noticed! If you don't tell us, we can't fix it. We appreciate your help!"

## What you'll see

1. **Feedback button in the header** — a "Feedback" link (with a message icon) next to Donate in the top navigation, visible on every page.
2. **A `/feedback` page** with:
   - Your exact message above as the headline/intro.
   - A simple, senior-friendly form: **What kind of feedback?** (Something's broken / I have an idea / Something confused me / Other), **Tell us more** (large text box), and an **optional email** field in case they want a reply.
   - Large type and clear labels, matching the rest of the site.
   - A warm thank-you confirmation after submitting.
3. **Submissions saved safely** — each message is stored so you can read them all in one place, instead of relying on email that can get lost.

## Technical details

- Enable **Lovable Cloud** (built-in database) to store feedback submissions in a `feedback` table (category, message, optional email, page they were on, date). No account or login needed for visitors to submit.
- New route `src/routes/feedback.tsx` with its own page title/description; form validated with zod (length limits, optional valid email).
- Submission goes through a server function; the table is write-only for the public (nobody can read other people's feedback).
- `SiteHeader.tsx` gains the Feedback nav link; sitemap gets the new page.
- No changes to plan data, costs, or existing pages.

## Notes

- Enabling Lovable Cloud also unlocks future features (saving plan comparisons, accounts, etc.) if you ever want them.
- If you'd rather start without a database, the alternative is a mailto link — but stored submissions are much easier to review and act on.
