(function (DjangoQL) {
  'use strict';

  DjangoQL.DOMReady(function () {
    // Replace standard search input with textarea
    var textarea,
        textareaWrapper;
    var input = document.querySelector('input[name=q]');
    if (!input) {
      return;
    }
    textareaWrapper = document.createElement('div');
    textareaWrapper.className = input.id + '__wrap';
    textarea = document.createElement('textarea');
    textarea.value = input.value;
    textarea.id = input.id;
    textarea.name = input.name;
    textarea.rows = 10;
    textarea.setAttribute('maxlength', 2000);
    textareaWrapper.appendChild(textarea);
    input.parentNode.insertBefore(textareaWrapper, input);
    input.parentNode.removeChild(input);
    textarea.focus();

    DjangoQL.init({
      introspections: 'introspect/',
      syntaxHelp: 'djangoql-syntax/',
      selector: 'textarea[name=q]',
      autoResize: true
    });
  });
}(window.DjangoQL));
