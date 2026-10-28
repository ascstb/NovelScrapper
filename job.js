const fetch = global.fetch; // Node 18+

const API_URL = "http://localhost:3700/api/v1/generateChapter";

const NOVEL = "shadow slave";
const START = 96;
const END = 98;

let current = START;

// format chapter number → Capitulo-0055
function formatChapter(num) {
  return `Capitulo-${String(num).padStart(4, "0")}`;
}

async function callAPI(chapter) {
  try {
    console.log(`[${new Date().toISOString()}] Processing ${chapter}`);

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        novel: NOVEL,
        chapter
      })
    });

    const data = await res.json();

    console.log(`[${new Date().toISOString()}] ✅ Done: ${chapter}`);
    return data;

  } catch (err) {
    console.error(`❌ Error on ${chapter}:`, err.message);
    console.log(err);
  }
}

async function processNext() {
  if (current > END) {
    console.log(`[${new Date().toISOString()}] 🎉 All chapters processed`);
    process.exit(0); // success
    return;
  }

  const chapter = formatChapter(current);

  await callAPI(chapter);

  current++;
}

// run every 25 minutes
setInterval(processNext, 25 * 60 * 1000);

// run immediately on start
processNext();