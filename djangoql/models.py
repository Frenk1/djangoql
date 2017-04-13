# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.utils.text import Truncator


class FavoriteSearchQuery(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    search_query = models.TextField()
    model_contenttype = models.ForeignKey(ContentType, on_delete=models.CASCADE)

    def __unicode__(self):
        return Truncator(self.search_query).words(12)

    def __str__(self):
        return self.__unicode__()

    class Meta:
        verbose_name = 'My favorite search query'
        verbose_name_plural = 'My favorite search queries'
