const q = new URLSearchParams(location.search).get("q");
box.insertAdjacentHTML("beforeend", q);
document.write(document.referrer);
