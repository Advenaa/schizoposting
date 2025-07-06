---
layout: page
title: Home
id: home
permalink: /
---

<h1>{{ site.title }}</h1>

<section>
  <h2>Latest</h2>
  {% assign latest_note = site.notes | sort: 'date' | last %}
  {% if latest_note %}
    <h3><a href="{{ latest_note.url }}">{{ latest_note.title }}</a></h3>
    {% if latest_note.date %}<p>{{ latest_note.date | date: "%B %e, %Y" }}</p>{% endif %}
    <p>{{ latest_note.excerpt | strip_html | truncate: 160 }}</p>
    <a href="{{ latest_note.url }}">Keep reading →</a>
  {% else %}
    <p>No notes yet.</p>
  {% endif %}
</section>

<hr/>

<section>
  <h2>Topics</h2>
  <div style="margin-bottom: 1.5em;">
    {% assign all_tags = site.notes | map: 'tags' | join: ',' | split: ',' | uniq | sort %}
    {% for tag in all_tags %}
      {% unless tag == '' %}
        <a href="{{ site.baseurl }}/tag/{{ tag | strip }}" style="margin-right: 1em;">{{ tag | strip }}</a>
      {% endunless %}
    {% endfor %}
  </div>
</section>

<hr/>

<section>
  <h2 class="accent-heading">Some <span class="accent">Notes</span></h2>
  <div class="notes-list">
    {% assign sorted_notes = site.notes | sort: 'date' | reverse %}
    {% for note in sorted_notes %}
      <div class="note-item">
        <a class="note-title" href="{{ note.url }}">{{ note.title }} <span class="note-arrow">&raquo;</span></a>
        <div class="note-meta">
          {% if note.author %}{{ note.author }} · {% endif %}{% if note.date %}{{ note.date | date: "%Y-%m-%d" }}{% endif %}
        </div>
      </div>
    {% endfor %}
  </div>
</section>
