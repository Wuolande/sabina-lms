import { lexical } from "./lexical";

/**
 * Default copy. Used when the admin leaves a field empty, and to create the standard pages the
 * first time they're opened. {cancelHours}, {trialMinutes}, {tutorShare}, {earlyJoin} and
 * {lateRefund} are replaced with the current platform rules.
 */
export const HOME_DEFAULTS = {
  hero: {
    pretitle: "LIVE 1-ON-1 TUTORING",
    headlines: ["Learn with a tutor who fits you", "Make maths make sense", "Get ready for KCSE with a tutor", "Speak English with confidence", "Prepare for IELTS with an expert"],
    subheading: "Pick a tutor, book a time that suits you, and learn live in your browser. Pay per lesson, with free cancellation up to {cancelHours} hours before.",
    searchPlaceholder: "What do you want to learn? e.g. Maths, IELTS, Python",
    popularTags: [
      { label: "Mathematics", slug: "mathematics" },
      { label: "English", slug: "english" },
      { label: "KCSE revision", slug: "kcse-revision" },
      { label: "IELTS", slug: "ielts-and-toefl" },
    ],
    proofText: "Every tutor is checked by our team",
    card1: { value: 1, suffix: "-on-1", decimals: 0, label: "Live lessons" },
    card2: { value: "{trialMinutes}", suffix: " min", decimals: 0, label: "Trial lessons" },
    card3: { value: "{cancelHours}", suffix: " h", decimals: 0, label: "Free cancellation" },
  },
  stats: {
    stat1: { value: 100, suffix: "%", decimals: 0, label: "Tutors reviewed by our team" },
    stat2: { value: "{cancelHours}", suffix: " h", decimals: 0, label: "Free cancellation window" },
    stat3: { value: 0, suffix: " apps", decimals: 0, label: "To download for lessons" },
    stat4: { value: "{trialMinutes}", suffix: " min", decimals: 0, label: "Trial lessons to get started" },
  },
  sections: {
    subjects: { pretitle: "SUBJECTS", title: "Find a tutor for what you're learning", cta: "See all subjects" },
    tutors: { pretitle: "TUTORS", title: "Meet some of our tutors", cta: "See all tutors" },
    classroom: {
      badge: "Runs in your browser",
      title: "A classroom that just works.",
      subtitle: "HD video, screen sharing and chat in one place, with nothing to install. After each lesson your tutor can leave notes for you.",
    },
    steps: {
      pretitle: "HOW IT WORKS",
      title: "Three steps to your first lesson",
      items: [
        { title: "Find your tutor", text: "Filter by subject, price and language. Watch their intro video and read reviews from other students." },
        { title: "Book a time", text: "Times show in your own time zone. Start with a {trialMinutes}-minute trial, or book a full lesson." },
        { title: "Learn live", text: "Join from your browser on any device. Your tutor's notes and your progress stay in your account." },
      ],
    },
    teach: {
      badge: "Teach on Sabina",
      title: "Teach what you know, on your schedule.",
      subtitle: "Set your own rate and hours. Students pay before the lesson, and you withdraw your earnings to M-Pesa, PayPal or your bank.",
      points: ["Keep {tutorShare}% of every lesson", "Set your own hours and rate", "Classroom, booking and payments handled for you"],
      cta: "Apply to teach",
      secondary: "How it works for tutors",
    },
    faq: {
      pretitle: "QUESTIONS",
      title: "Questions people ask",
      items: [
        { q: "How do lessons work?", a: "Choose a tutor, pick a time and pay to confirm. When it's time, open the lesson from your account and join the classroom in your browser. It opens {earlyJoin} minutes before the start." },
        { q: "Can I cancel or change a lesson?", a: "Cancel up to {cancelHours} hours before the start and you get a full refund. If your tutor cancels or doesn't turn up, we refund you in full automatically." },
        { q: "Do I need to install anything?", a: "No. Lessons run in Chrome, Safari, Edge or Firefox on a computer, tablet or phone. You need a camera, a microphone and a steady connection." },
        { q: "How are tutors checked?", a: "Every tutor applies with their qualifications, an ID document and an intro video. Our team reviews each application by hand before the profile goes live." },
        { q: "How do I pay?", a: "By card, or M-Pesa where it's available. You pay per lesson, and there's no subscription." },
      ],
    },
  },
};

const updated = "Last updated: November 2026.";

export const DEFAULT_PAGES: Record<string, { title: string; intro: string; kind: "company" | "legal"; body: ReturnType<typeof lexical> }> = {
  about: {
    title: "About Sabina",
    intro: "Live, one-to-one lessons with tutors we've checked ourselves.",
    kind: "company",
    body: lexical([
      ["p", "Sabina connects students with tutors for live lessons in maths, sciences, languages, exam preparation and more. We started in Kenya and welcome students and tutors from anywhere."],
      ["h2", "What we care about"],
      ["ul", [
        "**Good tutors.** Every tutor sends their qualifications, an ID document and an intro video. A person on our team reviews each one before the profile goes live.",
        "**Simple lessons.** The classroom runs in your browser, so there's nothing to install. Video, screen sharing and chat are built in.",
        "**Fair money.** Students pay per lesson. Tutors set their own rates and keep {tutorShare}% of each lesson.",
      ]],
      ["h2", "Get in touch"],
      ["p", "Questions, ideas or problems: [contact us](/contact). We read everything."],
    ]),
  },
  pricing: {
    title: "Pricing",
    intro: "Pay per lesson. No subscription, no sign-up fee.",
    kind: "company",
    body: lexical([
      ["h2", "What a lesson costs"],
      ["p", "Each tutor sets their own hourly rate, shown on their profile. You pay for the length you book: 30, 60 or 90 minutes."],
      ["h2", "Trial lessons"],
      ["p", "Many tutors offer a {trialMinutes}-minute trial at a lower price, so you can meet them before booking a full lesson. You get one trial with each tutor."],
      ["h2", "Cancelling"],
      ["ul", [
        "Cancel at least {cancelHours} hours before the start for a full refund.",
        "Later than that, {lateRefundSentence}.",
        "If your tutor cancels, declines or doesn't join, you get a full refund automatically.",
      ]],
      ["h2", "How to pay"],
      ["p", "By card, or M-Pesa where it's available. Payments are handled by our payment partners; we never see or store your card number."],
      ["p", "See the [refund policy](/refund-policy) for the details."],
    ]),
  },
  "refund-policy": {
    title: "Refund policy",
    intro: "When you get your money back, and how.",
    kind: "legal",
    body: lexical([
      ["p", updated],
      ["h2", "Full refunds"],
      ["ul", [
        "You cancel at least {cancelHours} hours before the lesson starts.",
        "Your tutor declines your request, or doesn't reply before the lesson time.",
        "Your tutor cancels the lesson.",
        "Your tutor doesn't join the lesson.",
        "The time was taken by someone else while you were paying.",
      ]],
      ["h2", "Late cancellations"],
      ["p", "If you cancel less than {cancelHours} hours before the start, {lateRefundSentence}. If you don't join a lesson your tutor attended, it counts as taught."],
      ["h2", "Something went wrong in a lesson"],
      ["p", "Use **Report a problem** on the lesson page within 48 hours. We'll look at it and reply by email, and refund you where it's fair."],
      ["h2", "How long refunds take"],
      ["p", "We send refunds straight away. Card refunds usually show within 5 to 10 working days; M-Pesa refunds are usually faster."],
    ]),
  },
  terms: {
    title: "Terms of service",
    intro: "The agreement between you and Sabina when you use the site.",
    kind: "legal",
    body: lexical([
      ["p", updated],
      ["h2", "Who we are"],
      ["p", "Sabina is a marketplace where students book live lessons with independent tutors. Tutors are not our employees; they decide what and how they teach."],
      ["h2", "Your account"],
      ["ul", [
        "You must give accurate details and keep your password private.",
        "Students under 18 need a parent or guardian's permission to use Sabina.",
        "One person per account. Don't share or sell accounts.",
      ]],
      ["h2", "Booking and payment"],
      ["ul", [
        "A lesson is confirmed once it's paid for and, where needed, accepted by the tutor.",
        "Cancellations and refunds follow our [refund policy](/refund-policy).",
        "Book and pay for lessons on Sabina. Arranging paid lessons off the platform with someone you met here isn't allowed, and those lessons aren't covered by refunds or support.",
      ]],
      ["h2", "For tutors"],
      ["ul", [
        "You keep {tutorShare}% of each lesson's price. Sabina keeps the rest as a service fee.",
        "Earnings become available a short time after each completed lesson and can be withdrawn once they reach the minimum payout.",
        "You're responsible for your own taxes.",
      ]],
      ["h2", "Behaviour"],
      ["p", "Be respectful. No harassment, discrimination, inappropriate content, or recording someone without their permission. We may suspend accounts that break these rules."],
      ["h2", "Liability"],
      ["p", "We work hard to keep Sabina running, but we can't promise it will always be available or error-free. To the extent the law allows, our liability is limited to the amount you paid for the lesson concerned."],
      ["h2", "Changes"],
      ["p", "We may update these terms. If the changes are significant we'll tell you by email before they apply."],
      ["p", "Questions: [contact us](/contact)."],
    ]),
  },
  privacy: {
    title: "Privacy policy",
    intro: "What we collect, why, and the choices you have.",
    kind: "legal",
    body: lexical([
      ["p", updated],
      ["h2", "What we collect"],
      ["ul", [
        "**Account details:** your name, email, time zone and, if you add them, phone number and photo.",
        "**Tutor applications:** qualifications, ID documents and intro videos. ID documents are only seen by our review team.",
        "**Lessons and messages:** bookings, notes, reviews and messages between students and tutors.",
        "**Payments:** what you paid and when. Card and M-Pesa details are handled by our payment partners, not stored by us.",
      ]],
      ["h2", "How we use it"],
      ["p", "To run your account and lessons, take payments and pay tutors, send the emails you need (and the optional ones you allow), keep the platform safe, and fix problems. We don't sell your data."],
      ["h2", "Lessons"],
      ["p", "Video and audio in the classroom pass through our video provider so the lesson can happen. We don't record lessons."],
      ["h2", "Who we share it with"],
      ["p", "Only with services that help us run Sabina (hosting, video, email and payments), and only what they need. We may also share information when the law requires it."],
      ["h2", "Your choices"],
      ["ul", [
        "Change your details in Account settings.",
        "Turn off message emails and reminders in Notifications.",
        "Ask us for a copy of your data, or to delete your account, by [contacting us](/contact).",
      ]],
      ["h2", "Keeping it safe"],
      ["p", "Data is encrypted in transit, and access inside our team is limited to the people who need it."],
    ]),
  },
  cookies: {
    title: "Cookie policy",
    intro: "The small files we store in your browser.",
    kind: "legal",
    body: lexical([
      ["p", updated],
      ["h2", "Cookies we use"],
      ["ul", [
        "**Sign-in:** keeps you signed in. Without it you'd have to log in on every page.",
        "**Preferences:** remembers simple choices, such as the currency you browse in.",
        "**Security:** helps us block automated abuse of sign-in and sign-up forms.",
      ]],
      ["p", "We don't use advertising cookies. If we add analytics, we'll update this page first."],
      ["h2", "Turning cookies off"],
      ["p", "You can block cookies in your browser settings, but you won't be able to sign in without them."],
    ]),
  },
};
