"use strict";
const fs = require("fs");
const axios = require("axios");

const translateChapter = async (req, res, next) => {
  try {
    let { filePath } = req.query;
    if (!filePath) {
      return res
        .status(400)
        .json({ message: "filePath query param is required" });
    }

    console.log(`Translator.js: translateChapter: ${filePath}`);

    let result = "";
    const fileContent = fs.readFileSync(path).toString();
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

    return res.status(200).json(result);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err });
  }
};

module.exports = {
  translateChapter,
};
