var availableChapters = [];
var currentSeries = "";

$(document).ready(function () {
  validateSession();
  init();

  $("button.navbar-toggle").click();
});

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

const onGetChapters = () => {
  let sourceOption = $("input[name='sourceOptions']:checked").val();
  console.log("Selected source: " + sourceOption);
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
  if (!value) {
    return `<button class="btn btn-secondary btn-sm">
              <i class="fa fa-book"></i> Traducir
            </button>`;
  } else {
    return "Traducido";
  }
}

const updateChaptersTable = async () => {
  $("#chaptersTable").bootstrapTable("destroy");
  $("#chaptersTable").bootstrapTable({ data: availableChapters });
};

function tableDownloadButton() {
  return {
    customButton1: {
      text: "Descargar seleccionados",
      icon: "fa-download", // Optional icon
      event: function () {
        onDownloadSelectedChapters();
      },
      attributes: {
        title: "Descargar capítulos seleccionados",
        id: "downloadSelectedChapters",
        class: "btn btn-primary",
      },
    },
  };
}

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
