const fs = require("fs").promises;

const OLLAMA_URL = "http://localhost:11434/api";
const EMBED_MODEL = "nomic-embed-text";

// split text into chunks
function chunkText(text, size = 1000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

// embed function
async function embed(text) {
  const res = await fetch(`${OLLAMA_URL}/embeddings`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      model: EMBED_MODEL,
      prompt: text
    })
  });

  const data = await res.json();
  return data.embedding;
}

async function buildVectorDB() {
  try {
    console.log("📥 Reading context file...");

    // 👉 THIS IS YOUR CONTEXT FILE
    const contextText = await fs.readFile("novels/shadow slave/audiobook/Capitulo-0043/Capitulo-0043.txt", "utf-8");

    const chunks = chunkText(contextText, 1000);

    console.log(`🔪 Split into ${chunks.length} chunks`);

    const vectorDB = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(`🧠 Embedding chunk ${i + 1}/${chunks.length}`);

      const embedding = await embed(chunks[i]);

      // ✅ validation (VERY important)
      if (!embedding || embedding.length === 0) {
        console.warn("⚠️ Skipping empty embedding");
        continue;
      }

      vectorDB.push({
        text: chunks[i],
        embedding
      });
    }

    await fs.writeFile(
      "novels/shadow slave/audiobook/data/vectorDB.json",
      JSON.stringify(vectorDB, null, 2)
    );

    console.log("✅ vectorDB.json created successfully!");
    console.log(`Stored ${vectorDB.length} chunks`);

  } catch (err) {
    console.error("❌ Failed to build vector DB:", err);
  }
}

buildVectorDB();