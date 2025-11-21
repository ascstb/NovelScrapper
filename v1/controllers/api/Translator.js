"use strict";
const fs = require("fs");
const axios = require("axios");

const translate = async (novelName, fileName) => {
    let rootPath = `novels`;
    let novelPath = `${rootPath}/${novelName}`;
    let englishPath = `${novelPath}/english/${fileName}`;
    let spanishPath = `${novelPath}/spanish/${fileName}`;

    console.log(`Translator.js: translate: ${englishPath}`);

    let result = "";
    const fileContent = fs.readFileSync(englishPath).toString();
    let paragraphs = fileContent.split("\n");
    let count = 0
    let progress = 0

    for await (const paragraph of paragraphs) {
        let p = paragraph.trim();
        if (p.length == 0) {
            count++;
            continue;
        }

        const baseUrl = "http://localhost:11434/api/generate";
        const payload = {
            model: "gemma3:12b",
            prompt: `Translate the following English text to Mexican Spanish (es-MX). Output only the translation, without any additional text or explanations.\n\nText:\n${paragraph}`,
            stream: false,
        };

        let tempResponse = await axios.post(baseUrl, payload);

        let tempResult = tempResponse.data.response;
        result += tempResult + "\n";

        count++;
        progress = (count / paragraphs.length) * 100;
        console.log(`${(new Date()).toISOString()} - Translator.js: translate: ${englishPath}, progress: ${progress.toFixed(2)} %`)
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

const translateChapter = async (req, res, next) => {
    try {
        let { novelName } = req.body;
        let { fileName } = req.body;
        if (!fileName) {
            return res.status(400).json({ message: "fileName param is required" });
        }

        const translated = translate(novelName, fileName);

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
            let translateResult = await translate(novelName, chapter);
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
