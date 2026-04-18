"use strict";
const puppeteer = require("puppeteer");
const puppeteerExtra = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");

//#region Get Chapters
const getChapterList = async (req, res, next) => {
  try {
    let { source } = req.query;
    let { url } = req.query;
    if (!source || !url) {
      return res
        .status(400)
        .json({ message: "source and url query params are required" });
    }

    //#region Folder Structure
    let novelName = url.split("/")[4].replace(/-/g, " ");

    let rootPath = `novels`;
    let novelPath = `${rootPath}/${novelName}`;
    let englishPath = `${novelPath}/english`;
    let spanishPath = `${novelPath}/spanish`;
    let ttsPath = `${spanishPath}/tts`
    let rvcPath = `${spanishPath}/rvc`

    if (!fs.existsSync(rootPath)) {
      fs.mkdirSync(rootPath);
    }
    if (!fs.existsSync(novelPath)) {
      fs.mkdirSync(novelPath);
    }
    if (!fs.existsSync(englishPath)) {
      fs.mkdirSync(englishPath);
    }
    if (!fs.existsSync(spanishPath)) {
      fs.mkdirSync(spanishPath);
    }
    if (!fs.existsSync(ttsPath)) {
      fs.mkdirSync(ttsPath);
    }
    if (!fs.existsSync(rvcPath)) {
      fs.mkdirSync(rvcPath);
    }
    //#endregion

    console.log(`Scrapper.js_TAG: getChapterList: source: ${source}, novel: ${novelName}, url: ${url}`);

    let result = [];
    if (source == "empireNovel") {
      result = await getChapterListFromEmpireNovel(englishPath, spanishPath, rvcPath, url);
    } else if (source == "novelbin") {
      result = await getChapterListFromNovelbin(url, englishPath, spanishPath, rvcPath);
    }

    return res.status(200).json(result);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err });
  }
};

const getChapterListFromEmpireNovel = async (englishPath, spanishPath, rvcPath, url) => {
  //#region Launch the browser
  const browser = await puppeteer.launch();

  // Open a new tab
  const page = await browser.newPage();

  // Visit the page and wait until network connections are completed
  await page.goto(url, {
    waitUntil: "networkidle2",
    //waitUntil: "domcontentloaded",
  });
  //#endregion

  let scrapResult = "";
  //#region Get From Web or Local
  try {
    scrapResult = await page.evaluate(() => {
      let select = [...document.querySelectorAll("a[rel='nofollow']")];
      let firstUrl = select[0].getAttribute("href");
      let firstUrlParts = firstUrl.split("/");
      let first = parseInt(firstUrlParts[firstUrlParts.length - 1]);

      let lastUrl = select[1].getAttribute("href");
      let lastUrlParts = lastUrl.split("/");
      let last = parseInt(lastUrlParts[lastUrlParts.length - 1]);

      return {
        first: first,
        last: last,
      };
    });
  } catch (error) {
    console.log(`from cache becuse: ${error.message}`);
    const fileNameList = fs.readdirSync(englishPath).sort();
    let firstChapter = parseInt(fileNameList[0].replace("Capitulo-", "").replace(".txt", ""));
    let lastChapter = parseInt(fileNameList[fileNameList.length - 1].replace("Capitulo-", "").replace(".txt", ""));

    scrapResult = {
      first: firstChapter,
      last: lastChapter
    }
  }
  //#endregion

  console.log(
    `getChapterListFromEmpireNovel: url: ${url}, range: ${scrapResult.first} - ${scrapResult.last}`
  );

  // Don't forget to close the browser instance to clean up the memory
  await browser.close();

  //#region Result
  let result = [];
  for (let i = scrapResult.first; i <= scrapResult.last; i++) {
    let chapterNumber = ("000" + i.toString()).slice(-4);
    let fileName = `Capitulo-${chapterNumber}.txt`;
    let fullEnglishPath = `${englishPath}/${fileName}`;
    let fullSpanishPath = `${spanishPath}/${fileName}`;
    let fullRVCPath = `${rvcPath}/${fileName.replace("txt", "mp3")}`;

    let downloaded = fs.existsSync(fullEnglishPath);
    let translated = fs.existsSync(fullSpanishPath);
    let converted = fs.existsSync(fullRVCPath);

    let temp = {
      chapterNumber: i,
      fileName: fileName,
      title: `${fileName.replace(".txt", "").replace(/-/g, " ")}`,
      link: `${url}/${i}`,
      downloaded: downloaded,
      translated: translated,
      converted: converted
    }
    result.push(temp);
  }
  //#endregion

  return result;
};

const getChapterListFromNovelbin = async (url, englishPath, spanishPath, rvcPath) => {
  console.log(`Scrapper.js_TAG: getChapterListFromNovelbin: ${url}`);
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
  await new Promise(resolve => setTimeout(resolve, 10000));

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
  const result = scrapResult.map((chapter) => {
    const chapterNumber = ("000" + chapter.chapterNumber.toString()).slice(-4);

    const fileName = `Capitulo-${chapterNumber}.txt`;

    const fullEnglishPath = `${englishPath}/${fileName}`;
    const fullSpanishPath = `${spanishPath}/${fileName}`;
    const fullRVCPath = `${rvcPath}/${fileName.replace("txt", "mp3")}`;

    const downloaded = fs.existsSync(fullEnglishPath);
    const translated = fs.existsSync(fullSpanishPath);
    const converted = fs.existsSync(fullRVCPath);

    return {
      chapterNumber: chapter.chapterNumber,
      fileName: fileName,
      title: fileName.replace(".txt", "").replace(/-/g, " "),
      link: chapter.link,
      downloaded: downloaded,
      translated: translated,
      converted: converted
    };
  });
  //#endregion

  return result;
};
//#endregion

const downloadChapter = async (req, res, next) => {
  try {
    const { source, url, chapterNumber } = req.query;

    if (!source || !url || !chapterNumber) {
      return res
        .status(400)
        .json({ message: "source, url and chapterNumber query params are required" });
    }

    let novelName = "";
    if (source == "novelbin") {
      novelName = url.split("/")[4].replace(/-/g, " ");
    }

    //#region Folder Structure
    let rootPath = `novels/`;
    let novelPath = `${rootPath}/${novelName}`;
    let englishPath = `${novelPath}/english`;

    if (!fs.existsSync(rootPath)) {
      fs.mkdirSync(rootPath);
    }
    if (!fs.existsSync(novelPath)) {
      fs.mkdirSync(novelPath);
    }
    if (!fs.existsSync(englishPath)) {
      fs.mkdirSync(englishPath);
    }
    //#endregion

    let chapterNumberPadded = ("000" + chapterNumber.toString()).slice(-4);
    let fileName = `Capitulo-${chapterNumberPadded}.txt`;
    let fullPath = `${englishPath}/${fileName}`;

    let chapterText = "";
    if (source == "empireNovel") {
      chapterText = await downloadChapterFromEmpireNovel();
    } else if (source == "novelbin") {
      chapterText = await downloadChapterFromNovelbin(url);
    }

    if (chapterText.trim().length == 0) {
      return res.status(500).json({ error: `Could not download the chapter: ${chapterNumber}` });
    }

    fs.writeFileSync(fullPath, chapterText);

    return res
      .status(200)
      .json({ message: "Chapter downloaded", path: fullPath });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err });
  }
};

const downloadChapterFromEmpireNovel = async () => {
  // Launch the browser
  const browser = await puppeteer.launch();
  console.log(`Scrapper.js: start browser`);

  // Open a new tab
  const page = await browser.newPage();
  console.log(`Scrapper.js: open new tab`);

  // Visit the page and wait until network connections are completed
  await page.goto(url, {
    // waitUntil: "networkidle2",
    waitUntil: "domcontentloaded",
  });
  console.log(`Scrapper.js: go to page: ${url}`);

  const chapterText = await page.evaluate(() => {
    return document.getElementById("read-novel").innerText;
  });
  console.log(
    `Scrapper.js: page.evaluate result length: ${chapterText.length}`
  );

  // Don't forget to close the browser instance to clean up the memory
  await browser.close();

  return chapterText;
}

const downloadChapterFromNovelbin = async (url) => {
  console.log(`Scrapper.js_TAG: downloadChapterFromNovelbin: ${url}`);
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

  return chapterText;
};

const downloadNovel = async (req, res, next) => {
  try {
    let { source, chapters } = req.body;

    if (!source || !chapters) {
      return res
        .status(400)
        .json({ message: "source and chapters body params are required" });
    }

    console.log(`Scrapper.js: downloadNovel called with source: ${source}, chapters: ${chapters.length}`);

    for (let chapter of chapters) {
      await downloadChapter(
        { query: { source, url: chapter.link, chapterNumber: chapter.chapterNumber } },
        { status: () => ({ json: () => { } }) },
        () => { }
      );
    }

    return res
      .status(200)
      .json({ message: "Novel download initiated", chapters: chapters });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err });
  }
};

module.exports = {
  getChapterList,
  downloadChapter,
  downloadNovel,
};
