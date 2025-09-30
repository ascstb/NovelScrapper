var displayName = "";
var photoUrl = "";
var email = "";
var shoppingCart = [];

function isSessionActive() {
  let email = sessionStorage.getItem("email");
  if (email == undefined || email == null || email.length == 0) {
    return false;
  }

  retrieveSession();

  return true;
}

function validateSession() {
  if (!isSessionActive()) {
    logout();
    return;
  }
}

function saveSession(userData) {
  for (key in userData) {
    sessionStorage.setItem(key, userData[key]);
  }

  let dName = userData["displayName"];
  if (dName == null || dName.length == 0) {
    displayName = userData["email"];
    sessionStorage.setItem("displayName", displayName);
  }

  let photo = userData["photoUrl"];
  if (photo == null || photo.length == 0) {
    photoUrl = "/pages/img/undraw_profile.svg";
    sessionStorage.setItem("photoUrl", photoUrl);
  }
}

function retrieveSession() {
  console.log("SessionJS_retrieveSession");
  email = sessionStorage.getItem("email");
  displayName = sessionStorage.getItem("displayName");
  photoUrl = sessionStorage.getItem("photoUrl");
}

function logout() {
  console.log("SessionJS_logout: ");
  sessionStorage.clear();
  window.location.href = "/pages/auth/login.html";
}

function clearShoppingCart() {
  shoppingCart = [];
  localStorage.setItem("shoppingCart", "");
}

function saveShoppingCart() {
  localStorage.setItem("shoppingCart", JSON.stringify(shoppingCart));
}

function restoreShoppingCart() {
  let temp = JSON.parse(localStorage.getItem("shoppingCart"));
  if (temp == null) {
    shoppingCart = [];
  } else {
    shoppingCart = temp;
  }
}
