var availableSeries = [];
var seriesId = "";

$(document).ready(function () {
  validateSession();
  init();

  fetchSeries();
});

const fetchSeries = async () => {
  showLoader("Cargando series...");

  let path = `${serverUrl}api/v1/series/getAll`;
  var success = function (data) {
    hideLoader();

    availableSeries = [];

    if (!data || data.length === 0 || data === null || data === undefined) {
      updateSeriesTable();
      return;
    }

    availableSeries = data;
    updateSeriesTable();
  };

  var error = function (err) {
    hideLoader();
    console.error("Error fetching series:", err);
    swal.fire({
      title: "Error",
      text: "Ocurrió un error al cargar las series. Por favor, intenta de nuevo.",
      icon: "error",
    });
  };

  callAPI("GET", path, null, success, error);
};

const updateSeriesTable = () => {
  $("#seriesTable").bootstrapTable("destroy");
  $("#seriesTable").bootstrapTable({
    data: availableSeries,
  });
};

function coverFormatter(value) {
  return `<img src="${value}" alt="Cover Image" style="width: 150px; height: auto;" />`;
}

function genresFormatter(value) {
  if (!value || value.length === 0) return "N/A";
  return value.join(", ");
}

function summaryFormatter(value) {
  if (!value) return "N/A";
  if (value.length > 100) {
    return value.substring(0, 100) + "...";
  }
  return value;
}

function languagesFormatter(value) {
  if (!value) return "N/A";
  return value.join(", ");
}

function editFormatter(_val, row) {
  return `<a href='#' onclick="onEditSeries('${row._id}')"><i class='fa fa-pencil'></i></a>`;
}

function selectFormatter(_val, row) {
  return `<button class='btn btn-sm btn-primary' onclick="onSelectSeries('${row._id}')">Seleccionar</button>`;
}

const onSelectSeries = (id) => {
  location.href = `/pages/groups/group.html?seriesId=${id}`;
};

const onNewSeries = () => {
  seriesId = "";
  cleanModal();
  $("#seriesModal").modal("show");
  $("#txtSeriesName").focus();
};

const onEditSeries = (id) => {
  seriesId = id;
  getSeriesById();
};

const getSeriesById = () => {
  showLoader("Cargando serie...");

  let path = `${serverUrl}api/v1/series/byId/${seriesId}`;

  var success = function (data) {
    hideLoader();

    if (!data) {
      swal.fire({
        title: "Error",
        text: "No se encontró la serie.",
        icon: "error",
      });
      return;
    }

    populateModal(data);
    $("#seriesModalTitle").text("Editar Serie");
    $("#seriesModal").modal("show");
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

const populateModal = (data) => {
  $("#modalTitle").text("Actualizar: " + (data.title || "Serie"));

  $("#txtSeriesName").val(data.title || "");
  $("#txtAuthor").val(data.author || "");
  $("#txtCoverUrl").val(data.coverUrl || "");
  $("#txtTotalChapters").val(data.totalChapters || "");
  $("#txtSummary").val(data.description || "");
  $("#txtGenres").val((data.genres || []).join(", "));
  $("#txtLanguages").val((data.languages || []).join(", "));
  $("#txtStatus").val(data.status || "");

  $("#seriesModal").modal("show");
  $("#txtSeriesName").focus();
};

const cleanModal = () => {
  $("#modalTitle").text("Agregar Serie");

  $("#txtSeriesName").val("");
  $("#txtAuthor").val("");
  $("#txtCoverUrl").val("");
  $("#txtTotalChapters").val("");
  $("#txtSummary").val("");
  $("#txtGenres").val("");
  $("#txtLanguages").val("");
  $("#txtStatus").val("");
};

const onUpdateSeries = () => {
  let title = $("#txtSeriesName").val().trim();
  let author = $("#txtAuthor").val().trim();
  let coverUrl = $("#txtCoverUrl").val().trim();
  let totalChapters = parseInt($("#txtTotalChapters").val().trim()) || 0;
  let description = $("#txtSummary").val().trim();
  let genres = $("#txtGenres")
    .val()
    .trim()
    .split(",")
    .map((g) => g.trim());
  let languages = $("#txtLanguages")
    .val()
    .trim()
    .split(",")
    .map((l) => l.trim());
  let status = $("#txtStatus").val().trim();

  if (!title) {
    swal.fire({
      title: "Error",
      text: "El nombre de la serie es obligatorio.",
      icon: "error",
    });
    return;
  }

  let payload = {
    title,
    author,
    coverUrl,
    totalChapters,
    description,
    genres,
    languages,
    status,
  };

  let path = seriesId
    ? `${serverUrl}api/v1/series/update/${seriesId}`
    : `${serverUrl}api/v1/series/add`;

  let method = seriesId ? "PUT" : "POST";

  showLoader(seriesId ? "Actualizando serie..." : "Creando serie...");

  var success = function (data) {
    hideLoader();
    $("#seriesModal").modal("hide");
    fetchSeries();
    swal.fire({
      title: "Éxito",
      text: seriesId
        ? "La serie ha sido actualizada exitosamente."
        : "La serie ha sido creada exitosamente.",
      icon: "success",
    });
  };

  var error = function (err) {
    hideLoader();
    console.error("Error updating/creating series:", err);
    swal.fire({
      title: "Error",
      text: "Ocurrió un error al guardar la serie. Por favor, intenta de nuevo.",
      icon: "error",
    });
  };

  callAPI(method, path, JSON.stringify(payload), success, error);
};
