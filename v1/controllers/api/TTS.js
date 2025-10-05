"use strict";
//import { Client } from "@gradio/client";
//import fs from "fs"
const { Client } = require("@gradio/client");
const fs = require("fs");
const spaceUrl = "http://127.0.0.1:6969";

const functionTest = async (req, res, next) => {
  try {
    const apiEndpoint = "/add_two"; // Corresponds to the api_name
    const { num1 } = req.body;
    const { num2 } = req.body;

    // 1. Connect to the Gradio Space (Equivalent to client = Client("..."))
    const client = await Client.connect(spaceUrl);

    // The input array must match the order of the Gradio function's arguments.
    const payload = [num1, num2];

    // The predict method is asynchronous and returns the result object.
    const result = await client.predict(
      apiEndpoint, // The API name
      payload // The input data array
    );

    // The actual result data is typically within the 'data' array property
    const finalResult = result.data[0];

    console.log(`Input: ${num1} and ${num2}`);
    console.log(`Result from ${apiEndpoint}: ${finalResult}`);

    return res.status(200).json(finalResult);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err });
  }
};

const getVoices = async (req, res, next) => {
  try {
    const apiEndpoint = "/getVoices"; // Corresponds to the api_name

    // 1. Connect to the Gradio Space (Equivalent to client = Client("..."))
    const client = await Client.connect(spaceUrl);

    // The predict method is asynchronous and returns the result object.
    const result = await client.predict(
      apiEndpoint // The API name
      //payload      // The input data array
    );

    // The actual result data is typically within the 'data' array property
    const finalResult = result.data[0];

    //console.log(`Result from ${apiEndpoint}: ${finalResult}`);

    return res.status(200).json(finalResult);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err });
  }
};

const getModels = async (req, res, next) => {
  try {
    const apiEndpoint = "/getModels"; // Corresponds to the api_name

    // 1. Connect to the Gradio Space (Equivalent to client = Client("..."))
    const client = await Client.connect(spaceUrl);

    // The predict method is asynchronous and returns the result object.
    const result = await client.predict(
      apiEndpoint // The API name
      //payload      // The input data array
    );

    // The actual result data is typically within the 'data' array property
    const finalResult = result.data[0];

    //console.log(`Result from ${apiEndpoint}: ${finalResult}`);

    return res.status(200).json(finalResult);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err });
  }
};

const getIndexes = async (req, res, next) => {
  try {
    const apiEndpoint = "/getIndexes"; // Corresponds to the api_name

    // 1. Connect to the Gradio Space (Equivalent to client = Client("..."))
    const client = await Client.connect(spaceUrl);

    // The predict method is asynchronous and returns the result object.
    const result = await client.predict(
      apiEndpoint // The API name
      //payload      // The input data array
    );

    // The actual result data is typically within the 'data' array property
    const finalResult = result.data[0];

    //console.log(`Result from ${apiEndpoint}: ${finalResult}`);

    return res.status(200).json(finalResult);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err });
  }
};

const generateRVC = async (req, res, next) => {
  try {
    const apiEndpoint = "/generateRVC"; // Corresponds to the api_name
    const { voiceModel } = req.body;
    const { voiceModelIndex } = req.body;
    const { ttsVoice } = req.body;
    const { rootFolder } = req.body;
    const { filesList } = req.body;

    //#region Validations
    if (!voiceModel)
      return res.status(400).json({ error: "voiceModel param is required" });
    if (!voiceModelIndex)
      return res
        .status(400)
        .json({ error: "voiceModelIndex param is required" });
    if (!ttsVoice)
      return res.status(400).json({ error: "ttsVoice param is required" });
    if (!rootFolder)
      return res.status(400).json({ error: "rootFolder param is required" });
    if (!filesList)
      return res.status(400).json({ error: "filesList param is required" });
    if (!Array.isArray(filesList))
      return res
        .status(400)
        .json({ error: "filesList param must be an array" });
    for (const filePath of filesList) {
      if (!fs.existsSync(filePath)) {
        return res
          .status(400)
          .json({ error: `file does not exist: ${filePath}` });
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

    return res.status(200).json(finalResult);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err });
  }
};

module.exports = {
  functionTest,
  getVoices,
  getModels,
  getIndexes,
  generateRVC,
};
