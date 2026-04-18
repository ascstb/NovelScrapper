"use strict";

//import fetch from "node-fetch";
//const fetch = require("node-fetch");
const fs = require("fs").promises;
const { existsSync } = require('fs');
const path = require("path");
const axios = require("axios");

const { VoicesModel } = require("../../../models")

const femaleVoices = new Set([
    "Elena", "Sofia", "Catalina", "Salome", "Ximena", "Maria", "Belkys", "Ramona",
    "Andrea", "Lorena", "Teresa", "Marta", "Karla", "Dalia", "Yolanda", "Margarita",
    "Tania", "Camila", "Karina", "Elvira", "Paloma", "Valentina", "Paola"
]);

const getSamples = async (req, res) => {
    try {
        let rootPath = "samples/rvc";
        const files = await fs.readdir(rootPath);

        const folderEntries = await fs.readdir("C:\\Project\\Applio\\logs", { withFileTypes: true });

        const groups = [...new Set(
            folderEntries
                .filter(entry => entry.isDirectory())
                .map(entry => entry.name.split("_")[0])
                .map(g => g.replace(/([a-z])([A-Z])/g, "$1 $2"))
        )].sort();

        const result = [];
        files
            .filter(f => f.endsWith(".mp3"))
            .forEach(file => {
                const filePath = path.join(rootPath, file);
                const name = file.replace(".mp3", "");
                const [voicePart, rest] = name.split("_");
                const [language, country, voiceRaw] = voicePart.split("-");
                const voiceName = voiceRaw.replace("Neural", "");
                //const [group, ...modelParts] = rest.split(" ");
                const groups = ["My Little Pony", "Kung Fu Panda"];

                let group = groups.find(g => rest.toLocaleLowerCase().startsWith(g.toLocaleLowerCase())) ?? "";

                if (!group) {
                    group = rest.split(" ")[0];
                }

                const model = group
                    ? rest.slice(group.length).trim()
                    : rest;

                const gender = femaleVoices.has(voiceName) ? "female" : "male";

                result.push({
                    language,
                    country,
                    group,
                    voiceName,
                    gender,
                    model,
                    filePath,
                    minAge: -1,
                    maxAge: -1,
                    pitch: "",
                    timbre: "",
                    texture: "",
                    energy: "",
                    speed: "",
                    temperament: ""
                });
            });

        res.status(200).json(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to retrieve samples" });
    }
};

const getNovels = async (req, res) => {
    try {
        let rootPath = "novels";

        const entries = await fs.readdir(rootPath, { withFileTypes: true });

        const folders = entries
            .filter(entry => entry.isDirectory())
            .map(entry => ({
                name: entry.name,
                path: path.join(rootPath, entry.name)
            }));

        res.json(folders);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to retrieve novels" });
    }
};

const getCharacters = async (req, res) => {
    try {
        let rootPath = "novels";
        const entries = await fs.readdir(rootPath, { withFileTypes: true });

        const novelsData = await Promise.all(
            entries
                .filter(entry => entry.isDirectory())
                .map(async (entry) => {
                    const novelName = entry.name;
                    const jsonPath = path.join(rootPath, novelName, "audiobook", "data", "characters.json");

                    let characters = [];

                    if (existsSync(jsonPath)) {
                        try {
                            const data = await fs.readFile(jsonPath, 'utf8');
                            characters = JSON.parse(data);
                        } catch (parseErr) {
                            console.error(`Could not read the Characters JSON in ${novelName}: `, parseErr);
                        }
                    }

                    return {
                        novelName: novelName,
                        characters: characters
                    };
                })
        );

        res.json(novelsData);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to retrieve novels" });
    }
};

const updateCharacters = async (req, res) => {
    try {
        let rootPath = "novels";
        let character = req.body;
        let novelName = character.novelName;

        const directoryPath = path.join(rootPath, novelName, "audiobook", "data");
        const jsonPath = path.join(directoryPath, "characters.json");
        if (!existsSync(directoryPath)) {
            await fs.mkdir(directoryPath, { recursive: true });
        }

        let characters = [];

        if (existsSync(jsonPath)) {
            const fileData = await fs.readFile(jsonPath, 'utf8');
            characters = JSON.parse(fileData);

            const existingIndex = characters.findIndex(c =>
                c.name.toLowerCase() === character.name.toLowerCase()
            );

            if (existingIndex !== -1) {
                characters[existingIndex] = { ...characters[existingIndex], ...character };
            } else {
                characters.push(character);
            }
        } else {
            characters.push(character);
        }

        await fs.writeFile(jsonPath, JSON.stringify(characters, null, 4), 'utf8');

        res.json({ success: true, message: "updated correctly" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to update characters" });
    }
}

const getVoices = async (req, res) => {
    try {
        const voices = await VoicesModel.find({}, {});
        res.status(200).json(voices);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to retrieve voices." });
    }
}

const assignCharacters = async (req, res) => {
    let { novel, chapter } = req.body;

    //#region Validations
    if (!novel)
        return res.status(400).json({ error: "novel param is required" });

    if (!chapter)
        return res.status(400).json({ error: "chapter param is required" });
    //#endregion

    console.log(`${new Date().toLocaleString()} - assignCharacters: ${novel}, ch: ${chapter}`);
    let inputText = await fs.readFile(`novels/${novel}/audiobook/${chapter}/${chapter}.txt`, "utf-8");
    inputText = inputText.replace(/Ca\.s\.sie/g, "Cassia")
        .replace(/Ca\.s\.sia/g, "Cassia")
        .replace(/Cassie/g, "Cassia")
        .replace(/Nephis/g, "Nefis")
        .replace(/Changing Star/g, "Estrella Cambiante")
        .replace(/<br>/g, "")
        .replace(/&nbsp;/g, "")
        .replace(/ReadNovelFull\.me/g, "")
        .replace(/\*\*\*/g, "")
        .replace(/\n\s*\n/g, " ");

    const characters = JSON.parse(
        await fs.readFile(`novels/${novel}/audiobook/data/characters.json`, "utf-8")
    );

    const characterList = characters
        .filter(c => c.novelName === novel)
        .map(c => `- ${c.name}`)
        .join("\n");

    let result = "";
    let paragraphs = inputText.split("\n");
    let count = 0;
    let progress = 0;
    let contextParagraph = ""
    let contextLines = 3

    for await (const paragraph of paragraphs) {
        let p = paragraph.trim();
        if (p.length == 0) {
            count++;
            continue;
        }

        const prompt = `
SYSTEM:
You are a dialogue classifier.

TASK:
Identify the speaker for each line of dialogue.

STRICT RULES:
- DO NOT rewrite or modify the text
- DO NOT paraphrase
- DO NOT translate
- DO NOT add or remove words
- You MUST return the text EXACTLY as given

CHARACTERS:
${characterList}

RULES:
- Use ONLY names from CHARACTERS
- If the speaker is unclear → use "Narrador"
- Do NOT invent characters
- Prefer consistency with context

CONTEXT (previous lines for reference):
${contextParagraph}

INPUT:
${paragraph}

OUTPUT FORMAT (JSON ONLY):
[
  { "character": "CharacterName", "text": "exact line here" }
]

IMPORTANT:
- Return ONLY valid JSON
- Each line must appear exactly once
- "text" must be identical to input
`;

        const apiUrl = "http://localhost:11434/api/generate";
        const payload = {
            model: "gemma3:12b",
            prompt: prompt,
            stream: false,
        };

        let tempResponse = await axios.post(apiUrl, payload);

        let tempResult = tempResponse.data.response;
        result += tempResult + "\n";


        if (contextLines >= 3) {
            contextParagraph = paragraph;
            contextLines = 0;
        } else {
            contextLines++;
        }
        count++;
        progress = (count / paragraphs.length) * 100;
        console.log(`${new Date().toLocaleString()} - Translator.js: translate: ${novel}: ${chapter}, progress: ${progress.toFixed(2)} %`)
    }

    var onCharacterError = function (err) {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err });
        }
    };

    fs.writeFile(`novels/${novel}/audiobook/${chapter}/${chapter}_final.txt`, result, "utf8", onCharacterError);

    return true;
};


module.exports = {
    getSamples,
    getNovels,
    getCharacters,
    updateCharacters,
    getVoices,
    assignCharacters
}