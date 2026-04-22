"use strict";
//const fs = require("fs");
const fs = require("fs/promises");
const axios = require("axios");

const translate = async (novelName, fileName) => {
    let rootPath = `novels`;
    let novelPath = `${rootPath}/${novelName}`;
    let englishPath = `${novelPath}/english/${fileName}`;
    let spanishPath = `${novelPath}/spanish/${fileName}`;

    console.log(`${new Date().toLocaleString("es-MX")} - Translator.js: translate: ${englishPath}`);

    let result = "";
    const fileContent = fs.readFileSync(englishPath).toString();
    let paragraphs = fileContent.split("\n");
    let count = 0
    let progress = 0
    let contextParagraph = ""

    for await (const paragraph of paragraphs) {
        let p = paragraph.trim();
        if (p.length == 0) {
            count++;
            continue;
        }

        const apiUrl = "http://localhost:11434/api/generate";
        const payload = {
            model: "gemma3:12b",
            prompt: `Translate the following English text to Mexican Spanish (es-MX). Output only the translation, without any additional text or explanations. context: ${contextParagraph} \n\nText to Translate:\n${paragraph}`,
            stream: false,
        };

        let tempResponse = await axios.post(baseUrl, payload);

        let tempResult = tempResponse.data.response;
        result += tempResult + "\n";

        contextParagraph = paragraph;
        count++;
        progress = (count / paragraphs.length) * 100;
        console.log(`${new Date().toLocaleString()} - Translator.js: translate: ${englishPath}, progress: ${progress.toFixed(2)} %`)
    }

    var onTranslateError = function (err) {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err });
        }
    };

    fs.writeFile(spanishPath, result, "utf8", onTranslateError);

    return true;
}

const baseUrl = "http://localhost:11434/api/generate";
const MAX_CONCURRENT = 5; // controla carga (ajústalo según tu PC)

const translateParagraph = async (paragraph, context) => {
    const payload = {
        model: "gemma3:12b",
        prompt: `Translate the following English text to Mexican Spanish (es-MX). Output only the translation.\nContext: ${context}\n\nText:\n${paragraph}`,
        stream: false,
    };

    const { data } = await axios.post(baseUrl, payload);
    return data.response.trim();
};

const translateV2 = async (novelName, fileName) => {
    const rootPath = `novels`;
    const novelPath = `${rootPath}/${novelName}`;
    const englishPath = `${novelPath}/english/${fileName}`;
    const spanishPath = `${novelPath}/spanish/${fileName}`;

    console.log(`[${new Date().toLocaleString("es-MX")}] Translating: ${englishPath}`);

    const fileContent = await fs.readFile(englishPath, "utf8");
    const paragraphs = fileContent.split("\n").filter(p => p.trim().length > 0);

    let results = [];
    let context = "";

    // 🔥 procesamiento en batches
    for (let i = 0; i < paragraphs.length; i += MAX_CONCURRENT) {
        const batch = paragraphs.slice(i, i + MAX_CONCURRENT);

        const promises = batch.map(p => translateParagraph(p, context));

        const batchResults = await Promise.all(promises);

        results.push(...batchResults);

        // actualizar contexto con el último del batch
        context = batch[batch.length - 1];

        const progress = ((i + batch.length) / paragraphs.length) * 100;

        console.log(
            `[${new Date().toLocaleString("es-MX")}] Progress: ${progress.toFixed(2)}%`
        );
    }

    await fs.writeFile(spanishPath, results.join("\n"), "utf8");

    return true;
};

const translateV3 = async (novelName, fileName) => {
    const rootPath = `novels`;
    const novelPath = `${rootPath}/${novelName}`;
    const englishPath = `${novelPath}/english/${fileName}`;
    const spanishPath = `${novelPath}/spanish/${fileName}`;

    console.log(`[${new Date().toLocaleString("es-MX")}] Translating: ${englishPath}`);

    const fileContent = await fs.readFile(englishPath, "utf8");

    // split paragraphs
    const paragraphs = fileContent
        .split("\n")
        .filter(p => p.trim().length > 0);

    // 🔥 agrupar de 2 en 2
    const paragraphPairs = [];
    for (let i = 0; i < paragraphs.length; i += 2) {
        paragraphPairs.push(paragraphs.slice(i, i + 2).join("\n"));
    }

    let results = [];
    let context = "";

    // 🔥 procesamiento en batches
    for (let i = 0; i < paragraphPairs.length; i += MAX_CONCURRENT) {
        const batch = paragraphPairs.slice(i, i + MAX_CONCURRENT);

        const promises = batch.map(p => translateParagraph(p, context));

        const batchResults = await Promise.all(promises);

        results.push(...batchResults);

        // actualizar contexto con el último del batch (puedes ajustar esto)
        context = batch[batch.length - 1];

        const progress = ((i + batch.length) / paragraphPairs.length) * 100;

        console.log(
            `[${new Date().toLocaleString("es-MX")}] Progress: ${progress.toFixed(2)}%`
        );
    }

    await fs.writeFile(spanishPath, results.join("\n"), "utf8");

    return true;
};

const translateChapter = async (req, res, next) => {
    try {
        let { novelName } = req.body;
        let { fileName } = req.body;
        if (!fileName) {
            return res.status(400).json({ message: "fileName param is required" });
        }

        //const translated = translate(novelName, fileName);
        const translated = translateV3(novelName, fileName);

        return res.status(200).json({ result: "process done" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: err });
    }
};

const translateNovel = async (req, res, next) => {
    try {
        let { novelName, chaptersList } = req.body;

        if (!novelName) {
            return res.status(400).json({ message: "novelName param is required" });
        }

        if (!chaptersList || chaptersList.length == 0) {
            return res
                .status(400)
                .json({ message: "chaptersList param is required" });
        }

        console.log(`translateNovel: ${novelName}, chapterList: `, chaptersList);

        let result = [];

        for (const chapter of chaptersList) {
            let translateResult = await translateV2(novelName, chapter);
            result.push({ chapter, translateResult });
        }

        return res.status(200).json(result);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: err });
    }
};

module.exports = {
    translateChapter,
    translateNovel,
};
