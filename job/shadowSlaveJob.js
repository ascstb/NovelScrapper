"use strict";
const fs = require("fs/promises");
const fsSync = require("fs");
const path = require("path");
const axios = require("axios");
const puppeteerExtra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const {
    S3Client,
    PutObjectCommand,
    ListObjectsV2Command
} = require("@aws-sdk/client-s3");

let Client;
(async () => {
    const gradio = await import("@gradio/client");
    Client = gradio.Client;
})();

const MINIMUM_CHAPTER = 100;
const MAXIMUM_CHAPTER = 115;

const baseUrl = "http://localhost:11434/api/generate";
const spaceUrl = "http://127.0.0.1:6969";

const novelName = "mother of learning";
const voiceModel = "logs\\Generico_CristinaHernandez\\Generico_CristinaHernandez.pth"
const voiceModelIndex = "logs\\Generico_CristinaHernandez\\added_IVF181_Flat_nprobe_1_Cristina-Hernandez_v2.index"
const ttsVoice = "es-MX-DaliaNeural"

const ONE_HOUR = 60 * 60 * 1000;

const fileExists = async (filePath) => {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
};

//#region Online Chapters
const getChapterListFromNovelbin = async (novelName) => {
    let url = `https://novelbin.com/b/${novelName.replace(/ /g, "-")}`;
    console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: getChapterListFromNovelbin: ${novelName}, url: ${url}`);
    let rootPath = `novels`;
    let novelPath = `${rootPath}/${novelName}`;
    let englishPath = `${novelPath}/english`;
    let spanishPath = `${novelPath}/spanish`;
    let ttsPath = `${spanishPath}/tts`
    let rvcPath = `${spanishPath}/rvc`

    puppeteerExtra.use(StealthPlugin());

    const browser = await puppeteerExtra.launch({
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.goto(url, {
        waitUntil: "networkidle2"
    });

    // wait for cloudflare verification to pass
    await page.waitForSelector("#tab-chapters-title", { timeout: 60000 });
    await page.click("#tab-chapters-title");

    // wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));

    let scrapResult = await page.evaluate(() => {
        let chapters = [...document.querySelectorAll(".list-chapter > li > a")];

        return chapters.map((el, index) => {
            const chapterNumber = index + 1;

            const fileName = `Capitulo-${String(chapterNumber).padStart(4, "0")}.txt`;

            return {
                chapterNumber,
                fileName,
                link: el.href
            };
        });
    });

    // Don't forget to close the browser instance to clean up the memory
    await browser.close();

    //#region Result
    const result = await Promise.all(
        scrapResult.map(async (chapter) => {
            const chapterNumber = ("000" + chapter.chapterNumber.toString()).slice(-4);

            const fileName = `Capitulo-${chapterNumber}.txt`;

            const fullEnglishPath = `${englishPath}/${fileName}`;
            const fullSpanishPath = `${spanishPath}/${fileName}`;
            const fullRVCPath = `${rvcPath}/${fileName.replace("txt", "mp3")}`;

            let downloaded = await fileExists(fullEnglishPath);
            let translated = await fileExists(fullSpanishPath);
            let converted = await fileExists(fullRVCPath);

            return {
                chapterNumber: chapter.chapterNumber,
                fileName: fileName,
                title: fileName.replace(".txt", "").replace(/-/g, " "),
                link: chapter.link,
                downloaded: downloaded,
                translated: translated,
                converted: converted
            };
        }));
    //#endregion

    return result;
};

const downloadChapterFromNovelbin = async (novelName, url, chapterNumber) => {
    console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: downloadChapterFromNovelbin: ${url}`);
    let rootPath = `novels`;
    let novelPath = `${rootPath}/${novelName}`;
    let englishPath = `${novelPath}/english`;

    //#region Prepare Browser
    puppeteerExtra.use(StealthPlugin());

    const browser = await puppeteerExtra.launch({
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.goto(url, {
        waitUntil: "networkidle2"
    });
    //#endregion

    await page.waitForSelector("#chr-content", { timeout: 100000 });

    const chapterText = await page.evaluate(() => {
        const title = document.getElementsByClassName("chr-text")[0].innerText;
        const paragraphs = [...document.querySelectorAll("#chr-content p")];

        let text = paragraphs
            .map(p => p.innerText.trim())
            .filter(text => text.length > 0)
            .join("\n\n");

        return `${title}\n\n${text}`;
    });

    // Don't forget to close the browser instance to clean up the memory
    await browser.close();

    let chapterNumberPadded = ("000" + chapterNumber.toString()).slice(-4);
    let fileName = `Capitulo-${chapterNumberPadded}.txt`;
    let fullPath = `${englishPath}/${fileName}`;

    await fs.writeFile(fullPath, chapterText);
};

const getChapterListFromNovelArrow = async (novelName) => {
    try {
        let url = `https://novelarrow.com/novel/${novelName.replace(/ /g, "-")}`;
        console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: getChapterListFromNovelArrow: ${novelName}, url: ${url}`);
        let rootPath = `novels`;
        let novelPath = `${rootPath}/${novelName}`;
        let englishPath = `${novelPath}/english`;
        let spanishPath = `${novelPath}/spanish`;
        let ttsPath = `${spanishPath}/tts`
        let rvcPath = `${spanishPath}/rvc`

        puppeteerExtra.use(StealthPlugin());

        const browser = await puppeteerExtra.launch({
            headless: false,
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        const page = await browser.newPage();

        await page.goto(url, {
            waitUntil: "networkidle2"
        });

        // wait for cloudflare verification to pass
        let chaptersButtonSelector = ".classic-detail-main > :nth-child(2) > div > div > div > :nth-child(2) > div > button";
        await page.waitForSelector(chaptersButtonSelector, { timeout: 60000 });
        await page.click(chaptersButtonSelector);

        // wait 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));

        const scrapResult = await page.evaluate(() => {
            const chapters = [...document.querySelectorAll("a.group")];

            return chapters
                .map((el) => {
                    const title =
                        el.querySelector("span.hidden.sm\\:inline")?.textContent.trim() ??
                        el.querySelector("span.sm\\:hidden")?.textContent.trim();

                    const href = el.href;

                    // Extract chapter number from the URL
                    const match = href.match(/chapter-(\d+)-/);
                    const chapterNumber = match ? Number(match[1]) : null;

                    return {
                        chapterNumber,
                        title,
                        link: href
                    };
                })
                .filter(chapter => chapter.chapterNumber !== null);
        });

        // Don't forget to close the browser instance to clean up the memory
        await browser.close();

        //#region Result
        const result = await Promise.all(
            scrapResult.map(async (chapter) => {
                //console.log(chapter);
                const chapterNumber = ("000" + chapter.chapterNumber.toString()).slice(-4);

                const fileName = `Capitulo-${chapterNumber}.txt`;

                const fullEnglishPath = `${englishPath}/${fileName}`;
                const fullSpanishPath = `${spanishPath}/${fileName}`;
                const fullRVCPath = `${rvcPath}/${fileName.replace("txt", "mp3")}`;

                let downloaded = await fileExists(fullEnglishPath);
                let translated = await fileExists(fullSpanishPath);
                let converted = await fileExists(fullRVCPath);

                return {
                    chapterNumber: chapter.chapterNumber,
                    fileName: fileName,
                    title: fileName.replace(".txt", "").replace(/-/g, " "),
                    link: chapter.link,
                    downloaded: downloaded,
                    translated: translated,
                    converted: converted
                };
            }));
        //#endregion

        return result;
    } catch (err) {
        console.log(`shadowSlaveJob.js_TAG: getChapterListFromNovelArrow: error ${err}`);
    }
    return [];
};

const downloadChapterFromNovelArrow = async (novelName, url, chapterNumber) => {
    console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: downloadChapterFromNovelArrow: ${url}`);
    let rootPath = `novels`;
    let novelPath = `${rootPath}/${novelName}`;
    let englishPath = `${novelPath}/english`;

    //#region Prepare Browser
    puppeteerExtra.use(StealthPlugin());

    const browser = await puppeteerExtra.launch({
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.goto(url, {
        waitUntil: "networkidle2"
    });
    //#endregion

    await page.waitForSelector("article", { timeout: 100000 });

    const chapterText = await page.evaluate(() => {
        const title = document.querySelector("article > h2")?.innerText.trim() ?? "";

        const paragraphs = [
            ...document.querySelectorAll("article > div > p")
        ];

        const text = paragraphs
            .map(p => p.innerText.trim())
            .filter(text => text.length > 0)
            .join("\n\n");

        return `${title}\n\n${text}`;
    });

    // Don't forget to close the browser instance to clean up the memory
    await browser.close();

    let chapterNumberPadded = ("000" + chapterNumber.toString()).slice(-4);
    let fileName = `Capitulo-${chapterNumberPadded}.txt`;
    let fullPath = `${englishPath}/${fileName}`;

    await fs.writeFile(fullPath, chapterText);
};

const getChapterListFromNovelPing = async (novelName) => {
    try {
        //#region Variables
        let url = `https://novelping.com/novel/${novelName.replace(/ /g, "-")}`;
        console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: getChapterListFromNovelPing: ${novelName}, url: ${url}`);
        let rootPath = `novels`;
        let novelPath = `${rootPath}/${novelName}`;
        let englishPath = `${novelPath}/english`;
        let spanishPath = `${novelPath}/spanish`;
        let ttsPath = `${spanishPath}/tts`
        let rvcPath = `${spanishPath}/rvc`
        //#endregion

        //#region Browser Config
        puppeteerExtra.use(StealthPlugin());

        const browser = await puppeteerExtra.launch({
            headless: false,
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        const page = await browser.newPage();

        await page.goto(url, {
            waitUntil: "networkidle2"
        });
        //#endregion

        //#region Show Chapters and wait for cloudflare verification to pass
        let chaptersButtonSelector = "#tab-chapters-title";
        await page.waitForSelector(chaptersButtonSelector, { timeout: 60000 });
        await page.click(chaptersButtonSelector);

        // wait 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));
        //#endregion

        const scrapResult = await page.evaluate(() => {
            const chapters = [...document.querySelectorAll(".list-chapter > li > a")];

            return chapters
                .map((a, index) => {
                    const title = a.getAttribute("title");

                    const href = a.href;

                    // Extract chapter number from the URL
                    //const match = href.match(/Chapter (\d+)-/);
                    //const chapterNumber = match ? Number(match[1]) : null;
                    //const match = title ? title.match(/Chapter\s+(\d+)/i) : null;
                    //const chapterNumber = match ? Number(match[1]) : null;
                    const chapterNumber = index + 1;

                    return {
                        chapterNumber,
                        title,
                        link: href
                    };
                })
                .filter(chapter => chapter.chapterNumber !== null);
        });

        // Don't forget to close the browser instance to clean up the memory
        await browser.close();

        //#region Result
        const result = await Promise.all(
            scrapResult.map(async (chapter) => {
                //console.log(chapter);
                const chapterNumber = ("000" + chapter.chapterNumber.toString()).slice(-4);

                const fileName = `Capitulo-${chapterNumber}.txt`;

                const fullEnglishPath = `${englishPath}/${fileName}`;
                const fullSpanishPath = `${spanishPath}/${fileName}`;
                const fullRVCPath = `${rvcPath}/${fileName.replace("txt", "mp3")}`;

                let downloaded = await fileExists(fullEnglishPath);
                let translated = await fileExists(fullSpanishPath);
                let converted = await fileExists(fullRVCPath);

                return {
                    chapterNumber: chapter.chapterNumber,
                    fileName: fileName,
                    title: fileName.replace(".txt", "").replace(/-/g, " "),
                    link: chapter.link,
                    downloaded: downloaded,
                    translated: translated,
                    converted: converted
                };
            }));
        //#endregion

        return result;
    } catch (err) {
        console.log(`shadowSlaveJob.js_TAG: getChapterListFromNovelPing: error ${err}`);
    }
    return [];
};

const downloadChapterFromNovelPing = async (novelName, url, chapterNumber) => {
    //#region Variables
    console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: downloadChapterFromNovelPing: ${url}`);
    let rootPath = `novels`;
    let novelPath = `${rootPath}/${novelName}`;
    let englishPath = `${novelPath}/english`;
    //#endregion

    //#region Prepare Browser
    puppeteerExtra.use(StealthPlugin());

    const browser = await puppeteerExtra.launch({
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.goto(url, {
        waitUntil: "networkidle2"
    });
    //#endregion

    await page.waitForSelector("#chr-content", { timeout: 100000 });

    const chapterText = await page.evaluate(() => {
        const title = document.querySelector(".chr-title")?.innerText.trim() ?? "";

        const paragraphs = [
            ...document.querySelectorAll("#chr-content > p")
        ];

        const text = paragraphs
            .map(p => p.innerText.trim())
            .filter(text => text.length > 0)
            .join("\n\n");

        return `${title}\n\n${text}`;
    });

    // Don't forget to close the browser instance to clean up the memory
    await browser.close();

    let chapterNumberPadded = ("000" + chapterNumber.toString()).slice(-4);
    let fileName = `Capitulo-${chapterNumberPadded}.txt`;
    let fullPath = `${englishPath}/${fileName}`;

    await fs.writeFile(fullPath, chapterText);
};
//#endregion

//#region Local Processes
const getDownloadedChapters = async (novelName) => {
    let rootPath = `novels`;
    let novelPath = `${rootPath}/${novelName}`;
    let englishPath = `${novelPath}/english`;
    let spanishPath = `${novelPath}/spanish`;
    let ttsPath = `${spanishPath}/tts`
    let rvcPath = `${spanishPath}/rvc`

    //const fileNameList = fs.readdirSync(englishPath).sort();
    // Only get .txt files
    const fileNameList = (await fs.readdir(englishPath))
        .filter(file => path.extname(file).toLowerCase() === ".txt")
        .sort();

    let result = [];
    for (let i = 0; i < fileNameList.length; i++) {
        const fileName = fileNameList[i];
        let chNumber = parseInt(fileName.replace("Capitulo-", "").replace(".txt", ""));
        if (chNumber < MINIMUM_CHAPTER || chNumber >= MAXIMUM_CHAPTER) continue;

        let fullEnglishPath = `${englishPath}/${fileName}`;
        let fullSpanishPath = `${spanishPath}/${fileName}`;
        let fullRVCPath = `${rvcPath}/${fileName.replace("txt", "mp3")}`;

        let downloaded = await fileExists(fullEnglishPath);
        let translated = await fileExists(fullSpanishPath);
        let converted = await fileExists(fullRVCPath);

        //if (converted) continue;

        let temp = {
            chapterNumber: chNumber,
            fileName: fileName,
            title: `${fileName.replace(".txt", "").replace(/-/g, " ")}`,
            downloaded: downloaded,
            translated: translated,
            converted: converted
        }
        result.push(temp);
    }

    return result;
}

const translate = async (novelName, fileName) => {
    let rootPath = `novels`;
    let novelPath = `${rootPath}/${novelName}`;
    let englishPath = `${novelPath}/english/${fileName}`;
    let spanishPath = `${novelPath}/spanish/${fileName}`;

    console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: translate: ${englishPath}`);

    let result = "";
    const fileContent = (await fs.readFile(englishPath)).toString();
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

        const apiUrl = baseUrl;
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
        console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: translate: ${englishPath}, progress: ${progress.toFixed(2)} %`)
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

const convertChapters = async (novelName, voiceModel, voiceModelIndex, ttsVoice, filesList) => {
    console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: convertChapters: ${novelName}, files: ${filesList}`);

    const apiEndpoint = "/generateRVC"; // Corresponds to the api_name
    //#region Validations
    if (!voiceModel) {
        console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: convertChapters: voiceModel param is required`);
        return;
    }
    if (!voiceModelIndex) {
        console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: convertChapters: voiceModelIndex param is required`);
        return;
    }
    if (!ttsVoice) {
        console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: convertChapters: ttsVoice param is required`);
        return;
    }
    if (!novelName) {
        console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: convertChapters: novelName param is required`);
        return;
    }
    if (!filesList) {
        console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: convertChapters: filesList param is required`);
        return;
    }
    if (!Array.isArray(filesList)) {
        console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: convertChapters: filesList param must be an array`);
        return;
    }

    let rootPath = `novels`;
    let novelPath = `${rootPath}/${novelName}`;
    let rootFolder = path.resolve(`${novelPath}/spanish`);

    for (const filePath of filesList) {
        let fullPath = `${rootFolder}\\${filePath}`;
        let exists = await fileExists(fullPath);
        if (!exists) {
            console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: convertChapters: file does not exist: ${filePath}`);
            continue;
        }
    }
    //#endregion

    // 1. Connect to the Gradio Space (Equivalent to client = Client("..."))
    const client = await Client.connect(spaceUrl);

    // The input array must match the order of the Gradio function's arguments.
    const payload = [
        voiceModel,
        voiceModelIndex,
        ttsVoice,
        rootFolder,
        filesList,
    ];

    // The predict method is asynchronous and returns the result object.
    const result = await client.predict(
        apiEndpoint, // The API name
        payload // The input data array
    );

    // The actual result data is typically within the 'data' array property
    const finalResult = result.data[0];

    return finalResult;
};
//#endregion

//#region S3
const s3 = new S3Client({
    // The SDK resolves credentials from environment variables, profiles, or IAM roles.
    region: process.env.AWS_REGION || "us-east-1"
});

async function listS3Contents(bucketName, prefix = "") {
    try {
        console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: listS3Files: ${bucketName}/${prefix}`);

        const command = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: prefix
        });

        const response = await s3.send(command);

        if (!response.Contents || response.Contents.length === 0) {
            console.log("No files found.");

            return {
                success: true,
                //folders: [],
                files: []
            };
        }

        //const folders = new Set();
        const files = [];

        for (const item of response.Contents) {

            const key = item.Key;

            // Skip empty keys
            if (!key) continue;

            const parts = key.split("/");

            // Detect folders
            /*if (parts.length > 1) {
                folders.add(parts[0]);
            }*/

            // Add file
            if (key.endsWith(".mp3")) {
                files.push({
                    key: key,
                    size: item.Size,
                    lastModified: item.LastModified
                });
            }
        }

        //console.log("Folders:");
        //console.log([...folders]);

        //console.log("\nFiles:");
        //console.log(files);

        return {
            success: true,
            //folders: [...folders],
            files
        };

    } catch (err) {
        console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: listS3Files: Failed to list S3 files: ${err.message}`);
        return {
            success: false,
            error: err.message
        };
    }
}

/**
 * Upload a local file to AWS S3 in the Novels folder
 *
 * @param {string} noveName - Name of the novel
 * @param {string} localFilePath - Path to local file
 */
async function uploadChapterToS3(novelName, fileName) {
    let rootPath = `novels`;
    let novelPath = `${rootPath}/${novelName}`;
    let spanishPath = `${novelPath}/spanish`;
    let rvcPath = `${spanishPath}/rvc`;
    let localFilePath = `${rvcPath}/${fileName}`;

    let bucketName = "arturo-audiolibros"
    let s3Key = `novels/${novelName}/audio/spanish/${fileName}`;

    console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: uploadChapterToS3: ${novelName} - ${fileName}`);

    try {
        // Check if file exists
        if (!(await fileExists(localFilePath))) {
            console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: uploadChapterToS3: error: file not found`);
            throw new Error(`File not found: ${localFilePath}`);
        }

        // Create file stream
        const fileStream = fsSync.createReadStream(localFilePath);

        // Upload command
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
            Body: fileStream,
            ACL: "public-read",
            ContentType: "audio/mpeg"
        });

        // Execute upload
        await s3.send(command);

        return {
            success: true,
            bucket: bucketName,
            key: s3Key,
            url: (`https://${bucketName}.s3.amazonaws.com/${s3Key}`).replace(/%2F/g, "/")
        };

    } catch (err) {
        console.error("Upload failed:", err.message);

        return {
            success: false,
            error: err.message
        };
    }
}
//#endregion

//#region Teams
const webhookUrl = "https://defaultbd790f064c4d4fbb8b451e03907204.08.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/b80f7877d10d4c41a65f9faebedf0db9/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=sRpEjCNNGYEB8DWXqflZvMoAWzyeIH_NC7EbukdJHnQ";

async function sendTeamsMessage(message) {
    const payload = {
        type: "message",
        attachments: [
            {
                contentType: "application/vnd.microsoft.card.adaptive",
                content: {
                    type: "AdaptiveCard",
                    version: "1.4",
                    body: [
                        {
                            type: "TextBlock",
                            text: "Shadow Slave Job Notification",
                            weight: "Bolder",
                            size: "Medium"
                        },
                        {
                            type: "TextBlock",
                            text: message,
                            wrap: true
                        }
                    ]
                }
            }
        ]
    };

    try {
        await axios.post(webhookUrl, payload);

        console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: Teams message sent`);
    } catch (err) {
        console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: error: ${err}`);
        console.error(err.response?.data || err.message);
    }
}
//#endregion

async function main() {
    //#region Download new Chapters (if any)
    console.log(`${new Date().toLocaleDateString("es-MX")} - shadowSlaveJob.js_TAG: chapters pending to download?`);
    //const availableChapters = await getChapterListFromNovelbin(novelName);
    //const availableChapters = await getChapterListFromNovelArrow(novelName);
    const availableChapters = await getChapterListFromNovelPing(novelName);
    console.log(`${new Date().toLocaleDateString("es-MX")} - shadowSlaveJob.js_TAG: new chapters: ${availableChapters.length}`);
    //return;
    const chaptersToDownload = availableChapters
        .filter(ch => !ch.downloaded && !ch.translated && !ch.converted && (ch.chapterNumber > MINIMUM_CHAPTER && ch.chapterNumber <= MAXIMUM_CHAPTER))
        .sort();

    for await (const chTD of chaptersToDownload) {
        //await downloadChapterFromNovelbin(novelName, chTD.link, chTD.chapterNumber);
        //await downloadChapterFromNovelArrow(novelName, chTD.link, chTD.chapterNumber);
        await downloadChapterFromNovelPing(novelName, chTD.link, chTD.chapterNumber);
    }

    console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: downloadChapterFromNovelbin: done`);
    //#endregion

    //#region Get Local Chapters
    const downloadedChapters = await getDownloadedChapters(novelName);
    console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: local chapters to process: ${downloadedChapters.length}`);
    //if (downloadedChapters.length == 0) return;
    //#endregion

    //#region Translate new Chapter (if any)
    const chaptersToTranslate = downloadedChapters.filter(ch => !ch.translated);
    console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: chapters to translate: ${chaptersToTranslate.length}`);
    for await (const chTT of chaptersToTranslate) {
        await translate(novelName, chTT.fileName);
    }
    //#endregion

    //#region Convert new Chapter (if any)
    const translatedChapters = await getDownloadedChapters(novelName);
    //if (translatedChapters.length == 0) return;

    const chaptersToConvert = downloadedChapters
        .filter(ch => ch.translated && !ch.converted)
        .map(ctc => ctc.fileName);

    console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: chapters to convert: ${chaptersToConvert.length}`);

    await convertChapters(novelName, voiceModel, voiceModelIndex, ttsVoice, chaptersToConvert);
    //#endregion

    //#region Upload new chapters (if any)
    const s3Chapters = await listS3Contents(
        "arturo-audiolibros",
        `novels/${novelName}/audio/spanish`
    );

    const localChapters = (await getDownloadedChapters(novelName)).filter(lc => lc.converted);
    const serverChapters = new Set(
        s3Chapters.files.map(file => path.basename(file.key))
    );

    // Compare local files against server files
    const chaptersToUpload = localChapters.filter(lc => {
        // Convert txt -> mp3 if needed
        const expectedServerFile = lc.fileName.replace(".txt", ".mp3");

        return !serverChapters.has(expectedServerFile);
    });

    for await (const ctu of chaptersToUpload) {
        const uploadResult = await uploadChapterToS3(novelName, ctu.fileName.replace(".txt", ".mp3"))
        if (uploadResult.success) {
            console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: ${uploadResult.url.replace(/%2F/g, "/").replace(/ /g, "%20")}`);
            sendTeamsMessage(`New Chapter: ${ctu.chapterNumber}, here is the link: ${uploadResult.url.replace(/%2F/g, "/").replace(/ /g, "%20")}`);
        } else {
            console.log(`${new Date().toISOString()} - shadowSlaveJob.js_TAG: error: ${uploadResult.error}`);
        }
    }
    //#endregion
}

async function runJob() {
    try {
        console.log(`[${new Date().toISOString()}] Job started`);

        await main();

        console.log(`[${new Date().toISOString()}] Job finished`);
    } catch (err) {
        console.error("Job error:", err);
    }
}

main();

// Run immediately on startup
//runJob();

// Then run every hour
//setInterval(runJob, ONE_HOUR);
