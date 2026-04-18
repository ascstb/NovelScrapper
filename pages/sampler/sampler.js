$(document).ready(function () {
  validateSession();
  init();

  fetchVoiceModels();
  fetchVoiceModelIndexes();
  fetchTTSVoices();
});

//#region Voice Model Selection
$(document).on("click", ".selectable-list .list-group-item", function (e) {
  const list = $(this).closest(".selectable-list");

  // CTRL or CMD allows multiple selection
  if (e.ctrlKey || e.metaKey) {
    $(this).toggleClass("selected");
  }
  else {
    // only clear selection inside the same list
    list.find(".list-group-item").removeClass("selected");
    $(this).addClass("selected");
  }
});

const femaleVoices = new Set([
  "Elena", "Sofia", "Catalina", "Salome", "Ximena", "Maria", "Belkys", "Ramona",
  "Andrea", "Lorena", "Teresa", "Marta", "Karla", "Dalia", "Yolanda", "Margarita",
  "Tania", "Camila", "Karina", "Elvira", "Paloma", "Valentina", "Paola"
]);

let men = [];
let women = [];

const fetchVoiceModels = () => {
  let path = `${serverUrl}api/v1/models`;
  var success = function (data) {
    if (!data || data.length == 0 || data === "undefined") {
      return;
    }

    let options = "";
    data.forEach((model) => {
      let formattedModelName = friendlyModelName(model);
      options += `<li class="list-group-item" data-model="${model}">${formattedModelName}</li>`;
    });

    $("#ulModels").html(options);
  };

  var error = function (err) {
    console.error("Error fetching voice models:", err);
  };
  callAPI("GET", path, null, success, error);
};

const fetchVoiceModelIndexes = () => {
  let path = `${serverUrl}api/v1/indexes`;
  var success = function (data) {
    if (!data || data.length == 0 || data === "undefined") {
      return;
    }

    let liModels = $("#ulModels li");

    liModels.each(function (i) {
      $(this).attr("data-model-index", data[i]);
    });
  };

  var error = function (err) {
    console.error("Error fetching voice model indexes:", err);
  };
  callAPI("GET", path, null, success, error);
};

const fetchTTSVoices = () => {
  let path = `${serverUrl}api/v1/voices`;
  var success = function (data) {
    if (!data || data.length == 0 || data === "undefined") {
      return;
    }

    let voices = data.filter(v => v.startsWith("es-"));

    let options = voices
      .map(v => `<li class="list-group-item" data-tts-voice="${v}">${v.replace("Neural", "").replace("es-", "")}</li>`)
      .join("");

    $("#ulVoices").html(options);

    men = [];
    women = [];
    voices.forEach(v => {
      const name = v.replace("Neural", "").split("-").pop();

      if (femaleVoices.has(name)) {
        women.push(v);
      } else {
        men.push(v);
      }
    });
  };

  var error = function (err) {
    console.error("Error fetching TTS voices:", err);
  };
  callAPI("GET", path, null, success, error);
};

const friendlyModelName = (path) => {

  // get folder name (better than filename)
  let name = path.split("\\")[1];

  // remove training metadata
  name = name.replace(/_\d+e_\d+s/g, "");
  name = name.replace(/_\d+e/g, "");
  name = name.replace(/_\d+s/g, "");
  name = name.replace(/_?\d+Epoch/gi, "");
  name = name.replace(/_?\d+Steps/gi, "");
  name = name.replace(/_RVC.*$/gi, "");

  // replace separators
  name = name.replace(/[_-]/g, " ");

  // split camelCase
  name = name.replace(/([a-z])([A-Z])/g, "$1 $2");

  // remove extra numbers
  name = name.replace(/\d+/g, "");

  // normalize spaces
  name = name.replace(/\s+/g, " ").trim();

  // capitalize words
  name = name.replace(/\b\w/g, c => c.toUpperCase());

  return name;
}
//#endregion

//#region Selections
function onSelectAllModels() {
  $("#ulModels li").toggleClass("selected");
}

function onSelectAllVoices() {
  $("#ulVoices li").removeClass("selected").addClass("selected");
}

function onSelectMenVoices() {
  let liModels = $("#ulVoices li")
  liModels.removeClass("selected");

  const menSet = new Set(men); // faster lookup

  liModels.each(function () {
    const voice = $(this).attr("data-tts-voice");

    if (menSet.has(voice)) {
      $(this).addClass("selected");
    }
  });
}

function onSelectWomenVoices() {
  let liModels = $("#ulVoices li")
  liModels.removeClass("selected");

  const womenSet = new Set(women); // faster lookup

  liModels.each(function () {
    const voice = $(this).attr("data-tts-voice");

    if (womenSet.has(voice)) {
      $(this).addClass("selected");
    }
  });
}
//#endregion

function generateSamples() {
  let path = `${serverUrl}api/v1/generateSamples`;

  const models = $("#ulModels li.selected").map(function () {
    return {
      model: $(this).attr("data-model"),
      modelIndex: $(this).attr("data-model-index")
    };
  }).get();

  const voices = $("#ulVoices li.selected").map(function () {
    return $(this).attr("data-tts-voice");
  }).get();

  const invalidModels = models.filter(m => !m.modelIndex);

  alert(invalidModels);

  let params = {
    models: models,
    ttsVoices: voices,
    sampleText: $("#txtSampleText").val()
  };

  console.log(params);

  var success = function (data) {
    console.log("Samples created successfully:", data);
    Swal.fire({
      title: "Éxito",
      text: `Muestras creadas exitosamente.`,
      icon: "success",
    });
  };

  var error = function (err) {
    console.error("Error generating samples: ", err);
    Swal.fire({
      title: "Error",
      text: `Ocurrió un error al generar las muestras.`,
      icon: "error",
    });
  };

  callAPI("POST", path, JSON.stringify(params), success, error);
}
