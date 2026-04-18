let availableSamples = [];
let tableData = [];
let voiceId = "";

$(document).ready(function () {
  validateSession();
  init();

  initComponents();
  fetchSamples();
});

function initComponents() {
  $("#ddlModel").selectpicker();
  $("#ddlVoice").change(function () {
    filterModels();
  });

  $("#btnPlayModel").click(() => playSelectedSample("#ddlModel"));
  $("#btnPlayVoice").click(() => playSelectedSample("#ddlVoice"));

  $("#btnCreateCharacter").click(function () {
    onCreateCharacter();
  });
}

const fetchDBVoices = () => {
  showLoader("Cargando Voces...")
  let path = `${serverUrl}api/v1/novels/voices`;
  var success = function (data) {
    hideLoader();

    voicesData = data;
    mergeVoiceData();
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

const mergeVoiceData = () => {
  const merged = tableData.map(v => {
    const details = voicesData.find(d => d.filePath === v.filePath);

    return {
      ...v,
      ...(details || {})
    };
  });

  tableData = merged;

  loadTable();
};

const fetchSamples = () => {
  let path = `${serverUrl}api/v1/samples/get`;
  var success = function (data) {
    if (!data || data.length == 0 || data === "undefined") {
      return;
    }

    availableSamples = data;

    loadVoices();

    if (availableSamples.length <= 0) return;

    tableData = availableSamples;
    fetchDBVoices();
    //loadTable();
  };

  var error = function (err) {
    console.error("Error fetching voice models:", err);
  };
  callAPI("GET", path, null, success, error);
}

const loadVoices = () => {
  let voices = "";
  availableSamples.forEach((voice) => {
    voices += `<option value="${voice.voiceName}" data-sampler-src="${voice.filePath}">[${voice.country}] - ${voice.voiceName}</option>`;
  });
  $("#ddlVoice").html(voices);
  $("#ddlVoice").selectpicker();
};

const filterModels = () => {
  let filterVoice = $("#ddlVoice").val();

  const voice = availableSamples.find(v => v.voiceName === filterVoice);
  const filteredModels = voice ? voice.models : [];

  let models = "";
  filteredModels.forEach((model) => {
    models += `<option value="${model.modelName}" data-sampler-src="${model.filePath}">${model.modelName}</option>`;
  });
  $("#ddlModel").html(models);
  $("#ddlModel").selectpicker("refresh");
}

//#region audio player
const audio = $("#audioPreview")[0];
const progress = $("#audioProgress");
const btnPlay = $("#btnAudioPlay");

let isDragging = false;

function playSelectedSample(select) {
  const sample = $(select).find(":selected").data("sampler-src");

  if (!sample) return;

  audio.src = encodeURI("/" + sample);;
  audio.play();

  btnPlay.text("⏸");
}

// PLAY / PAUSE
btnPlay.click(function () {
  if (audio.paused) {
    audio.play();
    btnPlay.text("⏸");
  } else {
    audio.pause();
    btnPlay.text("▶");
  }

});

audio.addEventListener("timeupdate", () => {
  if (isDragging) return;

  const percent = (audio.currentTime / audio.duration) * 100;
  progress.val(percent);

  updateTimeDisplay();
});

progress.on("input", function () {
  isDragging = true;

  const time = audio.duration * (this.value / 100);
  audio.currentTime = time;
});

progress.on("change", function () {
  isDragging = false;
});

function updateTimeDisplay() {
  const current = formatTime(audio.currentTime);
  const total = formatTime(audio.duration);

  $("#audioTime").text(`${current} / ${total}`);
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";

  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);

  return `${m}:${s.toString().padStart(2, "0")}`;
}
//#endregion

const playTableSample = (sample) => {
  console.log(sample);
  if (!sample) return;

  audio.src = encodeURI("/" + sample);;
  audio.play();

  btnPlay.text("⏸");
};

function editVoiceData(filePath) {
  let voiceData = tableData.find(v => v.filePath == filePath);

  $("#voicesModal").modal("show");

  $("#txtLanguage").val(voiceData.language ?? "");
  $("#txtGroup").val(voiceData.group ?? "");
  $("#txtModel").val(voiceData.model ?? "");
  $("#txtVoice").val(voiceData.voiceName ?? "");
}

const loadTable = () => {
  $("#voicesTable").bootstrapTable("destroy");
  $("#voicesTable").bootstrapTable({
    data: tableData,
  });
};

function countryFormatter(country) {
  return `<img src="../vendor/flags/${country}.svg" alt="Country ${country}" style="width: 25px; height: auto;" />`;
}

function sampleFormatter(filePath) {
  return `<a href="#" onclick="playTableSample('${filePath.replaceAll("\\", "/")}')"><i class="fa fa-circle-play"></i></a>`;
}

function editFormatter(filePath) {
  return `<a href="#" onclick="editVoiceData('${filePath.replaceAll("\\", "\\\\")}')"><i class="fa fa-pencil"></i></a>`;
}

function ageRangeFormatter(_minAge, voice) {
  return ``;
}