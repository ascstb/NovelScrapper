let currentCharacter = "";
let selectedNovel = "";
let availableCharacters = [];
let characters = [];
let editingFileName = "";

$(document).ready(function () {
  validateSession();
  init();

  initEditor();

  fetchNovels();
  fetchCharacters();
  fetchVoiceModels();
  fetchVoiceModelIndexes();
  fetchTTSVoices();
});

function initEditor() {
  // Este código hace que el nombre del archivo aparezca al seleccionarlo
  $(".custom-file-input").on("change", function () {
    editingFileName = $(this).val().split("\\").pop();
    $(this).siblings(".custom-file-label").addClass("selected").html(editingFileName);
  });

  const editor = document.getElementById('editor');

  editor.ondrop = function (e) {
    e.preventDefault();

    const characterName = e.dataTransfer.getData("text/plain");
    const character = characters.find(c => c.name == characterName);
    let simpleName = character.name.replace("{{", "").replace("}}", "");

    const characterTag = `<span class="character" contenteditable="false" style="background-color: ${character.backgroundColor};">${simpleName}</span>&nbsp;`;

    let range;
    let sel = window.getSelection();

    if (document.caretRangeFromPoint) {
      // Chrome, Edge, Safari
      range = document.caretRangeFromPoint(e.clientX, e.clientY);
    } else if (e.rangeParent) {
      // Firefox (uses rangeParent y rangeOffset)
      range = document.createRange();
      range.setStart(e.rangeParent, e.rangeOffset);
      range.collapse(true);
    }

    if (!range) {
      console.log(`It doesn't work`);
      return;
    }
    sel.removeAllRanges();
    sel.addRange(range);

    if (!document.execCommand('insertHTML', false, characterTag)) {
      // Fallback manual si execCommand falla
      range.deleteContents();
      const el = document.createElement("div");
      el.innerHTML = characterTag;
      const frag = document.createDocumentFragment();
      let node, lastNode;
      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node);
      }
      range.insertNode(frag);
    }
  };

  $("#charactersContainer").hide();

  $("#txtCharacterFilter").on("input", function () {
    // 1. Obtener el texto del filtro en minúsculas
    var value = $(this).val().toLowerCase();

    // 2. Filtrar cada elemento 'li' dentro de la lista
    $("#ulCharacters li").filter(function () {
      // toggle(condición) muestra el elemento si es true, lo oculta si es false
      $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
    });
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
      characters = availableCharacters.find(c => c.novelName === selectedNovel).characters;
      updateCharacterList();
      $("#charactersContainer").show();
      $("#txtCharacterFilter").focus();
    });
  };

  var error = function (err) {
    console.error("Error fetching novels:", err);
  };
  callAPI("GET", path, null, success, error);
}

const fetchCharacters = () => {
  let path = `${serverUrl}api/v1/novels/characters`;
  var success = function (data) {
    if (!data || data.length == 0 || data === "undefined") {
      return;
    }

    availableCharacters = data;

    if (selectedNovel.trim().length == 0) return;
    characters = availableCharacters.find(c => c.novelName === selectedNovel).characters;
    updateCharacterList();
  }
  var error = function (err) {
    console.error("Error fetching characters:", err);
  };
  callAPI("GET", path, null, success, error);
}

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

function onUploadFile() {
  const input = document.getElementById('inputGroupFile02');

  // Validations
  if (!input.files || !input.files[0]) {
    Swal.fire({
      title: "Advertencia",
      text: `Por favor selecciona un archivo primero.`,
      icon: "warning",
    })
    return;
  }

  const file = input.files[0];
  const reader = new FileReader();

  // check when file read
  reader.onload = function (e) {
    const fileContent = e.target.result;

    let html = "";
    const splitContent = fileContent.split("\n");

    const dynamicPattern = /{{(.*?)}}/g;

    splitContent.forEach(p => {
      tag = p.replace(dynamicPattern, function (match) {
        let tagSimpleName = match.replace("{{", "").replace("}}", "");
        let c = characters.find(x => x.name.toLowerCase() == tagSimpleName.toLowerCase());

        if (c) {
          return `<span class="character" contenteditable="false" style="background-color: ${c.backgroundColor}">${tagSimpleName}</span>`;
        } else {
          return `<span class="character" contenteditable="false">${tagSimpleName}</span>`;
        }
      });
      html += `<p>${tag}</p>`
    });

    $("#editor").html(html);

    updateCharacterList();

    enableDragAndDrop();
  };

  // 4. Leer como texto (puedes usar readAsDataURL si es una imagen)
  reader.readAsText(file);
}

function onDragCharacter(event, name) {
  event.dataTransfer.setData("text/plain", `${name}`);
}

function enableDragAndDrop() {
  const items = document.querySelectorAll('#ulCharacters .list-group-item');
  items.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      item.classList.add('dragging');
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
    });
  });
}

function updateCharacterList() {
  let liCharacters = characters
    .map(c => `<li class="list-group-item" draggable="true" ondragstart="onDragCharacter(event, '${c.name}')" style="background-color:${c.backgroundColor}; color: ${c.textColor};">${c.name}</li>`)
    .join("");

  $("#ulCharacters").html(liCharacters);
}

function onAddCharacter() {
  const txtAddCharacter = $("#txtAddCharacter");
  let characterName = txtAddCharacter.val();

  const chExists = characters.some(c => c.name === characterName);

  const colorInput = document.getElementById('colorPicker');
  const bColor = colorInput.value;

  if (!chExists) {
    characters.push({
      name: characterName,
      backgroundColor: bColor
    });
  }

  updateCharacterList();

  txtAddCharacter.val("");
  txtAddCharacter.focus();
}

function onEditCharacter() {
  $("#characterModal").modal("show");
  $("#modalTitle").text(`Editar Personaje - ${selectedNovel.replace(/\b\w/g, c => c.toUpperCase())}`);
}

function onUpdateCharacter() {
  let characterName = $("#txtCharacterName").val();
  let bColor = $("#backgroundColorPicker").val();
  let tColor = $("#textColorPicker").val();
  let model = $("#ddlVoiceModel").val();
  let index = $("#ddlVoiceModelIndex").val();
  let voice = $("#ddlTTSVoice").val();

  let character = {
    novelName: selectedNovel,
    name: characterName,
    backgroundColor: bColor,
    textColor: tColor,
    voiceModel: model,
    voiceModelIndex: index,
    voiceTTS: voice
  }
  let path = `${serverUrl}api/v1/novels/character`;

  var error = function (err) {
    console.error("Error updating character:", err);
    Swal.fire({
      title: "Error",
      text: `No se pudo actualizar el personaje.`,
      icon: "warning",
    });
  };

  var success = function (data) {
    $("#characterModal").modal("hide");

    fetchCharacters();
  };

  callAPI("POST", path, JSON.stringify(character), success, error);
}

function onSaveFile() {
  const regex = /<span[^>]*>(.*?)<\/span>(&nbsp;)?/g;
  const temp = $("#editor").html().replace(regex, '{{$1}} ');
  const content = temp
    .replace(/<p>/g, "")
    .replace(/<\/p>/g, "\n")
    .replace(/&nbsp;/, "")
    .trim();

  const contentType = "text/plain";
  const blob = new Blob([content], { type: contentType });

  const url = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = editingFileName;

  document.body.appendChild(a);
  a.click();

  // 5. Limpieza: eliminar el elemento y liberar la URL
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

function onCleanFile() {
  let temp = $("#editor").html();

  let html = temp
    .replace(/Changing Star/g, "Estrella Cambiante")
    .replace(/Cambiante Estelar/g, "Estrella Cambiante")
    .replace(/Cambio Estelar/g, "Estrella Cambiante")
    .replace(/Cambiante Estrella/g, "Estrella Cambiante")
    .replace(/Cambiando Estrella/g, "Estrella Cambiante")
    .replace(/Estrellita Cambiante/g, "Estrella Cambiante")
    .replace(/Nefi /g, "Nefis ")
    .replace(/Nefi,/g, "Nefis,")
    .replace(/Nefi\./g, "Nefis.")
    .replace(/Nephis/g, "Nefis")
    .replace(/Soleado/g, "Sunny")
    .replace(/ echo/g, " Eco")
    .replace(/ Echo/g, " Eco")
    .replace(/ echoes/g, " Ecos")
    .replace(/ Echoes/g, " Ecos")
    .replace(/ReadNovelFull\.me/g, "")
    .replace(/\*\*\*/g, "")
    .replace(/Cassie/g, "Cassia")
    .replace(/Ca\.s\.sie/g, "Cassia")
    .replace(/Ca\.s\.sia/g, "Cassia")
    .replace(/Carapaz/g, "Acorazado")
    .replace(/Demonio Carapazón/g, "Demonio Acorazado");

  $("#editor").html(html);
}