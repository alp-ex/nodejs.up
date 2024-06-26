import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const RESOURCES_FILE_PATH = path.join(__dirname, "resources.md");
const SKILLS_FILE_PATH = path.join(__dirname, "skills.json");
const SCORE_FILE_PATH = path.join(__dirname, "skill_score.json");

const debug = process.argv.includes("--debug");

if (!OPENAI_API_KEY) {
  console.error("Please set your OPENAI_API_KEY in the environment variables.");
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function debugLog(message) {
  if (debug) {
    console.log(message);
  }
}

async function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function fetchAPI(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        resolve(JSON.parse(data));
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

function startLoading(message) {
  let loadingDots = "";
  const loadingMessage = message;
  process.stdout.write(loadingMessage);

  const loadingInterval = setInterval(() => {
    if (loadingDots.length < 3) {
      loadingDots += ".";
    } else {
      loadingDots = "";
    }
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(loadingMessage + loadingDots);
  }, 500);

  return () => {
    clearInterval(loadingInterval);
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
  };
}

// Read the skill score from a file
function readSkillScore() {
  if (fs.existsSync(SCORE_FILE_PATH)) {
    const data = fs.readFileSync(SCORE_FILE_PATH);
    debugLog("Skill score loaded: " + data);
    return JSON.parse(data);
  }
  debugLog("No existing skill score found.");
  return {};
}

// Write the skill score to a file
function writeSkillScore(score) {
  fs.writeFileSync(SCORE_FILE_PATH, JSON.stringify(score, null, 2));
  debugLog("Skill score saved: " + JSON.stringify(score, null, 2));
}

// Read the resources file
function readResources() {
  if (fs.existsSync(RESOURCES_FILE_PATH)) {
    const data = fs.readFileSync(RESOURCES_FILE_PATH, "utf8");
    debugLog("Resources content loaded.");
    return data;
  }
  console.error("resources.md file not found.");
  process.exit(1);
}

// Read or initialize the skills file
function readOrInitializeSkills() {
  if (fs.existsSync(SKILLS_FILE_PATH)) {
    const data = JSON.parse(fs.readFileSync(SKILLS_FILE_PATH));
    debugLog("Skills loaded: " + JSON.stringify(data));
    return data;
  }
  debugLog("No existing skills found.");
  return {};
}

// Write skills to a file
function writeSkills(skills) {
  fs.writeFileSync(SKILLS_FILE_PATH, JSON.stringify(skills, null, 2));
  debugLog("Skills saved: " + JSON.stringify(skills, null, 2));
}

// Generate skills based on the resources content
async function generateSkills(resourcesContent) {
  const prompt = `Based on the following content, suggest a list of skills that can be mastered. Format the response as a JSON array.
Content:
${resourcesContent}

Example response:
[
  "Skill 1",
  "Skill 2",
  "Skill 3"
]`;

  debugLog("Generating skills...");

  const stopLoading = startLoading("Updating skills");
  const data = await fetchAPI("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      max_tokens: 1500,
    }),
  });
  stopLoading();

  debugLog("Skills generated: " + data.choices[0].message.content.trim());
  return JSON.parse(data.choices[0].message.content.trim());
}

// Generate flashcards based on the concepts
async function generateFlashcards(concepts) {
  const prompt = `Generate 10 flashcards for learning Node.js. Use the following concepts and their mastery levels to adjust the difficulty of the questions: ${JSON.stringify(concepts)}. Each flashcard should have a question and the associated skills. Format them as a JSON array of objects with "question" and "skills" fields.

Example response:
[
  {
    "question": "What is Node.js?",
    "skills": ["Node.js Basics"]
  },
  {
    "question": "Explain the event loop in Node.js.",
    "skills": ["Node.js Event Loop"]
  }
]`;

  debugLog("Generating flashcards...");

  const stopLoading = startLoading("Generating flashcards");
  const data = await fetchAPI("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      max_tokens: 1500,
    }),
  });
  stopLoading();

  debugLog("Flashcards generated: " + data.choices[0].message.content.trim());
  return JSON.parse(data.choices[0].message.content.trim());
}

async function getFeedback(userAnswer, question, skills) {
  const prompt = `Evaluate the user's answer to the following question and provide a JSON object with the following fields: "feedback" (string), "isCorrect" (boolean), and "correctAnswer" (string). Additionally, confirm the associated skills.
Question: "${question}"
User's answer: "${userAnswer}"
Skills: ${JSON.stringify(skills)}
Respond in JSON format.

Example response:
{
  "feedback": "Good job! You correctly identified the main purpose of Node.js.",
  "isCorrect": true,
  "correctAnswer": "Node.js is a JavaScript runtime built on Chrome's V8 engine.",
  "skills": ["Node.js Basics"]
}`;

  debugLog("Getting feedback...");

  const stopLoading = startLoading("Getting feedback");
  const data = await fetchAPI("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      max_tokens: 150,
    }),
  });
  stopLoading();

  debugLog("Feedback received: " + data.choices[0].message.content.trim());
  return JSON.parse(data.choices[0].message.content.trim());
}

async function runFlashcardSession() {
  debugLog("Reading skill score...");
  let skillScore = readSkillScore();
  debugLog("Reading resources content...");
  const resourcesContent = readResources();
  debugLog("Reading or initializing skills...");
  let skills = readOrInitializeSkills();

  if (Object.keys(skills).length === 0) {
    debugLog("Generating new skills...");
    skills = await generateSkills(resourcesContent);
    writeSkills(skills);
  }

  const concepts =
    Object.keys(skillScore).length > 0
      ? skillScore
      : skills.reduce((acc, skill) => ({ ...acc, [skill]: 1 }), {});
  debugLog("Generating flashcards...");
  const flashcards = await generateFlashcards(concepts);
  let queue = [...flashcards];
  let correctAnswers = 0;
  const totalFlashcards = queue.length;

  while (queue.length > 0) {
    const flashcard = queue.shift();
    console.log(
      `Flashcard ${correctAnswers + 1}/${totalFlashcards}: ${flashcard.question}`,
    );
    const userAnswer = await askQuestion("Your answer: ");

    const feedbackObject = await getFeedback(
      userAnswer,
      flashcard.question,
      flashcard.skills,
    );
    console.log(`Feedback: ${feedbackObject.feedback}`);
    console.log(`Correct Answer: ${feedbackObject.correctAnswer}`);

    if (feedbackObject.isCorrect) {
      correctAnswers++;
      flashcard.skills.forEach((concept) => {
        if (!skillScore[concept]) {
          skillScore[concept] = 0;
        }
        skillScore[concept]++;
      });
    } else {
      queue.push(flashcard);
    }

    // Write updated skill score to file
    writeSkillScore(skillScore);
  }

  console.log(
    `You have completed the flashcard session with ${correctAnswers}/${totalFlashcards} correct answers.`,
  );
  rl.close();

  // Write final skill score to file
  writeSkillScore(skillScore);
}

runFlashcardSession();
