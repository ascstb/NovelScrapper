var availableGroups = [];
var seriesId = "";
var groupId = "";

$(document).ready(function () {
  validateSession();
  init();

  if (params["seriesId"] !== undefined) {
    seriesId = params["seriesId"];
    getSeriesById();
  }

  fetchGroups();
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

const fetchGroups = async () => {
  showLoader("Cargando grupos...");

  let path = `${serverUrl}api/v1/groups/bySeriesId/${seriesId}`;
  var success = function (data) {
    hideLoader();

    availableGroups = [];

    if (!data || data.length === 0 || data === null || data === undefined) {
      updateGroupsTable();
      return;
    }

    availableGroups = data;
    updateGroupsTable();
  };

  var error = function (err) {
    hideLoader();
    console.error("Error fetching groups:", err);
    swal.fire({
      title: "Error",
      text: "Ocurrió un error al cargar los grupos. Por favor, intenta de nuevo.",
      icon: "error",
    });
  };

  callAPI("GET", path, null, success, error);
};

const updateGroupsTable = () => {
  $("#groupsTable").bootstrapTable("destroy");
  $("#groupsTable").bootstrapTable({
    data: availableGroups,
  });
};

function coverFormatter(value) {
  return `<img src="${value}" alt="Cover Image" style="width: 150px; height: auto;" />`;
}

function editFormatter(_val, row) {
  return `<a href='#' onclick="onEditGroup('${row._id}')"><i class='fa fa-pencil'></i></a>`;
}

function selectFormatter(_val, row) {
  return `<a href="/pages/chapters/chapter.html?seriesId=${row.seriesId}&groupId=${row._id}" class="btn btn-secondary btn-sm">Seleccionar</a>`;
}

function summaryFormatter(value) {
  if (!value) return "N/A";
  if (value.length > 100) {
    return value.substring(0, 100) + "...";
  }
  return value;
}

const onEditGroup = (id) => {
  groupId = id;
  const group = availableGroups.find((g) => g._id === id);
  if (!group) return;

  $("#txtGroupName").val(group.title);
  $("#txtCoverUrl").val(group.coverUrl);
  $("#txtSummary").val(group.description);
  $("#groupType").val(group.type);
  $("#txtSortOrder").val(group.sortOrder);

  $("#groupModal").modal("show");
};

function onNewGroup() {
  groupId = "";

  $("#txtGroupName").val("");
  $("#txtCoverUrl").val("");
  $("#txtSummary").val("");
  $("#groupType").val("volume");
  $("#txtSortOrder").val("");

  $("#groupModal").modal("show");
  $("#txtGroupName").focus();
}

function onUpdateGroup() {
  const title = $("#txtGroupName").val().trim();
  const coverUrl = $("#txtCoverUrl").val().trim();
  const description = $("#txtSummary").val().trim();
  const type = $("#groupType").val();
  const sortOrder = parseInt($("#txtSortOrder").val().trim()) || 0;

  if (title === "") {
    swal.fire({
      title: "Validación",
      text: "El nombre del grupo es obligatorio.",
      icon: "warning",
    });
    return;
  }

  let payload = {
    seriesId: seriesId,
    title: title,
    coverUrl: coverUrl,
    description: description,
    type: type,
    sortOrder: sortOrder,
  };

  let path = groupId
    ? `${serverUrl}api/v1/groups/update/${groupId}`
    : `${serverUrl}api/v1/groups/add`;

  let method = groupId ? "PUT" : "POST";

  showLoader("Guardando grupo...");

  var success = function (data) {
    hideLoader();
    $("#groupModal").modal("hide");
    fetchGroups();
    swal.fire({
      title: "Éxito",
      text: `El grupo ha sido ${
        groupId ? "actualizado" : "creado"
      } exitosamente.`,
      icon: "success",
    });
  };

  var error = function (err) {
    hideLoader();
    console.error("Error saving group:", err);
    swal.fire({
      title: "Error",
      text: "Ocurrió un error al guardar el grupo. Por favor, intenta de nuevo.",
      icon: "error",
    });
  };

  callAPI(method, path, JSON.stringify(payload), success, error);
}
