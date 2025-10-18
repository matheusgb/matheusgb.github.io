---
layout: default
title: Tópicos
description: Explore posts por tópicos e categorias no blog do Matheus Gomes.
---

# Tópicos

Explore os posts por categorias e temas:

{% for tag in collections.tagList %}

<div class="py-3 border-b border-gray-700">
  <a href="/topicos/{{ tag | downcase }}" class="text-xl font-semibold text-white hover:text-gray-300 transition-colors">
    {{ tag | capitalize }}
  </a>
  <span class="text-gray-400 ml-2">
    ({{ collections[tag].length }} {% if collections[tag].length == 1 %}post{% else %}posts{% endif %})
  </span>
</div>
{% endfor %}

{% if collections.tagList.size == 0 %}

<p class="text-gray-400 italic">Nenhum tópico encontrado ainda.</p>
{% endif %}
