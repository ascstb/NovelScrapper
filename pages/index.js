var availableChapters = [];
var currentSeries = "";

$(document).ready(function () {
  validateSession();
  init();

  fetchVoiceModels();
  fetchVoiceModelIndexes();
  fetchTTSVoices();

  $("button.navbar-toggle").click();
});

//#region Search Novels
const onSearchNovel = () => {
  let search = $("#txtSearch").val();
  if (search && search.length > 0) {
    fetchNovels(search);
  }
};

const fetchNovels = (search) => {
  //TODO: Fetch novels from Scrapper API
  console.log("Fetching novels for search: " + search);
};
//#endregion

//#region Chapters
const onGetChapters = () => {
  let sourceOption = $("input[name='sourceOptions']:checked").val();
  let urlSource = $("#urlSource").val();
  if (!urlSource || urlSource.length == 0) {
    Swal.fire({
      title: "Advertencia",
      text: `Por favor ingresa una URL válida.`,
      icon: "warning",
    });
    return;
  }

  fetchChapters(sourceOption, urlSource);
};

const fetchChapters = (source, urlSource) => {
  $("#btnSpinner").removeClass("d-none");

  currentSeries = $("#urlSource").val().split("/").pop();

  let path = `${serverUrl}api/v1/chapter-list?source=${source}&url=${urlSource}`;
  var success = function (data) {
    $("#btnSpinner").addClass("d-none");

    availableChapters = [];

    if (!data || data.length == 0 || data === "undefined") {
      updateChaptersTable();
      return;
    }

    availableChapters = data;
    updateChaptersTable();
  };

  var error = function (err) {
    console.error("Error fetching chapters:", err);
  };
  callAPI("GET", path, null, success, error);
};
//#endregion

//#region Table Formatters and Options
function downloadFormatter(value, row) {
  if (!value) {
    return `<button class="btn btn-primary btn-sm" onclick="onDownloadChapter('${row.link}')">
              <i class="fa fa-download"></i> Descargar
            </button>`;
  } else {
    return "Descargado";
  }
}

function translatedFormatter(value, row) {
  if (row.downloaded && !value) {
    return `<button class="btn btn-secondary btn-sm" onclick="onTranslateChapter('${row.link}')">
              <i class="fa fa-book"></i> Traducir
            </button>`;
  } else if (value) {
    return "Traducido";
  } else {
    ("");
  }
}

function convertedFormatter(value, row) {
  if (value) {
    return "Convertido";
  } else if (row.translated) {
    return `<button class="btn btn-secondary btn-sm" onclick="onConvertChapter('${row.link}')">
              <i class="fa fa-cogs"></i> Convertir
            </button>`;
  } else {
    ("");
  }
}

const updateChaptersTable = async () => {
  $("#chaptersTable").bootstrapTable("destroy");
  $("#chaptersTable").bootstrapTable({
    data: availableChapters,
    buttonsClass: "",
  });
};

function tableDownloadButton() {
  return {
    downloadButton: {
      text: "Descargar seleccionados",
      icon: "fa-download", // Optional icon
      event: function () {
        onDownloadSelectedChapters();
      },
      attributes: {
        title: "Descargar capítulos seleccionados",
        id: "downloadSelectedChapters",
        class: "btn-download",
      },
    },
    translateButton: {
      text: "Traducir seleccionados",
      icon: "fa-book", // Optional icon
      event: function () {
        onTranslateSelectedChapters();
      },
      attributes: {
        title: "Traducir capítulos seleccionados",
        id: "translateSelectedChapters",
        class: "btn-translate",
      },
    },
    convertButton: {
      text: "Convertir seleccionados",
      icon: "fa-cogs", // Optional icon
      event: function () {
        onConvertSelectedChapters();
      },
      attributes: {
        title: "Convertir capítulos seleccionados",
        id: "convertSelectedChapters",
        class: "btn-convert",
      },
    },
  };
}
//#endregion

//#region Chapter Actions
const onDownloadChapter = (link) => {
  console.log("Downloading chapter: " + link);
  let sourceOption = $("input[name='sourceOptions']:checked").val();
  let path = `${serverUrl}api/v1/download-chapter?source=${sourceOption}&url=${link}`;
  var success = function (data) {
    console.log("Chapter downloaded successfully:", data);
    Swal.fire({
      title: "Éxito",
      text: `Capítulo descargado exitosamente.`,
      icon: "success",
    });
    fetchChapters(
      $("input[name='sourceOptions']:checked").val(),
      $("#urlSource").val()
    );
  };

  var error = function (err) {
    console.error("Error downloading chapter:", err);
    Swal.fire({
      title: "Error",
      text: `Ocurrió un error al descargar el capítulo.`,
      icon: "error",
    });
  };
  callAPI("GET", path, null, success, error);
};

const onDownloadSelectedChapters = () => {
  let sourceOption = $("input[name='sourceOptions']:checked").val();
  let urlSource = $("#urlSource").val();
  let path = `${serverUrl}api/v1/download-novel`;

  let selectedChapters = $("#chaptersTable").bootstrapTable("getSelections");
  if (!selectedChapters || selectedChapters.length == 0) {
    Swal.fire({
      title: "Advertencia",
      text: `Por favor selecciona al menos un capítulo para descargar.`,
      icon: "warning",
    });
    return;
  }
  console.log(`Downloading selected chapters: ${selectedChapters.length}`);

  let params = {
    source: sourceOption,
    url: urlSource,
    chapters: selectedChapters.map((c) => c.chapterNumber),
  };

  var success = function (data) {
    console.log("Chapter downloaded successfully:", data);
    Swal.fire({
      title: "Éxito",
      text: `Capítulos descargados exitosamente.`,
      icon: "success",
    });
    fetchChapters(
      $("input[name='sourceOptions']:checked").val(),
      $("#urlSource").val()
    );
  };

  var error = function (err) {
    console.error("Error downloading chapters:", err);
    Swal.fire({
      title: "Error",
      text: `Ocurrió un error al descargar el capítulo.`,
      icon: "error",
    });
  };
  callAPI("POST", path, JSON.stringify(params), success, error);
};

const onTranslateChapter = (link) => {
  console.log(`Translate chapter: ${link}`);
  let urlSource = $("#urlSource").val();
  let novelName = urlSource.split("/")[4].replace(/-/g, " ");

  let urlParts = link.split("/");
  let chapterNumber = urlParts[urlParts.length - 1];
  let chapterNumberPadded = ("000" + chapterNumber.toString()).slice(-4);
  let fileName = `Capitulo-${chapterNumberPadded}.txt`;

  let path = `${serverUrl}api/v1/translate-chapter`;

  var success = function (data) {
    console.log("Chapter translated successfully: ", data);
    Swal.fire({
      title: "Éxito",
      text: `Capítulo traducido exitosamente.`,
      icon: "success",
    });
    fetchChapters(
      $("input[name='sourceOptions']:checked").val(),
      $("#urlSource").val()
    );
  };

  var error = function (err) {
    console.error("Error translating chapter:", err);
    Swal.fire({
      title: "Error",
      text: `Ocurrió un error al traducir el capítulo.`,
      icon: "error",
    });
  };

  var params = {
    novelName: novelName,
    fileName: fileName,
  };

  callAPI("POST", path, JSON.stringify(params), success, error);
};

const onConvertSelectedChapters = () => {
  let sourceOption = $("input[name='sourceOptions']:checked").val();
  let urlSource = $("#urlSource").val();
  let path = `${serverUrl}api/v1/generateRVC`;

  let selectedChapters = $("#chaptersTable").bootstrapTable("getSelections");
  if (!selectedChapters || selectedChapters.length == 0) {
    Swal.fire({
      title: "Advertencia",
      text: `Por favor selecciona al menos un capítulo para convertir.`,
      icon: "warning",
    });
    return;
  }
  let novelName = urlSource.split("/")[4].replace(/-/g, " ");

  let chaptersList = [];

  selectedChapters.forEach((ch) => {
    if (ch.converted || !ch.translated || !ch.downloaded) return

    let urlParts = ch.link.split("/");
    let chapterNumber = urlParts[urlParts.length - 1];
    let chapterNumberPadded = ("000" + chapterNumber.toString()).slice(-4);
    let fileName = `Capitulo-${chapterNumberPadded}.txt`;
    chaptersList.push(fileName);
  });
  console.log(`Converting selected chapters: ${selectedChapters.length}`);

  let voiceModel = $("#ddlVoiceModel").val();
  let voiceModelIndex = $("#ddlVoiceModelIndex").val();
  let ttsVoice = $("#ddlTTSVoice").val();

  if (!voiceModel || voiceModel.length == 0) {
    Swal.fire({
      title: "Advertencia",
      text: `Por favor selecciona un modelo de voz.`,
      icon: "warning",
    });
    return;
  }
  if (!voiceModelIndex || voiceModelIndex.length == 0) {
    Swal.fire({
      title: "Advertencia",
      text: `Por favor selecciona un índice de modelo de voz.`,
      icon: "warning",
    });
    return;
  }
  if (!ttsVoice || ttsVoice.length == 0) {
    Swal.fire({
      title: "Advertencia",
      text: `Por favor selecciona una voz TTS.`,
      icon: "warning",
    });
    return;
  }

  let params = {
    source: sourceOption,
    voiceModel: voiceModel,
    voiceModelIndex: voiceModelIndex,
    ttsVoice: ttsVoice,
    novelName: novelName,
    filesList: chaptersList,
  };

  console.log(params);

  var success = function (data) {
    console.log("Chapters converted successfully:", data);
    Swal.fire({
      title: "Éxito",
      text: `Capítulos convertidos exitosamente.`,
      icon: "success",
    });
    fetchChapters(
      $("input[name='sourceOptions']:checked").val(),
      $("#urlSource").val()
    );
  };

  var error = function (err) {
    console.error("Error converting chapters:", err);
    Swal.fire({
      title: "Error",
      text: `Ocurrió un error al traducir el capítulo.`,
      icon: "error",
    });
  };
  callAPI("POST", path, JSON.stringify(params), success, error);
};

const onTranslateSelectedChapters = () => {
  let sourceOption = $("input[name='sourceOptions']:checked").val();
  let urlSource = $("#urlSource").val();
  let path = `${serverUrl}api/v1/translate-novel`;

  let selectedChapters = $("#chaptersTable").bootstrapTable("getSelections");
  if (!selectedChapters || selectedChapters.length == 0) {
    Swal.fire({
      title: "Advertencia",
      text: `Por favor selecciona al menos un capítulo para traducir.`,
      icon: "warning",
    });
    return;
  }
  console.log(`Translating selected chapters: ${selectedChapters.length}`);
  let novelName = urlSource.split("/")[4].replace(/-/g, " ");

  let chaptersList = [];

  selectedChapters.forEach((ch) => {
    if (ch.translated || ch.converted || !ch.downloaded) return

    let urlParts = ch.link.split("/");
    let chapterNumber = urlParts[urlParts.length - 1];
    let chapterNumberPadded = ("000" + chapterNumber.toString()).slice(-4);
    let fileName = `Capitulo-${chapterNumberPadded}.txt`;
    chaptersList.push(fileName);
  });

  let params = {
    source: sourceOption,
    novelName: novelName,
    chaptersList: chaptersList,
  };

  console.log(params);

  var success = function (data) {
    console.log("Chapter translated successfully:", data);
    Swal.fire({
      title: "Éxito",
      text: `Capítulos traducidos exitosamente.`,
      icon: "success",
    });
    fetchChapters(
      $("input[name='sourceOptions']:checked").val(),
      $("#urlSource").val()
    );
  };

  var error = function (err) {
    console.error("Error translating chapters:", err);
    Swal.fire({
      title: "Error",
      text: `Ocurrió un error al traducir el capítulo.`,
      icon: "error",
    });
  };
  callAPI("POST", path, JSON.stringify(params), success, error);
};
//#endregion

//#region Voice Model Selection
const fetchVoiceModels = () => {
  let path = `${serverUrl}api/v1/models`;
  var success = function (data) {
    if (!data || data.length == 0 || data === "undefined") {
      return;
    }

    let options = "";
    data.forEach((model) => {
      options += `<option value="${model}">${model}</option>`;
    });

    $("#ddlVoiceModel").html(options);
    $("#ddlVoiceModel").selectpicker();
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

    let ddlVoiceModelIndex = $("#ddlVoiceModelIndex");
    ddlVoiceModelIndex.empty();

    data.forEach((index) => {
      ddlVoiceModelIndex.append($("<option></option").val(index).html(index));
    });

    ddlVoiceModelIndex.selectpicker();
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

    let ddlTTSVoice = $("#ddlTTSVoice");
    ddlTTSVoice.empty();

    data.forEach((voice) => {
      ddlTTSVoice.append($("<option></option").val(voice).html(voice));
    });

    ddlTTSVoice.selectpicker();
  };

  var error = function (err) {
    console.error("Error fetching TTS voices:", err);
  };
  callAPI("GET", path, null, success, error);
};
//#endregion
