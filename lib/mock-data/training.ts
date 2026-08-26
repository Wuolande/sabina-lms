import { TrainingCourse, TutorCertificate } from '@/src/modules/training/types/trainingTypes';

export const mockTrainingCourses: TrainingCourse[] = [
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    slug: 'sabina-classroom-mastery',
    title: 'Sabina Live Classroom Mastery & HD Whiteboard',
    headline: 'Master interactive whiteboard tools, LaTeX formatting, screen sharing, and audio isolation to deliver flawless 1-on-1 sessions.',
    description: 'An essential masterclass on utilizing Sabina Edge Classroom capabilities. Learn how to plot graphs dynamically, upload problem sets, format mathematical formulas in real-time, and handle student connectivity hiccups with zero friction.',
    category: 'Classroom Tools',
    level: 'All Levels',
    estimatedMinutes: 45,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
    badgeTitle: 'Classroom Technology Specialist',
    badgeIcon: 'Laptop',
    isMandatory: true,
    passingScorePercentage: 80,
    orderIndex: 1,
    isPublished: true,
    isEnrolled: true,
    progressPercentage: 66,
    status: 'in_progress',
    modules: [
      {
        id: 'm1-1',
        courseId: 'c1111111-1111-1111-1111-111111111111',
        title: '1. Navigating the LiveKit Collaborative Whiteboard',
        description: 'Explore brush tools, vector shapes, LaTeX rendering box, and unlimited canvas panning.',
        moduleType: 'video',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-online-learning-concept-42526-large.mp4',
        durationMinutes: 12,
        orderIndex: 1,
        isCompleted: true,
        resources: [
          { title: 'Whiteboard Hotkeys & Shortcut Cheatsheet (PDF)', url: '/docs/whiteboard-shortcuts.pdf', type: 'cheatsheet' },
          { title: 'LaTeX Equation Syntax Guide', url: 'https://katex.org/docs/supported.html', type: 'link' }
        ]
      },
      {
        id: 'm1-2',
        courseId: 'c1111111-1111-1111-1111-111111111111',
        title: '2. Real-Time Document Annotations & Screen Sharing',
        description: 'How to upload PDFs, annotate past papers simultaneously with students, and split-screen code editors.',
        moduleType: 'reading',
        durationMinutes: 15,
        orderIndex: 2,
        isCompleted: true,
        readingContent: `
# Mastering Document Collaboration in Sabina Classroom

Live 1-on-1 tutoring requires seamless document sharing without delays or pixelated compression.

### 1. Uploading Problem Sets & Past Papers
- Always upload PDF documents at least 2 minutes prior to session commencement.
- Use the **Annotate Layer** so you and your student can highlight terms in different colored markers (Tutor: Blue/Green; Student: Orange/Purple).

### 2. Live LaTeX Math Rendering
- Click the **Math Formula** tool on the left toolbar.
- Type equations using standard LaTeX:
  - Quadratic: \`x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\`
  - Integrals: \`\\int_{a}^{b} f(x) dx\`
- The math box automatically compiles in real-time, giving students textbook-quality clarity.

### 3. Screen Sharing Protocols
- Share specific application windows rather than your entire desktop to preserve privacy and prevent background notifications.
- Enable high-frame-rate mode if showing animations or dynamic Desmos graphs.
        `
      },
      {
        id: 'm1-3',
        courseId: 'c1111111-1111-1111-1111-111111111111',
        title: '3. Troubleshooting Audio, Camera & Reconnection',
        description: 'Handling low-bandwidth scenarios, background noise cancellation, and automated session backup recordings.',
        moduleType: 'video',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-41551-large.mp4',
        durationMinutes: 10,
        orderIndex: 3,
        isCompleted: false
      }
    ],
    quiz: {
      id: 'q1',
      courseId: 'c1111111-1111-1111-1111-111111111111',
      title: 'Classroom Technology & Operations Certification Exam',
      description: 'Test your understanding of Sabina Classroom tools, document sharing, and connectivity protocols.',
      passingScore: 80,
      timeLimitMinutes: 15,
      questions: [
        {
          id: 'q1-1',
          quizId: 'q1',
          question: 'What is the recommended practice when sharing your screen with a student on Sabina LMS?',
          options: [
            'Share the entire display including personal messaging apps',
            'Share specific application windows only to protect privacy and minimize distractions',
            'Turn off your camera completely during the entire lesson',
            'Ask the student to share their screen instead at all times'
          ],
          correctOptionIndex: 1,
          explanation: 'Sharing specific application windows prevents accidental exposure of personal notifications and keeps student focus on the lesson material.',
          orderIndex: 1
        },
        {
          id: 'q1-2',
          quizId: 'q1',
          question: 'How can you insert formatted mathematical integrals and formulas on the Sabina whiteboard?',
          options: [
            'Draw every symbol by hand with mouse brush only',
            'Use the LaTeX Formula tool for crisp real-time KaTeX rendering',
            'Take screenshots from Google search and paste them',
            'Type plain ASCII text without formatting'
          ],
          correctOptionIndex: 1,
          explanation: 'The built-in LaTeX formula tool instantly compiles mathematical expressions for textbook-grade legibility.',
          orderIndex: 2
        },
        {
          id: 'q1-3',
          quizId: 'q1',
          question: 'If a student experiences unstable bandwidth during a video session, what is the best immediate step?',
          options: [
            'End the lesson immediately and issue a penalty',
            'Switch student video to low-resolution audio-priority mode while maintaining whiteboard sync',
            'Ask the student to reschedule for next month',
            'Ignore the issue and speak louder'
          ],
          correctOptionIndex: 1,
          explanation: 'Reducing video bitrate while prioritizing crisp audio and synced whiteboard keeps the lesson productive without interruption.',
          orderIndex: 3
        },
        {
          id: 'q1-4',
          quizId: 'q1',
          question: 'Where are session annotated whiteboard notes saved after a completed lesson?',
          options: [
            'They are permanently deleted immediately after logout',
            'Automatically exported to the student & tutor lesson portal as an archived PDF summary',
            'Sent only via postal mail',
            'Saved locally on tutor hard drive only'
          ],
          correctOptionIndex: 1,
          explanation: 'Sabina automatically archives annotated notes and lesson materials into the student and tutor lesson history portal.',
          orderIndex: 4
        }
      ]
    }
  },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    slug: 'pedagogical-excellence-and-socratic-methods',
    title: 'Pedagogical Excellence & Socratic Questioning',
    headline: 'Engage students with active inquiry, diagnostic assessments, and scaffolding to build deep conceptual mastery.',
    description: 'Move beyond passive lecturing. This course equips educators with active learning routines, cognitive load management strategies, and techniques to turn struggling students into independent problem solvers.',
    category: 'Pedagogy',
    level: 'Intermediate',
    estimatedMinutes: 60,
    thumbnailUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80',
    badgeTitle: 'Certified Master Pedagogue',
    badgeIcon: 'GraduationCap',
    isMandatory: false,
    passingScorePercentage: 85,
    orderIndex: 2,
    isPublished: true,
    isEnrolled: false,
    progressPercentage: 0,
    status: 'not_started',
    modules: [
      {
        id: 'm2-1',
        courseId: 'c2222222-2222-2222-2222-222222222222',
        title: '1. The 70/30 Student Talk-Time Rule',
        description: 'Why passive tutoring fails and how to engineer lessons where students verbalize 70% of reasoning.',
        moduleType: 'reading',
        durationMinutes: 20,
        orderIndex: 1,
        readingContent: `
# The 70/30 Active Learning Architecture

Research demonstrates that tutoring retention drops below 20% when the instructor does 80% of the talking.

### Core Framework:
1. **The 3-Second Wait Time**: After asking a probing question, give students 3 to 5 seconds of silence before offering hints.
2. **Never Write What the Student Can Dictate**: Have the student guide your pen or write directly on the whiteboard.
3. **The "Teach-Back" Loop**: Before moving to the next concept, ask: *"If you were explaining this mechanism to a classmate tomorrow, what are the three key steps you would outline?"*
        `
      },
      {
        id: 'm2-2',
        courseId: 'c2222222-2222-2222-2222-222222222222',
        title: '2. Socratic Scaffolding & Diagnostic Questioning',
        description: 'How to diagnose misconceptions without giving away answers directly.',
        moduleType: 'video',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-online-learning-concept-42526-large.mp4',
        durationMinutes: 20,
        orderIndex: 2
      }
    ],
    quiz: {
      id: 'q2',
      courseId: 'c2222222-2222-2222-2222-222222222222',
      title: 'Pedagogical Mastery Certification Exam',
      description: 'Evaluate your application of Socratic methods, active talk-time ratios, and cognitive scaffolding.',
      passingScore: 85,
      questions: [
        {
          id: 'q2-1',
          quizId: 'q2',
          question: 'What is the target ratio for student talk-time versus tutor talk-time in an optimal 1-on-1 lesson?',
          options: [
            'Student 20%, Tutor 80%',
            'Student 70%, Tutor 30%',
            'Student 50%, Tutor 50% only',
            'Tutor 100% lecture'
          ],
          correctOptionIndex: 1,
          explanation: 'Having the student talk and articulate reasoning for ~70% of the session maximizes cognitive retention and active problem solving.',
          orderIndex: 1
        },
        {
          id: 'q2-2',
          quizId: 'q2',
          question: 'When a student gets stuck on a multi-step problem, what is the best Socratic intervention?',
          options: [
            'Write out the full solution for them and tell them to copy it',
            'Ask: "What do we know from the problem statement, and what is our target variable?"',
            'Skip the problem and move to something easier',
            'Tell them they need to study more at home'
          ],
          correctOptionIndex: 1,
          explanation: 'Deconstructing the problem statement into knowns and target unknowns scaffolds the solution path without solving it for them.',
          orderIndex: 2
        }
      ]
    }
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    slug: 'child-safety-and-safeguarding-compliance',
    title: 'Safeguarding, Privacy & Professional Conduct',
    headline: 'Essential safety standards, student data protection, code of ethics, and mandatory reporting protocols on Sabina LMS.',
    description: 'Protect yourself and your students. Learn our mandatory safeguarding regulations, parent communication policies, recording protocols, and ethics standards for online education.',
    category: 'Safeguarding',
    level: 'All Levels',
    estimatedMinutes: 30,
    thumbnailUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80',
    badgeTitle: 'Safeguarding & Ethics Verified',
    badgeIcon: 'ShieldCheck',
    isMandatory: true,
    passingScorePercentage: 100,
    orderIndex: 3,
    isPublished: true,
    isEnrolled: true,
    progressPercentage: 100,
    status: 'completed',
    completedAt: '2026-08-20T10:00:00Z',
    certificateCode: 'SAB-SAFE-98214',
    modules: [
      {
        id: 'm3-1',
        courseId: 'c3333333-3333-3333-3333-333333333333',
        title: '1. Code of Professional Conduct & Communication Boundaries',
        description: 'Official communication channels, zero off-platform messaging, and professional demeanor.',
        moduleType: 'reading',
        durationMinutes: 15,
        orderIndex: 1,
        isCompleted: true,
        readingContent: `
# Sabina Safeguarding & Professional Conduct Policy

Every educator on Sabina is bound by our strict Child Safeguarding & Safety Code.

### Mandatory Rules:
1. **Platform Exclusivity**: Never exchange personal phone numbers, WhatsApp, Instagram, or Discord handles with minor students. All messaging must occur within the Sabina Student-Tutor chat.
2. **Classroom Environment**: Conduct sessions from a neutral, quiet, and professional environment with appropriate dress code.
3. **Session Archiving**: Sessions are monitored by automated safety telemetry to protect both educators and students.
4. **Mandatory Reporting**: If a student discloses abuse, harm, or emergency danger, immediately alert the Sabina Trust & Safety Team via the Emergency Report flag.
        `
      }
    ],
    quiz: {
      id: 'q3',
      courseId: 'c3333333-3333-3333-3333-333333333333',
      title: 'Safeguarding & Ethics Verification Exam',
      description: 'Mandatory 100% pass mark required for all certified educators on Sabina.',
      passingScore: 100,
      questions: [
        {
          id: 'q3-1',
          quizId: 'q3',
          question: 'Is it permissible to communicate with a student on personal WhatsApp or Instagram for lesson homework?',
          options: [
            'Yes, if the student asks for it',
            'No. All communication must remain strictly inside the encrypted Sabina messaging portal',
            'Yes, if it is on weekends only',
            'Only with adult students'
          ],
          correctOptionIndex: 1,
          explanation: 'Strict in-app messaging protects both tutors and students under international safeguarding and GDPR compliance standards.',
          orderIndex: 1
        },
        {
          id: 'q3-2',
          quizId: 'q3',
          question: 'What should you do if you notice concerning safety disclosures or distress during a session?',
          options: [
            'Ignore it because you are only responsible for academics',
            'Use the Sabina Trust & Safety incident reporting channel immediately',
            'Post about it on social media',
            'Cancel the lesson without explanation'
          ],
          correctOptionIndex: 1,
          explanation: 'Prompt reporting to Sabina Trust & Safety ensures immediate intervention and compliance with child protection guidelines.',
          orderIndex: 2
        }
      ]
    }
  },
  {
    id: 'c4444444-4444-4444-4444-444444444444',
    slug: 'high-converting-trial-lessons-and-retention',
    title: 'High-Converting Trial Lessons & Student Retention',
    headline: 'Turn 25-minute intro lessons into long-term learning subscriptions through personalized roadmaps and clear milestones.',
    description: 'Learn the exact 5-step framework top tutors use to achieve a 90%+ trial conversion rate. Discover how to pinpoint student pain points in the first 5 minutes and co-design an irresistible study roadmap.',
    category: 'Business & Growth',
    level: 'Beginner',
    estimatedMinutes: 40,
    thumbnailUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=80',
    badgeTitle: 'Student Success Strategist',
    badgeIcon: 'TrendingUp',
    isMandatory: false,
    passingScorePercentage: 80,
    orderIndex: 4,
    isPublished: true,
    isEnrolled: false,
    progressPercentage: 0,
    status: 'not_started',
    modules: [
      {
        id: 'm4-1',
        courseId: 'c4444444-4444-4444-4444-444444444444',
        title: '1. The 25-Minute Trial Anatomy',
        description: '5-minute Rapport, 12-minute Diagnostic Problem, 5-minute Custom Roadmap, 3-minute Next Steps.',
        moduleType: 'reading',
        durationMinutes: 20,
        orderIndex: 1,
        readingContent: `
# The Anatomy of a 90%+ Converting Trial Lesson

The goal of a trial lesson is NOT to teach an entire semester of calculus in 25 minutes. The goal is to make the student feel understood, capable, and excited about their future growth.

### 5-Step Structure:
1. **Minutes 0-4 (Rapport & Target Definition)**: Understand their target grade, exam date, and previous frustrations with the subject.
2. **Minutes 5-16 (The "Lightbulb" Moment)**: Pick ONE tricky concept they struggled with. Solve it together until they achieve a breakthrough.
3. **Minutes 17-22 (Co-Creating the 8-Week Roadmap)**: Open the whiteboard notes and write down a tailored 4-module roadmap.
4. **Minutes 23-25 (Booking the Regular Slot)**: Recommend a consistent 2x weekly schedule to hit their target score.
        `
      }
    ],
    quiz: {
      id: 'q4',
      courseId: 'c4444444-4444-4444-4444-444444444444',
      title: 'Trial Conversion & Retention Exam',
      description: 'Assessment on lesson pacing, roadmap design, and student onboarding excellence.',
      passingScore: 80,
      questions: [
        {
          id: 'q4-1',
          quizId: 'q4',
          question: 'What is the primary objective of a 25-minute introductory trial session?',
          options: [
            'Cover as many formulas as possible without pauses',
            'Diagnose student learning needs, deliver a confidence breakthrough, and map out a structured study plan',
            'Give a difficult test to prove how much they do not know',
            'Only talk about tutor credentials for 25 minutes'
          ],
          correctOptionIndex: 1,
          explanation: 'Building student confidence on a key topic and presenting a clear roadmap leads to long-term tutoring success.',
          orderIndex: 1
        }
      ]
    }
  },
  {
    id: 'c5555555-5555-5555-5555-555555555555',
    slug: 'competitive-exam-prep-mastery',
    title: 'Competitive Exam Prep Coaching (AP, IB & SAT)',
    headline: 'Proven coaching methodologies for AP Calculus, IB DP Sciences, SAT Math, and GCSE/A-Level testing strategies.',
    description: 'Tailored specifically for test preparation coaches. Learn past-paper diagnostic pacing, time-management drills, marking scheme insights, and high-yield question dissection.',
    category: 'Exam Coaching',
    level: 'Advanced',
    estimatedMinutes: 75,
    thumbnailUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
    badgeTitle: 'Elite Test Prep Coach',
    badgeIcon: 'Award',
    isMandatory: false,
    passingScorePercentage: 85,
    orderIndex: 5,
    isPublished: true,
    isEnrolled: false,
    progressPercentage: 0,
    status: 'not_started',
    modules: [
      {
        id: 'm5-1',
        courseId: 'c5555555-5555-5555-5555-555555555555',
        title: '1. Diagnostic Testing & Marking Scheme Secrets',
        description: 'Analyzing examiners reports, common pitfalls in AP/IB questions, and rubric-driven coaching.',
        moduleType: 'reading',
        durationMinutes: 25,
        orderIndex: 1,
        readingContent: `
# Elite Exam Preparation Strategies

Competitive test prep coaching requires mastering the exam syllabus and official mark schemes.

### 1. High-Yield Past Paper Analysis
- Group questions by conceptual archetype rather than chronological years.
- Train students on command words: *"Evaluate" vs "Explain" vs "Calculate"*.

### 2. Time-Management Drills
- Implement the "1.5 minute per mark" pacing rule.
- Teach students when to flag and skip difficult questions to secure easy points first.
        `
      }
    ],
    quiz: {
      id: 'q5',
      courseId: 'c5555555-5555-5555-5555-555555555555',
      title: 'Exam Coaching Specialization Exam',
      description: 'Coaching evaluation for standardized testing, mark schemes, and timing drills.',
      passingScore: 85,
      questions: [
        {
          id: 'q5-1',
          quizId: 'q5',
          question: 'What is the most effective way to utilize official past papers in test coaching?',
          options: [
            'Have the student do them with zero review',
            'Categorize questions by topic, dissect official rubric marking points, and drill time-pressured mock sets',
            'Avoid past papers until the day before the exam',
            'Only practice multiple choice and ignore free response questions'
          ],
          correctOptionIndex: 1,
          explanation: 'Targeted rubric dissection and timed archetype drills produce the highest score improvements.',
          orderIndex: 1
        }
      ]
    }
  }
];

export const mockTutorCertificates: TutorCertificate[] = [
  {
    id: 'cert-1',
    tutorId: 'f9e96316-0e63-44ef-a08a-6b2862a3c55f',
    courseId: 'c3333333-3333-3333-3333-333333333333',
    courseSlug: 'child-safety-and-safeguarding-compliance',
    courseTitle: 'Safeguarding, Privacy & Professional Conduct',
    tutorName: 'Dr. Elena Rostova',
    tutorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    certificateCode: 'SAB-SAFE-98214',
    badgeTitle: 'Safeguarding & Ethics Verified',
    badgeIcon: 'ShieldCheck',
    scoreAchieved: 100,
    issuedAt: '2026-08-20T10:00:00Z',
    isValid: true
  }
];
