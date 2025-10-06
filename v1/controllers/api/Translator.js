"use strict";
const fs = require("fs");
const axios = require("axios");

const translateChapter = async (req, res, next) => {
    try {
        let { novelName } = req.body;
        let { fileName } = req.body;
        if (!fileName) {
            return res.status(400).json({ message: "fileName param is required" });
        }

        let rootPath = `novels/`;
        let novelPath = `${rootPath}/${novelName}`;
        let englishPath = `${novelPath}/english/${fileName}`;
        let spanishPath = `${novelPath}/spanish/${fileName}`;

        console.log(`Translator.js: translateChapter: ${englishPath}`);

        let result = "";
        const fileContent = fs.readFileSync(englishPath).toString();
        let paragraphs = fileContent.split("\n");

        for await (const paragraph of paragraphs) {
            let p = paragraph.trim();
            if (p.length == 0) {
                continue;
            }

            const baseUrl = "http://localhost:11434/api/generate";
            const payload = {
                model: "aya-expanse",
                prompt: `Translate the following English text to Mexican Spanish (es-MX). Output only the translation, without any additional text or explanations.\n\nText:\n${paragraph}`,
                stream: false,
            };

            let tempResponse = await axios.post(baseUrl, payload);
            let tempResult = tempResponse.data.response;
            result += tempResult + "\n";
        }

        var onTranslateError = function (err) {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: err });
            }
        }

        fs.writeFile(spanishPath, result, "utf8", onTranslateError);

        return res.status(200).json({ result: "process done" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: err });
    }
};

module.exports = {
    translateChapter,
};
