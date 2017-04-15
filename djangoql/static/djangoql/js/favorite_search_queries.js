(function($) {
  $(document).ready(function() {
    var searchToolbox = $('#toolbar');
    var searchQueriesBoxTemplate = '' +
      '<div class="search-queries__control-wrap">' +
        '<a class="search-queries__control js-toggle-saved-searches" href="#">' +
          'toggle saved searches' +
        '</a>' +
        '' +
      '</div>' +
      '<div id="search-queries">' +
        '<div><input type="search" placeholder="Type to filter" id="search-queries-filter"></div>' +
        '<ul id="search-queries-list">' +
        '</ul>' +
      '</div>' +
      '';
    var favoriteIconTemplate = '<a href="#" class="js-add-search-query icon icon_favorite-inactive"></a></div>';
    searchToolbox.append(searchQueriesBoxTemplate);

    // NOTE: something shit, maybe related with completion_admin.js
    setTimeout(function () {
      searchToolbox.find('.searchbar__wrap').append(favoriteIconTemplate);
      FavoriteQuery.addSearchQuery();
      FavoriteQuery.listSearchQueries();
    }, 0);

    $('.js-toggle-saved-searches').click(function (e) {
      e.preventDefault();
      $('#search-queries').toggle();
    });
    searchToolbox.on('keyup', '#searchbar',function() {
      FavoriteQuery.updateStateAddingButton();
    });
  });


  var FavoriteQuery = {

    listSearchQueries: function () {
      $.get({url: 'favorite_queries/'})
        .done(function(data) {
          var favoriteSearchQueryTemplate = '' +
              '<li data-id="{_id_}">' +
                '<a href="#" class="js-delete-query icon icon_delete"></a> ' +
                // '<a href="#">share</a> ' +
                '<a href="#" class="search-query">{_value_}</a>' +
              '</li>';
          var searchQueries = $.map(data.items, function (value, id) {
            var title = favoriteSearchQueryTemplate
              .replace('{_id_}', id)
              .replace('{_value_}', value);
            return title;
          });

          $('#toolbar').find('#search-queries-list').html(searchQueries);
          $('#toolbar').find('.search-query').on('click', function (e) {
            e.preventDefault();
            // TODO: need start trigger for textareaResize
            $('#searchbar').val($(this).text());
            FavoriteQuery.updateStateAddingButton();
          });
          FavoriteQuery.updateStateAddingButton();
          FavoriteQuery.deleteSearchQuery();
          FavoriteQuery.filterSearchQueries();
        });
    },

    updateStateAddingButton: function () {
      var searchQueryItems = $('#toolbar').find('.search-query');
      var saveIcon = $('.js-add-search-query');
      saveIcon.removeClass('icon_favorite');
      saveIcon.addClass('icon_favorite-inactive');

      searchQueryItems.each(function () {
        if ($(this).text() === $('#searchbar').val()) {
          saveIcon.removeClass('icon_favorite-inactive');
          saveIcon.addClass('icon_favorite');
          return false;
        }
      });
    },

    addSearchQuery: function () {
      var saveIcon = $('#toolbar').find('.js-add-search-query');
      var csrftoken = getCookie('csrftoken');

      $.ajaxSetup({
        beforeSend: function(xhr, settings) {
          if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
          }
        }
      });

      saveIcon.on('click', function (e) {
        e.preventDefault();
        if ($(this).hasClass("icon_favorite")) return;
        $.post({
          url: 'save_search_query/',
          data: {
            search_query: $('#searchbar').val(),
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val()
          },
        })
        .done(function(data) {
          FavoriteQuery.listSearchQueries();
        });

      });
    },

    deleteSearchQuery: function () {
      var searchToolbox = $('#toolbar');
      searchToolbox.find('.js-delete-query').on('click', function (e) {
        e.preventDefault();
        var searchItem = $(this).closest('li');
        searchItem.hide();
        $.get({
          url: 'delete_search_query/' + searchItem.data('id')
        }).done(function () {
          searchItem.remove();
          FavoriteQuery.updateStateAddingButton();
        }).fail(function () {
          searchItem.show();
        });
      });
    },

    filterSearchQueries: function () {
      var searchQueryItems = $('#toolbar').find('.search-query');
      $('#search-queries-filter').on('keyup search', function () {
        var value = $(this).val();
        var item;
        var parent;

        searchQueryItems.each(function () {
          item = $(this);
          parent = item.closest('li');
          if (item.text().indexOf(value) >= 0) {
            parent.show();
          } else {
            parent.hide();
          }
        });
      });
    }

  };


  // https://docs.djangoproject.com/en/1.10/ref/csrf/#ajax
  function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        var cookie = $.trim(cookies[i]);
        // Does this cookie string begin with the name we want?
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
  }

})(django.jQuery);
