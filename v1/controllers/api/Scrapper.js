"use strict";
const puppeteer = require("puppeteer");
const fs = require("fs");

const getChapterList = async (req, res, next) => {
  try {
    console.log(`Scrapper.js: getChapterList: called`);
    let { source } = req.query;
    let { url } = req.query;

    if (!source || !url) {
      return res
        .status(400)
        .json({ message: "source and url query params are required" });
    }

    //#region Extract min and max chapter numbers from the URL
    // Launch the browser
    const browser = await puppeteer.launch({
      headless: "false",
      defaultViewport: null,
      args: [
        '--user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36"',
      ],
    });

    // Open a new tab
    const page = await browser.newPage();

    // Visit the page and wait until network connections are completed
    await page.goto(url, {
      // waitUntil: "networkidle2",
      waitUntil: "domcontentloaded",
    });

    //#region Folder Structure
    let scrapResult = "";
    let novelName = "";

    if (source == "empireNovel") {
      novelName = url.split("/")[4].replace(/-/g, " ");
    } else if (source == "novelfull") {
      novelName = url.split("/")[3].replace(/-/g, " ").replace(".html", "");
    } else if (source == "novelbin") {
      novelName = url.split("/")[4].replace(/-/g, " ");
    }

    let rootPath = `novels`;
    let novelPath = `${rootPath}/${novelName}`;
    let englishPath = `${novelPath}/english`;
    let spanishPath = `${novelPath}/spanish`;
    let rvcPath = `${spanishPath}/rvc`;

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
        let firstChapter = parseInt(
          fileNameList[0].replace("Capitulo-", "").replace(".txt", "")
        );
        let lastChapter = parseInt(
          fileNameList[fileNameList.length - 1]
            .replace("Capitulo-", "")
            .replace(".txt", "")
        );

        scrapResult = {
          first: firstChapter,
          last: lastChapter,
        };
      }
    } else if (source == "novelfull") {
      scrapResult = await page.evaluate(() => {
        return document.body.innerHTML;
        /*let liLast = document.querySelector(".l-chapters > li")[0];
        let first = 1;

        let last = parseInt(
          liLast.innerText.split(" - ")[0].replace("Chapter ", "")
        );

        return {
          first: first,
          last: last,
        };*/
      });
    } else if (source == "novelbin") {
      let sourcePath = `sources/${novelName}/content.html`;
      if (!fs.existsSync(sourcePath)) {
        return res
          .status(400)
          .json({ message: `Source file not found: ${sourcePath}` });
      }

      let filePath = `file://${process.cwd()}/${sourcePath}`;
      console.log(`Loading local file: ${filePath}`);
      await page.goto(filePath, {
        waitUntil: "domcontentloaded",
      });

      scrapResult = await page.evaluate(() => {
        let select = [...document.querySelectorAll("ul.list-chapter > li > a")];
        let count = 0;
        let chapters = select.map((aChapter) => {
          let url = aChapter.getAttribute("href");
          let title = aChapter.getAttribute("title");
          count++;
          return {
            chapterNumber: count,
            title: title,
            url: url,
          };
        });
        return chapters;
      });
    }

    // Don't forget to close the browser instance to clean up the memory
    await browser.close();
    //#endregion

    let result = [];
    if (source == "novelbin") {
      for (let chapter of scrapResult) {
        let chapterNumber = ("000" + chapter.chapterNumber.toString()).slice(
          -4
        );
        let fileName = `Capitulo-${chapterNumber}.txt`;
        let fullEnglishPath = `${englishPath}/${fileName}`;
        let fullSpanishPath = `${spanishPath}/${fileName}`;
        let fullRVCPath = `${rvcPath}/${fileName.replace("txt", "mp3")}`;

        let downloaded = fs.existsSync(fullEnglishPath);
        let translated = fs.existsSync(fullSpanishPath);
        let converted = fs.existsSync(fullRVCPath);

        if (chapter.chapterNumber === 1) {
          console.log(
            `Checking chapter 1 paths: ${fileName}, ${fullEnglishPath}, ${fullSpanishPath}, ${fullRVCPath}`
          );
        }

        let temp = {
          chapterNumber: chapter.chapterNumber,
          fileName: fileName,
          title: chapter.title,
          link: chapter.url,
          downloaded: downloaded,
          translated: translated,
          converted: converted,
        };
        result.push(temp);
      }
    } else {
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
          converted: converted,
        };
        result.push(temp);
      }
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
    let { chapterNumber } = req.query;

    if (!source || !url) {
      return res
        .status(400)
        .json({ message: "source and url query params are required" });
    }

    //#region Extract chapter number and novel name from the URL
    let urlParts = url.split("/");

    let novelName = "";
    if (source == "empireNovel") {
      novelName = urlParts[4].replace(/-/g, " ");
    } else if (source == "novelfull") {
      novelName = urlParts[3].replace(/-/g, " ").replace(".html", "");
    } else if (source == "novelbin") {
      novelName = urlParts[4].replace(/-/g, " ");
    }
    //#endregion

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

    // Launch the browser
    const browser = await puppeteer.launch({
      headless: "false",
      defaultViewport: null,
      args: [
        '--user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36"',
      ],
    });
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

    let chapterText = "";

    if (source == "empireNovel") {
      await page.evaluate(() => {
        return document.getElementById("read-novel").innerText;
      });
    } else if (source == "novelfull") {
      chapterText = await page.evaluate(() => {
        return document.getElementById("chapter-content").innerText;
      });
    } else if (source == "novelbin") {
      chapterText = await page.evaluate(() => {
        let container = document.getElementById("chr-content");
        let title = container.querySelector("h4").innerText;
        let paragraphs = [...container.querySelectorAll("p")];
        let textContent = `${title}\n\n`;
        paragraphs.forEach((p) => {
          if (p.innerText.trim() !== "") {
            textContent += `${p.innerText}\n\n`;
          }
        });
        return textContent;
      });
    }
    //console.log(`Scrapper.js: page.evaluate result: ${chapterText}`);

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

    if (source == "novelbin") {
      let count = 0;
      for (let chapterUrl of url) {
        let chapterNumber = chapters[count];
        await downloadChapter(
          { query: { source, url: chapterUrl, chapterNumber } },
          { status: () => ({ json: () => {} }) },
          () => {}
        );
        count++;
      }
    } else {
      for (let chapterNumber of chapters) {
        let chapterUrl = `${url}/${chapterNumber}`;
        await downloadChapter(
          { query: { source, url: chapterUrl, chapterNumber } },
          { status: () => ({ json: () => {} }) },
          () => {}
        );
      }
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
