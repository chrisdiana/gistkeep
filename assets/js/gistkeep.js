class GistKeep {
  constructor(token, id = "", options = {}) {
    this.token = token;
    this.id = id;
    this.baseUrl = "https://api.github.com/gists";
    this.filename = "bookmarks.md";
    this.notesFilename = "notes.md";
    this.data = null;
    this.separator = "----------";
    this.encryptContent = options.encryptContent || false;
    this.encryptionKey = options.encryptionKey || null;

    this.errorMessages = {
      "file-not-found":
        "No GistKeep file found. The gist exists but doesn't contain a bookmarks.md file.",
      "gist-not-found":
        "Gist ID not found. Please check the ID or create a new gist.",
      "invalid-credentials":
        "Invalid GitHub token. Please check your token and try again.",
      "network-error":
        "Network error. Please check your connection and try again.",
      "rate-limit":
        "GitHub API rate limit exceeded. Please wait and try again.",
      "generic-error": "An unexpected error occurred. Please try again.",
    };
  }

  setId(id) {
    this.id = id;
  }

  getHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `token ${this.token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "GistKeep-App",
    };
  }

  getUrl(id = null) {
    let url = this.baseUrl;
    if (id) {
      url += `/${id}`;
    }
    return url;
  }

  async makeRequest(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(this.parseError(response.status, data.message));
      }

      return data;
    } catch (error) {
      if (error.message.includes("Failed to fetch")) {
        throw new Error(this.errorMessages["network-error"]);
      }
      throw error;
    }
  }

  parseError(status, message = "") {
    switch (status) {
      case 401:
        return this.errorMessages["invalid-credentials"];
      case 403:
        if (message.includes("rate limit")) {
          return this.errorMessages["rate-limit"];
        }
        return this.errorMessages["invalid-credentials"];
      case 404:
        return this.errorMessages["gist-not-found"];
      default:
        return message || this.errorMessages["generic-error"];
    }
  }

  async createGist(description = "GistKeep", files = {}, isPublic = false) {
    const data = {
      description,
      public: isPublic,
      files,
    };

    return this.makeRequest(this.getUrl(), {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async addCategory(category) {
    if (!category || !category.trim()) {
      throw new Error("List name is required");
    }

    category = category.trim();
    const normalizedCategory = category.toLowerCase();
    const categories = this.getCategories();
    if (
      categories.some(
        (existingCategory) =>
          existingCategory.toLowerCase() === normalizedCategory,
      )
    ) {
      throw new Error(`List "${category}" already exists`);
    }

    const content = this.getContent();
    const newContent = content + `\n\n## ${category}`;

    const idx = newContent.indexOf(this.separator);
    const newCategoryLink = `* [${category}](#${category.toLowerCase().replace(/\s+/g, "-")})\n`;
    const updatedContent =
      newContent.slice(0, idx) + newCategoryLink + newContent.slice(idx);

    return this.saveGist(updatedContent);
  }

  async renameCategory(oldCategory, newCategory) {
    if (
      !oldCategory ||
      !oldCategory.trim() ||
      !newCategory ||
      !newCategory.trim()
    ) {
      throw new Error("Both list names are required");
    }

    oldCategory = oldCategory.trim();
    newCategory = newCategory.trim();
    const normalizedNewCategory = newCategory.toLowerCase();

    if (oldCategory === newCategory) {
      return this.data;
    }

    const categories = this.getCategories();
    if (!categories.includes(oldCategory)) {
      throw new Error(`List "${oldCategory}" not found`);
    }

    if (
      categories.some(
        (category) => category.toLowerCase() === normalizedNewCategory,
      )
    ) {
      throw new Error(`List "${newCategory}" already exists`);
    }

    const oldAnchor = oldCategory.toLowerCase().replace(/\s+/g, "-");
    const newAnchor = newCategory.toLowerCase().replace(/\s+/g, "-");
    const lines = this.getContent().split("\n");

    const updatedLines = lines.map((line) => {
      if (line.trim() === `## ${oldCategory}`) {
        return `## ${newCategory}`;
      }

      if (line.trim() === `* [${oldCategory}](#${oldAnchor})`) {
        return `* [${newCategory}](#${newAnchor})`;
      }

      return line;
    });

    return this.saveGist(updatedLines.join("\n"));
  }

  async deleteCategory(categoryToDelete, destinationCategory) {
    if (!categoryToDelete || !categoryToDelete.trim()) {
      throw new Error("List name is required");
    }

    if (!destinationCategory || !destinationCategory.trim()) {
      throw new Error("Destination list is required");
    }

    categoryToDelete = categoryToDelete.trim();
    destinationCategory = destinationCategory.trim();

    if (categoryToDelete === destinationCategory) {
      throw new Error("Destination list must be different");
    }

    const categories = this.getCategories();
    if (!categories.includes(categoryToDelete)) {
      throw new Error(`List "${categoryToDelete}" not found`);
    }

    if (!categories.includes(destinationCategory)) {
      throw new Error(`Destination list "${destinationCategory}" not found`);
    }

    const deletedAnchor = categoryToDelete.toLowerCase().replace(/\s+/g, "-");
    const lines = this.getContent().split("\n");
    const movedBookmarks = [];
    const keptLines = [];
    let inDeletedCategory = false;
    let foundDeletedCategory = false;

    for (const line of lines) {
      if (line.trim() === `* [${categoryToDelete}](#${deletedAnchor})`) {
        continue;
      }

      if (line.startsWith("## ")) {
        if (line.trim() === `## ${categoryToDelete}`) {
          inDeletedCategory = true;
          foundDeletedCategory = true;
          continue;
        }

        inDeletedCategory = false;
      }

      if (inDeletedCategory) {
        if (line.startsWith("* [")) {
          movedBookmarks.push(line);
        }
        continue;
      }

      keptLines.push(line);
    }

    if (!foundDeletedCategory) {
      throw new Error(`List "${categoryToDelete}" not found`);
    }

    if (movedBookmarks.length === 0) {
      return this.saveGist(keptLines.join("\n"));
    }

    const targetHeadingIndex = keptLines.findIndex(
      (line) => line.trim() === `## ${destinationCategory}`,
    );
    if (targetHeadingIndex === -1) {
      throw new Error(`Destination list "${destinationCategory}" not found`);
    }

    const insertAt = targetHeadingIndex + 1;
    keptLines.splice(insertAt, 0, ...movedBookmarks);

    return this.saveGist(keptLines.join("\n"));
  }

  async saveGist(newContent) {
    if (!this.data) {
      throw new Error("No gist data loaded. Please load the gist first.");
    }

    this.setContent(newContent);

    return this.makeRequest(this.getUrl(this.id), {
      method: "PATCH",
      body: JSON.stringify(this.data),
    });
  }

  async saveBookmark(title, link, category, tags = []) {
    if (!title || !link || !category) {
      throw new Error("Title, link, and list are required");
    }

    title = title.trim() || link;
    link = link.trim();
    category = category.trim();
    tags = Array.isArray(tags)
      ? tags.filter((tag) => tag.trim()).map((tag) => tag.trim())
      : [];

    // Validate URL
    try {
      new URL(link);
    } catch {
      throw new Error("Invalid URL format");
    }

    const content = this.getContent();
    const categoryTitle = `## ${category}`;
    const categoryIndex = content.indexOf(categoryTitle);

    if (categoryIndex === -1) {
      throw new Error(`List "${category}" not found. Please create it first.`);
    }

    // Format tags for markdown
    const tagString =
      tags.length > 0
        ? ` ${tags.map((tag) => `#${tag.replace(/\s+/g, "-")}`).join(" ")}`
        : "";
    const newLink = `\n* [${title}](${link})${tagString}`;
    const insertIndex = categoryIndex + categoryTitle.length;
    const newContent =
      content.slice(0, insertIndex) + newLink + content.slice(insertIndex);

    return this.saveGist(newContent);
  }

  async updateBookmark(
    originalTitle,
    originalCategory,
    newTitle,
    newUrl,
    newCategory,
    newTags = [],
  ) {
    if (!originalTitle || !originalCategory) {
      throw new Error("Original title and list are required");
    }

    if (!newTitle || !newUrl || !newCategory) {
      throw new Error("New title, URL, and list are required");
    }

    // First remove the old bookmark
    await this.removeBookmark(originalTitle, originalCategory);

    // Then add the updated bookmark
    return this.saveBookmark(newTitle, newUrl, newCategory, newTags);
  }

  async removeBookmark(title, category) {
    if (!title || !category) {
      throw new Error("Title and list are required");
    }

    const content = this.getContent();
    const lines = content.split("\n");
    let foundBookmark = false;
    let inCategory = false;

    const newLines = lines.filter((line) => {
      if (line.startsWith(`## ${category}`)) {
        inCategory = true;
        return true;
      }
      if (line.startsWith("## ") && !line.startsWith(`## ${category}`)) {
        inCategory = false;
        return true;
      }
      if (inCategory && line.includes(`[${title}]`)) {
        foundBookmark = true;
        return false; // Remove this line
      }
      return true;
    });

    if (!foundBookmark) {
      throw new Error(`Bookmark "${title}" not found in list "${category}"`);
    }

    return this.saveGist(newLines.join("\n"));
  }

  getCategories() {
    if (!this.data) {
      return [];
    }

    const content = this.getContent();
    const categoryMatches = content.match(/^##\s+(.+)$/gm);

    if (!categoryMatches) {
      return [];
    }

    return categoryMatches
      .map((match) => match.replace(/^##\s+/, "").trim())
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }

  getBookmarks() {
    if (!this.data) {
      return {};
    }

    const content = this.getContent();
    const lines = content.split("\n");
    const bookmarks = {};
    let currentCategory = null;

    for (const line of lines) {
      const categoryMatch = line.match(/^##\s+(.+)$/);
      if (categoryMatch) {
        currentCategory = categoryMatch[1].trim();
        bookmarks[currentCategory] = [];
        continue;
      }

      // Updated regex to capture tags after the URL
      const bookmarkMatch = line.match(/^\*\s+\[([^\]]+)\]\(([^)]+)\)(.*)$/);
      if (bookmarkMatch && currentCategory) {
        const title = bookmarkMatch[1];
        const url = bookmarkMatch[2];
        const tagsString = bookmarkMatch[3] || "";

        // Extract tags from the string (format: #tag1 #tag2)
        const tags = tagsString.match(/#[\w-]+/g) || [];
        const cleanTags = tags.map((tag) => tag.slice(1).replace(/-/g, " "));

        bookmarks[currentCategory].push({
          title,
          url,
          category: currentCategory,
          tags: cleanTags,
        });
      }
    }

    return bookmarks;
  }

  searchBookmarks(query) {
    if (!query || !query.trim()) {
      return this.getBookmarks();
    }

    const allBookmarks = this.getBookmarks();
    const filteredBookmarks = {};
    const searchTerm = query.toLowerCase().trim();

    for (const [category, bookmarks] of Object.entries(allBookmarks)) {
      const matchingBookmarks = bookmarks.filter(
        (bookmark) =>
          bookmark.title.toLowerCase().includes(searchTerm) ||
          bookmark.url.toLowerCase().includes(searchTerm) ||
          bookmark.category.toLowerCase().includes(searchTerm) ||
          bookmark.tags.some((tag) => tag.toLowerCase().includes(searchTerm)),
      );

      if (matchingBookmarks.length > 0) {
        filteredBookmarks[category] = matchingBookmarks;
      }
    }

    return filteredBookmarks;
  }

  getFileContent(filename, defaultContent = null) {
    if (!this.data || !this.data.files) {
      throw new Error("No gist content available");
    }

    const file = this.data.files[filename];
    if (!file) {
      if (defaultContent !== null) {
        return defaultContent;
      }
      throw new Error(`No gist content available for ${filename}`);
    }

    const rawContent = file.content || "";

    // Decrypt content if encryption is enabled
    if (this.encryptContent && this.encryptionKey) {
      try {
        return this.decryptGistContent(rawContent);
      } catch (error) {
        // If decryption fails, might be unencrypted content
        console.warn(
          "Failed to decrypt content, assuming unencrypted:",
          error.message,
        );
        return rawContent;
      }
    }

    return rawContent;
  }

  getContent() {
    return this.getFileContent(this.filename);
  }

  setFileContent(filename, content) {
    if (!this.data) {
      throw new Error("No gist data to update");
    }

    if (!this.data.files) {
      this.data.files = {};
    }

    if (!this.data.files[filename]) {
      this.data.files[filename] = {};
    }

    // Encrypt content if encryption is enabled
    const finalContent =
      this.encryptContent && this.encryptionKey
        ? this.encryptGistContent(content)
        : content;

    this.data.files[filename].content = finalContent;
    return content; // Return original content, not encrypted
  }

  setContent(content) {
    return this.setFileContent(this.filename, content);
  }

  getDefaultNotesContent() {
    return "# Notes\n\n";
  }

  normalizeNote(note = {}) {
    return {
      id:
        note.id ||
        `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      content: typeof note.content === "string" ? note.content.trim() : "",
      tags: Array.isArray(note.tags)
        ? note.tags.map((tag) => tag.trim()).filter(Boolean)
        : [],
      createdAt: note.createdAt || new Date().toISOString(),
      updatedAt: note.updatedAt || note.createdAt || new Date().toISOString(),
    };
  }

  escapeNoteMetadata(value) {
    return String(value).replace(/\n/g, " ").trim();
  }

  renderNotesMarkdown(notes = []) {
    const normalizedNotes = notes.map((note) => this.normalizeNote(note));
    const header = this.getDefaultNotesContent().trimEnd();

    if (normalizedNotes.length === 0) {
      return `${header}\n`;
    }

    const sections = normalizedNotes.map((note) => {
      const body = note.content ? `${note.content}\n` : "";
      const tagsLine =
        note.tags.length > 0
          ? `Tags: ${note.tags.map((tag) => `#${tag.replace(/\s+/g, "-")}`).join(" ")}`
          : "";
      const lines = [
        "---",
        "",
        `ID: ${this.escapeNoteMetadata(note.id)}`,
        `Created: ${this.escapeNoteMetadata(note.createdAt)}`,
        `Updated: ${this.escapeNoteMetadata(note.updatedAt)}`,
      ];

      if (tagsLine) {
        lines.push(tagsLine);
      }

      lines.push("", body.trimEnd());

      return lines.join("\n").trimEnd();
    });

    return `${header}\n\n${sections.join("\n\n")}\n`;
  }

  parseNotesMarkdown(rawNotes) {
    const normalized = (rawNotes || "").replace(/\r\n/g, "\n").trim();
    if (!normalized) {
      return [];
    }

    if (!normalized.startsWith("# Notes")) {
      throw new Error("Failed to parse notes data");
    }

    const body = normalized
      .replace(/^# Notes\s*/, "")
      .replace(/^---\s*/, "")
      .trim();
    if (!body) {
      return [];
    }

    const sections = body
      .split(/\n\s*---\s*\n/)
      .map((section) => section.trim())
      .filter(Boolean);

    return sections.map((section) => {
      const lines = section.split("\n");
      const metadata = {};

      while (lines.length > 0) {
        const line = lines[0];
        if (!line.trim()) {
          lines.shift();
          break;
        }

        const separatorIndex = line.indexOf(":");
        if (separatorIndex === -1) {
          break;
        }

        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim();
        metadata[key] = value;
        lines.shift();
      }

      const content = lines.join("\n").trim();
      const tags = (metadata.Tags || "").match(/#[\w-]+/g) || [];

      return this.normalizeNote({
        id: metadata.ID,
        content,
        tags: tags.map((tag) => tag.slice(1).replace(/-/g, " ")),
        createdAt: metadata.Created,
        updatedAt: metadata.Updated,
      });
    });
  }

  getNotes() {
    if (!this.data) {
      return [];
    }

    const rawNotes = this.getFileContent(
      this.notesFilename,
      this.getDefaultNotesContent(),
    );

    if (!rawNotes || !rawNotes.trim()) {
      return [];
    }

    return this.parseNotesMarkdown(rawNotes);
  }

  async saveNotes(notes) {
    if (!Array.isArray(notes)) {
      throw new Error("Notes data must be an array");
    }

    this.setFileContent(this.notesFilename, this.renderNotesMarkdown(notes));

    return this.makeRequest(this.getUrl(this.id), {
      method: "PATCH",
      body: JSON.stringify(this.data),
    });
  }

  async addNote(content = "", tags = []) {
    if (!content || !content.trim()) {
      throw new Error("Note content is required");
    }

    const now = new Date().toISOString();
    const notes = this.getNotes();
    notes.unshift({
      id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      content: content.trim(),
      tags: Array.isArray(tags)
        ? tags.map((tag) => tag.trim()).filter(Boolean)
        : [],
      createdAt: now,
      updatedAt: now,
    });

    return this.saveNotes(notes);
  }

  async updateNote(noteId, updates = {}) {
    if (!noteId) {
      throw new Error("Note ID is required");
    }

    const notes = this.getNotes();
    const noteIndex = notes.findIndex((note) => note.id === noteId);
    if (noteIndex === -1) {
      throw new Error("Note not found");
    }

    const nextContent = (updates.content ?? notes[noteIndex].content).trim();
    const nextTags = Array.isArray(updates.tags)
      ? updates.tags.map((tag) => tag.trim()).filter(Boolean)
      : notes[noteIndex].tags;

    if (!nextContent) {
      throw new Error("Note content is required");
    }

    notes[noteIndex] = {
      ...notes[noteIndex],
      content: nextContent,
      tags: nextTags,
      updatedAt: new Date().toISOString(),
    };

    return this.saveNotes(notes);
  }

  async deleteNote(noteId) {
    if (!noteId) {
      throw new Error("Note ID is required");
    }

    const notes = this.getNotes();
    const nextNotes = notes.filter((note) => note.id !== noteId);
    if (nextNotes.length === notes.length) {
      throw new Error("Note not found");
    }

    return this.saveNotes(nextNotes);
  }

  searchNotes(query) {
    const notes = this.getNotes();
    if (!query || !query.trim()) {
      return notes;
    }

    const searchTerm = query.toLowerCase().trim();
    return notes.filter(
      (note) =>
        note.content.toLowerCase().includes(searchTerm) ||
        note.tags.some((tag) => tag.toLowerCase().includes(searchTerm)),
    );
  }

  getNote(noteId) {
    return this.getNotes().find((note) => note.id === noteId) || null;
  }

  getAllNoteTags() {
    const tags = new Set();
    this.getNotes().forEach((note) => {
      note.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }

  filterNotesByTags(tags) {
    if (!tags || tags.length === 0) {
      return this.getNotes();
    }

    const searchTags = tags.map((tag) => tag.toLowerCase());
    return this.getNotes().filter((note) =>
      note.tags.some((tag) => searchTags.includes(tag.toLowerCase())),
    );
  }

  getManagedFileContents() {
    return {
      [this.filename]: this.getFileContent(this.filename),
      [this.notesFilename]: this.renderNotesMarkdown(this.getNotes()),
    };
  }

  async saveManagedFiles(fileContents) {
    Object.entries(fileContents).forEach(([filename, content]) => {
      this.setFileContent(filename, content);
    });

    return this.makeRequest(this.getUrl(this.id), {
      method: "PATCH",
      body: JSON.stringify(this.data),
    });
  }

  encryptGistContent(content) {
    if (!this.encryptionKey) {
      throw new Error("Encryption key required for content encryption");
    }
    try {
      // Use the same encryption function as the app
      return CryptoJS.AES.encrypt(content, this.encryptionKey).toString();
    } catch (error) {
      throw new Error("Failed to encrypt content: " + error.message);
    }
  }

  decryptGistContent(encryptedContent) {
    if (!this.encryptionKey) {
      throw new Error("Encryption key required for content decryption");
    }
    try {
      // Use the same decryption function as the app
      const bytes = CryptoJS.AES.decrypt(encryptedContent, this.encryptionKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      if (!decrypted) {
        throw new Error("Failed to decrypt content - invalid encryption key");
      }
      return decrypted;
    } catch (error) {
      throw new Error("Failed to decrypt content: " + error.message);
    }
  }

  async getGist() {
    if (!this.id) {
      throw new Error("No gist ID provided");
    }

    const data = await this.makeRequest(this.getUrl(this.id));

    if (!data.files) {
      throw new Error(this.errorMessages["gist-not-found"]);
    }

    if (!data.files[this.filename]) {
      throw new Error(this.errorMessages["file-not-found"]);
    }

    this.data = data;
    return this.data;
  }

  async ensureManagedFiles() {
    if (!this.data) {
      throw new Error("No gist data loaded. Please load the gist first.");
    }

    let hasChanges = false;

    if (!this.data.files[this.notesFilename]) {
      this.setFileContent(this.notesFilename, this.getDefaultNotesContent());
      hasChanges = true;
    }

    if (hasChanges) {
      await this.makeRequest(this.getUrl(this.id), {
        method: "PATCH",
        body: JSON.stringify(this.data),
      });
    }

    return this.data;
  }

  async setup() {
    const initialContent = `# GistKeep

${this.separator}

## Getting Started
* [GistKeep Documentation](https://github.com/your-repo/gistkeep)
* [GitHub Gists](https://gist.github.com)
`;
    const initialNotes = this.getDefaultNotesContent();
    const bookmarkFileContent =
      this.encryptContent && this.encryptionKey
        ? this.encryptGistContent(initialContent)
        : initialContent;
    const notesFileContent =
      this.encryptContent && this.encryptionKey
        ? this.encryptGistContent(initialNotes)
        : initialNotes;

    const data = {
      description: "GistKeep - Personal Bookmark Manager",
      public: false,
      files: {
        [this.filename]: {
          content: bookmarkFileContent,
        },
        [this.notesFilename]: {
          content: notesFileContent,
        },
      },
    };

    const result = await this.makeRequest(this.getUrl(), {
      method: "POST",
      body: JSON.stringify(data),
    });

    this.id = result.id;
    this.data = result;
    return result;
  }

  // Utility method to get bookmark count for a category
  getCategoryBookmarkCount(category) {
    const bookmarks = this.getBookmarks();
    return bookmarks[category] ? bookmarks[category].length : 0;
  }

  // Get total bookmark count
  getTotalBookmarkCount() {
    const bookmarks = this.getBookmarks();
    return Object.values(bookmarks).reduce(
      (total, categoryBookmarks) => total + categoryBookmarks.length,
      0,
    );
  }

  // Get all unique tags from bookmarks
  getAllTags() {
    const allBookmarks = this.getBookmarks();
    const tags = new Set();

    Object.values(allBookmarks).forEach((categoryBookmarks) => {
      categoryBookmarks.forEach((bookmark) => {
        bookmark.tags.forEach((tag) => tags.add(tag));
      });
    });

    return Array.from(tags).sort();
  }

  // Filter bookmarks by specific tags
  filterByTags(tags) {
    if (!tags || tags.length === 0) {
      return this.getBookmarks();
    }

    const allBookmarks = this.getBookmarks();
    const filteredBookmarks = {};
    const searchTags = tags.map((tag) => tag.toLowerCase());

    for (const [category, bookmarks] of Object.entries(allBookmarks)) {
      const matchingBookmarks = bookmarks.filter((bookmark) =>
        bookmark.tags.some((tag) => searchTags.includes(tag.toLowerCase())),
      );

      if (matchingBookmarks.length > 0) {
        filteredBookmarks[category] = matchingBookmarks;
      }
    }

    return filteredBookmarks;
  }

  // Get specific bookmark details for editing
  getBookmarkDetails(title, category) {
    const bookmarks = this.getBookmarks();
    const categoryBookmarks = bookmarks[category] || [];

    return categoryBookmarks.find((bookmark) => bookmark.title === title);
  }

  // Validate gist structure
  validateGistStructure() {
    try {
      const content = this.getContent();
      return content.includes(this.separator);
    } catch {
      return false;
    }
  }
}
