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
    console.log(`Scrapper.js: start browser`);

    // Open a new tab
    const page = await browser.newPage();
    console.log(`Scrapper.js_test: open new tab`);

    // Visit the page and wait until network connections are completed
    await page.goto(url, {
      // waitUntil: "networkidle2",
      waitUntil: "domcontentloaded",
    });
    console.log(`Scrapper.js_test: go to page`);

    const scrapResult = await page.evaluate(() => {
      let select = [...document.querySelectorAll("a[rel='nofollow']")];
      let firstUrl = select[0].getAttribute("href");
      let firstUrlParts = firstUrl.split("/");
      let first = parseInt(firstUrlParts[firstUrlParts.length - 1]);

      let lastUrl = select[1].getAttribute("href");
      let lastUrlParts = lastUrl.split("/");
      let last = parseInt(lastUrlParts[lastUrlParts.length - 1]);

      select.forEach((element) => {
        console.log(`Scrapper.js_test: element href: ${element.href}`);
      });

      return {
        first: first,
        last: last,
      };
    });
    console.log(
      `Scrapper.js_test: page.evaluate result: ${scrapResult.first} - ${scrapResult.last}`
    );

    // Don't forget to close the browser instance to clean up the memory
    await browser.close();
    //#endregion

    let novelName = url.split("/")[4].replace(/-/g, " ");
    let rootPath = `novels/`;
    let novelPath = `${rootPath}/${novelName}`;
    let englishPath = `${novelPath}/english`;
    let spanishPath = `${novelPath}/spanish`;

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

    let result = [];
    for (let i = scrapResult.first; i <= scrapResult.last; i++) {
      let chapterNumber = ("00" + i.toString()).slice(-3);
      let fileName = `Capitulo-${chapterNumber}.txt`;
      let fullEnglishPath = `${englishPath}/${fileName}`;
      let fullSpanishPath = `${spanishPath}/${fileName}`;

      let downloaded = fs.existsSync(fullEnglishPath);
      let translated = fs.existsSync(fullSpanishPath);

      result.push({
        chapterNumber: i,
        title: `${fileName.replace(".txt", "").replace(/-/g, " ")}`,
        link: `${url}/${i}`,
        downloaded: downloaded,
        translated: translated,
      });
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

    let chapterNumberPadded = ("00" + chapterNumber.toString()).slice(-3);
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
