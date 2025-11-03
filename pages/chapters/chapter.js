var availableChapters = [];
var seriesId = "";
var groupId = "";
var chapterId = "";

$(document).ready(function () {
  validateSession();
  init();

  if (params["seriesId"] !== undefined) {
    seriesId = params["seriesId"];
    getSeriesById();
  }

  if (params["groupId"] !== undefined) {
    groupId = params["groupId"];
    getGroupById();
  }

  fetchChapters();
});

const getSeriesById = async () => {
  showLoader("Cargando serie...");

  let path = `${serverUrl}api/v1/series/byId/${seriesId}`;
  var success = function (data) {
    hideLoader();

    if (!data || data === null || data === undefined) {
      return;
    }

    $("#txtSearchSeries").val(data.title);
  };

  var error = function (err) {
    hideLoader();
    console.error("Error fetching series by ID:", err);
    swal.fire({
      title: "Error",
      text: "Ocurrió un error al cargar la serie. Por favor, intenta de nuevo.",
      icon: "error",
    });
  };

  callAPI("GET", path, null, success, error);
};

const getGroupById = async () => {
  showLoader("Cargando grupo...");

  let path = `${serverUrl}api/v1/groups/byId/${groupId}`;
  var success = function (data) {
    hideLoader();

    if (!data || data === null || data === undefined) {
      return;
    }

    $("#txtSearchGroup").val(data.title);
  };

  var error = function (err) {
    hideLoader();
    console.error("Error fetching group by ID:", err);
    swal.fire({
      title: "Error",
      text: "Ocurrió un error al cargar el grupo. Por favor, intenta de nuevo.",
      icon: "error",
    });
  };

  callAPI("GET", path, null, success, error);
};

const fetchChapters = async () => {
  showLoader("Cargando capítulos...");

  let path = `${serverUrl}api/v1/chapters/byGroupId/${groupId}`;
  var success = function (data) {
    hideLoader();

    availableChapters = [];

    if (!data || data.length === 0 || data === null || data === undefined) {
      updateChaptersTable();
      return;
    }

    availableChapters = data;
    updateChaptersTable();
  };

  var error = function (err) {
    hideLoader();
    console.error("Error fetching chapters:", err);
    swal.fire({
      title: "Error",
      text: "Ocurrió un error al cargar los capítulos. Por favor, intenta de nuevo.",
      icon: "error",
    });
  };

  callAPI("GET", path, null, success, error);
};

const updateChaptersTable = () => {
  $("#chaptersTable").bootstrapTable("destroy");
  $("#chaptersTable").bootstrapTable({
    data: availableChapters,
  });
};

function editFormatter(value) {
  return `<a href='#' onclick="onEditChapter('${value}')"><i class="fas fa-edit"></i></a>`;
}

function sourceFormatter(_val, row) {
  let sources = "";
  row.contentSource.forEach((source) => {
    if (source.url && source.url.trim() !== "") {
      sources += `<b>Texto [${source.language}]:</b> <a href="${source.url}" target="_blank">${source.language}</a><br/>`;
    }
  });
  row.audioSource.forEach((source) => {
    if (source.url && source.url.trim() !== "") {
      sources += `<a href="${source.url}" target="_blank"><i class="fa fa-file-audio"></i> ${source.language}</a><br/>`;
    }
  });
  return sources;
}

function durationFormatter(value) {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}m ${seconds}s`;
}

const onNewChapter = () => {
  chapterId = "";

  $("#chapterModalTitle").text("Nuevo capítulo");

  $("#txtChapterNumber").val("");
  $("#txtTitle").val("");
  $("#txtSubtitle").val("");
  $("#txtDurationMin").val("");
  $("#txtDurationSec").val("");

  // Clear existing sources
  $("#sourcesContainer").empty();

  $("#chapterModal").modal("show");
};

const onAddSource = () => {
  let sourceRow = `
    <div class="row col-sm-12 source-row">
        <div class="col-sm-2">
            <label>Fuente</label>
        </div>
        <div class="col-sm-2">
            <select id="contentType" class="form-control">
                <option value="text">Texto</option>
                <option value="audio">Audio</option>
            </select>
        </div>
        <div class="col-sm-2">
            <select id="language" class="form-control">
                <option value="es">Español</option>
                <option value="en">Inglés</option>
            </select>
        </div>
        <div class="col-sm-5">
            <input id="txtSourceUrl" type="text" class="form-control"
                placeholder="https://url.de.recurso" />
        </div>
        <div class="col-sm-1">
            <button class="btn btn-danger" onclick="onRemoveSource(this)"><i class="fa fa-trash"></i></button>
        </div>
    </div>
    `;
  $("#sourcesContainer").append(sourceRow);
};

const onRemoveSource = (btn) => {
  $(btn).closest(".source-row").remove();
};

const onSaveChapter = () => {
  const chapterNumber = parseInt($("#txtChapterNumber").val().trim()) || -1;
  const title = $("#txtTitle").val().trim();
  const subtitle = $("#txtSubtitle").val().trim();
  const durationMin = parseInt($("#txtDurationMin").val().trim()) || 0;
  const durationSec = parseInt($("#txtDurationSec").val().trim()) || 0;
  const duration = durationMin * 60 + durationSec;

  if (chapterNumber < 0) {
    swal.fire({
      title: "Validación",
      text: "El número de capítulo es obligatorio y debe ser mayor que cero.",
      icon: "warning",
    });
    return;
  }

  let contentSources = [];
  let audioSources = [];

  $("#sourcesContainer .source-row").each(function () {
    const contentType = $(this).find("#contentType").val();
    const language = $(this).find("#language").val();
    const url = $(this).find("#txtSourceUrl").val().trim();

    if (url !== "") {
      if (contentType === "text") {
        contentSources.push({ language: language, url: url });
      } else if (contentType === "audio") {
        audioSources.push({ language: language, url: url });
      }
    }
  });

  let payload = {
    seriesId: seriesId,
    groupId: groupId,
    chapterNumber: chapterNumber,
    title: title,
    subtitle: subtitle,
    contentSource: contentSources,
    audioSource: audioSources,
    duration: duration,
  };

  let path = "";
  let method = "";

  if (chapterId === "") {
    // New chapter
    path = `${serverUrl}api/v1/chapters/add`;
    method = "POST";
  } else {
    // Update chapter
    path = `${serverUrl}api/v1/chapters/update/${chapterId}`;
    method = "PUT";
  }

  showLoader("Guardando capítulo...");

  var success = function (_data) {
    hideLoader();
    $("#chapterModal").modal("hide");
    fetchChapters();
  };

  var error = function (err) {
    hideLoader();
    console.error("Error saving chapter:", err);
    swal.fire({
      title: "Error",
      text: "Ocurrió un error al guardar el capítulo. Por favor, intenta de nuevo.",
      icon: "error",
    });
  };

  callAPI(method, path, JSON.stringify(payload), success, error);
};

const onEditChapter = (id) => {
  const chapter = availableChapters.find((ch) => ch._id === id);
  if (!chapter) {
    swal.fire({
      title: "Error",
      text: "No se encontró el capítulo seleccionado.",
      icon: "error",
    });
    return;
  }

  chapterId = chapter._id;

  $("#chapterModalTitle").text("Editar capítulo");

  $("#txtChapterNumber").val(chapter.chapterNumber);
  $("#txtTitle").val(chapter.title);
  $("#txtSubtitle").val(chapter.subtitle);
  $("#txtDurationMin").val(Math.floor(chapter.duration / 60));
  $("#txtDurationSec").val(chapter.duration % 60);

  // Clear existing sources
  $("#sourcesContainer").empty();

  // Populate content sources
  chapter.contentSource.forEach((source) => {
    let sourceRow = `
      <div class="row col-sm-12 source-row">
          <div class="col-sm-2">
              <label>Fuente</label>
          </div>
          <div class="col-sm-2">
              <select id="contentType" class="form-control">
                  <option value="text" ${
                    source.language ? "selected" : ""
                  }>Texto</option>
                  <option value="audio" ${
                    source.language ? "" : "selected"
                  }>Audio</option>
              </select>
          </div>
          <div class="col-sm-2">
              <select id="language" class="form-control">
                  <option value="es" ${
                    source.language === "es" ? "selected" : ""
                  }>Español</option>
                  <option value="en" ${
                    source.language === "en" ? "selected" : ""
                  }>Inglés</option>
              </select>
          </div>
          <div class="col-sm-5">
              <input id="txtSourceUrl" type="text" class="form-control"
                  placeholder="https://url.de.recurso" value="${source.url}" />
          </div>
          <div class="col-sm-1">
              <button class="btn btn-danger" onclick="onRemoveSource(this)"><i class="fa fa-trash"></i></button>
          </div>
      </div>
      `;
    $("#sourcesContainer").append(sourceRow);
  });

  // Populate audio sources
  chapter.audioSource.forEach((source) => {
    let sourceRow = `
      <div class="row col-sm-12 source-row">
          <div class="col-sm-2">
              <label>Fuente</label>
          </div>
          <div class="col-sm-2">
              <select id="contentType" class="form-control">
                  <option value="text" ${
                    source.language ? "" : "selected"
                  }>Texto</option>
                  <option value="audio" ${
                    source.language ? "selected" : ""
                  }>Audio</option>
              </select>
          </div>
          <div class="col-sm-2">
              <select id="language" class="form-control">
                  <option value="es" ${
                    source.language === "es" ? "selected" : ""
                  }>Español</option>
                  <option value="en" ${
                    source.language === "en" ? "selected" : ""
                  }>Inglés</option>
              </select>
          </div>
          <div class="col-sm-5">
              <input id="txtSourceUrl" type="text" class="form-control"
                  placeholder="https://url.de.recurso" value="${source.url}" />
          </div>
          <div class="col-sm-1">
              <button class="btn btn-danger" onclick="onRemoveSource(this)"><i class="fa fa-trash"></i></button>
          </div>
      </div>
      `;
    $("#sourcesContainer").append(sourceRow);
  });

  $("#chapterModal").modal("show");
};
