---
layout: page
title: All Notes
id: notes
permalink: /notes/
---

<div class="hero-section">
  <h1 class="hero-title">All <span class="accent">Notes</span></h1>
  <p class="hero-subtitle">Browse through all my thoughts and ideas</p>
</div>

<section class="notes-section">
  <div class="notes-grid">
    {% assign sorted_notes = site.notes | sort: 'date' | reverse %}
    {% for note in sorted_notes %}
      <article class="note-card">
        <div class="note-card-content">
          <h3 class="note-card-title">
            <a class="internal-link" href="{{ note.url }}">{{ note.title }}</a>
          </h3>
          {% if note.excerpt %}
            <p class="note-card-excerpt">{{ note.excerpt }}</p>
          {% endif %}
          <div class="note-card-meta">
            {% if note.date %}{{ note.date | date: "%B %d, %Y" }}{% endif %}
          </div>
        </div>
      </article>
    {% endfor %}
  </div>
</section> 