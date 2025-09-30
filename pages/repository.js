var serverUrl = "http://localhost:3700/";

function callAPI(type, url, data, success, error) {
  var params = {
    type: type,
    contentType: "application/json",
    dataType: "json",
    url: url,
    data: data,
    success: success,
    error: error,
  };
  $.ajax(params);
}
