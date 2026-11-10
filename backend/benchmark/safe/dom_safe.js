el.textContent = location.hash;
el.innerHTML = "<b>loading...</b>";
el.innerHTML = DOMPurify.sanitize(location.search);
