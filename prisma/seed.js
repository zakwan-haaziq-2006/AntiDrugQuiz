const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const officialQuestions = [
  {
    order: 1,
    questionText: "What is the main goal of an Anti-Drug Club?",
    optionA: "To punish students who use drugs",
    optionB: "To promote awareness and prevention of substance abuse",
    optionC: "To sell health products",
    optionD: "To report students to the police",
    correctAnswer: "B",
  },
  {
    order: 2,
    questionText: "What does \"substance abuse\" mean?",
    optionA: "Using medicine as prescribed by a doctor",
    optionB: "The harmful or excessive use of drugs or alcohol",
    optionC: "Eating a balanced diet",
    optionD: "Exercising regularly",
    correctAnswer: "B",
  },
  {
    order: 3,
    questionText: "Which organ is most commonly damaged by long-term alcohol use?",
    optionA: "Liver",
    optionB: "Skin",
    optionC: "Ear",
    optionD: "Hair follicles",
    correctAnswer: "A",
  },
  {
    order: 4,
    questionText: "Nicotine is mainly found in which substance?",
    optionA: "Coffee",
    optionB: "Tobacco",
    optionC: "Chocolate",
    optionD: "Sugar",
    correctAnswer: "B",
  },
  {
    order: 5,
    questionText: "What is a \"healthy coping mechanism\" for stress?",
    optionA: "Smoking a cigarette",
    optionB: "Exercising or talking to a trusted friend",
    optionC: "Ignoring the problem completely",
    optionD: "Isolating from everyone",
    correctAnswer: "B",
  },
  {
    order: 6,
    questionText: "Which of these is NOT a good way to say no to drugs?",
    optionA: "Walking away",
    optionB: "Giving a firm \"no thank you\"",
    optionC: "Trying it just once to fit in",
    optionD: "Suggesting a different activity",
    correctAnswer: "C",
  },
  {
    order: 7,
    questionText: "What does \"prevention\" mean in the context of drug abuse?",
    optionA: "Treating addiction after it happens",
    optionB: "Taking steps to stop drug use before it starts",
    optionC: "Selling drugs safely",
    optionD: "Ignoring the issue",
    correctAnswer: "B",
  },
  {
    order: 8,
    questionText: "Which of the following is a legal drug for adults in many countries?",
    optionA: "Heroin",
    optionB: "Alcohol",
    optionC: "Cocaine",
    optionD: "Methamphetamine",
    correctAnswer: "B",
  },
  {
    order: 9,
    questionText: "What is a common reason young people try drugs?",
    optionA: "Curiosity or peer pressure",
    optionB: "Doctor's recommendation",
    optionC: "School requirement",
    optionD: "Government mandate",
    correctAnswer: "A",
  },
  {
    order: 10,
    questionText: "Which activity can help reduce stress without using substances?",
    optionA: "Deep breathing or meditation",
    optionB: "Binge drinking",
    optionC: "Skipping meals",
    optionD: "Avoiding sleep",
    correctAnswer: "A",
  },
  {
    order: 11,
    questionText: "What does \"addiction\" mean?",
    optionA: "A temporary dislike for something",
    optionB: "A compulsive need to use a substance despite harm",
    optionC: "A mild preference for a food",
    optionD: "A skill learned in school",
    correctAnswer: "B",
  },
  {
    order: 12,
    questionText: "Which of these is an example of positive peer influence?",
    optionA: "Encouraging a friend to skip school",
    optionB: "Encouraging a friend to join a sports team",
    optionC: "Pressuring a friend to smoke",
    optionD: "Daring a friend to drink alcohol",
    correctAnswer: "B",
  },
  {
    order: 13,
    questionText: "What should you do if a friend offers you drugs?",
    optionA: "Accept to avoid conflict",
    optionB: "Politely refuse and walk away",
    optionC: "Try it secretly",
    optionD: "Pressure them back",
    correctAnswer: "B",
  },
  {
    order: 14,
    questionText: "Which of the following best describes \"peer pressure\"?",
    optionA: "Pressure from parents only",
    optionB: "Influence from friends or peers to act a certain way",
    optionC: "Pressure from teachers",
    optionD: "Pressure from advertisements only",
    correctAnswer: "B",
  },
  {
    order: 15,
    questionText: "Which substance is commonly found in energy drinks and coffee?",
    optionA: "Caffeine",
    optionB: "Nicotine",
    optionC: "Alcohol",
    optionD: "Morphine",
    correctAnswer: "A",
  },
  {
    order: 16,
    questionText: "What is the best way to handle stress in a healthy way?",
    optionA: "Talking to someone you trust",
    optionB: "Using drugs",
    optionC: "Bottling up emotions",
    optionD: "Avoiding all responsibilities",
    correctAnswer: "A",
  },
  {
    order: 17,
    questionText: "Which of these is a sign of a healthy lifestyle?",
    optionA: "Regular exercise and balanced diet",
    optionB: "Frequent substance use",
    optionC: "Skipping sleep regularly",
    optionD: "Avoiding all social interaction",
    correctAnswer: "A",
  },
  {
    order: 18,
    questionText: "What does \"say no to drugs\" campaigns aim to promote?",
    optionA: "Drug use in moderation",
    optionB: "Complete avoidance of illegal drug use",
    optionC: "Selling drugs responsibly",
    optionD: "Ignoring the topic",
    correctAnswer: "B",
  },
  {
    order: 19,
    questionText: "Which of the following is an illegal drug in most countries?",
    optionA: "Aspirin",
    optionB: "Heroin",
    optionC: "Vitamin C",
    optionD: "Paracetamol",
    correctAnswer: "B",
  },
  {
    order: 20,
    questionText: "What is a good alternative to relieve boredom instead of using substances?",
    optionA: "Trying drugs for excitement",
    optionB: "Pursuing a hobby or sport",
    optionC: "Sitting alone doing nothing",
    optionD: "Avoiding friends",
    correctAnswer: "B",
  },
  {
    order: 21,
    questionText: "Which of the following best describes a physiological effect of long-term drug abuse?",
    optionA: "Improved organ function",
    optionB: "Damage to vital organs such as the liver, heart, or brain",
    optionC: "Increased lifespan",
    optionD: "Enhanced immune system",
    correctAnswer: "B",
  },
  {
    order: 22,
    questionText: "What is a common psychological warning sign of substance abuse?",
    optionA: "Improved academic performance",
    optionB: "Sudden mood swings, withdrawal from family, or loss of interest in activities",
    optionC: "Increased motivation",
    optionD: "Better sleep patterns",
    correctAnswer: "B",
  },
  {
    order: 23,
    questionText: "Which strategy is most effective in resisting peer pressure to use drugs?",
    optionA: "Avoiding eye contact and staying silent",
    optionB: "Practicing assertive refusal skills in advance",
    optionC: "Waiting to see what others decide",
    optionD: "Agreeing to avoid confrontation",
    correctAnswer: "B",
  },
  {
    order: 24,
    questionText: "What is a basic harm reduction concept related to substance abuse?",
    optionA: "Encouraging heavier use for tolerance",
    optionB: "Reducing risks associated with substance use, such as avoiding mixing substances",
    optionC: "Ignoring safety altogether",
    optionD: "Promoting drug use in public",
    correctAnswer: "B",
  },
  {
    order: 25,
    questionText: "Which of the following is an early warning sign that someone may be struggling with substance abuse?",
    optionA: "Consistent grades and attendance",
    optionB: "Sudden changes in friend groups, secrecy, and declining performance",
    optionC: "Increased participation in family activities",
    optionD: "Stable sleeping and eating habits",
    correctAnswer: "B",
  },
];

async function main() {
  console.log('Seeding Anti-Drug Club Official Quiz Database...');

  // Create Admin
  const adminPassword = await bcrypt.hash('admin@login.123', 10);
  await prisma.admin.upsert({
    where: { username: 'admin_login' },
    update: { password: adminPassword },
    create: {
      username: 'admin_login',
      password: adminPassword,
    },
  });
  console.log('Admin account created / verified (admin_login).');

  // Get or Create Default Quiz
  let quiz = await prisma.quiz.findFirst();
  if (!quiz) {
    quiz = await prisma.quiz.create({
      data: {
        title: 'Anti-Drug Club Quiz Competition',
        status: 'UPCOMING',
        durationSec: 1800, // 30 minutes
      },
    });
  }

  // Clear existing questions for fresh seed
  await prisma.question.deleteMany({ where: { quizId: quiz.id } });

  // Create 25 official questions
  for (const q of officialQuestions) {
    await prisma.question.create({
      data: {
        quizId: quiz.id,
        order: q.order,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer,
      },
    });
  }

  console.log(`Successfully seeded ${officialQuestions.length} official questions into the database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
