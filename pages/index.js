$(document).ready(function () {
  validateSession();
  init();

  $("button.navbar-toggle").click();
});

const onSearchNovel = () => {
  let search = $("#txtSearch").val();
  if (search && search.length > 0) {
    fetchNovels(search);
  }
};

const fetchNovels = (search) => {
  //TODO: Fetch novels from Scrapper API
  console.log("Fetching novels for search: " + search);
};
