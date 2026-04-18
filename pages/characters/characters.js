let availableSamples = [];

$(document).ready(function () {
  validateSession();
  init();

  initComponents();
  fetchNovels();
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

function onCreateCharacter() {
  const novel = $("#ddlNovel").val();
  const model = $("#ddlModel").val();
  const voice = $("#ddlVoice").val();

  if (!novel || !model || !voice) {
    Swal.fire({
      title: "Advertencia",
      text: `Por favor completa todas las selecciones.`,
      icon: "warning",
    });
    return;
  }

  const payload = {
    novel,
    model,
    voice
  };

  console.log("Creating character:", payload);

  // call API
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
  };

  var error = function (err) {
    console.error("Error fetching voice models:", err);
  };
  callAPI("GET", path, null, success, error);
}

const fetchSamples = () => {
  let path = `${serverUrl}api/v1/samples/get`;
  var success = function (data) {
    if (!data || data.length == 0 || data === "undefined") {
      return;
    }

    availableSamples = data;

    loadVoices();
  };

  var error = function (err) {
    console.error("Error fetching voice models:", err);
  };
  callAPI("GET", path, null, success, error);
}

const loadVoices = () => {
  let voices = "";
  availableSamples.forEach((voice) => {
    voices += `<option value="${voice.voiceName}" data-sampler-src="${voice.models[0].filePath}">[${voice.country}] - ${voice.voiceName}</option>`;
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

