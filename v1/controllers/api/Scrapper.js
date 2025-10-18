"use strict";
const puppeteer = require("puppeteer");
const fs = require("fs");

const getChapterList = async (req, res, next) => {
  try {
    let { source } = req.query;
    let { url } = req.query;

    if (!source || !url) {
      return res
        .status(400)
        .json({ message: "source and url query params are required" });
    }

    //#region Extract min and max chapter numbers from the URL
    // Launch the browser
    const browser = await puppeteer.launch();

    // Open a new tab
    const page = await browser.newPage();

    // Visit the page and wait until network connections are completed
    await page.goto(url, {
      // waitUntil: "networkidle2",
      waitUntil: "domcontentloaded",
    });

    //#region Folder Structure
    let scrapResult = "";
    let novelName = url.split("/")[4].replace(/-/g, " ");

    let rootPath = `novels`;
    let novelPath = `${rootPath}/${novelName}`;
    let englishPath = `${novelPath}/english`;
    let spanishPath = `${novelPath}/spanish`;
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
    if (!fs.existsSync(rvcPath)) {
      fs.mkdirSync(rvcPath);
    }
    //#endregion

    if (source == "empireNovel") {
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
    }

    console.log(
      `getChapterList: url: ${url}, range: ${scrapResult.first} - ${scrapResult.last}`
    );

    // Don't forget to close the browser instance to clean up the memory
    await browser.close();
    //#endregion

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

    return res.status(200).json(result);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err });
  }
};

const downloadChapter = async (req, res, next) => {
  try {
    let { source } = req.query;
    let { url } = req.query;

    if (!source || !url) {
      return res
        .status(400)
        .json({ message: "source and url query params are required" });
    }

    //#region Extract chapter number and novel name from the URL
    let urlParts = url.split("/");
    let chapterNumber = urlParts[urlParts.length - 1];
    let novelName = urlParts[4].replace(/-/g, " ");

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

    let chapterNumberPadded = ("000" + chapterNumber.toString()).slice(-4);
    let fileName = `Capitulo-${chapterNumberPadded}.txt`;
    let fullPath = `${englishPath}/${fileName}`;

    fs.writeFileSync(fullPath, chapterText);

    return res
      .status(200)
      .json({ message: "Chapter downloaded", path: fullPath });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err });
  }
};

const downloadNovel = async (req, res, next) => {
  try {
    let { source, url, chapters } = req.body;

    if (!source || !url || !chapters) {
      return res
        .status(400)
        .json({ message: "source, url and chapters body params are required" });
    }

    console.log(
      `Scrapper.js: downloadNovel called with source: ${source}, url: ${url}, chapters: ${chapters}`
    );

    for (let chapterNumber of chapters) {
      let chapterUrl = `${url}/${chapterNumber}`;
      await downloadChapter(
        { query: { source, url: chapterUrl } },
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
