var form = document.getElementById("pagination-form");

document.getElementById("next-click").addEventListener("click", function () {
    var queryPartial = document.getElementById("next-click").value
    var nextPage = parseInt(document.getElementById("page-number").innerHTML) + 1
    var nextPageQuery = queryPartial.concat(nextPage)
    document.getElementById("next-click").value = nextPageQuery
    form.submit();
});

document.getElementById("prev-click").addEventListener("click", function () {
    var queryPartial = document.getElementById("prev-click").value
    var nextPage = parseInt(document.getElementById("page-number").innerHTML) - 1
    var nextPageQuery = queryPartial.concat(nextPage)
    document.getElementById("prev-click").value = nextPageQuery
    form.submit();
});

if (parseInt(document.getElementById("page-number").innerHTML)==1) {
    document.getElementById("prev-click").style.display = 'none'
  }


function generateAudiobook(query) {
  document.getElementById(query).submit();
  document.querySelectorAll('.overlay')[0].style.display ="flex"
}

