---
layout: page
title: Home
id: home
permalink: /
---

<h1>{{ site.title }}</h1>

<section>
  <h2 class="accent-heading">Some <span class="accent">Notes</span></h2>
  <div class="notes-list">
    {% assign sorted_notes = site.notes | sort: 'date' | reverse %}
    {% for note in sorted_notes %}
      <div class="note-item">
        <a class="note-title internal-link" href="{{ note.url }}">{{ note.title }}</a>
        <div class="note-meta">
          {% if note.author %}{{ note.author }} · {% endif %}{% if note.date %}{{ note.date | date: "%Y-%m-%d" }}{% endif %}
        </div>
      </div>
    {% endfor %}
  </div>
</section>
