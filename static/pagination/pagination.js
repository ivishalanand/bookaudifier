var form = document.getElementById("pagination-form");

document.getElementById("next-click").addEventListener("click", function () {
    var queryPartial = document.getElementById("next-click").value
    var nextPage = parseInt(document.getElementById("page-number").innerHTML) + 1
    var nextPageQuery = queryPartial.concat(nextPage)
    document.getElementById("next-click").value = nextPageQuery
    console.log(document.getElementById("next-click").value)
    form.submit();
});

document.getElementById("prev-click").addEventListener("click", function () {
    var queryPartial = document.getElementById("prev-click").value
    var nextPage = parseInt(document.getElementById("page-number").innerHTML) - 1
    var nextPageQuery = queryPartial.concat(nextPage)
    document.getElementById("prev-click").value = nextPageQuery
    console.log(document.getElementById("prev-click").value)
    form.submit();
});

if (parseInt(document.getElementById("page-number").innerHTML)==1) {
    document.getElementById("prev-click").style.display = 'none'
  }