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

function changeNoCover() {
    var a = new Image();
    var count = document.getElementsByClassName("book-card__img").length;
    for (i = 0; i < count; i++) {
        srcElement = document.getElementsByClassName("book-card__img")[i]['src'];
        a.src = srcElement;
        if (a.width == 210) {
            document.getElementsByClassName("book-card__img")[i]['src'] = "https://i.imgur.com/BxgcRaS.jpeg";
            console.log("Book number: ".concat(i))
            console.log("Cover changed from ".concat( srcElement," to ", "https://i.imgur.com/BxgcRaS.jpeg" ))
        }
    }
}

function getCorrectCover(cover_pic_link) {
    var a = new Image();
    a.src = cover_pic_link;
    if (a.width == 210) {
        return "https://i.imgur.com/BxgcRaS.jpeg";
    }
    return cover_pic_link
}

window.onload  = changeNoCover;
