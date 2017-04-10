function main() {
  enableDragging();
  getAuthor();
}

function enableDragging() {
  const $draggable = $('.draggable').draggabilly();

  const quill = new Quill('#editor-container', {
    modules: {
      toolbar: [['bold', 'italic']]
    },
    placeholder: 'Write a poem!',
    theme: 'snow'
  });


  $("#poem-form").click(function() {
    $("#hidden-form").val(quill.root.innerHTML);
  });
}


function getAuthor() {
    const req = new XMLHttpRequest();
    const url = 'https://crossorigin.me/http://poetrydb.org/author';
    req.open('GET', url, true);

    req.addEventListener('load', function() {
      if (req.status >= 200 && req.status < 400) {
        const data = JSON.parse(req.responseText);
        const index = getRandomInt(0, data.authors.length);
        const author = data.authors[index];
        getPoem(author);
      }
    })

    req.send();
}

function getPoem(author) {
    const req = new XMLHttpRequest();
    const url = 'https://crossorigin.me/http://poetrydb.org/author/' + author;
    req.open('GET', url, true);

    req.addEventListener('load', function() {
      if (req.status >= 200 && req.status < 400) {
        const data = JSON.parse(req.responseText);
        const index = getRandomInt(0, data.length);

        let poem = '';
        data[index].lines.forEach(line => {
          poem += line + '<br/>';
        })

        document.getElementsByClassName('example-poem')[0].innerHTML = poem;
      }
    })

    req.send();
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

$(document).ready(main);
