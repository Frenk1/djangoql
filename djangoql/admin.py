import json

from django.conf.urls import url
from django.contrib import admin, messages
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import FieldError, ValidationError
from django.http import HttpResponse
from django.views.generic import TemplateView

from .compat import text_type
from .exceptions import DjangoQLError
from .queryset import apply_search
from .schema import DjangoQLSchema
from .models import FavoriteSearch


class DjangoQLSearchMixin(object):
    search_fields = ('_djangoql',)  # just a stub to have search input displayed
    djangoql_completion = True
    djangoql_schema = DjangoQLSchema
    djangoql_syntax_help_template = 'djangoql/syntax_help.html'

    def get_search_results(self, request, queryset, search_term):
        use_distinct = False
        if not search_term:
            return queryset, use_distinct
        try:
            return (
                apply_search(queryset, search_term, self.djangoql_schema),
                use_distinct,
            )
        except (DjangoQLError, ValueError, FieldError) as e:
            msg = text_type(e)
        except ValidationError as e:
            msg = e.messages[0]
        queryset = queryset.none()
        messages.add_message(request, messages.WARNING, msg)
        return queryset, use_distinct

    @property
    def media(self):
        media = super(DjangoQLSearchMixin, self).media
        if self.djangoql_completion:
            media.add_js((
                'djangoql/js/lib/lexer.js',
                'djangoql/js/completion.js',
                'djangoql/js/completion_admin.js',
                'djangoql/js/favorite_search_queries.js',
            ))
            media.add_css({'': (
                'djangoql/css/completion.css',
                'djangoql/css/completion_admin.css',
                'djangoql/css/favorite_search_queries.css',
            )})
        return media

    def get_urls(self):
        custom_urls = []
        if self.djangoql_completion:
            custom_urls += [
                url(
                    r'^favorite_queries/$',
                    self.admin_site.admin_view(self.favorite_queries),
                    name='%s_%s_favorite_queries' % (
                        self.model._meta.app_label,
                        self.model._meta.model_name,
                    ),
                ),
                url(
                    r'^save_search_query/$',
                    self.admin_site.admin_view(self.save_search_query),
                    name='%s_%s_save_search_query' % (
                        self.model._meta.app_label,
                        self.model._meta.model_name,
                    ),
                ),
                url(
                    r'^toggle_public_search_query/$',
                    self.admin_site.admin_view(self.toggle_public_search_query),
                    name='%s_%s_toggle_public_search_query' % (
                        self.model._meta.app_label,
                        self.model._meta.model_name,
                    ),
                ),
                url(
                    r'^delete_search_query/(?P<item_id>\d+)/$',
                    self.admin_site.admin_view(self.delete_search_query),
                    name='%s_%s_delete_search_query' % (
                        self.model._meta.app_label,
                        self.model._meta.model_name,
                    ),
                ),
                url(
                    r'^introspect/$',
                    self.admin_site.admin_view(self.introspect),
                    name='%s_%s_djangoql_introspect' % (
                        self.model._meta.app_label,
                        self.model._meta.model_name,
                    ),
                ),
                url(
                    r'^djangoql-syntax/$',
                    TemplateView.as_view(
                        template_name=self.djangoql_syntax_help_template,
                    ),
                    name='djangoql_syntax_help',
                ),
            ]
        return custom_urls + super(DjangoQLSearchMixin, self).get_urls()

    def http_response(self, context):
        return HttpResponse(
            content=json.dumps(context, indent=2),
            content_type='application/json; charset=utf-8',
        )

    def introspect(self, request):
        response = self.djangoql_schema(self.model).as_dict()
        return self.http_response(response)

    def save_search_query(self, request):
        search_query = request.POST.get('search_query')
        response = {"success": False}

        if search_query:
            model_contenttype = ContentType.objects.get(
                                    app_label=self.model._meta.app_label,
                                    model=self.model._meta.model_name)

            _, created = FavoriteSearch.objects.get_or_create(
                            model_contenttype=model_contenttype,
                            user=request.user,
                            search_query=search_query)

            response = {"success": True}
        return self.http_response(response)

    def favorite_queries(self, request):
        items = FavoriteSearch.objects.filter(user=request.user) \
                    .values_list('id', 'search_query')
        return self.http_response({"items": dict(items)})

    def toggle_public_search_query(self, request):
        pass
        # items = FavoriteSearchQuery.objects.filter(user=request.user).values_list('search_query', flat=True)
        # return self.http_response({"items": list(items)})

    def delete_search_query(self, request, item_id):
        response = {"success": False}
        if request.user.is_superuser:
            filter_options = dict(id=item_id)
        else:
            filter_options = dict(id=item_id, user=request.user)
        item = FavoriteSearch.objects.get(**filter_options)
        if item.delete():
            response = {"success": True}
        return self.http_response(response)


@admin.register(FavoriteSearch)
class FavoriteSearchAdmin(admin.ModelAdmin):
    list_display = ('model_contenttype', 'search_query',)

    def get_queryset(self, request):
        qs = super(FavoriteSearchAdmin, self).get_queryset(request)
        return qs.filter(user=request.user)

