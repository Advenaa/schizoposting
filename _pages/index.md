---
layout: page
title: Home
id: home
permalink: /
---

<section class="wide-content">
  <h2 class="accent-heading">Latest <span class="accent">Notes</span></h2>
  <div class="notes-list">
    {% assign sorted_notes = site.notes | sort: 'date' | reverse %}
    {% for note in sorted_notes limit:10 %}
      <div class="note-item">
        <a class="note-title internal-link" href="{{ note.url }}">{{ note.title }}</a>
        <div class="note-meta">
          {% if note.author %}{{ note.author }} · {% endif %}{% if note.date %}{{ note.date | date: "%Y-%m-%d" }}{% endif %}
        </div>
      </div>
    {% endfor %}
  </div>
  {% if site.notes.size > 10 %}
    <div class="view-all-notes">
      <a href="/notes" class="internal-link">View all notes →</a>
    </div>
  {% endif %}
</section>
