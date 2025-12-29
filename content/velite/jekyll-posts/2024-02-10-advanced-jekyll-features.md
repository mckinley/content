---
title: Advanced Jekyll Features
layout: post
categories: [tutorials, jekyll]
tags: [liquid, templates, collections]
---

# Advanced Jekyll Features

Once you've mastered the basics, Jekyll offers powerful features for building complex sites.

## Liquid Templating

Jekyll uses Liquid for templating:

```liquid
{% for post in site.posts %}
  <h2>{{ post.title }}</h2>
  <p>{{ post.excerpt }}</p>
{% endfor %}
```

## Collections

Beyond posts, Jekyll supports custom collections:

```yaml
# _config.yml
collections:
  projects:
    output: true
    permalink: /projects/:name/
```

## Data Files

Store structured data in `_data/`:

```yaml
# _data/members.yml
- name: Alice
  role: Developer
- name: Bob
  role: Designer
```

Access in templates: `{{ site.data.members }}`

This separation of data and presentation is a powerful pattern.
