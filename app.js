const STORAGE_KEY = "notizen";
const EMPTY_NOTE_ERROR = "Bitte gib einen Titel oder einen Text ein.";
const SAVE_FAILED_ERROR = "Die Änderung konnte nicht dauerhaft gespeichert werden.";

const form = document.getElementById("note-form");
const titleInput = document.getElementById("note-title");
const textInput = document.getElementById("note-text");
const errorMessage = document.getElementById("form-error");
const emptyMessage = document.getElementById("empty-message");
const noteList = document.getElementById("note-list");
const searchInput = document.getElementById("search-input");
const noResultsMessage = document.getElementById("no-results-message");

let notes = loadNotes();
// Id of the note currently being edited, or null.
let editingId = null;
// Id of a note that was just created or saved. It stays visible even if it
// doesn't match the search, until the search term changes.
let keepVisibleId = null;

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

function createButton(label, action, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset.action = action;
  button.className = className;
  return button;
}

function renderNoteView(note) {
  const item = document.createElement("li");
  item.className = "note";
  item.dataset.id = note.id;

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

  const actions = document.createElement("div");
  actions.className = "note-actions";
  actions.append(
    createButton("Bearbeiten", "edit", "button-secondary"),
    createButton("Löschen", "delete", "button-danger")
  );
  item.append(actions);

  return item;
}

function renderNoteEditor(note) {
  const item = document.createElement("li");
  item.className = "note note-editing";
  item.dataset.id = note.id;

  const editForm = document.createElement("form");
  editForm.className = "edit-form";
  editForm.noValidate = true;

  const titleId = `edit-title-${note.id}`;
  const textId = `edit-text-${note.id}`;

  const titleLabel = document.createElement("label");
  titleLabel.htmlFor = titleId;
  titleLabel.textContent = "Titel";

  const titleField = document.createElement("input");
  titleField.id = titleId;
  titleField.type = "text";
  titleField.name = "title";
  titleField.autocomplete = "off";
  titleField.value = note.title;

  const textLabel = document.createElement("label");
  textLabel.htmlFor = textId;
  textLabel.textContent = "Text";

  const textField = document.createElement("textarea");
  textField.id = textId;
  textField.name = "text";
  textField.rows = 4;
  textField.value = note.text;

  const error = document.createElement("p");
  error.className = "form-error";
  error.setAttribute("role", "alert");

  const actions = document.createElement("div");
  actions.className = "note-actions";
  const saveButton = document.createElement("button");
  saveButton.type = "submit";
  saveButton.textContent = "Speichern";
  saveButton.className = "button-primary";
  actions.append(saveButton, createButton("Abbrechen", "cancel", "button-secondary"));

  editForm.append(titleLabel, titleField, textLabel, textField, error, actions);
  item.append(editForm);

  // Enter in the title field submits this form, like in the create form.
  editForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = titleField.value.trim();
    const text = textField.value.trim();

    if (!title && !text) {
      error.textContent = EMPTY_NOTE_ERROR;
      titleField.focus();
      return;
    }

    note.title = title;
    note.text = text;
    note.updatedAt = new Date().toISOString();
    editingId = null;
    keepVisibleId = note.id;
    showError(saveNotes() ? "" : SAVE_FAILED_ERROR);
    renderNotes();
    focusNoteButton(note.id, "edit");
  });

  editForm.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      cancelEditing();
    }
  });

  const clearError = () => {
    error.textContent = "";
  };
  titleField.addEventListener("input", clearError);
  textField.addEventListener("input", clearError);

  return item;
}

function renderNotes() {
  noteList.replaceChildren();
  emptyMessage.hidden = notes.length > 0;

  for (const note of notes) {
    noteList.append(note.id === editingId ? renderNoteEditor(note) : renderNoteView(note));
  }

  applySearch();
}

function normalize(value) {
  return value.toLocaleLowerCase("de");
}

function matchesSearch(note, query) {
  return normalize(note.title).includes(query) || normalize(note.text).includes(query);
}

// Hides non-matching notes without re-rendering, so an open editor
// keeps its unsaved input while the user types in the search field.
function applySearch() {
  const query = normalize(searchInput.value.trim());
  let visibleCount = 0;

  for (const item of noteList.children) {
    const note = notes.find((n) => n.id === item.dataset.id);
    // The note being edited stays visible so its changes aren't lost from view,
    // and so does a note that was just created or saved.
    const visible =
      !query || note.id === editingId || note.id === keepVisibleId || matchesSearch(note, query);
    item.hidden = !visible;
    if (visible) visibleCount++;
  }

  noResultsMessage.hidden = notes.length === 0 || visibleCount > 0;
}

function focusNoteButton(id, action) {
  const item = noteList.querySelector(`[data-id="${CSS.escape(id)}"]`);
  item?.querySelector(`[data-action="${action}"]`)?.focus();
}

function startEditing(id) {
  editingId = id;
  renderNotes();
  noteList.querySelector(".note-editing input")?.focus();
}

function cancelEditing() {
  const id = editingId;
  editingId = null;
  renderNotes();
  focusNoteButton(id, "edit");
}

function deleteNote(id) {
  const note = notes.find((n) => n.id === id);
  if (!note) return;

  const name = note.title ? `„${note.title}“` : "diese Notiz";
  if (!confirm(`Möchtest du ${name} wirklich löschen?`)) return;

  notes = notes.filter((n) => n.id !== id);
  if (editingId === id) editingId = null;
  showError(saveNotes() ? "" : SAVE_FAILED_ERROR);
  renderNotes();
  titleInput.focus();
}

function showError(message) {
  errorMessage.textContent = message;
}

noteList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = button.closest(".note").dataset.id;

  if (button.dataset.action === "edit") startEditing(id);
  else if (button.dataset.action === "delete") deleteNote(id);
  else if (button.dataset.action === "cancel") cancelEditing();
});

form.addEventListener("submit", (event) => {
  // The browser also submits the form when Enter is pressed in the title field.
  event.preventDefault();

  const title = titleInput.value.trim();
  const text = textInput.value.trim();

  if (!title && !text) {
    showError(EMPTY_NOTE_ERROR);
    titleInput.focus();
    return;
  }

  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  notes.unshift({
    id,
    title,
    text,
    createdAt: new Date().toISOString(),
  });
  keepVisibleId = id;

  showError(saveNotes() ? "" : SAVE_FAILED_ERROR);
  renderNotes();
  form.reset();
  titleInput.focus();
});

titleInput.addEventListener("input", () => showError(""));
textInput.addEventListener("input", () => showError(""));
searchInput.addEventListener("input", () => {
  keepVisibleId = null;
  applySearch();
});

renderNotes();
