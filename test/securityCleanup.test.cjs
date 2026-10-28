const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function translator(input, fail = false) {
    const requests = [];
    const writes = [];
    let active = 0;
    let maxActive = 0;
    const sandbox = {
        module: { exports: {} },
        console: { log() {} },
        require(name) {
            if (name === "fs/promises") return {
                readFile: async () => input,
                writeFile: async (...args) => writes.push(args),
            };
            if (name === "langchain") return {};
            if (name === "axios") return {
                post: async (url, payload) => {
                    requests.push({ url, payload });
                    active++;
                    maxActive = Math.max(maxActive, active);
                    await new Promise(resolve => setTimeout(resolve, 1));
                    active--;
                    if (fail) throw new Error("Translation service unavailable");
                    return { data: { response: payload.prompt.split("\n\nText:\n")[1] } };
                },
            };
            throw new Error("Unexpected dependency");
        },
    };
    const source = fs.readFileSync(path.join(root, "v1/controllers/api/Translator.js"), "utf8");
    vm.runInNewContext(source + "\nmodule.exports.translateV3 = translateV3;", sandbox);
    return { api: sandbox.module.exports, requests, writes, maxActive: () => maxActive };
}

test("V3 preserves paired paragraphs, order, five-request batches, and context", async () => {
    const paragraphs = Array.from({ length: 13 }, (_, i) => "Paragraph " + i);
    const run = translator("\n" + paragraphs.join("\n\n") + "\n");
    assert.equal(await run.api.translateV3("example", "chapter.txt"), true);
    assert.equal(run.requests.length, 7);
    assert.equal(run.maxActive(), 5);
    assert.equal(run.requests[0].payload.prompt.includes("Context: \n\nText:"), true);
    assert.equal(run.requests[5].payload.prompt.includes("Context: Paragraph 8\nParagraph 9\n\nText:"), true);
    assert.equal(run.requests[6].payload.prompt.endsWith("Text:\nParagraph 12"), true);
    assert.equal(run.writes.length, 1);
    assert.equal(run.writes[0][0], "novels/example/spanish/chapter.txt");
    assert.equal(run.writes[0][1], paragraphs.join("\n"));
});

test("V3 handles empty input and propagates translation failures without writing output", async () => {
    const empty = translator("\n \n");
    assert.equal(await empty.api.translateV3("example", "empty.txt"), true);
    assert.equal(empty.requests.length, 0);
    assert.equal(empty.writes[0][1], "");
    const failed = translator("Paragraph", true);
    await assert.rejects(failed.api.translateV3("example", "chapter.txt"), /Translation service unavailable/);
    assert.equal(failed.writes.length, 0);
});

test("novel endpoint retains V2 translation and its response contract", async () => {
    const run = translator("First\nSecond");
    let response;
    const res = { status(code) { assert.equal(code, 200); return this; }, json(value) { response = value; } };
    await run.api.translateNovel({ body: { novelName: "example", chaptersList: ["a.txt", "b.txt"] } }, res);
    assert.equal(response.length, 2);
    assert.equal(response[0].chapter, "a.txt");
    assert.equal(response[0].translateResult, true);
    assert.equal(run.requests.length, 4);
    assert.equal(run.writes.length, 2);
});

test("MongoDB requires environment configuration and preserves the full supplied URI", () => {
    const source = fs.readFileSync(path.join(root, "config/db.js"), "utf8");
    const load = env => {
        const sandbox = { process: { env }, module: { exports: {} } };
        vm.runInNewContext(source, sandbox);
        return sandbox.module.exports;
    };
    assert.throws(() => load({}), /MONGODB_URI is required/);
    const uri = "mongodb://localhost:27017/example?retryWrites=true";
    const config = load({ MONGODB_URI: uri });
    assert.equal(config.db.uri, uri);
    assert.equal(config.app.port, 3000);
});
