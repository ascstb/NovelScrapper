// const { json } = require("stream/consumers");

$(document).ready(function () {
  if (isSessionActive()) {
    window.location.href = "/pages/index.html";
  }
});

function onLoginClicked() {
  console.log("LoginJS_onLoginClicked: ");
  let email = $("#txtEmail").val();
  let password = $("#txtPassword").val();
  var params = {
    email: email,
    password: password,
  };

  console.log(
    "LoginJS_onLoginClicked: email: " + email + ", password: " + password
  );

  let url = "../../api/v1/auth/signIn";
  let callType = "POST";

  var success = function (userData) {
    saveSession(userData);
    window.location.href = "/pages/index.html";
  };

  var error = function (err) {
    console.log(err.responseText);
    let res = JSON.parse(err.responseText);

    Swal.fire({
      title: "Hubo un problema",
      text: res.error.code,
      icon: "error",
    });
  };

  callAPI(callType, url, JSON.stringify(params), success, error);
}
