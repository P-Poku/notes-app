const STORAGE_KEY = "notizen";

const form = document.getElementById("note-form");
const titleInput = document.getElementById("note-title");
const textInput = document.getElementById("note-text");
const errorMessage = document.getElementById("form-error");
const emptyMessage = document.getElementById("empty-message");
const noteList = document.getElementById("note-list");

let notes = loadNotes();

function loadNotes() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    // Storage blocked or data corrupted: start with an empty list.
    return [];
  }
}

function saveNotes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    return true;
  } catch (error) {
    return false;
  }
}

function renderNotes() {
  noteList.replaceChildren();
  emptyMessage.hidden = notes.length > 0;

  for (const note of notes) {
    const item = document.createElement("li");
    item.className = "note";

    if (note.title) {
      const title = document.createElement("h3");
      title.className = "note-title";
      title.textContent = note.title;
      item.append(title);
    }

    if (note.text) {
      const text = document.createElement("p");
      text.className = "note-text";
      text.textContent = note.text;
      item.append(text);
    }

    noteList.append(item);
  }
}

function showError(message) {
  errorMessage.textContent = message;
}

form.addEventListener("submit", (event) => {
  // The browser also submits the form when Enter is pressed in the title field.
  event.preventDefault();

  const title = titleInput.value.trim();
  const text = textInput.value.trim();

  if (!title && !text) {
    showError("Bitte gib einen Titel oder einen Text ein.");
    titleInput.focus();
    return;
  }

  notes.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    title,
    text,
    createdAt: new Date().toISOString(),
  });

  if (!saveNotes()) {
    showError("Die Notiz konnte nicht dauerhaft gespeichert werden.");
  } else {
    showError("");
  }

  renderNotes();
  form.reset();
  titleInput.focus();
});

titleInput.addEventListener("input", () => showError(""));
textInput.addEventListener("input", () => showError(""));

renderNotes();
