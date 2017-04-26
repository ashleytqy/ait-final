function main() {
  enableDragging();
  getAuthor();
  getGif();
}

function getGif() {
    const req = new XMLHttpRequest();
    const url = 'http://api.giphy.com/v1/gifs/search?q=congrats&api_key=dc6zaTOxFJmzC';
    req.open('GET', url, true);

    req.addEventListener('load', function() {
      if (req.status >= 200 && req.status < 400) {
        const response = JSON.parse(req.responseText);
        const index = getRandomInt(0, response.data.length);
        const gif = response.data[index].images.original.url;
        document.getElementById("gif").src = gif;
      }
    })

    req.send();
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
    console.log('getting author.. please wait...')
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

        const author = data[index].author;
        const title = data[index].title;

        let poem = '';
        data[index].lines.forEach(line => {
          poem += line + '<br/>';
        })

        document.getElementsByClassName('example-poem-title')[0].innerHTML = `${title} by ${author}`;
        document.getElementsByClassName('example-poem-body')[0].innerHTML = poem;
      } else {
        const message = "Oop! Sorry"
        document.getElementsByClassName('example-poem-body')[0].innerHTML = message;
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
