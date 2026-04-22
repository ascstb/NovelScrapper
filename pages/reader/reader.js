let fontSize = 18;
let selectedNovel = "";
let selectedChapter = "";
let availableNovels = [];
let availableChapters = [];

$(document).ready(function () {
  validateSession();
  init();

  initScreen();

  fetchNovels();
});

function initScreen() {
  $("#btnThemeWhite").click(function () {
    $("#readerContainer").removeClass("bg-dark").removeClass("bg-white").removeClass("text-white").removeClass("text-dark");
    $("#readerContainer").addClass("bg-white").addClass("text-dark");
  });
  $("#btnThemeDark").click(function () {
    $("#readerContainer").removeClass("bg-dark").removeClass("bg-white").removeClass("text-white").removeClass("text-dark");
    $("#readerContainer").addClass("bg-dark").addClass("text-white");
  });

  $("#fontPlus").click(function () {
    fontSize += 2;
    $("#dReader").css("font-size", fontSize + "px");
  });

  $("#fontMinus").click(function () {
    fontSize -= 2;
    $("#dReader").css("font-size", fontSize + "px");
  });

  $("#rContainerWidth").on("input", function () {
    $("#dReader").css("max-width", $(this).val() + "px");
  });

  $("#rLineSpacing").on("input", function () {
    $("#dReader").css("line-height", $(this).val());
  });
}

const fetchNovels = () => {
  let path = `${serverUrl}api/v1/novels/get`;
  var success = function (data) {
    if (!data || data.length == 0 || data === "undefined") {
      return;
    }

    let options = "";
    data.forEach((novel) => {
      options += `<option value="${novel.name}">${novel.name.replace(/\b\w/g, c => c.toUpperCase())}</option>`;
    });

    $("#ddlNovel").html(options);
    $("#ddlNovel").selectpicker();
    $("#ddlNovel").change(function () {
      selectedNovel = $(this).val();

      if (selectedNovel.trim().length == 0) return;
      fetchChapters();
    });
  };

  var error = function (err) {
    console.error("Error fetching novels:", err);
  };
  callAPI("GET", path, null, success, error);
}

const fetchChapters = () => {
  let path = `${serverUrl}api/v1/novels/getChapters`;

  let params = {
    novel: selectedNovel,
    language: "spanish"
  }

  var success = function (data) {
    if (!data || data.length == 0 || data === "undefined") {
      return;
    }

    let options = "";
    data.forEach((chapter) => {
      options += `<option value="${chapter.path}">${chapter.name.replace("-", " ").replace(".txt", "")}</option>`;
    });

    $("#ddlChapters").html(options);
    $("#ddlChapters").selectpicker("refresh");
    $("#ddlChapters").change(function () {
      selectedChapter = $(this).val().replace(/\\/g, "/");

      loadChapter();
    });
  };

  var error = function (err) {
    console.error("Error fetching chapters:", err);
  };
  callAPI("POST", path, JSON.stringify(params), success, error);
};

const loadChapter = () => {
  let url = serverUrl + selectedChapter;
  $.get(url, function (data) {
    const formatted = data
      .split("\n")
      .filter(p => p.trim().length > 0)
      .map(p => `<p>${p}</p>`)
      .join("");

    $("#dReader").html(formatted);
  }).fail(function () {
    $("#dReader").text("Error loading file");
  });
}