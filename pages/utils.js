const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

function dateToUTC(date) {
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );
}

async function getTemplate(name, onDone) {
  if (
    Handlebars.templates === undefined ||
    Handlebars.templates[name] === undefined
  ) {
    $.ajax({
      url: "/pages/templates/" + name + ".hbs",
      success: function (data) {
        if (Handlebars.templates === undefined) {
          Handlebars.templates = {};
        }
        Handlebars.templates[name] = Handlebars.compile(data);
        onDone();
      },
      error: function (err) {
        console.log(err);
      },
      async: true,
    });
  }
}

function init() {
  $("#sUserName").text(displayName);
  $("#iUserProfilePicture").attr("src", photoUrl);
}

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",

  // These options are needed to round to whole numbers if that's what you want.
  //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
  //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
});

const initUI = async () => {
  $(".modal").on("shown.bs.modal", function () {
    $(this).find("[autofocus]").focus();
  });
};

const showLoader = (message) => {
  $("#loaderContainer").css("display", "flex");
  $("#loaderMessage").text(message);
};

const hideLoader = () => {
  $("#loaderContainer").css("display", "none");
  $("#loaderMessage").text("");
};
