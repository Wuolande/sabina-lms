/** Demo students and the words they use: reviews, messages, notes. */
export type DemoStudent = { first: string; last: string; country: string; tz: string; goal: "exam" | "school" | "career" | "conversation" | "hobby" | "child"; level: "beginner" | "elementary" | "intermediate" | "advanced" };

export const DEMO_STUDENTS: DemoStudent[] = [
  { first: "Amani", last: "Njeri", country: "Kenya", tz: "Africa/Nairobi", goal: "exam", level: "intermediate" },
  { first: "Kevin", last: "Omondi", country: "Kenya", tz: "Africa/Nairobi", goal: "exam", level: "elementary" },
  { first: "Faith", last: "Chebet", country: "Kenya", tz: "Africa/Nairobi", goal: "school", level: "intermediate" },
  { first: "Brian", last: "Mutua", country: "Kenya", tz: "Africa/Nairobi", goal: "career", level: "beginner" },
  { first: "Wanjiku", last: "Kimani", country: "Kenya", tz: "Africa/Nairobi", goal: "child", level: "elementary" },
  { first: "Abdi", last: "Mohamed", country: "Kenya", tz: "Africa/Nairobi", goal: "exam", level: "advanced" },
  { first: "Lilian", last: "Atieno", country: "Kenya", tz: "Africa/Nairobi", goal: "career", level: "intermediate" },
  { first: "Collins", last: "Kipchoge", country: "Kenya", tz: "Africa/Nairobi", goal: "exam", level: "intermediate" },
  { first: "Mary", last: "Wairimu", country: "Kenya", tz: "Africa/Nairobi", goal: "child", level: "beginner" },
  { first: "Dennis", last: "Kiplagat", country: "Kenya", tz: "Africa/Nairobi", goal: "career", level: "elementary" },
  { first: "Joy", last: "Mumbua", country: "Kenya", tz: "Africa/Nairobi", goal: "school", level: "elementary" },
  { first: "Victor", last: "Odhiambo", country: "Kenya", tz: "Africa/Nairobi", goal: "exam", level: "advanced" },
  { first: "Zainab", last: "Omar", country: "Kenya", tz: "Africa/Nairobi", goal: "conversation", level: "intermediate" },
  { first: "Ian", last: "Gitau", country: "Kenya", tz: "Africa/Nairobi", goal: "career", level: "beginner" },
  { first: "Purity", last: "Nyambura", country: "Kenya", tz: "Africa/Nairobi", goal: "exam", level: "intermediate" },
  { first: "Moses", last: "Ssempala", country: "Uganda", tz: "Africa/Kampala", goal: "career", level: "intermediate" },
  { first: "Ruth", last: "Namubiru", country: "Uganda", tz: "Africa/Kampala", goal: "exam", level: "intermediate" },
  { first: "Joseph", last: "Mushi", country: "Tanzania", tz: "Africa/Dar_es_Salaam", goal: "career", level: "elementary" },
  { first: "Halima", last: "Said", country: "Tanzania", tz: "Africa/Dar_es_Salaam", goal: "conversation", level: "intermediate" },
  { first: "Eric", last: "Niyonzima", country: "Rwanda", tz: "Africa/Kigali", goal: "career", level: "intermediate" },
  { first: "Tolu", last: "Adeyemi", country: "Nigeria", tz: "Africa/Lagos", goal: "exam", level: "advanced" },
  { first: "Chiamaka", last: "Nwosu", country: "Nigeria", tz: "Africa/Lagos", goal: "exam", level: "intermediate" },
  { first: "Kofi", last: "Asante", country: "Ghana", tz: "Africa/Accra", goal: "career", level: "beginner" },
  { first: "Nomvula", last: "Dlamini", country: "South Africa", tz: "Africa/Johannesburg", goal: "conversation", level: "beginner" },
  { first: "Priya", last: "Shah", country: "Kenya", tz: "Africa/Nairobi", goal: "exam", level: "advanced" },
  { first: "Ali", last: "Hussein", country: "United Arab Emirates", tz: "Asia/Dubai", goal: "child", level: "beginner" },
  { first: "Njambi", last: "Karanja", country: "United Kingdom", tz: "Europe/London", goal: "child", level: "beginner" },
  { first: "Otieno", last: "Ouma", country: "United States", tz: "America/New_York", goal: "child", level: "beginner" },
  { first: "Emily", last: "Carter", country: "United States", tz: "America/Chicago", goal: "conversation", level: "beginner" },
  { first: "Lukas", last: "Schneider", country: "Germany", tz: "Europe/Berlin", goal: "hobby", level: "elementary" },
  { first: "Sophie", last: "Martin", country: "France", tz: "Europe/Paris", goal: "conversation", level: "beginner" },
  { first: "Grace", last: "Akinyi", country: "Kenya", tz: "Africa/Nairobi", goal: "career", level: "intermediate" },
  { first: "Samuel", last: "Kiprono", country: "Kenya", tz: "Africa/Nairobi", goal: "exam", level: "elementary" },
  { first: "Diana", last: "Moraa", country: "Kenya", tz: "Africa/Nairobi", goal: "career", level: "elementary" },
  { first: "Hassan", last: "Juma", country: "Kenya", tz: "Africa/Nairobi", goal: "exam", level: "intermediate" },
  { first: "Beatrice", last: "Wangari", country: "Kenya", tz: "Africa/Nairobi", goal: "hobby", level: "beginner" },
  { first: "Stephen", last: "Macharia", country: "Kenya", tz: "Africa/Nairobi", goal: "career", level: "advanced" },
  { first: "Mercy", last: "Jepkoech", country: "Kenya", tz: "Africa/Nairobi", goal: "exam", level: "intermediate" },
  { first: "Paul", last: "Mugisha", country: "Uganda", tz: "Africa/Kampala", goal: "exam", level: "intermediate" },
  { first: "Fatma", last: "Bakari", country: "Kenya", tz: "Africa/Nairobi", goal: "child", level: "elementary" },
  { first: "Nadia", last: "Rahman", country: "United Kingdom", tz: "Europe/London", goal: "conversation", level: "elementary" },
  { first: "Tendai", last: "Moyo", country: "Zimbabwe", tz: "Africa/Harare", goal: "career", level: "intermediate" },
];

/** Review comments. {s} is the subject, {t} the tutor's first name. Grouped by rating. */
export const REVIEWS: Record<5 | 4 | 3, string[]> = {
  5: [
    "{t} explained things in a way my school never did. I finally understand {s}.",
    "Third month with {t} and my last test was my best result this year.",
    "Very patient. I asked the same question three times and {t} found a new way to explain it each time.",
    "Lessons are well planned and {t} always sends notes afterwards. Worth every shilling.",
    "My daughter looks forward to her lessons, which I never thought I would say about {s}.",
    "{t} is on time, prepared and really cares about progress. Highly recommend.",
    "Clear, calm and encouraging. I feel much more confident going into my exam.",
    "We went through past papers and {t} showed me exactly where I was losing marks.",
    "Great first lesson. {t} worked out quickly what I needed and made a plan.",
    "I have tried other tutors before. {t} is the first one who made {s} feel easy.",
    "Practical and to the point. I used what we covered at work the very next day.",
    "Friendly and very knowledgeable. The homework is short but really helps.",
    "{t} makes difficult topics simple without making you feel slow.",
    "Booked a trial and ended up buying a package the same day.",
    "My son went from a D+ to a B in one term. Thank you {t}!",
    "Excellent feedback on my essays. I can see exactly what to change.",
    "Always encouraging. I stopped being afraid of {s}.",
    "Brilliant lesson as always. We covered a lot without it feeling rushed.",
    "{t} adapts every lesson to what I struggled with last time.",
    "Helped me prepare for an interview at short notice. I got the job!",
  ],
  4: [
    "Good lesson, though we ran a little over time. Very clear explanations.",
    "{t} knows {s} really well. I would like a bit more practice in each lesson.",
    "Helpful and patient. My connection was poor but {t} was understanding about it.",
    "Solid lessons and useful notes. I need to do more of the homework myself!",
    "Good tutor. The first lesson was slow but the next ones were great.",
  ],
  3: ["Knows the subject but the lesson felt a bit unstructured this time.", "Okay lesson. I expected more past-paper practice."],
};

export const REPLIES = [
  "Thank you so much! It's been a pleasure seeing your progress.",
  "Thank you! Keep up the practice and see you next week.",
  "Asante sana! Your hard work is paying off.",
  "Thanks for the kind words. On to the next topic!",
  "Thank you, this made my day. Well done on the test!",
  "Thanks for the feedback. I'll make sure we fit in more practice next time.",
];

/** Short threads between a student and a tutor. s = student, t = tutor. */
export const THREADS: ["s" | "t", string][][] = [
  [["s", "Hi {t}, I have my exam in about six weeks. Do you think we can cover {s} in time?"], ["t", "Hi {n}! Yes, six weeks is enough if we meet twice a week. Book a trial and I'll do a quick check of where you are."], ["s", "Great, I've booked Tuesday at 5pm."], ["t", "Perfect, see you then. Bring any past papers you've done."]],
  [["s", "Hello, is it okay if we move Thursday's lesson to Friday?"], ["t", "No problem. Just reschedule it from your lessons page and pick any free time on Friday."], ["s", "Done, thank you!"]],
  [["t", "Hi {n}, great work today. I've added a few practice questions as homework."], ["s", "Thanks! Question 3 is confusing me a bit."], ["t", "That one is tricky. Try drawing it out first, and we'll go through it at the start of the next lesson."], ["s", "Okay will do 👍"]],
  [["s", "Good evening {t}. My son really enjoyed the lesson. Can we do two lessons a week from now on?"], ["t", "Good evening! I'm glad to hear that. Yes, Mondays and Thursdays at the same time work for me."], ["s", "Thank you, I'll book them now."]],
  [["s", "Do you have any notes I can read before our next lesson?"], ["t", "Yes, I've shared a summary in the lesson files. Have a look at pages 1 and 2."], ["s", "Got it, thanks."]],
  [["s", "I passed!! Thank you so much for all your help."], ["t", "Congratulations {n}!! You worked so hard for this. So proud of you."], ["s", "Couldn't have done it without you 🙏"]],
  [["s", "Hi, do you offer packages? I'd like to do lessons every week for the next few months."], ["t", "Hi {n}, yes. You can buy 5 or 10 lessons at a discount from my profile page. The lessons stay valid for months, so no pressure."], ["s", "Perfect, I'll get the 10-lesson one."]],
];

export const LESSON_NOTES = [
  "We went through the topic step by step and you did well on the practice questions. Keep revising the formulas we wrote down.",
  "Good progress today. Next time we'll do a timed past paper.",
  "You're much more confident now. Focus on showing all your working.",
  "Great conversation practice. Review the new vocabulary list before the next lesson.",
  "We covered the main ideas. Try the three questions in your homework and note anything you get stuck on.",
];

export const HOMEWORK = [
  "Past paper practice: Section A",
  "Write a 350-word essay",
  "Practice set: 10 questions",
  "Vocabulary review and short paragraph",
  "Read chapter 4 and answer the questions",
];

export const GOALS: [string, string[]][] = [
  ["Get a B+ or better in KCSE", ["Finish the syllabus by July", "Do one past paper a week", "Score 70% in the mock"]],
  ["Reach IELTS band 7", ["Writing Task 2 at band 7", "Speaking fluency practice", "Full mock test"]],
  ["Hold a 10-minute conversation", ["Introduce myself", "Talk about my work", "Order food and ask for directions"]],
  ["Build my first web app", ["HTML and CSS basics", "JavaScript fundamentals", "Deploy a project online"]],
];
