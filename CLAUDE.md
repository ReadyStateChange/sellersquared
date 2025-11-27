# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
Be terse. Sacrifice grammar for concision.

## Project Overview

This is a blog website built with Astro.js and styled with Tailwind CSS v4. The site includes:
- Blog posts managed through Astro's content collections
- Static site generation with RSS feed support
- Responsive design using Tailwind CSS
- MDX support for rich content

## Common Commands

```bash
# Development
npm run dev          # Start dev server at localhost:3000
npm run start        # Alias for dev

# Build & Deploy
npm run build        # Build production site to ./dist/
npm run preview      # Preview build locally

# Astro CLI
npm run astro        # Access Astro CLI commands
```

## Architecture

### Content Management
- Blog posts are stored in `src/content/posts/` as Markdown files
- Content schema defined in `src/content/config.ts` with required fields: title, pubDate, description, author, tags, published
- Posts are filtered by `published: true` status via `getPublishedPosts()` utility in `src/utils/posts.ts`

### Styling System
- Uses Tailwind CSS v4 (beta) with CSS-only configuration
- All styles defined in `src/styles/global.css` using `@theme` directive
- Custom fonts: Inter (sans), Gilda Display (display), JetBrains Mono (mono)
- Custom blue color palette defined in CSS variables

### Site Structure
- Pages in `src/pages/` follow file-based routing
- Dynamic routes: `posts/[...slug].astro` for individual posts, `tags/[tag].astro` for tag pages
- Layouts: `BaseLayout.astro` (main), `MarkdownPostLayout.astro` (blog posts)
- Components organized in `src/components/` with subdirectories for different sections

### Configuration
- Site URL configured in `astro.config.mjs` (currently set to placeholder)
- Integrations: sitemap, MDX
- Markdown drafts enabled, Shiki syntax highlighting with CSS variables theme