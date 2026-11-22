# CLAUDE.md

## Project

A simple notes app. Users can create, edit and delete notes. Each note has a title and a text body.

## Stack

- Plain HTML, CSS and JavaScript. No frameworks, no build step.
- `index.html`: markup
- `style.css`: styles
- `app.js`: all logic
- Notes are saved in the browser's `localStorage`.
- Hosted on GitHub Pages, served as static files straight from the repo.

## Running

Open `index.html` in a browser. There is nothing to install or build.

## Rules

- **All visible text is in German.** This covers labels, buttons, placeholders, messages, confirmation dialogs, the page `<title>` and `aria-label`s. Code, comments and identifiers can stay in English.
- **Ask before adding any library.** That includes CDN scripts, npm packages and web fonts.
- **Keep everything in the three files** (`index.html`, `style.css`, `app.js`). Don't add new source files, folders or tooling.
- Since there is no build step, the app must run as-is from the file system and on GitHub Pages. Use relative paths and avoid anything that needs a server or bundler, such as ES module imports across files.
