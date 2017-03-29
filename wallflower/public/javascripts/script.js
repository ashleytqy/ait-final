$(document).ready( function() {
  const $draggable = $('.draggable').draggabilly();

  const quill = new Quill('#editor-container', {
    modules: {
      toolbar: [['bold', 'italic']]
    },
    placeholder: 'Write a poem!',
    theme: 'snow'
  });
});
