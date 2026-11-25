/**
 * Demo tutors. Each one is written to read like a real profile: a specific background, a clear
 * way of teaching and believable qualifications. Subjects are catalogue names.
 */
export type DemoTutor = {
  first: string;
  last: string;
  country: string;
  tz: string;
  subjects: string[];
  levels: ("primary" | "secondary" | "university" | "adult" | "exam")[];
  langs: [string, "native" | "c2" | "c1" | "b2" | "b1" | "a2"][];
  rate: number;
  headline: string;
  about: string;
  style: string;
  education: { degree: string; institution: string; field?: string; start: number; end: number }[];
  experience: { role: string; org: string; start: number; end?: number; text?: string }[];
  certs?: { title: string; issuer: string; year: number }[];
  featured?: boolean;
  superTutor?: boolean;
  /** Roughly how busy they are: drives past lessons and reviews. */
  load: number;
  instant?: boolean;
  packages?: [5 | 10 | 20, number][];
};

export const DEMO_TUTORS: DemoTutor[] = [
  {
    first: "Grace", last: "Wanjiru", country: "Kenya", tz: "Africa/Nairobi",
    subjects: ["Mathematics", "KCSE Revision", "Physics"], levels: ["secondary", "exam"], langs: [["English", "c2"], ["Kiswahili", "native"]],
    rate: 22, featured: true, superTutor: true, load: 1, packages: [[5, 10], [10, 15]],
    headline: "KCSE Maths that finally makes sense, 9 years in the classroom",
    about: "I taught Mathematics and Physics at Alliance Girls for six years before I started tutoring full time. Most of my students come to me after a disappointing mock, convinced they are \"just not a maths person\". By the time they sit KCSE most of them have moved up two or three grades.\nI grew up in Nyeri and was the first in my family to study engineering, so I know what it feels like when nobody at home can help with homework. That is a big part of why I teach.\nOutside lessons I mark KCSE papers in November, which means I know exactly how examiners award method marks and where students throw them away.",
    style: "Every first lesson starts with a short diagnostic so we can see which topics are costing you the most marks. From there we work through one topic a week: I explain it, we do worked examples together, then you try past-paper questions on your own while I watch how you think.\nYou get a one-page summary after every lesson and a small set of questions to try before the next one. I would rather you do five questions properly than fifty in a rush.",
    education: [{ degree: "BSc Mechanical Engineering", institution: "University of Nairobi", field: "Engineering", start: 2008, end: 2012 }, { degree: "Postgraduate Diploma in Education", institution: "Kenyatta University", field: "Mathematics education", start: 2013, end: 2014 }],
    experience: [{ role: "Mathematics & Physics teacher", org: "Alliance Girls High School", start: 2014, end: 2020 }, { role: "KCSE Mathematics examiner", org: "KNEC", start: 2017 }, { role: "Private tutor", org: "Self-employed", start: 2020 }],
    certs: [{ title: "TSC registered teacher", issuer: "Teachers Service Commission", year: 2014 }],
  },
  {
    first: "Daniel", last: "Otieno", country: "Kenya", tz: "Africa/Nairobi",
    subjects: ["Python & Data Science", "Computer Science", "Web Development"], levels: ["university", "adult"], langs: [["English", "c2"], ["Kiswahili", "native"]],
    rate: 35, featured: true, load: 0.9, packages: [[5, 8], [10, 12]],
    headline: "Data scientist at a fintech, teaching Python from zero to job-ready",
    about: "By day I build credit-scoring models at a Nairobi fintech; in the evenings I teach people who want to break into tech. I started coding late myself, at 24, after a degree in statistics, so I am very patient with beginners.\nMy students range from university students stuck on assignments to accountants and marketers who want to automate their reports. A few have gone on to junior data roles at Safaricom, Twiga and Andela.\nI care about real projects rather than toy exercises. By lesson five you will be working with a real dataset that matters to you.",
    style: "We agree on a goal in the first lesson, for example \"build a dashboard of my shop's sales\" or \"pass my data structures exam\". Lessons are hands-on: you share your screen and write the code, and I guide you rather than typing for you.\nBetween lessons I review your code on GitHub and leave comments. If you get stuck you can message me and I usually reply the same day.",
    education: [{ degree: "BSc Statistics", institution: "Jomo Kenyatta University of Agriculture and Technology", start: 2010, end: 2014 }, { degree: "MSc Data Science", institution: "Strathmore University", start: 2017, end: 2019 }],
    experience: [{ role: "Senior Data Scientist", org: "Fintech company, Nairobi", start: 2019 }, { role: "Mentor", org: "Moringa School", start: 2018, end: 2021 }],
    certs: [{ title: "TensorFlow Developer Certificate", issuer: "Google", year: 2021 }, { title: "AWS Certified Cloud Practitioner", issuer: "Amazon Web Services", year: 2022 }],
  },
  {
    first: "Amina", last: "Hassan", country: "Kenya", tz: "Africa/Nairobi",
    subjects: ["Kiswahili", "English"], levels: ["primary", "secondary", "adult"], langs: [["Kiswahili", "native"], ["English", "c2"], ["Arabic", "b2"]],
    rate: 15, featured: true, superTutor: true, load: 1, instant: true, packages: [[10, 15], [20, 20]],
    headline: "Kiswahili for children, diaspora families and curious adults",
    about: "Nimezaliwa na kukulia Mombasa, na Kiswahili ni lugha ya moyo wangu. I teach Kiswahili to three kinds of students: school pupils preparing for exams, children of Kenyan families living abroad who want to talk to their grandparents, and adults who simply love the language.\nI taught at a primary school in Mombasa for eight years and now teach online full time. Many of my diaspora families have been with me for more than two years.\nI am a member of the Chama cha Kiswahili cha Taifa and I write short stories for children in my free time. Some of them we read together in lessons.",
    style: "For children I keep lessons short, bright and full of songs, games and stories. For adults we talk from the very first lesson; grammar comes in when you need it, not before.\nExam students get a clear plan for insha, fasihi and sarufi, with marked practice essays every week.",
    education: [{ degree: "Bachelor of Education (Arts)", institution: "Pwani University", field: "Kiswahili and Religious Studies", start: 2009, end: 2013 }],
    experience: [{ role: "Kiswahili teacher", org: "Primary school, Mombasa", start: 2013, end: 2021 }, { role: "Online Kiswahili tutor", org: "Self-employed", start: 2021 }],
  },
  {
    first: "James", last: "Mwangi", country: "Kenya", tz: "Africa/Nairobi",
    subjects: ["Chemistry", "Biology", "KCSE Revision"], levels: ["secondary", "exam"], langs: [["English", "c2"], ["Kiswahili", "native"]],
    rate: 20, load: 0.8, packages: [[5, 10]],
    headline: "Chemistry and Biology made visual, with KCSE practicals explained",
    about: "I am a pharmacist who never stopped loving the chemistry lab. I taught sciences part time while at university and kept going because I enjoy the moment a student finally sees how a reaction works.\nMost of my students are in Form 3 and 4. We spend a lot of time on organic chemistry, moles and genetics, the topics that usually decide the grade.\nI also help students who missed practical lessons at school understand what happens in the lab, using videos and simple home experiments.",
    style: "I draw a lot. Every reaction gets a diagram, every process in Biology gets a flowchart, and you keep them all in a shared notebook we build over the term.\nWe finish each lesson with ten minutes of past-paper questions so you get used to the wording KNEC uses.",
    education: [{ degree: "Bachelor of Pharmacy", institution: "University of Nairobi", start: 2011, end: 2016 }],
    experience: [{ role: "Community pharmacist", org: "Pharmacy, Thika", start: 2016 }, { role: "Science tutor", org: "Self-employed", start: 2014 }],
  },
  {
    first: "Sarah", last: "Thompson", country: "United Kingdom", tz: "Europe/London",
    subjects: ["IELTS & TOEFL", "English", "Business English"], levels: ["university", "adult", "exam"], langs: [["English", "native"], ["French", "b2"]],
    rate: 38, featured: true, superTutor: true, load: 1, packages: [[5, 5], [10, 10]],
    headline: "Former IELTS examiner, helping you reach band 7 and above",
    about: "I was an IELTS speaking and writing examiner for seven years, so I know exactly what examiners listen for and what costs candidates marks. Now I use that inside knowledge to help students hit the score they need for university, work or migration.\nI have taught English in Manchester, Nairobi and Lyon, and I have worked with nurses, engineers, students and doctors from more than 30 countries.\nMost of my students need band 7 or higher. On average they improve by one full band in about eight weeks of regular lessons.",
    style: "We start with a mock test so we both know where you are. Then we focus on the parts of the test that will move your score most, usually Writing Task 2 and Speaking Part 2.\nYou get written feedback on every essay using the official band descriptors, so you can see exactly why an essay is a 6.5 and what would make it a 7.",
    education: [{ degree: "BA English Language and Linguistics", institution: "University of Manchester", start: 2006, end: 2009 }, { degree: "CELTA", institution: "Cambridge English", start: 2010, end: 2010 }, { degree: "DELTA", institution: "Cambridge English", start: 2014, end: 2015 }],
    experience: [{ role: "IELTS examiner", org: "British Council", start: 2013, end: 2020 }, { role: "English teacher", org: "Language school, Lyon", start: 2010, end: 2013 }, { role: "Online English and IELTS tutor", org: "Self-employed", start: 2020 }],
    certs: [{ title: "DELTA", issuer: "Cambridge English", year: 2015 }],
  },
  {
    first: "Chinedu", last: "Okafor", country: "Nigeria", tz: "Africa/Lagos",
    subjects: ["SAT & ACT", "Mathematics", "Economics"], levels: ["secondary", "university", "exam"], langs: [["English", "c2"], ["Igbo", "native"]],
    rate: 40, featured: true, load: 0.85, packages: [[5, 8], [10, 12]],
    headline: "SAT Maths 800 scorer, now coaching students into US universities",
    about: "I scored 1560 on the SAT and went on to study economics at Princeton on a scholarship. Since coming home to Lagos I have helped more than 150 students prepare for the SAT, and many of them are now at universities in the US, Canada and the UK.\nI know the pressure students and parents feel around these tests, and I know that the SAT is a learnable test. It rewards strategy as much as knowledge.\nAlongside SAT prep I tutor A-level and university economics.",
    style: "I start with a full diagnostic test and build a study plan around your test date. Each lesson combines content review with timed practice, and we keep a log of every mistake so you never lose marks the same way twice.\nParents get a short progress note every two weeks.",
    education: [{ degree: "AB Economics", institution: "Princeton University", start: 2012, end: 2016 }],
    experience: [{ role: "Analyst", org: "Investment bank, Lagos", start: 2016, end: 2019 }, { role: "Founder and lead tutor", org: "Test prep studio, Lagos", start: 2019 }],
  },
  {
    first: "Marie", last: "Dubois", country: "France", tz: "Europe/Paris",
    subjects: ["French"], levels: ["secondary", "university", "adult", "exam"], langs: [["French", "native"], ["English", "c1"], ["Spanish", "b2"]],
    rate: 30, load: 0.75, instant: true, packages: [[10, 10]],
    headline: "Native French teacher from Lyon, DELF and conversation",
    about: "Bonjour ! I am a French teacher from Lyon with a master's in teaching French as a foreign language. I spent two years teaching at the Alliance Française in Nairobi, which is where I fell in love with East Africa and met many of my current students.\nI teach beginners who want to order a coffee in Paris, professionals who need French for work at the UN or embassies, and students preparing for DELF A2 to C1.\nI am patient, and I believe mistakes are the best part of learning a language.",
    style: "We speak French from the first lesson, slowly at first. Every lesson has a theme from real life: travel, work, food, news. I send you a short vocabulary list and audio recording after each lesson.\nFor DELF candidates we practise each part of the exam under real conditions.",
    education: [{ degree: "Master FLE (Français Langue Étrangère)", institution: "Université Lumière Lyon 2", start: 2013, end: 2015 }],
    experience: [{ role: "French teacher", org: "Alliance Française de Nairobi", start: 2016, end: 2018 }, { role: "DELF examiner", org: "France Éducation International", start: 2017 }, { role: "Online French tutor", org: "Self-employed", start: 2018 }],
    certs: [{ title: "DELF/DALF examiner accreditation", issuer: "France Éducation International", year: 2017 }],
  },
  {
    first: "Brian", last: "Kiprop", country: "Kenya", tz: "Africa/Nairobi",
    subjects: ["Physics", "Mathematics"], levels: ["secondary", "university"], langs: [["English", "c2"], ["Kiswahili", "native"]],
    rate: 18, load: 0.7,
    headline: "Physics graduate who loves turning formulas into stories",
    about: "I studied Physics at Moi University and now work as a lab technician while finishing my master's. I have been tutoring for five years, mostly Form 3 and 4 students and first-year university students taking Physics 101.\nI was not a strong student myself until a teacher showed me that every formula describes something real. That is how I teach now.\nI am from Eldoret and I run in the mornings. Some of my examples about speed and acceleration come straight from the running track.",
    style: "Short explanations, lots of questions. I ask you to predict what will happen before we calculate it, then we check. We go through past papers once the ideas are clear.",
    education: [{ degree: "BSc Physics", institution: "Moi University", start: 2014, end: 2018 }, { degree: "MSc Applied Physics (in progress)", institution: "Moi University", start: 2022, end: 2025 }],
    experience: [{ role: "Laboratory technician", org: "Moi University", start: 2019 }, { role: "Physics tutor", org: "Self-employed", start: 2018 }],
  },
  {
    first: "Fatuma", last: "Nakato", country: "Uganda", tz: "Africa/Kampala",
    subjects: ["Accounting", "Economics"], levels: ["university", "adult", "exam"], langs: [["English", "c2"], ["Luganda", "native"], ["Kiswahili", "b2"]],
    rate: 28, load: 0.8, packages: [[5, 10], [10, 15]],
    headline: "Chartered accountant tutoring ACCA, CPA and university accounting",
    about: "I am an ACCA member and worked in audit at one of the big four firms in Kampala for six years. I now run my own small practice and tutor accounting students in the evenings.\nI know how hard it is to study for professional exams while working full time. My students are mostly working adults, and I plan lessons around their exam sittings and their busy weeks.\nMy favourite papers to teach are Financial Reporting and Audit and Assurance.",
    style: "We go through the syllabus in a set order and finish every topic with an exam-standard question under time pressure. I mark your answers the way an ACCA marker would and show you where the easy marks are.",
    education: [{ degree: "Bachelor of Commerce", institution: "Makerere University", field: "Accounting", start: 2008, end: 2011 }],
    experience: [{ role: "Audit senior", org: "Big four firm, Kampala", start: 2012, end: 2018 }, { role: "Founder", org: "Accounting practice, Kampala", start: 2018 }],
    certs: [{ title: "ACCA member", issuer: "ACCA", year: 2014 }, { title: "CPA(U)", issuer: "ICPAU", year: 2013 }],
  },
  {
    first: "Kwame", last: "Mensah", country: "Ghana", tz: "Africa/Accra",
    subjects: ["Web Development", "Computer Science"], levels: ["secondary", "university", "adult"], langs: [["English", "c2"], ["Twi", "native"]],
    rate: 32, load: 0.65, instant: true,
    headline: "Frontend engineer teaching HTML, JavaScript and React the practical way",
    about: "I am a frontend engineer working remotely for a European e-commerce company. I taught myself to code from YouTube videos in an internet café in Kumasi, so I know you do not need a computer science degree to build great things.\nI have mentored over 60 developers, from teenagers building their first website to career-changers landing their first developer job.\nIf you want to build something real, like a portfolio, a shop or an app idea, I can help you get there.",
    style: "Project first. We pick something you want to build and learn every concept through it. I do code reviews between lessons and help you put your work on GitHub so employers can see it.",
    education: [{ degree: "BSc Computer Science", institution: "Kwame Nkrumah University of Science and Technology", start: 2013, end: 2017 }],
    experience: [{ role: "Frontend Engineer", org: "E-commerce company (remote)", start: 2019 }, { role: "Web developer", org: "Digital agency, Accra", start: 2017, end: 2019 }],
  },
  {
    first: "Esther", last: "Achieng", country: "Kenya", tz: "Africa/Nairobi",
    subjects: ["English", "History & Government"], levels: ["primary", "secondary", "exam"], langs: [["English", "c2"], ["Kiswahili", "native"], ["Dholuo", "native"]],
    rate: 16, load: 0.9, instant: true, packages: [[10, 15]],
    headline: "English and composition tutor for Grade 4 to Form 4",
    about: "I have taught English for twelve years in schools in Kisumu and Nairobi. I now teach online so that I can give each student the attention a class of 50 does not allow.\nMost of my students want to write better compositions and understand their set books. I also help younger learners in CBC grades build strong reading habits.\nParents tell me their children start reading for fun after a few weeks with me, and that is the result I am proudest of.",
    style: "We read together, talk about what we read, and then write. I mark every composition with clear comments and a short list of things to try next time. For set books we cover themes, characters and essay questions step by step.",
    education: [{ degree: "Bachelor of Education (Arts)", institution: "Maseno University", field: "English and Literature", start: 2006, end: 2010 }],
    experience: [{ role: "English teacher", org: "Secondary school, Kisumu", start: 2011, end: 2018 }, { role: "Head of Languages", org: "Private school, Nairobi", start: 2018, end: 2022 }, { role: "Online tutor", org: "Self-employed", start: 2022 }],
  },
  {
    first: "Lucía", last: "Fernández", country: "Spain", tz: "Europe/Madrid",
    subjects: ["Spanish"], levels: ["secondary", "adult", "exam"], langs: [["Spanish", "native"], ["English", "c1"], ["French", "b1"]],
    rate: 26, load: 0.6, instant: true, packages: [[5, 5], [10, 10]],
    headline: "Conversational Spanish with a teacher from Seville",
    about: "¡Hola! I am Lucía, a Spanish teacher from Seville. I have a degree in Hispanic Philology and have been teaching Spanish to foreigners for eight years, first in Madrid and now online.\nMy students are mostly adults who want to travel, work with Spanish-speaking clients or connect with family. I also prepare students for the DELE exam.\nI love flamenco, cooking and bad jokes, and you will probably hear about all three in our lessons.",
    style: "Relaxed, conversation-based lessons with grammar explained only when you need it. I share a document during the lesson with all the new words and corrections so you can review later.",
    education: [{ degree: "Grado en Filología Hispánica", institution: "Universidad de Sevilla", start: 2010, end: 2014 }, { degree: "Máster en Enseñanza de Español como Lengua Extranjera", institution: "Universidad Nebrija", start: 2014, end: 2015 }],
    experience: [{ role: "Spanish teacher", org: "Language academy, Madrid", start: 2015, end: 2020 }, { role: "Online Spanish tutor", org: "Self-employed", start: 2020 }],
    certs: [{ title: "DELE examiner", issuer: "Instituto Cervantes", year: 2018 }],
  },
  {
    first: "Peter", last: "Njoroge", country: "Kenya", tz: "Africa/Nairobi",
    subjects: ["Mathematics"], levels: ["primary", "secondary"], langs: [["English", "c2"], ["Kiswahili", "native"], ["Kikuyu", "native"]],
    rate: 14, load: 0.75, instant: true,
    headline: "Patient Maths tutor for CBC and 8-4-4 learners",
    about: "I am a retired deputy principal with 26 years of teaching Mathematics. After I retired I found I missed teaching, so I now help a small group of learners online.\nI specialise in students who have fallen behind or who feel anxious about Maths. With patience and the right steps, every child can do well in Maths.\nI also help parents understand the new CBC approach so they can support their children at home.",
    style: "Slow and steady. We make sure the basics are solid before moving on. I use everyday examples like shopping, sharing and measuring, and I praise effort, not just right answers.",
    education: [{ degree: "Bachelor of Education (Science)", institution: "Kenyatta University", field: "Mathematics and Physics", start: 1993, end: 1996 }],
    experience: [{ role: "Mathematics teacher", org: "Secondary schools, Kiambu County", start: 1997, end: 2012 }, { role: "Deputy Principal", org: "Secondary school, Kiambu County", start: 2012, end: 2023 }],
  },
  {
    first: "Aisha", last: "Abdi", country: "Kenya", tz: "Africa/Nairobi",
    subjects: ["English Conversation", "Business English"], levels: ["adult"], langs: [["English", "c2"], ["Somali", "native"], ["Kiswahili", "c1"], ["Arabic", "b1"]],
    rate: 20, load: 0.8, instant: true, packages: [[10, 12]],
    headline: "Speak English with confidence at work, interviews and everyday life",
    about: "I work in communications for an international NGO and have coached colleagues and friends on their English for years before making it official. Many of my students are professionals who understand English well but freeze when they have to speak in meetings or interviews.\nI speak Somali, Kiswahili and Arabic, so I understand the common pronunciation and grammar habits of speakers of these languages.\nMy goal is simple: that you leave every lesson feeling a little more confident than when you came.",
    style: "Lots of speaking. We practise real situations from your life: a presentation next week, a job interview, a phone call with a client. I note down your mistakes quietly and we go through them at the end.",
    education: [{ degree: "BA Communication and Media", institution: "Daystar University", start: 2012, end: 2016 }],
    experience: [{ role: "Communications officer", org: "International NGO, Nairobi", start: 2017 }, { role: "English coach", org: "Self-employed", start: 2019 }],
    certs: [{ title: "TEFL Certificate (120 hours)", issuer: "TEFL Org", year: 2019 }],
  },
  {
    first: "Thomas", last: "Becker", country: "Germany", tz: "Europe/Berlin",
    subjects: ["German"], levels: ["university", "adult", "exam"], langs: [["German", "native"], ["English", "c2"]],
    rate: 34, load: 0.5, packages: [[10, 10]],
    headline: "German for study, work and Goethe exams, from a Berlin teacher",
    about: "I have taught German as a foreign language in Berlin for ten years, mostly to students and professionals preparing to move to Germany. Many of my current students are nurses and engineers from Kenya and Nigeria going through the recognition process.\nI know the Goethe-Institut exams inside out, from A1 all the way to C1, and I know how stressful the visa timeline can feel.\nOutside teaching I cycle, cook and spend too much time in bookshops.",
    style: "Clear structure: every lesson has a goal, a short grammar point, plenty of speaking and a writing task for homework. Exam students do one full mock test every month.",
    education: [{ degree: "MA Deutsch als Fremdsprache", institution: "Freie Universität Berlin", start: 2011, end: 2013 }],
    experience: [{ role: "German teacher", org: "Language school, Berlin", start: 2013, end: 2021 }, { role: "Goethe-Institut examiner", org: "Goethe-Institut", start: 2016 }, { role: "Online German tutor", org: "Self-employed", start: 2021 }],
  },
  {
    first: "Mercy", last: "Wambui", country: "Kenya", tz: "Africa/Nairobi",
    subjects: ["Biology", "Chemistry"], levels: ["secondary", "university"], langs: [["English", "c2"], ["Kiswahili", "native"]],
    rate: 19, load: 0.7,
    headline: "Medical student making Biology simple and memorable",
    about: "I am in my fifth year of medicine at Moi University and I have been tutoring Biology since I was in first year. I still remember exactly which topics confused me in high school, and I love making them clear for others.\nMost of my students want to study medicine, nursing or pharmacy, so we often talk about university admissions and what studying medicine is really like.\nI am friendly, organised and always on time.",
    style: "I use diagrams, mnemonics and quick quizzes. Every lesson ends with five past-paper questions. I share all my notes with you after each lesson.",
    education: [{ degree: "MBChB (in progress)", institution: "Moi University", field: "Medicine", start: 2021, end: 2027 }],
    experience: [{ role: "Biology and Chemistry tutor", org: "Self-employed", start: 2021 }],
  },
  {
    first: "Rajesh", last: "Patel", country: "Kenya", tz: "Africa/Nairobi",
    subjects: ["Mathematics", "Physics", "SAT & ACT"], levels: ["secondary", "university", "exam"], langs: [["English", "c2"], ["Gujarati", "native"], ["Hindi", "c1"], ["Kiswahili", "b2"]],
    rate: 42, featured: true, load: 0.9, packages: [[5, 8], [10, 12]],
    headline: "IGCSE, A-level and IB Maths and Physics, 15 years of results",
    about: "I have taught IGCSE, A-level and IB Mathematics and Physics in international schools in Nairobi for fifteen years. My students have gone on to study at Imperial, Toronto, Cambridge and MIT.\nI hold a degree in Mathematics from the University of Warwick and I have been an IB examiner for Mathematics: Analysis and Approaches.\nI work with ambitious students who want top grades, and also with students who simply need a calm, clear explanation of a topic their school moved through too quickly.",
    style: "Rigorous but friendly. I explain the reasoning behind every method, then we practise with exam-board questions. I help IB students plan and polish their Internal Assessment.",
    education: [{ degree: "BSc Mathematics", institution: "University of Warwick", start: 2004, end: 2007 }, { degree: "PGCE Secondary Mathematics", institution: "Institute of Education, London", start: 2007, end: 2008 }],
    experience: [{ role: "Head of Mathematics", org: "International school, Nairobi", start: 2012, end: 2022 }, { role: "IB Mathematics examiner", org: "International Baccalaureate", start: 2015 }, { role: "Private tutor", org: "Self-employed", start: 2022 }],
    certs: [{ title: "Qualified Teacher Status (QTS)", issuer: "Department for Education, UK", year: 2008 }],
  },
  {
    first: "Neema", last: "Mollel", country: "Tanzania", tz: "Africa/Dar_es_Salaam",
    subjects: ["Kiswahili", "Geography"], levels: ["primary", "secondary", "adult"], langs: [["Kiswahili", "native"], ["English", "c1"]],
    rate: 13, load: 0.55, instant: true,
    headline: "Learn Kiswahili the Tanzanian way, from Arusha",
    about: "Habari! I am Neema, a teacher from Arusha. I teach Kiswahili to visitors, volunteers, researchers and families who are moving to Tanzania, and Geography to secondary school students.\nI have worked with safari guides, doctors volunteering at Mount Meru hospital and university students doing field research. Each of them needed slightly different Kiswahili, and I enjoy shaping lessons around what you will actually use.\nI am warm, patient and I laugh a lot.",
    style: "We focus on speaking and listening from day one, with simple phrases you can use straight away. I send voice notes for you to practise pronunciation between lessons.",
    education: [{ degree: "BA Education", institution: "University of Dar es Salaam", field: "Kiswahili and Geography", start: 2012, end: 2015 }],
    experience: [{ role: "Secondary school teacher", org: "School in Arusha", start: 2016, end: 2022 }, { role: "Kiswahili trainer", org: "Volunteer organisations, Arusha", start: 2018 }],
  },
  {
    first: "Michael", last: "Ochieng", country: "Kenya", tz: "Africa/Nairobi",
    subjects: ["Music"], levels: ["primary", "secondary", "adult"], langs: [["English", "c2"], ["Kiswahili", "native"]],
    rate: 24, load: 0.5, instant: true, packages: [[10, 10]],
    headline: "Piano and music theory, from first notes to ABRSM grade 8",
    about: "I studied music at Kenyatta University and have played piano in churches, hotels and with jazz bands across Nairobi for fifteen years. I have taught piano and music theory to more than 100 students, from five-year-olds to retirees.\nI prepare students for ABRSM exams and I am just as happy teaching an adult who wants to play their favourite songs for fun.\nMusic should be a joy, and my lessons are built around that.",
    style: "Every lesson includes something technical (scales or theory), something you are learning properly and something fun. You need a keyboard and a phone or laptop where I can see your hands.",
    education: [{ degree: "Bachelor of Music", institution: "Kenyatta University", start: 2006, end: 2010 }],
    experience: [{ role: "Music teacher", org: "International school, Nairobi", start: 2011, end: 2019 }, { role: "Session pianist", org: "Freelance", start: 2010 }],
    certs: [{ title: "ABRSM Grade 8 Piano (Distinction)", issuer: "ABRSM", year: 2005 }, { title: "ABRSM Grade 8 Music Theory", issuer: "ABRSM", year: 2006 }],
  },
  {
    first: "Hannah", last: "Mugo", country: "Kenya", tz: "Africa/Nairobi",
    subjects: ["Mathematics", "English"], levels: ["primary"], langs: [["English", "c2"], ["Kiswahili", "native"]],
    rate: 12, load: 0.85, instant: true, packages: [[10, 15], [20, 20]],
    headline: "Friendly primary tutor for Grades 1 to 6, Maths and reading",
    about: "I am a primary school teacher with nine years of experience in CBC and international curricula. I work with young learners who need a little extra help with reading, phonics and numbers, and with confident learners who want to go further.\nI have two children of my own, so I know how busy evenings can be for parents. I keep lessons to 30 or 45 minutes so they fit around homework and dinner.\nI send parents a short message after every lesson so you always know what we covered.",
    style: "Playful and structured: games, stories, flashcards and a sticker chart for the little ones. Each lesson has one clear goal, like \"read words with sh and ch\" or \"add two-digit numbers\".",
    education: [{ degree: "Diploma in Primary Teacher Education", institution: "Kilimo Teachers College", start: 2012, end: 2014 }, { degree: "Bachelor of Education (Primary)", institution: "Mount Kenya University", start: 2016, end: 2019 }],
    experience: [{ role: "Class teacher", org: "Primary school, Nairobi", start: 2015 }],
  },
  {
    first: "Samuel", last: "Habimana", country: "Rwanda", tz: "Africa/Kigali",
    subjects: ["French", "English Conversation"], levels: ["secondary", "adult"], langs: [["Kinyarwanda", "native"], ["French", "c2"], ["English", "c1"], ["Kiswahili", "b2"]],
    rate: 18, load: 0.6, instant: true,
    headline: "French and English from Kigali, for school, work and travel",
    about: "I grew up in Kigali speaking Kinyarwanda at home, French at school and English at university, so switching between languages is part of my daily life. I teach French and English to students across East Africa.\nMany of my students are Kenyan and Ugandan professionals who need French for jobs with regional organisations, and secondary school students who want to improve their grades.\nI also translate for conferences, which keeps my vocabulary fresh.",
    style: "Practical and conversation-led. We practise real situations and I explain grammar with simple comparisons to English or Kiswahili.",
    education: [{ degree: "BA Modern Languages", institution: "University of Rwanda", field: "French and English", start: 2011, end: 2015 }],
    experience: [{ role: "Conference interpreter and translator", org: "Freelance", start: 2016 }, { role: "Language tutor", org: "Self-employed", start: 2017 }],
  },
  {
    first: "Olivia", last: "Kariuki", country: "Kenya", tz: "Africa/Nairobi",
    subjects: ["Economics", "Business English", "Accounting"], levels: ["secondary", "university", "adult"], langs: [["English", "c2"], ["Kiswahili", "native"]],
    rate: 25, load: 0.55, packages: [[5, 10]],
    headline: "Economics and business tutor, from A-level to MBA case work",
    about: "I studied economics at Strathmore and later did an MBA while working in strategy for a large East African bank. I tutor A-level and university economics, and I help MBA students with case analysis and financial modelling.\nI like connecting theory to what is happening in the news: inflation, exchange rates, the price of unga. Economics makes much more sense when you can see it around you.",
    style: "Each lesson links a concept to a real example, then we practise exam or case questions. I give detailed feedback on essays and help you structure strong arguments.",
    education: [{ degree: "BCom Economics", institution: "Strathmore University", start: 2009, end: 2013 }, { degree: "MBA", institution: "Strathmore Business School", start: 2017, end: 2019 }],
    experience: [{ role: "Strategy manager", org: "Commercial bank, Nairobi", start: 2014, end: 2022 }, { role: "Tutor and consultant", org: "Self-employed", start: 2022 }],
  },
  {
    first: "Yusuf", last: "Ali", country: "Kenya", tz: "Africa/Nairobi",
    subjects: ["Computer Science", "Python & Data Science", "Mathematics"], levels: ["secondary", "university"], langs: [["English", "c2"], ["Kiswahili", "native"], ["Somali", "c1"]],
    rate: 27, load: 0.6, instant: true,
    headline: "Computer Science student helping with KCSE Computer Studies and first-year coding",
    about: "I am a final-year Computer Science student at the University of Nairobi and a teaching assistant for the first-year programming course. I help high school students with Computer Studies and university students who are struggling with their first programming units.\nI remember how lost I felt in my first C++ class. I explain things the way I wish someone had explained them to me.",
    style: "We code together from the first lesson. I break problems into small steps and make sure you can solve the next one on your own.",
    education: [{ degree: "BSc Computer Science (final year)", institution: "University of Nairobi", start: 2022, end: 2026 }],
    experience: [{ role: "Teaching assistant, Introduction to Programming", org: "University of Nairobi", start: 2024 }],
  },
];

/** A few applications waiting in the admin review queue. */
export const DEMO_APPLICANTS: Pick<DemoTutor, "first" | "last" | "country" | "tz" | "subjects" | "levels" | "langs" | "rate" | "headline" | "about" | "style" | "education" | "experience">[] = [
  {
    first: "Joseph", last: "Kamau", country: "Kenya", tz: "Africa/Nairobi", subjects: ["Geography", "History & Government"], levels: ["secondary", "exam"], langs: [["English", "c2"], ["Kiswahili", "native"]], rate: 15,
    headline: "Geography and History teacher, KCSE focused",
    about: "I have taught Geography and History at a county school in Murang'a for seven years and I want to help more students online, especially those preparing for KCSE.\nI enjoy map work and fieldwork questions, which many students find hard.",
    style: "Clear notes, lots of maps and diagrams, and past-paper practice every week.",
    education: [{ degree: "Bachelor of Education (Arts)", institution: "Egerton University", field: "Geography and History", start: 2012, end: 2016 }],
    experience: [{ role: "Geography and History teacher", org: "County school, Murang'a", start: 2017 }],
  },
  {
    first: "Ifeoma", last: "Eze", country: "Nigeria", tz: "Africa/Lagos", subjects: ["Chemistry", "Biology"], levels: ["secondary", "university"], langs: [["English", "c2"], ["Igbo", "native"]], rate: 22,
    headline: "Biochemist tutoring WAEC, IGCSE and university chemistry",
    about: "I am a biochemist and a lecturer's assistant at a university in Enugu. I have tutored chemistry and biology for six years and would like to reach students across Africa.\nMy students have improved their WAEC and IGCSE grades, and I enjoy making organic chemistry less scary.",
    style: "Concept first, then practice. I use simple experiments and lots of diagrams.",
    education: [{ degree: "BSc Biochemistry", institution: "University of Nigeria, Nsukka", start: 2012, end: 2016 }, { degree: "MSc Biochemistry", institution: "University of Nigeria, Nsukka", start: 2018, end: 2020 }],
    experience: [{ role: "Graduate assistant", org: "University in Enugu", start: 2020 }],
  },
  {
    first: "Ahmed", last: "Farah", country: "Kenya", tz: "Africa/Nairobi", subjects: ["English Conversation"], levels: ["adult"], langs: [["Somali", "native"], ["Arabic", "c2"], ["English", "c1"]], rate: 17,
    headline: "Conversational English for Somali and Arabic speakers",
    about: "I help Somali and Arabic speakers in Nairobi and abroad build confidence speaking English for work and study. I have taught evening classes at a community centre in Eastleigh for four years.",
    style: "Relaxed conversation with a focus on pronunciation and everyday phrases.",
    education: [{ degree: "BA English", institution: "Mount Kenya University", start: 2015, end: 2019 }],
    experience: [{ role: "Evening class teacher", org: "Community centre, Eastleigh", start: 2020 }],
  },
];
