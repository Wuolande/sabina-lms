import { emailLayout, siteUrl } from "./layout";

type Who = { firstName?: string | null };
const hi = (u: Who) => (u.firstName ? `Hi ${u.firstName},` : "Hi,");

export function applicationReceived(u: Who) {
  return {
    subject: "We've received your tutor application",
    html: emailLayout({
      preheader: "Our team reviews applications within 48 hours.",
      heading: "Application received",
      body: [hi(u), "Thanks for applying to teach on Sabina. Our team checks every application by hand, usually within 48 hours. We'll email you as soon as there's a decision."],
      cta: { label: "View your application", href: `${siteUrl()}/tutor/profile` },
    }),
  };
}

export function applicationApproved(u: Who, slug: string) {
  return {
    subject: "You're approved to teach on Sabina",
    html: emailLayout({
      preheader: "Your profile is now live in the marketplace.",
      heading: "Welcome to Sabina's tutors",
      body: [hi(u), "Great news: your application is approved and your profile is now live. Students can find you in the marketplace.", "Next, set your availability so students can book you."],
      cta: { label: "See your public profile", href: `${siteUrl()}/tutors/${slug}` },
    }),
  };
}

export function changesRequested(u: Who, notes: string) {
  return {
    subject: "A few changes needed on your tutor application",
    html: emailLayout({
      preheader: "Update your application and send it back.",
      heading: "Almost there",
      body: [hi(u), "Our team reviewed your application and needs a few changes before approving it:", notes || "Please check the notes in your application.", "Make the changes and submit again."],
      cta: { label: "Update my application", href: `${siteUrl()}/tutor/profile` },
    }),
  };
}

export function applicationRejected(u: Who, notes: string) {
  return {
    subject: "Your Sabina tutor application",
    html: emailLayout({
      preheader: "An update on your application.",
      heading: "An update on your application",
      body: [hi(u), "Thank you for applying to teach on Sabina. After careful review, we're not able to approve your application at this time.", ...(notes ? [notes] : []), "If you have questions, reply to this email."],
    }),
  };
}
