/**
 * Default wording for the menus, footer, How it works, Become a tutor, Contact and the sign-in
 * screens. Admins change any of it in Settings › Page wording; an empty field uses the text here.
 *
 * Tags in {braces} are replaced with the live platform rules, so the wording never goes out of
 * date: {siteName} {cancelHours} {trialMinutes} {lessonLengths} {earlyJoin} {tutorShare} {fee}
 * {minRate} {maxRate} {payoutDays} {minPayout} {lateRefundSentence}.
 */
export const TEXT_TOKENS = "{siteName} {cancelHours} {trialMinutes} {lessonLengths} {earlyJoin} {tutorShare} {fee} {minRate} {maxRate} {payoutDays} {minPayout} {lateRefundSentence}";

export type Link = { label: string; href: string };
export type Item = { title: string; text: string };

export const TEXT_DEFAULTS = {
  menu: {
    links: [
      { label: "Find tutors", href: "/find-tutors" },
      { label: "Subjects", href: "/subjects" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Become a tutor", href: "/become-a-tutor" },
      { label: "About us", href: "/about" },
      { label: "Blog", href: "/blog" },
    ] as Link[],
    portalsLabel: "Portals",
    studentLabel: "Student portal",
    studentText: "Lessons, homework and messages",
    tutorLabel: "Tutor portal",
    tutorText: "Schedule, students and earnings",
    secondary: [
      { label: "About us", href: "/about" },
      { label: "Contact us", href: "/contact" },
    ] as Link[],
  },
  footer: {
    trust: ["Every tutor checked by our team", "Secure payments", "Times shown in your time zone"],
    subjectsTitle: "Subjects",
    learnTitle: "Learn and teach",
    learnLinks: [
      { label: "Find a tutor", href: "/find-tutors" },
      { label: "Get matched", href: "/match" },
      { label: "Become a tutor", href: "/become-a-tutor" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Pricing", href: "/pricing" },
      { label: "Blog", href: "/blog" },
    ] as Link[],
    companyTitle: "Company",
    companyLinks: [
      { label: "About us", href: "/about" },
      { label: "Contact us", href: "/contact" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms of service", href: "/terms" },
      { label: "Refund policy", href: "/refund-policy" },
      { label: "Cookie policy", href: "/cookies" },
    ] as Link[],
  },
  howItWorks: {
    badge: "For students and parents",
    title: "How {siteName} works",
    intro: "From finding a tutor to your first lesson in a few minutes.",
    steps: [
      { title: "Find your tutor", text: "Filter by subject, level, price and language. Read reviews from other students and watch tutors' intro videos. Not sure where to start? Answer a few questions and we'll suggest three tutors." },
      { title: "Book a time", text: "Times show in your own time zone. Start with a {trialMinutes}-minute trial lesson at a lower price, or book a {lessonLengths}-minute lesson. Some tutors also offer packages of lessons at a discount." },
      { title: "Learn live in your browser", text: "Open the lesson from your account up to {earlyJoin} minutes before it starts. Video, a shared whiteboard, screen sharing, chat and lesson files are all in one place, with nothing to install." },
      { title: "Keep track of progress", text: "Set learning goals, do the homework your tutor sets, and see their notes after each lesson. Parents can follow along with a private progress link." },
    ] as Item[],
    payBadge: "Payments and cancellations",
    payTitle: "Pay per lesson. Cancel up to {cancelHours} hours before for a full refund.",
    payText: "You pay when you book, by card or M-Pesa where it's available. There's no subscription. If you cancel later than {cancelHours} hours before, {lateRefundSentence}. If your tutor cancels or doesn't turn up, you get a full refund automatically.",
    cta: "Find a tutor",
    secondaryCta: "Or get matched in 1 minute",
  },
  becomeTutor: {
    badge: "Teach on {siteName}",
    title: "Teach what you know, on your schedule.",
    intro: "Set your own rate and hours, teach live 1-on-1 lessons in your browser, and get paid for every lesson you teach.",
    cta: "Apply to teach",
    calcEyebrow: "Earnings estimate",
    calcTitle: "What could you earn in a month?",
    reasonsTitle: "Why teach with us",
    reasons: [
      { title: "Keep {tutorShare}% of every lesson", text: "Students pay before the lesson, so there's nothing to chase. Earnings are ready to withdraw {payoutDays} days after a lesson, to M-Pesa, PayPal or your bank, once you have at least {minPayout}." },
      { title: "Your rate, your hours", text: "Charge between {minRate} and {maxRate} an hour and open only the times that suit you. Students see them in their own time zone." },
      { title: "A classroom that's ready", text: "Video, a shared whiteboard, screen sharing, chat and lesson files in one place in the browser. No Zoom links or extra subscriptions." },
    ] as Item[],
    stepsTitle: "How to apply",
    steps: [
      { title: "Create your account", text: "It's free to apply." },
      { title: "Tell us about your teaching", text: "Subjects, qualifications, an ID document and a short intro video." },
      { title: "Get approved and start teaching", text: "Our team reviews every application by hand. Once you're approved, your profile goes live." },
    ] as Item[],
  },
  contact: {
    badge: "Contact us",
    title: "How can we help?",
    intro: "Ask about booking, payments, the classroom or teaching on {siteName}. A member of our team will reply by email.",
    sideTitle: "Other ways to reach us",
    sentTitle: "Message sent",
    sentText: "Thanks for getting in touch. We'll reply by email.",
  },
  signIn: {
    student: {
      badge: "Live 1-to-1 lessons",
      title: "Learn from verified tutors, live.",
      text: "Book a lesson in minutes, meet in our built-in classroom, and track your progress.",
      points: ["Every tutor's application is checked by our team", "Times shown in your own time zone", "Pay per lesson, no subscription"],
    },
    tutor: {
      badge: "Teach on {siteName}",
      title: "Teach on your schedule. Get paid on time.",
      text: "Set your hours and rates. Students book, pay and join the classroom in one place.",
      points: ["Students pay before the lesson", "You choose your rate and your hours", "Classroom, booking and payments handled for you"],
    },
    chips: [
      { value: "1-on-1", label: "Live lessons" },
      { value: "0", label: "Apps to install" },
      { value: "24/7", label: "Book any time" },
    ],
  },
};

export type SiteText = typeof TEXT_DEFAULTS;
