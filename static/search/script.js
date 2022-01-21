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
    var prevPage = parseInt(document.getElementById("page-number").innerHTML) - 1
    var prevPageQuery = queryPartial.concat(prevPage)
    document.getElementById("prev-click").value = prevPageQuery
    form.submit();
});

if (parseInt(document.getElementById("page-number").innerHTML)==1) {
    document.getElementById("prev-click").style.display = 'none'
    document.getElementById("page-number").style.display =  "none"
  }


function generateAudiobook(query) {
  document.getElementById(query).submit();
  document.querySelectorAll('.overlay')[0].style.display ="flex"
}

