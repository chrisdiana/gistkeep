// Utility functions
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

function encrypt(text, key) {
  return CryptoJS.AES.encrypt(text, key).toString();
}

function decrypt(ciphertext, key) {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Decryption failed:", error);
    return "";
  }
}

// Storage utilities
class Storage {
  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Storage error:", error);
      return false;
    }
  }

  static get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error("Storage error:", error);
      return null;
    }
  }

  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("Storage error:", error);
      return false;
    }
  }
}

class SessionStorage {
  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Shared auth storage error:", error);
      return false;
    }
  }

  static get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error("Shared auth storage error:", error);
      return null;
    }
  }

  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("Shared auth storage error:", error);
      return false;
    }
  }
}

// Notification utility
class Notification {
  static show(message, type = "success", duration = 3000) {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; margin-left: auto; cursor: pointer;">✕</button>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, duration);
  }

  static success(message, duration) {
    this.show(message, "success", duration);
  }

  static error(message, duration) {
    this.show(message, "error", duration);
  }

  static warning(message, duration) {
    this.show(message, "warning", duration);
  }
}

// Modern GistKeep App
class GistKeepApp {
  constructor() {
    this.configKey = "@gistkeep/v2/config";
    this.themeKey = "@gistkeep/theme";
    this.authTimeoutKey = "@gistkeep/auth-timeout";
    this.authExpirationKey = "@gistkeep/auth-expiration";
    this.sessionEncryptionKey = "@gistkeep/session-encryption-key";
    this.bookmarkletPanels = new Map();
    this.config = null;
    this.gistmark = null;
    this.currentCategory = null;
    this.currentView = "bookmarks";
    this.searchQuery = "";
    this.activeTagFilters = [];
    this.pendingBookmarkletData = null;
    this.editingBookmark = null;
    this.editingCategory = null;
    this.editingNote = null;
    this.viewingNote = null;
    this.selectedNoteId = null;
    this.visibleNotes = [];
    this.currentTheme = "light";
    this.isLoading = false;
    this.loadingCount = 0;
    this.loadingMessage = "Working...";
    this.collapsedSections = {
      tags: false,
      ...(Storage.get("@gistkeep/collapsed-sections") || {}),
    };
    this.authTimeout = null;
    this.authExpiration = null;

    // DOM elements
    this.elements = {
      welcomeScreen: document.getElementById("welcomeScreen"),
      mainApp: document.getElementById("mainApp"),
      setupForm: document.getElementById("setupForm"),
      categoryList: document.getElementById("categoryList"),
      contentHeader: document.getElementById("contentHeader"),
      contentTitle: document.getElementById("contentTitle"),
      editCategoryBtn: document.getElementById("editCategoryBtn"),
      bookmarkList: document.getElementById("bookmarkList"),
      searchInput: document.getElementById("searchInput"),
      primaryActionLabel: document.getElementById("primaryActionLabel"),
      categoriesSection: document.querySelector(".categories-section"),
      tagsSection: document.querySelector(".tags-section"),
      bookmarksViewBtn: document.getElementById("bookmarksViewBtn"),
      notesViewBtn: document.getElementById("notesViewBtn"),
      sidebar: document.getElementById("sidebar"),
      sidebarToggle: document.getElementById("sidebarToggle"),
      notesSidebarSection: document.getElementById("notesSidebarSection"),
      notesSidebarList: document.getElementById("notesSidebarList"),
      tagList: document.getElementById("tagList"),
      clearTagFilters: document.getElementById("clearTagFilters"),
      globalActivity: document.getElementById("globalActivity"),
      globalActivityText: document.getElementById("globalActivityText"),

      // Modals
      addBookmarkModal: document.getElementById("addBookmarkModal"),
      addBookmarkForm: document.getElementById("addBookmarkForm"),
      editBookmarkModal: document.getElementById("editBookmarkModal"),
      editBookmarkForm: document.getElementById("editBookmarkForm"),
      addNoteModal: document.getElementById("addNoteModal"),
      addNoteForm: document.getElementById("addNoteForm"),
      editNoteModal: document.getElementById("editNoteModal"),
      editNoteForm: document.getElementById("editNoteForm"),
      viewNoteModal: document.getElementById("viewNoteModal"),
      editCategoryModal: document.getElementById("editCategoryModal"),
      settingsModal: document.getElementById("settingsModal"),
      welcomeModal: document.getElementById("welcomeModal"),
      bookmarkletPanelTemplate: document.getElementById(
        "bookmarkletPanelTemplate",
      ),

      // Form elements
      githubToken: document.getElementById("githubToken"),
      githubUsername: document.getElementById("githubUsername"),
      encryptionKey: document.getElementById("encryptionKey"),
      gistId: document.getElementById("gistId"),
      encryptContent: document.getElementById("encryptContent"),
      bookmarkTitle: document.getElementById("bookmarkTitle"),
      bookmarkUrl: document.getElementById("bookmarkUrl"),
      bookmarkCategory: document.getElementById("bookmarkCategory"),
      bookmarkTags: document.getElementById("bookmarkTags"),
      noteContent: document.getElementById("noteContent"),
      noteTags: document.getElementById("noteTags"),
      newCategoryGroup: document.getElementById("newCategoryGroup"),
      newCategoryName: document.getElementById("newCategoryName"),
      editBookmarkTitle: document.getElementById("editBookmarkTitle"),
      editBookmarkUrl: document.getElementById("editBookmarkUrl"),
      editBookmarkCategory: document.getElementById("editBookmarkCategory"),
      editBookmarkTags: document.getElementById("editBookmarkTags"),
      editNoteContent: document.getElementById("editNoteContent"),
      editNoteTags: document.getElementById("editNoteTags"),
      viewNoteMeta: document.getElementById("viewNoteMeta"),
      viewNoteContent: document.getElementById("viewNoteContent"),
      noteDetailPane: document.getElementById("noteDetailPane"),
      editNewCategoryGroup: document.getElementById("editNewCategoryGroup"),
      editNewCategoryName: document.getElementById("editNewCategoryName"),
      editCategoryCurrentName: document.getElementById(
        "editCategoryCurrentName",
      ),
      editCategoryName: document.getElementById("editCategoryName"),
      deleteCategoryDestination: document.getElementById(
        "deleteCategoryDestination",
      ),
      saveCategoryChanges: document.getElementById("saveCategoryChanges"),
      confirmDeleteCategory: document.getElementById("confirmDeleteCategory"),
      deleteNoteBtn: document.getElementById("deleteNoteBtn"),
      editViewedNoteBtn: document.getElementById("editViewedNoteBtn"),
      deleteViewedNoteBtn: document.getElementById("deleteViewedNoteBtn"),

      // Collapsible elements
      tagsHeader: document.getElementById("tagsHeader"),
      tagsCollapseIcon: document.getElementById("tagsCollapseIcon"),

      // Settings
      authTimeout: document.getElementById("authTimeout"),
      authTimeoutSection: document.getElementById("authTimeoutSection"),
      tokenProtectionSection: document.getElementById("tokenProtectionSection"),
      settingsEncryptionKey: document.getElementById("settingsEncryptionKey"),
      saveEncryptionKeyBtn: document.getElementById("saveEncryptionKeyBtn"),
      themeOptions: document.getElementById("themeOptions"),
      encryptContentSection: document.getElementById("encryptContentSection"),
      encryptContentSetting: document.getElementById("encryptContentSetting"),
    };

    this.initializeBookmarkletPanels();
    this.bindEvents();
    this.initTheme();
    this.initCollapsibleSections();
    this.init();
  }

  bindEvents() {
    // Setup form
    this.elements.setupForm?.addEventListener(
      "submit",
      this.handleSetup.bind(this),
    );

    // Search
    this.elements.searchInput?.addEventListener(
      "input",
      this.handleSearch.bind(this),
    );

    // Sidebar toggle
    this.elements.sidebarToggle?.addEventListener(
      "click",
      this.toggleSidebar.bind(this),
    );

    // Modal controls
    document
      .getElementById("addBookmarkBtn")
      ?.addEventListener("click", () => this.handlePrimaryAction());
    document
      .getElementById("settingsBtn")
      ?.addEventListener("click", () => this.showModal("settings"));
    this.elements.bookmarksViewBtn?.addEventListener("click", () =>
      this.setView("bookmarks"),
    );
    this.elements.notesViewBtn?.addEventListener("click", () =>
      this.setView("notes"),
    );

    // Modal close buttons
    document
      .getElementById("closeAddBookmarkModal")
      ?.addEventListener("click", () => this.hideModal("addBookmark"));
    document
      .getElementById("closeEditBookmarkModal")
      ?.addEventListener("click", () => this.hideModal("editBookmark"));
    document
      .getElementById("closeAddNoteModal")
      ?.addEventListener("click", () => this.hideModal("addNote"));
    document
      .getElementById("closeEditNoteModal")
      ?.addEventListener("click", () => this.hideModal("editNote"));
    document
      .getElementById("closeViewNoteModal")
      ?.addEventListener("click", () => this.hideModal("viewNote"));
    document
      .getElementById("closeEditCategoryModal")
      ?.addEventListener("click", () => this.hideModal("editCategory"));
    document
      .getElementById("closeSettingsModal")
      ?.addEventListener("click", () => this.hideModal("settings"));
    document
      .getElementById("closeWelcomeModal")
      ?.addEventListener("click", () => this.hideModal("welcome"));
    document
      .getElementById("cancelAddBookmark")
      ?.addEventListener("click", () => this.hideModal("addBookmark"));
    document
      .getElementById("cancelEditBookmark")
      ?.addEventListener("click", () => this.hideModal("editBookmark"));
    document
      .getElementById("cancelAddNote")
      ?.addEventListener("click", () => this.hideModal("addNote"));
    document
      .getElementById("cancelEditNote")
      ?.addEventListener("click", () => this.hideModal("editNote"));
    document
      .getElementById("closeViewNote")
      ?.addEventListener("click", () => this.hideModal("viewNote"));
    document
      .getElementById("cancelEditCategory")
      ?.addEventListener("click", () => this.hideModal("editCategory"));
    document
      .getElementById("dismissWelcomeModal")
      ?.addEventListener("click", () => this.hideModal("welcome"));

    // Forms
    this.elements.addBookmarkForm?.addEventListener(
      "submit",
      this.handleAddBookmark.bind(this),
    );
    this.elements.editBookmarkForm?.addEventListener(
      "submit",
      this.handleEditBookmark.bind(this),
    );
    this.elements.addNoteForm?.addEventListener(
      "submit",
      this.handleAddNote.bind(this),
    );
    this.elements.editNoteForm?.addEventListener(
      "submit",
      this.handleEditNote.bind(this),
    );
    this.elements.deleteNoteBtn?.addEventListener(
      "click",
      this.handleDeleteNote.bind(this),
    );
    this.elements.editViewedNoteBtn?.addEventListener(
      "click",
      this.handleViewNoteEdit.bind(this),
    );
    this.elements.deleteViewedNoteBtn?.addEventListener(
      "click",
      this.handleDeleteViewedNote.bind(this),
    );

    // Category dropdown events
    this.elements.bookmarkCategory?.addEventListener(
      "change",
      this.handleCategoryChange.bind(this),
    );
    this.elements.editBookmarkCategory?.addEventListener(
      "change",
      this.handleEditCategoryChange.bind(this),
    );

    // Collapsible sections
    this.elements.tagsHeader?.addEventListener("click", () =>
      this.toggleCollapsible("tags"),
    );

    // Settings actions
    document
      .getElementById("addCategoryBtn")
      ?.addEventListener("click", this.handleAddCategory.bind(this));
    document
      .getElementById("viewGistBtn")
      ?.addEventListener("click", this.handleViewGist.bind(this));
    document
      .getElementById("logoGistLink")
      ?.addEventListener("click", this.handleViewGist.bind(this));
    document
      .getElementById("resetConfigBtn")
      ?.addEventListener("click", this.handleResetConfig.bind(this));
    this.elements.authTimeout?.addEventListener(
      "change",
      this.handleAuthTimeoutChange.bind(this),
    );
    this.elements.encryptContentSetting?.addEventListener(
      "change",
      this.handleEncryptContentChange.bind(this),
    );
    this.elements.saveEncryptionKeyBtn?.addEventListener(
      "click",
      this.handleAddEncryptionKey.bind(this),
    );
    this.elements.editCategoryBtn?.addEventListener("click", () =>
      this.handleCategoryEdit(this.currentCategory),
    );
    this.elements.saveCategoryChanges?.addEventListener(
      "click",
      this.handleRenameCategorySubmit.bind(this),
    );
    this.elements.confirmDeleteCategory?.addEventListener(
      "click",
      this.handleDeleteCategorySubmit.bind(this),
    );
    this.elements.themeOptions
      ?.querySelectorAll("[data-theme-option]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const theme = button.getAttribute("data-theme-option");
          this.setTheme(theme);
        });
      });

    // Tag filtering
    this.elements.clearTagFilters?.addEventListener(
      "click",
      this.clearTagFilters.bind(this),
    );

    // Close modals on overlay click
    document.querySelectorAll(".modal-overlay").forEach((overlay) => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          overlay.classList.add("hidden");
        }
      });
    });

    // Close sidebar on mobile backdrop click
    document.addEventListener("click", (e) => {
      if (
        e.target.closest(".main-app") &&
        e.target === document.querySelector(".main-app::before") &&
        document.querySelector(".main-app")?.classList.contains("sidebar-open")
      ) {
        this.toggleSidebar();
      }
    });

    // Also handle clicks directly on the main-app when sidebar is open
    document.addEventListener("click", (e) => {
      const mainApp = document.querySelector(".main-app");
      if (mainApp?.classList.contains("sidebar-open") && e.target === mainApp) {
        this.toggleSidebar();
      }
    });

    window.addEventListener("hashchange", this.handleHashChange.bind(this));
  }

  initializeBookmarkletPanels() {
    const template = this.elements.bookmarkletPanelTemplate;
    if (!template) return;

    this.bookmarkletPanels.clear();

    document.querySelectorAll("[data-bookmarklet-panel]").forEach((host) => {
      host.innerHTML = "";
      host.appendChild(template.content.cloneNode(true));

      const label = host.dataset.bookmarkletLabel?.trim() || "";
      const intro = host.dataset.bookmarkletIntro?.trim() || "";
      const labelEl = host.querySelector("[data-bookmarklet-label]");
      const introEl = host.querySelector("[data-bookmarklet-intro]");
      const copyBtn = host.querySelector("[data-bookmarklet-copy-btn]");

      if (labelEl) {
        if (label) {
          labelEl.textContent = label;
        } else {
          labelEl.remove();
        }
      }

      if (introEl) {
        if (intro) {
          introEl.textContent = intro;
        } else {
          introEl.remove();
        }
      }

      if (copyBtn) {
        copyBtn.addEventListener("click", () =>
          this.handleCopyBookmarklet(host.dataset.bookmarkletPanel),
        );
      }

      this.bookmarkletPanels.set(host.dataset.bookmarkletPanel, {
        host,
        link: host.querySelector("[data-bookmarklet-link]"),
        code: host.querySelector("[data-bookmarklet-code]"),
      });
    });
  }

  initTheme() {
    const savedTheme = Storage.get(this.themeKey) || "light";
    this.setTheme(savedTheme);
  }

  setTheme(theme) {
    const validThemes = [
      "light",
      "midnight",
      "paper",
      "dawn",
      "grove",
      "ember",
      "terminal-light",
      "terminal-dark",
      "terminal-solarized",
      "terminal-ink",
    ];
    this.currentTheme = validThemes.includes(theme) ? theme : "light";
    document.documentElement.setAttribute("data-theme", this.currentTheme);
    this.updateThemeOptions();
    Storage.set(this.themeKey, this.currentTheme);
  }

  updateThemeOptions() {
    this.elements.themeOptions
      ?.querySelectorAll("[data-theme-option]")
      .forEach((button) => {
        button.classList.toggle(
          "active",
          button.getAttribute("data-theme-option") === this.currentTheme,
        );
      });
  }

  handlePrimaryAction() {
    if (this.currentView === "notes") {
      this.startNewNote();
      return;
    }

    this.showModal("addBookmark");
  }

  getViewFromHash() {
    const hash = window.location.hash.replace(/^#/, "").toLowerCase();
    return hash === "notes" ? "notes" : "bookmarks";
  }

  syncViewHash(view, replace = false) {
    const nextHash = `#${view}`;
    if (window.location.hash === nextHash) return;

    if (replace) {
      window.history.replaceState(
        {},
        document.title,
        `${window.location.pathname}${window.location.search}${nextHash}`,
      );
      return;
    }

    window.location.hash = view;
  }

  handleHashChange() {
    const hashView = this.getViewFromHash();
    if (hashView !== this.currentView) {
      this.setView(hashView, { syncHash: false });
    }
  }

  setView(view, options = {}) {
    if (!["bookmarks", "notes"].includes(view)) return;
    const { syncHash = true } = options;

    this.currentView = view;

    if (view === "notes") {
      this.currentCategory = null;
      this.activeTagFilters = [];
    }

    if (syncHash) {
      this.syncViewHash(view);
    }

    this.updateViewControls();
    this.loadTags();
    this.loadCurrentView();
  }

  updateViewControls() {
    const isNotesView = this.currentView === "notes";

    this.elements.bookmarksViewBtn?.classList.toggle(
      "btn-primary",
      !isNotesView,
    );
    this.elements.bookmarksViewBtn?.classList.toggle(
      "btn-secondary",
      isNotesView,
    );
    this.elements.notesViewBtn?.classList.toggle("btn-primary", isNotesView);
    this.elements.notesViewBtn?.classList.toggle("btn-secondary", !isNotesView);
    this.elements.categoriesSection?.classList.toggle("hidden", isNotesView);
    this.elements.notesSidebarSection?.classList.toggle("hidden", !isNotesView);
    this.elements.tagsSection?.classList.remove("hidden");
    this.elements.contentHeader?.classList.toggle("hidden", isNotesView);
    this.elements.bookmarkList?.classList.toggle("hidden", isNotesView);
    this.elements.noteDetailPane?.classList.toggle("hidden", !isNotesView);

    if (this.elements.searchInput) {
      this.elements.searchInput.placeholder = isNotesView
        ? "Search notes..."
        : "Search bookmarks...";
    }

    if (this.elements.primaryActionLabel) {
      this.elements.primaryActionLabel.textContent = isNotesView
        ? "Add Note"
        : "Add Bookmark";
    }

    if (this.elements.editCategoryBtn) {
      this.elements.editCategoryBtn.classList.toggle("hidden", isNotesView);
    }
  }

  handleCategoryChange() {
    const isCreatingNew =
      this.elements.bookmarkCategory.value === "__CREATE_NEW__";
    this.elements.newCategoryGroup.style.display = isCreatingNew
      ? "block"
      : "none";

    if (isCreatingNew) {
      this.elements.newCategoryName.focus();
      this.elements.newCategoryName.required = true;
    } else {
      this.elements.newCategoryName.required = false;
      this.elements.newCategoryName.value = "";
    }
  }

  async loadCurrentView() {
    if (this.currentView === "notes") {
      await this.loadNotes();
      return;
    }

    await this.loadBookmarks();
  }

  handleEditCategoryChange() {
    const isCreatingNew =
      this.elements.editBookmarkCategory.value === "__CREATE_NEW__";
    this.elements.editNewCategoryGroup.style.display = isCreatingNew
      ? "block"
      : "none";

    if (isCreatingNew) {
      this.elements.editNewCategoryName.focus();
      this.elements.editNewCategoryName.required = true;
    } else {
      this.elements.editNewCategoryName.required = false;
      this.elements.editNewCategoryName.value = "";
    }
  }

  toggleCollapsible(section) {
    if (section !== "tags") return; // Only handle tags

    const isCollapsed = this.collapsedSections.tags;
    const content = this.elements.tagList;
    const icon = this.elements.tagsCollapseIcon;

    if (isCollapsed) {
      // Expand
      content.classList.remove("collapsed");
      content.style.maxHeight = content.scrollHeight + "px";
      icon.style.transform = "rotate(0deg)";
      this.collapsedSections.tags = false;
    } else {
      // Collapse
      content.style.maxHeight = "0";
      content.classList.add("collapsed");
      icon.style.transform = "rotate(-90deg)";
      this.collapsedSections.tags = true;
    }

    // Save state
    Storage.set("@gistkeep/collapsed-sections", this.collapsedSections);
  }

  initCollapsibleSections() {
    // Initialize collapsed state for tags only
    if (this.collapsedSections.tags) {
      this.elements.tagList.classList.add("collapsed");
      this.elements.tagList.style.maxHeight = "0";
      this.elements.tagsCollapseIcon.style.transform = "rotate(-90deg)";
    } else {
      this.elements.tagList.style.maxHeight =
        this.elements.tagList.scrollHeight + "px";
    }
  }

  refreshCollapsibleHeights() {
    // Update max-height for expanded tags section after content changes
    if (!this.collapsedSections.tags) {
      this.elements.tagList.style.maxHeight =
        this.elements.tagList.scrollHeight + "px";
    }
  }

  handleAuthTimeoutChange() {
    const timeoutMs = parseInt(this.elements.authTimeout.value);
    Storage.set(this.authTimeoutKey, timeoutMs);

    // Clear existing timeout and set new one if needed
    this.clearAuthTimeout();
    if (timeoutMs === 0) {
      this.clearDecryptedToken(false);
      Notification.success(
        "Authentication will now be required for every action.",
      );
      return;
    }

    if (this.config?.decryptedToken) {
      this.setAuthTimeout(timeoutMs);
    }
  }

  setAuthTimeout(timeoutMs) {
    this.clearAuthTimeout();

    if (timeoutMs > 0) {
      this.authExpiration = Date.now() + timeoutMs;
      Storage.set(this.authExpirationKey, this.authExpiration);
      this.authTimeout = setTimeout(() => {
        console.log(
          "Auth timeout expired after",
          timeoutMs / 1000 / 60,
          "minutes",
        );
        this.clearDecryptedToken();
      }, timeoutMs);

      console.log("Auth timeout set for", timeoutMs / 1000 / 60, "minutes");
    }
  }

  clearAuthTimeout() {
    if (this.authTimeout) {
      clearTimeout(this.authTimeout);
      this.authTimeout = null;
    }
    this.authExpiration = null;
    Storage.remove(this.authExpirationKey);
  }

  clearDecryptedToken(showNotification = true) {
    if (this.config) {
      delete this.config.decryptedToken;
      delete this.config.encryptionKey;
    }
    SessionStorage.remove(this.sessionEncryptionKey);
    this.clearAuthTimeout();

    if (showNotification) {
      Notification.warning(
        "Your session has expired. You'll need to enter your encryption key for the next operation.",
      );
    }
  }

  restoreSessionAuth() {
    if (this.config?.tokenEncrypted === false && this.config?.token) {
      this.config.decryptedToken = this.config.token;
      this.config.encryptionKey = null;
      return true;
    }

    const encryptionKey = SessionStorage.get(this.sessionEncryptionKey);
    if (!encryptionKey || !this.config?.token) return false;

    const storedExpiration = Storage.get(this.authExpirationKey);
    if (storedExpiration && Date.now() >= storedExpiration) {
      this.clearDecryptedToken();
      return false;
    }

    const decryptedToken = decrypt(this.config.token, encryptionKey);
    if (!decryptedToken) {
      SessionStorage.remove(this.sessionEncryptionKey);
      Storage.remove(this.authExpirationKey);
      return false;
    }

    this.config.decryptedToken = decryptedToken;
    this.config.encryptionKey = encryptionKey;

    if (storedExpiration) {
      this.authExpiration = storedExpiration;
      if (!this.authTimeout) {
        const remainingTime = Math.max(storedExpiration - Date.now(), 0);
        this.authTimeout = setTimeout(() => {
          console.log("Auth timeout expired (restored from session)");
          this.clearDecryptedToken();
        }, remainingTime);
      }
    }

    return true;
  }

  isAuthValid() {
    if (this.config?.decryptedToken) {
      if (!this.authExpiration) {
        const timeoutMs = Storage.get(this.authTimeoutKey) || 0;
        if (timeoutMs > 0) {
          this.setAuthTimeout(timeoutMs);
        }
        return true;
      }

      if (Date.now() < this.authExpiration) {
        return true;
      }

      this.clearDecryptedToken();
      return false;
    }

    return this.restoreSessionAuth();
  }

  initializeAuthTimeout() {
    // Set up timeout based on stored preference
    const timeoutMs = Storage.get(this.authTimeoutKey) || 0;
    if (timeoutMs > 0 && this.config?.decryptedToken && !this.authTimeout) {
      this.setAuthTimeout(timeoutMs);
    }
  }

  async ensureAuthenticated() {
    if (!this.isAuthValid()) {
      await this.promptForEncryptionKey();
    }

    if (!this.gistmark && this.config?.decryptedToken) {
      await this.initializeGistKeep();
    }
  }

  async init() {
    this.config = Storage.get(this.configKey);
    this.pendingBookmarkletData = this.getBookmarkletLaunchData();
    this.currentView = this.getViewFromHash();

    if (!this.config) {
      this.showWelcomeScreen();
    } else {
      await this.loadApp();
    }
  }

  showWelcomeScreen() {
    this.elements.welcomeScreen?.classList.remove("hidden");
    this.elements.mainApp?.classList.add("hidden");
  }

  showMainApp() {
    this.elements.welcomeScreen?.classList.add("hidden");
    this.elements.mainApp?.classList.remove("hidden");
  }

  async loadApp(options = {}) {
    const { showWelcomeModal = false } = options;
    try {
      this.setLoading(true, "Loading your gist...");
      this.showMainApp();
      this.currentView = this.getViewFromHash();
      this.syncViewHash(this.currentView, true);
      await this.ensureAuthenticated();
      this.updateViewControls();
      await this.loadCategories();
      await this.loadTags();
      await this.loadCurrentView();
      this.generateBookmarklet();
      this.handleBookmarkletLaunch();
      if (showWelcomeModal) {
        this.showModal("welcome");
      }
    } catch (error) {
      console.error("App initialization error:", error);
      Notification.error(error.message);
      this.showWelcomeScreen();
    } finally {
      this.setLoading(false);
    }
  }

  async promptForEncryptionKey() {
    if (this.config?.tokenEncrypted === false && this.config?.token) {
      this.config.decryptedToken = this.config.token;
      this.config.encryptionKey = null;
      return null;
    }

    if (this.config?.decryptedToken) {
      return this.config.encryptionKey;
    }

    return new Promise((resolve, reject) => {
      const key = prompt("Enter your encryption key to unlock your bookmarks:");
      if (!key) {
        reject(new Error("Encryption key is required"));
        return;
      }

      try {
        const decryptedToken = decrypt(this.config.token, key);
        if (!decryptedToken) {
          reject(new Error("Invalid encryption key"));
          return;
        }

        this.config.decryptedToken = decryptedToken;
        this.config.encryptionKey = key;
        SessionStorage.set(this.sessionEncryptionKey, key);

        const timeoutMs = Storage.get(this.authTimeoutKey) || 0;
        if (timeoutMs > 0) {
          this.setAuthTimeout(timeoutMs);
        } else {
          Storage.remove(this.authExpirationKey);
        }

        resolve(key);
      } catch (error) {
        reject(new Error("Invalid encryption key"));
      }
    });
  }

  async initializeGistKeep() {
    this.setLoading(true, "Loading your gist...");
    try {
      this.gistmark = new GistKeep(this.config.decryptedToken, this.config.id, {
        encryptContent: this.config.encryptContent || false,
        encryptionKey: this.config.encryptionKey,
      });
      await this.gistmark.getGist();
      await this.gistmark.ensureManagedFiles();
    } finally {
      this.setLoading(false);
    }
  }

  async handleSetup(e) {
    e.preventDefault();

    if (this.isLoading) return;

    try {
      this.setLoading(true, "Setting up your gist...");

      const setupTarget = this.elements.githubUsername.value.trim();
      const looksLikeGistId = /^[0-9a-f]{8,}$/i.test(setupTarget);

      const formData = {
        token: this.elements.githubToken.value.trim(),
        username: looksLikeGistId ? "" : setupTarget,
        encryptionKey: this.elements.encryptionKey.value.trim(),
        gistId: looksLikeGistId ? setupTarget : "",
        encryptContent: this.elements.encryptContent.checked,
      };

      if (!formData.token || !setupTarget) {
        throw new Error("Please fill in all required fields");
      }

      if (formData.encryptContent && !formData.encryptionKey) {
        throw new Error(
          "An encryption key is required to encrypt bookmark content",
        );
      }

      if (!formData.encryptionKey) {
        const confirmed = confirm(
          "No encryption key was provided. Your GitHub token will be stored unencrypted in this browser, so only continue on a trusted browser/device. Continue?",
        );
        if (!confirmed) {
          return;
        }
      }

      this.gistmark = new GistKeep(formData.token, formData.gistId, {
        encryptContent: formData.encryptContent,
        encryptionKey: formData.encryptionKey,
      });

      let gistData;
      if (formData.gistId) {
        // Load existing gist
        gistData = await this.gistmark.getGist();
      } else {
        // Create new gist
        gistData = await this.gistmark.setup();
        formData.gistId = gistData.id;
      }

      formData.username = gistData?.owner?.login || formData.username;

      // Save encrypted config
      this.config = {
        username: formData.username,
        token: formData.encryptionKey
          ? encrypt(formData.token, formData.encryptionKey)
          : formData.token,
        tokenEncrypted: Boolean(formData.encryptionKey),
        id: formData.gistId,
        encryptContent: formData.encryptContent,
        decryptedToken: formData.token,
        encryptionKey: formData.encryptionKey || null,
      };

      Storage.set(this.configKey, {
        username: this.config.username,
        token: this.config.token,
        tokenEncrypted: this.config.tokenEncrypted,
        id: this.config.id,
        encryptContent: this.config.encryptContent,
      });
      if (formData.encryptionKey) {
        SessionStorage.set(this.sessionEncryptionKey, formData.encryptionKey);
      } else {
        SessionStorage.remove(this.sessionEncryptionKey);
      }

      // Set default timeout if not already configured
      if (!Storage.get(this.authTimeoutKey)) {
        Storage.set(this.authTimeoutKey, 900000); // Default to 15 minutes
      }

      await this.loadApp({ showWelcomeModal: true });
      Notification.success("Setup complete!");
    } catch (error) {
      console.error("Setup error:", error);
      Notification.error(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  async loadCategories() {
    try {
      const categories = this.gistmark.getCategories();
      this.renderCategories(categories);
    } catch (error) {
      console.error("Error loading categories:", error);
      Notification.error("Failed to load lists");
    }
  }

  async loadTags() {
    try {
      const tags =
        this.currentView === "notes"
          ? this.gistmark.getAllNoteTags()
          : this.gistmark.getAllTags();
      this.renderTags(tags);
      // Refresh collapsible height after content changes
      setTimeout(() => this.refreshCollapsibleHeights(), 0);
    } catch (error) {
      console.error("Error loading tags:", error);
    }
  }

  renderTags(tags) {
    const tagList = this.elements.tagList;
    if (!tagList) return;

    if (tags.length === 0) {
      tagList.innerHTML = `<div style="font-size: 0.75rem; color: var(--gray-500); text-align: center;">No ${
        this.currentView === "notes" ? "note " : ""
      }tags yet</div>`;
      return;
    }

    const tagsHtml = tags
      .map((tag) => {
        const isActive = this.activeTagFilters.includes(tag);
        const tagClass = isActive ? "tag tag-filter" : "tag";
        return `<span class="${tagClass}" onclick="app.filterByTag('${tag}')">${tag}</span>`;
      })
      .join("");

    tagList.innerHTML = tagsHtml;

    // Show/hide clear button
    if (this.elements.clearTagFilters) {
      this.elements.clearTagFilters.style.display =
        this.activeTagFilters.length > 0 ? "block" : "none";
    }
  }

  renderCategories(categories) {
    const categoryList = this.elements.categoryList;
    if (!categoryList) return;

    // Add "All Bookmarks" option
    const totalBookmarks = this.gistmark.getTotalBookmarkCount();
    const allBookmarksHtml = `
      <div class="category-item ${!this.currentCategory ? "active" : ""}" data-category="">
        <span class="category-label">All Bookmarks</span>
        <span class="category-meta">
          <span class="category-count">${totalBookmarks}</span>
        </span>
      </div>
    `;

    // Add individual categories
    const categoriesHtml = categories
      .map((category) => {
        const count = this.gistmark.getCategoryBookmarkCount(category);
        const isActive = this.currentCategory === category;

        return `
        <div class="category-item ${isActive ? "active" : ""}" data-category="${category}">
          <span class="category-label">${category}</span>
          <span class="category-meta">
            <span class="category-count">${count}</span>
          </span>
        </div>
      `;
      })
      .join("");

    categoryList.innerHTML = allBookmarksHtml + categoriesHtml;

    // Add click handlers
    categoryList.querySelectorAll(".category-item").forEach((item) => {
      item.addEventListener("click", () => {
        const category = item.getAttribute("data-category");
        this.selectCategory(category);
      });
    });
  }

  selectCategory(category) {
    this.currentView = "bookmarks";
    this.currentCategory = category || null;
    this.updateViewControls();
    this.loadCurrentView();

    // Update active state
    this.elements.categoryList
      ?.querySelectorAll(".category-item")
      .forEach((item) => {
        item.classList.remove("active");
      });

    const activeItem = this.elements.categoryList?.querySelector(
      `[data-category="${category || ""}"]`,
    );
    activeItem?.classList.add("active");

    this.updateContentTitle();
  }

  async loadBookmarks() {
    try {
      let allBookmarks;

      if (this.searchQuery) {
        allBookmarks = this.gistmark.searchBookmarks(this.searchQuery);
      } else if (this.activeTagFilters.length > 0) {
        allBookmarks = this.gistmark.filterByTags(this.activeTagFilters);
      } else {
        allBookmarks = this.gistmark.getBookmarks();
      }

      let bookmarksToShow;

      if (this.currentCategory) {
        bookmarksToShow = allBookmarks[this.currentCategory] || [];
      } else {
        bookmarksToShow = Object.values(allBookmarks).flat();
      }

      this.renderBookmarks(bookmarksToShow);
      this.populateBookmarkCategories();
      this.updateContentTitle();
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      Notification.error("Failed to load bookmarks");
    }
  }

  async loadNotes() {
    try {
      let notes;

      if (this.searchQuery) {
        notes = this.gistmark.searchNotes(this.searchQuery);
      } else if (this.activeTagFilters.length > 0) {
        notes = this.gistmark.filterNotesByTags(this.activeTagFilters);
      } else {
        notes = this.gistmark.getNotes();
      }

      this.visibleNotes = notes;
      this.syncSelectedNote(notes);
      this.renderNotes(notes);
      this.updateContentTitle();
      this.renderSelectedNote();
    } catch (error) {
      console.error("Error loading notes:", error);
      Notification.error("Failed to load notes");
    }
  }

  renderBookmarks(bookmarks) {
    const bookmarkList = this.elements.bookmarkList;
    if (!bookmarkList) return;

    if (bookmarks.length === 0) {
      const emptyMessage = this.searchQuery
        ? "No bookmarks match your search"
        : "No bookmarks yet";
      const emptyDescription = this.searchQuery
        ? "Try a different search term"
        : "Add your first bookmark to get started!";

      bookmarkList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <h3 class="empty-state-title">${emptyMessage}</h3>
          <p class="empty-state-description">${emptyDescription}</p>
          ${
            !this.searchQuery
              ? `
            <button class="btn btn-primary" onclick="document.getElementById('addBookmarkBtn').click()">
              <span class="icon icon-plus"></span>
              Add Your First Bookmark
            </button>
          `
              : ""
          }
        </div>
      `;
      return;
    }

    const bookmarksHtml = bookmarks
      .map((bookmark) => {
        let domain = "";
        try {
          domain = new URL(bookmark.url).hostname;
        } catch {
          domain = "unknown";
        }

        const tagsHtml =
          bookmark.tags && bookmark.tags.length > 0
            ? `<div class="bookmark-tags">
          ${bookmark.tags
            .map((tag) => {
              const isActive = this.activeTagFilters.includes(tag);
              const tagClass = isActive ? "tag tag-filter" : "tag";
              return `<span class="${tagClass}" onclick="app.filterByTag('${tag}')">${tag}</span>`;
            })
            .join("")}
         </div>`
            : "";

        // Escape quotes for onclick handlers
        const escapedTitle = bookmark.title.replace(/'/g, "\\'");
        const escapedCategory = bookmark.category.replace(/'/g, "\\'");

        return `
        <div class="bookmark-item" data-url="${bookmark.url}" data-title="${bookmark.title}" data-category="${bookmark.category}">
          <div class="bookmark-icon" style="background-image: url('https://www.google.com/s2/favicons?sz=32&domain=${domain}')"></div>
          <div class="bookmark-content">
            <a href="${bookmark.url}" target="_blank" class="bookmark-title">${bookmark.title}</a>
            <div class="bookmark-url">${bookmark.url}</div>
            ${tagsHtml}
          </div>
          <div class="bookmark-actions">
            <button class="btn btn-ghost btn-sm" onclick="app.editBookmark('${escapedTitle}', '${escapedCategory}')" title="Edit">
              <span class="icon icon-edit"></span>
            </button>
            <button class="btn btn-ghost btn-sm" onclick="app.deleteBookmark('${escapedTitle}', '${escapedCategory}')" title="Delete">
              <span class="icon icon-trash"></span>
            </button>
          </div>
        </div>
      `;
      })
      .join("");

    bookmarkList.innerHTML = bookmarksHtml;
  }

  renderNotes(notes) {
    const notesList = this.elements.notesSidebarList;
    if (!notesList) return;

    if (notes.length === 0) {
      const emptyMessage = this.searchQuery
        ? "No notes match your search"
        : "No notes yet";
      notesList.innerHTML = `<div class="notes-empty-state">${emptyMessage}</div>`;
      return;
    }

    const notesHtml = notes
      .map((note) => {
        const updatedLabel = this.formatRelativeDate(
          note.updatedAt || note.createdAt,
        );
        const previewText = this.getNotePreviewText(note.content);
        const preview = this.escapeHtml(previewText);
        const safeId = note.id.replace(/'/g, "\\'");
        const isActive = note.id === this.selectedNoteId;
        const tagsHtml =
          note.tags && note.tags.length > 0
            ? `<div class="bookmark-tags">
          ${note.tags
            .map((tag) => {
              const isActive = this.activeTagFilters.includes(tag);
              const tagClass = isActive ? "tag tag-filter" : "tag";
              return `<span class="${tagClass}" onclick="event.stopPropagation(); app.filterByTag('${tag}')">${tag}</span>`;
            })
            .join("")}
         </div>`
            : "";

        return `
          <div class="note-item ${isActive ? "active" : ""}" data-note-id="${note.id}" onclick="app.viewNote('${safeId}')">
            <div class="note-content">
              <div class="note-title">${preview}</div>
              <div class="note-meta">Updated ${updatedLabel}</div>
              ${tagsHtml}
            </div>
          </div>
        `;
      })
      .join("");

    notesList.innerHTML = notesHtml;
  }

  syncSelectedNote(notes = []) {
    if (this.editingNote && !this.editingNote.id) {
      return;
    }

    const selectedVisible = notes.some(
      (note) => note.id === this.selectedNoteId,
    );
    if (!selectedVisible) {
      this.selectedNoteId = notes[0]?.id || null;
    }

    if (this.selectedNoteId) {
      this.viewingNote = this.gistmark.getNote(this.selectedNoteId);
      return;
    }

    this.viewingNote = null;
    this.editingNote = null;
  }

  getNotePreviewText(content) {
    const text = String(content || "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
      .replace(/^>\s?/gm, "")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/[*_~]/g, "")
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return text || "No content";
  }

  renderNoteMarkdown(content) {
    const escape = (value) => this.escapeHtml(value);
    const inline = (value) =>
      escape(value)
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/__([^_]+)__/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>")
        .replace(/_([^_]+)_/g, "<em>$1</em>")
        .replace(
          /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
          '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
        );

    const normalized = String(content || "")
      .replace(/\r\n/g, "\n")
      .trim();
    if (!normalized) {
      return "<p>No content</p>";
    }

    return normalized
      .split(/\n{2,}/)
      .map((block) => {
        const trimmed = block.trim();

        if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
          const code = trimmed
            .replace(/^```[^\n]*\n?/, "")
            .replace(/\n?```$/, "");
          return `<pre><code>${escape(code)}</code></pre>`;
        }

        if (/^#{1,4}\s/.test(trimmed)) {
          const [, hashes, text] = trimmed.match(/^(#{1,4})\s+(.*)$/) || [];
          const level = hashes ? hashes.length : 2;
          return `<h${level}>${inline(text || "")}</h${level}>`;
        }

        if (trimmed.split("\n").every((line) => /^\s*[-*+]\s+/.test(line))) {
          const items = trimmed
            .split("\n")
            .map((line) => line.replace(/^\s*[-*+]\s+/, ""))
            .map((line) => `<li>${inline(line)}</li>`)
            .join("");
          return `<ul>${items}</ul>`;
        }

        if (trimmed.split("\n").every((line) => /^\s*\d+\.\s+/.test(line))) {
          const items = trimmed
            .split("\n")
            .map((line) => line.replace(/^\s*\d+\.\s+/, ""))
            .map((line) => `<li>${inline(line)}</li>`)
            .join("");
          return `<ol>${items}</ol>`;
        }

        if (/^>\s?/m.test(trimmed)) {
          const quote = trimmed
            .split("\n")
            .map((line) => line.replace(/^>\s?/, ""))
            .join("<br>");
          return `<blockquote>${inline(quote)}</blockquote>`;
        }

        return `<p>${inline(trimmed).replace(/\n/g, "<br>")}</p>`;
      })
      .join("");
  }

  escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  formatRelativeDate(value) {
    if (!value) return "just now";

    const timestamp = new Date(value).getTime();
    if (Number.isNaN(timestamp)) {
      return "recently";
    }

    const diffMs = Date.now() - timestamp;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Date(value).toLocaleDateString();
  }

  populateBookmarkCategories() {
    const categories = this.gistmark.getCategories();
    const categorySelect = this.elements.bookmarkCategory;

    if (!categorySelect) return;

    categorySelect.innerHTML = '<option value="">Select a list</option>';
    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categorySelect.appendChild(option);
    });

    // Add "Create New List" option
    const createOption = document.createElement("option");
    createOption.value = "__CREATE_NEW__";
    createOption.textContent = "+ Create New List";
    categorySelect.appendChild(createOption);
  }

  handleSearch(e) {
    this.searchQuery = e.target.value;
    if (this.searchQuery) {
      this.activeTagFilters = [];
    }
    this.loadTags();
    this.loadCurrentView();
  }

  filterByTag(tag) {
    // Toggle tag filter
    const index = this.activeTagFilters.indexOf(tag);
    if (index > -1) {
      this.activeTagFilters.splice(index, 1);
    } else {
      this.activeTagFilters.push(tag);
    }

    // Clear search when filtering by tags
    if (this.activeTagFilters.length > 0) {
      this.searchQuery = "";
      if (this.elements.searchInput) {
        this.elements.searchInput.value = "";
      }
    }

    this.loadCurrentView();
    this.loadTags();
  }

  clearTagFilters() {
    this.activeTagFilters = [];
    this.loadCurrentView();
    this.loadTags();
  }

  updateContentTitle() {
    if (!this.elements.contentTitle) return;

    let title;

    if (this.currentView === "notes") {
      title = "Notes";
      if (this.searchQuery) {
        title += ` (search: "${this.searchQuery}")`;
      } else if (this.activeTagFilters.length > 0) {
        title += ` (tags: ${this.activeTagFilters.join(", ")})`;
      }
    } else {
      title = this.currentCategory || "All Bookmarks";

      if (this.searchQuery) {
        title += ` (search: "${this.searchQuery}")`;
      } else if (this.activeTagFilters.length > 0) {
        title += ` (tags: ${this.activeTagFilters.join(", ")})`;
      }
    }

    this.elements.contentTitle.textContent = title;

    if (this.elements.editCategoryBtn) {
      const shouldShowEdit = Boolean(
        this.currentView === "bookmarks" &&
        this.currentCategory &&
        !this.searchQuery &&
        this.activeTagFilters.length === 0,
      );
      this.elements.editCategoryBtn.classList.toggle("hidden", !shouldShowEdit);
    }
  }

  async handleAddBookmark(e) {
    e.preventDefault();

    if (this.isLoading) return;

    try {
      this.setLoading(true, "Saving bookmark...");
      await this.ensureAuthenticated();

      const title = this.elements.bookmarkTitle.value.trim();
      const url = this.elements.bookmarkUrl.value.trim();
      let category = this.elements.bookmarkCategory.value;
      const tagsString = this.elements.bookmarkTags.value.trim();

      // Handle new category creation
      if (category === "__CREATE_NEW__") {
        const newCategoryName = this.elements.newCategoryName.value.trim();
        if (!newCategoryName) {
          throw new Error("Please enter a list name");
        }
        category = newCategoryName;

        // Create the category first
        await this.gistmark.addCategory(category);
      }

      if (!title || !url || !category) {
        throw new Error("Please fill in all required fields");
      }

      // Parse tags from comma-separated string
      const tags = tagsString
        ? tagsString
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag)
        : [];

      await this.gistmark.saveBookmark(title, url, category, tags);
      await this.loadCategories();
      await this.loadTags();
      await this.loadBookmarks();

      this.hideModal("addBookmark");
      this.elements.addBookmarkForm.reset();
      // Reset new category form state
      this.elements.newCategoryGroup.style.display = "none";
      this.elements.newCategoryName.value = "";
      this.elements.newCategoryName.required = false;
      Notification.success("Bookmark added successfully!");
    } catch (error) {
      console.error("Add bookmark error:", error);
      Notification.error(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  async handleAddCategory() {
    const categoryName = prompt("Enter list name:");
    if (!categoryName || !categoryName.trim()) return;

    try {
      this.setLoading(true, "Saving list...");
      await this.ensureAuthenticated();
      await this.gistmark.addCategory(categoryName.trim());
      await this.loadCategories();
      this.populateBookmarkCategories();
      Notification.success(`List "${categoryName}" added successfully!`);
    } catch (error) {
      console.error("Add category error:", error);
      Notification.error(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  async handleCategoryEdit(category) {
    if (!category) return;
    this.editingCategory = category;
    this.initializeEditCategoryModal();
    this.showModal("editCategory");
  }

  initializeEditCategoryModal() {
    if (!this.editingCategory) return;

    if (this.elements.editCategoryCurrentName) {
      this.elements.editCategoryCurrentName.textContent = this.editingCategory;
    }

    if (this.elements.editCategoryName) {
      this.elements.editCategoryName.value = this.editingCategory;
    }

    if (this.elements.deleteCategoryDestination) {
      const destinations = this.gistmark
        .getCategories()
        .filter((name) => name !== this.editingCategory);
      this.elements.deleteCategoryDestination.innerHTML =
        '<option value="">Select destination list</option>';
      destinations.forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        this.elements.deleteCategoryDestination.appendChild(option);
      });
    }
  }

  async handleRenameCategorySubmit() {
    const category = this.editingCategory;
    const newCategory = this.elements.editCategoryName?.value.trim();
    if (!category || !newCategory || newCategory === category) return;

    try {
      this.setLoading(true, "Renaming list...");
      await this.ensureAuthenticated();
      await this.gistmark.renameCategory(category, newCategory);

      if (this.currentCategory === category) {
        this.currentCategory = newCategory;
      }

      await this.loadCategories();
      await this.loadTags();
      await this.loadBookmarks();
      this.hideModal("editCategory");
      Notification.success(`List renamed to "${newCategory}"`);
    } catch (error) {
      console.error("Rename category error:", error);
      Notification.error(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  async handleDeleteCategorySubmit() {
    const category = this.editingCategory;
    if (!category) return;

    const categories = this.gistmark
      .getCategories()
      .filter((name) => name !== category);
    if (categories.length === 0) {
      Notification.error("Create another list before deleting this one.");
      return;
    }

    const targetCategory = this.elements.deleteCategoryDestination?.value;
    if (!targetCategory) {
      Notification.error("Select a destination list.");
      return;
    }

    if (
      !confirm(
        `Delete list "${category}" and move its bookmarks to "${targetCategory}"?`,
      )
    )
      return;

    try {
      this.setLoading(true, "Deleting list...");
      await this.ensureAuthenticated();
      await this.gistmark.deleteCategory(category, targetCategory);

      if (this.currentCategory === category) {
        this.currentCategory = targetCategory;
      }

      await this.loadCategories();
      await this.loadTags();
      await this.loadBookmarks();
      this.hideModal("editCategory");
      Notification.success(`List "${category}" deleted`);
    } catch (error) {
      console.error("Delete category error:", error);
      Notification.error(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  async deleteBookmark(title, category) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      this.setLoading(true, "Deleting bookmark...");
      await this.ensureAuthenticated();
      await this.gistmark.removeBookmark(title, category);
      await this.loadCategories();
      await this.loadTags();
      await this.loadBookmarks();
      Notification.success("Bookmark deleted successfully!");
    } catch (error) {
      console.error("Delete bookmark error:", error);
      Notification.error(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  editBookmark(title, category) {
    try {
      const bookmark = this.gistmark.getBookmarkDetails(title, category);
      if (!bookmark) {
        Notification.error("Bookmark not found");
        return;
      }

      // Store the original bookmark details for updating
      this.editingBookmark = { title, category, bookmark };

      // Populate the edit form
      this.elements.editBookmarkTitle.value = bookmark.title;
      this.elements.editBookmarkUrl.value = bookmark.url;
      this.elements.editBookmarkTags.value = bookmark.tags.join(", ");

      // Populate categories for edit form
      this.populateEditBookmarkCategories();
      this.elements.editBookmarkCategory.value = bookmark.category;

      // Show the edit modal
      this.showModal("editBookmark");
    } catch (error) {
      console.error("Error opening edit modal:", error);
      Notification.error("Failed to load bookmark details");
    }
  }

  populateEditBookmarkCategories() {
    const categories = this.gistmark.getCategories();
    const categorySelect = this.elements.editBookmarkCategory;

    if (!categorySelect) return;

    categorySelect.innerHTML = '<option value="">Select a list</option>';
    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categorySelect.appendChild(option);
    });

    // Add "Create New List" option
    const createOption = document.createElement("option");
    createOption.value = "__CREATE_NEW__";
    createOption.textContent = "+ Create New List";
    categorySelect.appendChild(createOption);
  }

  async handleEditBookmark(e) {
    e.preventDefault();

    if (this.isLoading || !this.editingBookmark) return;

    try {
      this.setLoading(true, "Saving bookmark...");
      await this.ensureAuthenticated();

      const newTitle = this.elements.editBookmarkTitle.value.trim();
      const newUrl = this.elements.editBookmarkUrl.value.trim();
      let newCategory = this.elements.editBookmarkCategory.value;
      const tagsString = this.elements.editBookmarkTags.value.trim();

      // Handle new category creation
      if (newCategory === "__CREATE_NEW__") {
        const newCategoryName = this.elements.editNewCategoryName.value.trim();
        if (!newCategoryName) {
          throw new Error("Please enter a list name");
        }
        newCategory = newCategoryName;

        // Create the category first
        await this.gistmark.addCategory(newCategory);
      }

      if (!newTitle || !newUrl || !newCategory) {
        throw new Error("Please fill in all required fields");
      }

      // Parse tags from comma-separated string
      const newTags = tagsString
        ? tagsString
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag)
        : [];

      // Update the bookmark
      await this.gistmark.updateBookmark(
        this.editingBookmark.title,
        this.editingBookmark.category,
        newTitle,
        newUrl,
        newCategory,
        newTags,
      );

      if (
        this.currentCategory === this.editingBookmark.category &&
        this.editingBookmark.category !== newCategory &&
        !this.searchQuery &&
        this.activeTagFilters.length === 0
      ) {
        this.currentCategory = newCategory;
      }

      await this.loadCategories();
      await this.loadTags();
      await this.loadBookmarks();

      this.hideModal("editBookmark");
      this.editingBookmark = null;
      // Reset new category form state
      this.elements.editNewCategoryGroup.style.display = "none";
      this.elements.editNewCategoryName.value = "";
      this.elements.editNewCategoryName.required = false;
      Notification.success("Bookmark updated successfully!");
    } catch (error) {
      console.error("Edit bookmark error:", error);
      Notification.error(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  async handleAddNote(e) {
    e.preventDefault();

    if (this.isLoading) return;

    try {
      this.setLoading(true, "Saving note...");
      await this.ensureAuthenticated();

      const content = this.elements.noteContent?.value.trim() || "";
      const tagsString = this.elements.noteTags?.value.trim() || "";
      const tags = tagsString
        ? tagsString
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag)
        : [];

      if (!content) {
        throw new Error("Please enter note content");
      }

      const createdNote = await this.gistmark.addNote(content, tags);
      this.editingNote = null;
      this.selectedNoteId = createdNote?.id || null;
      this.viewingNote = null;
      await this.loadTags();
      await this.loadNotes();
      Notification.success("Note added successfully!");
    } catch (error) {
      console.error("Add note error:", error);
      Notification.error(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  viewNote(noteId) {
    const note = this.gistmark.getNote(noteId);
    if (!note) {
      Notification.error("Note not found");
      return;
    }

    this.selectedNoteId = note.id;
    this.viewingNote = note;
    this.editingNote = null;
    this.renderNotes(this.visibleNotes);
    this.renderSelectedNote();
  }

  handleViewNoteEdit() {
    if (!this.viewingNote) return;
    const noteId = this.viewingNote.id;
    this.editNote(noteId);
  }

  async handleDeleteViewedNote() {
    if (!this.viewingNote) return;
    await this.deleteNote(this.viewingNote.id, false, true);
  }

  editNote(noteId) {
    const note = this.gistmark.getNote(noteId);
    if (!note) {
      Notification.error("Note not found");
      return;
    }

    this.selectedNoteId = note.id;
    this.viewingNote = note;
    this.editingNote = { ...note };
    this.renderNotes(this.visibleNotes);
    this.renderSelectedNote();
  }

  async handleEditNote(e) {
    e.preventDefault();

    if (this.isLoading || !this.editingNote) return;

    try {
      this.setLoading(true, "Saving note...");
      await this.ensureAuthenticated();

      const inlineContent =
        this.elements.noteDetailPane?.querySelector("#inlineNoteContent");
      const inlineTags =
        this.elements.noteDetailPane?.querySelector("#inlineNoteTags");
      const content =
        inlineContent?.value.trim() ||
        this.elements.editNoteContent?.value.trim() ||
        "";
      const tagsString =
        inlineTags?.value.trim() ||
        this.elements.editNoteTags?.value.trim() ||
        "";
      const tags = tagsString
        ? tagsString
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag)
        : [];

      if (!content) {
        throw new Error("Please enter note content");
      }

      const isNewNote = !this.editingNote.id;

      if (isNewNote) {
        const createdNote = await this.gistmark.addNote(content, tags);
        this.selectedNoteId = createdNote?.id || null;
      } else {
        await this.gistmark.updateNote(this.editingNote.id, {
          content,
          tags,
        });
        this.selectedNoteId = this.editingNote.id;
      }

      this.editingNote = null;
      this.viewingNote = null;
      await this.loadTags();
      await this.loadNotes();
      Notification.success(isNewNote ? "Note added!" : "Note updated!");
    } catch (error) {
      console.error("Edit note error:", error);
      Notification.error(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  async handleDeleteNote() {
    if (!this.editingNote) return;
    await this.deleteNote(this.editingNote.id, true);
  }

  async deleteNote(noteId, fromEditModal = false, fromViewModal = false) {
    const note = this.gistmark.getNote(noteId);
    if (!note) {
      Notification.error("Note not found");
      return;
    }

    if (!confirm("Are you sure you want to delete this note?")) {
      return;
    }

    try {
      this.setLoading(true, "Deleting note...");
      await this.ensureAuthenticated();
      const currentIndex = this.visibleNotes.findIndex(
        (visibleNote) => visibleNote.id === noteId,
      );
      const fallbackNote =
        this.visibleNotes[currentIndex + 1] ||
        this.visibleNotes[currentIndex - 1] ||
        null;
      await this.gistmark.deleteNote(noteId);
      this.selectedNoteId = fallbackNote?.id || null;
      this.editingNote = null;
      this.viewingNote = null;
      await this.loadTags();
      await this.loadNotes();
      Notification.success("Note deleted!");
    } catch (error) {
      console.error("Delete note error:", error);
      Notification.error(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  startNewNote() {
    if (this.currentView !== "notes") {
      this.showModal("addNote");
      return;
    }

    this.viewingNote = null;
    this.editingNote = {
      id: null,
      content: "",
      tags: [],
      createdAt: null,
      updatedAt: null,
    };
    this.renderNotes(this.visibleNotes);
    this.renderSelectedNote();

    setTimeout(() => {
      this.elements.noteDetailPane
        ?.querySelector("#inlineNoteContent")
        ?.focus();
    }, 0);
  }

  cancelNoteEdit() {
    if (this.editingNote?.id) {
      this.selectedNoteId = this.editingNote.id;
      this.viewingNote = this.gistmark.getNote(this.editingNote.id);
    } else {
      this.syncSelectedNote(this.visibleNotes);
    }

    this.editingNote = null;
    this.renderNotes(this.visibleNotes);
    this.renderSelectedNote();
  }

  renderSelectedNote() {
    const noteDetailPane = this.elements.noteDetailPane;
    if (!noteDetailPane) return;

    if (this.editingNote) {
      noteDetailPane.innerHTML = this.renderNoteEditor(this.editingNote);
      return;
    }

    const note =
      this.viewingNote ||
      (this.selectedNoteId ? this.gistmark.getNote(this.selectedNoteId) : null);

    if (!note) {
      noteDetailPane.innerHTML = `
        <div class="notes-detail-empty">
          <div class="empty-state">
            <div class="empty-state-icon">📝</div>
            <h3 class="empty-state-title">No note selected</h3>
            <p class="empty-state-description">Pick a note from the sidebar or start a new one.</p>
            <button class="btn btn-primary" type="button" onclick="app.startNewNote()">
              <span class="icon icon-plus"></span>
              New Note
            </button>
          </div>
        </div>
      `;
      return;
    }

    this.viewingNote = note;
    noteDetailPane.innerHTML = this.renderNoteViewer(note);
  }

  renderNoteViewer(note) {
    const created = this.formatRelativeDate(note.createdAt);
    const updated = this.formatRelativeDate(note.updatedAt || note.createdAt);
    const tags = note.tags?.length
      ? ` • Tags: ${this.escapeHtml(note.tags.join(", "))}`
      : "";
    const safeId = note.id.replace(/'/g, "\\'");

    return `
      <div class="note-detail-card">
        <div class="note-detail-header">
          <div class="note-detail-heading">
            <div class="note-detail-meta">Created ${created} • Updated ${updated}${tags}</div>
          </div>
          <div class="note-detail-actions">
            <button class="btn btn-secondary" type="button" onclick="app.editNote('${safeId}')" aria-label="Edit note" title="Edit note">
              <span class="icon icon-edit"></span>
            </button>
            <button class="btn btn-danger" type="button" onclick="app.deleteNote('${safeId}')" aria-label="Delete note" title="Delete note">
              <span class="icon icon-trash"></span>
            </button>
          </div>
        </div>
        <div class="note-detail-body">
          <div class="note-read-content">${this.renderNoteMarkdown(note.content)}</div>
        </div>
      </div>
    `;
  }

  renderNoteEditor(note) {
    const isNewNote = !note.id;
    const meta = isNewNote
      ? "Draft note"
      : `Created ${this.formatRelativeDate(note.createdAt)} • Updated ${this.formatRelativeDate(note.updatedAt || note.createdAt)}`;

    return `
      <div class="note-detail-card">
        <div class="note-detail-header">
          <div class="note-detail-heading">
            <div class="note-detail-meta">${meta}</div>
          </div>
          <div class="note-detail-actions">
            <button class="btn btn-secondary" type="button" onclick="app.cancelNoteEdit()">Cancel</button>
            <button class="btn btn-primary" type="submit" form="inlineNoteEditor">
              <span aria-hidden="true">💾</span>
              ${isNewNote ? "Save Note" : "Save Changes"}
            </button>
          </div>
        </div>
        <div class="note-detail-body">
          <form id="inlineNoteEditor" class="note-editor-form" onsubmit="app.handleEditNote(event)">
            <div class="form-group">
              <label class="form-label" for="inlineNoteContent">Note</label>
              <textarea id="inlineNoteContent" class="form-input note-editor-content" placeholder="Write your note...">${this.escapeHtml(note.content || "")}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label" for="inlineNoteTags">Tags (optional)</label>
              <input id="inlineNoteTags" class="form-input" type="text" value="${this.escapeHtml((note.tags || []).join(", "))}" placeholder="ideas, writing, todo" />
            </div>
          </form>
        </div>
      </div>
    `;
  }

  handleViewGist() {
    if (this.config?.id) {
      const gistUrl = this.config.username
        ? `https://gist.github.com/${this.config.username}/${this.config.id}`
        : `https://gist.github.com/${this.config.id}`;
      window.open(gistUrl, "_blank");
    }
  }

  handleResetConfig() {
    if (
      !confirm(
        "Are you sure you want to reset your configuration? This will log you out but won't delete your bookmarks.",
      )
    ) {
      return;
    }

    Storage.remove(this.configKey);
    this.config = null;
    this.gistmark = null;
    this.showWelcomeScreen();
    Notification.success(
      "Configuration reset. You can now setup a new account.",
    );
  }

  generateBookmarklet() {
    const appUrl = `${window.location.origin}/app.html`;
    const bookmarkletBody = [
      "(function(){",
      "var u=" + JSON.stringify(appUrl) + ";",
      "var p=new URLSearchParams();",
      "p.set('source','bookmarklet');",
      "p.set('title',document.title||'');",
      "p.set('url',location.href||'');",
      "var selected='';",
      "try{selected=(window.getSelection&&window.getSelection().toString())||'';}catch(e){}",
      "if(selected){p.set('selection',selected.slice(0,500));}",
      "var target=u+'?'+p.toString();",
      "var w=window.open(target,'_blank');",
      "if(w){try{w.opener=null;}catch(e){}}else{window.location.href=target;}",
      "})();",
    ].join("");
    const bookmarkletCode = `javascript:${encodeURIComponent(bookmarkletBody)}`;

    this.bookmarkletPanels.forEach((panel) => {
      if (panel.code) {
        panel.code.value = bookmarkletCode;
      }

      if (panel.link) {
        panel.link.href = bookmarkletCode;
      }
    });
  }

  getBookmarkletLaunchData() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("source") !== "bookmarklet") {
      return null;
    }

    const title = params.get("title") || "";
    const url = params.get("url") || "";
    if (!url) {
      return null;
    }

    return {
      title,
      url,
      selection: params.get("selection") || "",
    };
  }

  handleBookmarkletLaunch() {
    if (!this.pendingBookmarkletData) return;

    this.setView("bookmarks");
    this.showModal("addBookmark");

    if (this.elements.bookmarkTitle) {
      this.elements.bookmarkTitle.value =
        this.pendingBookmarkletData.title || "";
    }

    if (this.elements.bookmarkUrl) {
      this.elements.bookmarkUrl.value = this.pendingBookmarkletData.url || "";
    }

    if (this.elements.bookmarkTags && this.pendingBookmarkletData.selection) {
      this.elements.bookmarkTags.placeholder = `Selected text captured: "${this.pendingBookmarkletData.selection}"`;
    }

    const cleanUrl = `${window.location.pathname}${window.location.hash}`;
    window.history.replaceState({}, document.title, cleanUrl);
    this.pendingBookmarkletData = null;
  }

  showModal(modalName) {
    const modal = document.getElementById(`${modalName}Modal`);
    modal?.classList.remove("hidden");

    // Initialize settings modal
    if (modalName === "settings") {
      this.initializeSettingsModal();
    }

    // Focus first input if it exists
    const firstInput = modal?.querySelector("input, textarea, select");
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }

  initializeSettingsModal() {
    this.updateThemeOptions();
    this.updateSettingsSecuritySections();

    // Load current timeout setting
    const timeoutMs = Storage.get(this.authTimeoutKey) || 0;
    if (this.elements.authTimeout) {
      this.elements.authTimeout.value = timeoutMs;
    }

    // Load current encryption setting
    if (this.elements.encryptContentSetting) {
      this.elements.encryptContentSetting.checked =
        this.config?.encryptContent || false;
    }

    if (this.elements.settingsEncryptionKey) {
      this.elements.settingsEncryptionKey.value = "";
    }
  }

  updateSettingsSecuritySections() {
    const tokenEncrypted = this.config?.tokenEncrypted !== false;

    this.elements.tokenProtectionSection?.classList.toggle(
      "hidden",
      tokenEncrypted,
    );
    this.elements.authTimeoutSection?.classList.toggle(
      "hidden",
      !tokenEncrypted,
    );
    this.elements.encryptContentSection?.classList.toggle(
      "hidden",
      !tokenEncrypted,
    );
  }

  async handleAddEncryptionKey() {
    if (!this.config || this.config.tokenEncrypted !== false) return;

    const encryptionKey = this.elements.settingsEncryptionKey?.value.trim();
    if (!encryptionKey) {
      Notification.error("Enter an encryption key to continue.");
      return;
    }

    try {
      this.setLoading(true, "Saving settings...");

      const decryptedToken = this.config.decryptedToken || this.config.token;

      this.config.token = encrypt(decryptedToken, encryptionKey);
      this.config.tokenEncrypted = true;
      this.config.encryptionKey = encryptionKey;
      this.config.decryptedToken = decryptedToken;
      SessionStorage.set(this.sessionEncryptionKey, encryptionKey);

      Storage.set(this.configKey, {
        username: this.config.username,
        token: this.config.token,
        tokenEncrypted: this.config.tokenEncrypted,
        id: this.config.id,
        encryptContent: this.config.encryptContent,
      });

      this.updateSettingsSecuritySections();
      if (this.elements.settingsEncryptionKey) {
        this.elements.settingsEncryptionKey.value = "";
      }

      Notification.success(
        "Encryption key added. Token protection is now enabled.",
      );
    } catch (error) {
      console.error("Add encryption key error:", error);
      Notification.error("Failed to add encryption key: " + error.message);
    } finally {
      this.setLoading(false);
    }
  }

  async handleEncryptContentChange() {
    if (!this.config) return;

    const newEncryptSetting = this.elements.encryptContentSetting.checked;
    const currentSetting = this.config.encryptContent || false;

    if (newEncryptSetting === currentSetting) return;

    // Warn user about the change
    const action = newEncryptSetting ? "encrypt" : "decrypt";
    const message = `This will ${action} all your bookmark data. This may take a moment and requires your encryption key. Continue?`;

    if (!confirm(message)) {
      // Revert the checkbox
      this.elements.encryptContentSetting.checked = currentSetting;
      return;
    }

    try {
      this.setLoading(true, "Updating encryption...");
      await this.ensureAuthenticated();
      const fileContents = this.gistmark.getManagedFileContents();

      // Update config
      this.config.encryptContent = newEncryptSetting;

      // Update stored config
      Storage.set(this.configKey, {
        username: this.config.username,
        token: this.config.token,
        tokenEncrypted: this.config.tokenEncrypted,
        id: this.config.id,
        encryptContent: this.config.encryptContent,
      });

      // Reinitialize gistmark with new encryption setting
      await this.initializeGistKeep();

      // Re-save all managed files to apply the new encryption setting.
      await this.gistmark.saveManagedFiles(fileContents);

      Notification.success(
        `Data ${action}ion ${newEncryptSetting ? "enabled" : "disabled"} successfully!`,
      );
    } catch (error) {
      console.error("Failed to update encryption setting:", error);
      Notification.error(
        "Failed to update encryption setting: " + error.message,
      );
      // Revert the checkbox
      this.elements.encryptContentSetting.checked = currentSetting;
    } finally {
      this.setLoading(false);
    }
  }

  async handleCopyBookmarklet(panelKey = "settings") {
    const panel = this.bookmarkletPanels.get(panelKey);
    const bookmarkletCode = panel?.code?.value;
    if (!bookmarkletCode) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(bookmarkletCode);
      } else if (panel?.code) {
        panel.code.focus();
        panel.code.select();
        panel.code.setSelectionRange(0, bookmarkletCode.length);
        document.execCommand("copy");
      }

      Notification.success("Bookmarklet code copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy bookmarklet:", error);
      Notification.error("Failed to copy bookmarklet code");
    }
  }

  hideModal(modalName) {
    const modal = document.getElementById(`${modalName}Modal`);
    modal?.classList.add("hidden");

    // Clear editing state when closing edit modal
    if (modalName === "editBookmark") {
      this.editingBookmark = null;
      // Reset new category form state
      this.elements.editNewCategoryGroup.style.display = "none";
      this.elements.editNewCategoryName.value = "";
      this.elements.editNewCategoryName.required = false;
    }

    // Reset add bookmark new category form state
    if (modalName === "addBookmark") {
      this.elements.newCategoryGroup.style.display = "none";
      this.elements.newCategoryName.value = "";
      this.elements.newCategoryName.required = false;
      this.elements.bookmarkTags.placeholder =
        "web, development, tutorial (comma separated)";
    }

    if (modalName === "addNote") {
      this.elements.addNoteForm?.reset();
    }

    if (modalName === "editNote") {
      this.editingNote = null;
      if (this.elements.editNoteForm) {
        this.elements.editNoteForm.reset();
      }
    }

    if (modalName === "viewNote") {
      this.viewingNote = null;
      if (this.elements.viewNoteContent) {
        this.elements.viewNoteContent.innerHTML = "";
      }
      if (this.elements.viewNoteMeta) {
        this.elements.viewNoteMeta.textContent = "";
      }
    }

    if (modalName === "editCategory") {
      this.editingCategory = null;
      if (this.elements.editCategoryName) {
        this.elements.editCategoryName.value = "";
      }
      if (this.elements.editCategoryCurrentName) {
        this.elements.editCategoryCurrentName.textContent = "";
      }
      if (this.elements.deleteCategoryDestination) {
        this.elements.deleteCategoryDestination.innerHTML =
          '<option value="">Select destination list</option>';
      }
    }
  }

  toggleSidebar() {
    this.elements.sidebar?.classList.toggle("open");
    document.querySelector(".main-app")?.classList.toggle("sidebar-open");
  }

  setLoading(loading, message = "Working...") {
    if (loading) {
      this.loadingCount += 1;
      this.loadingMessage = message;
    } else {
      this.loadingCount = Math.max(0, this.loadingCount - 1);
      if (this.loadingCount === 0) {
        this.loadingMessage = "Working...";
      }
    }

    this.isLoading = this.loadingCount > 0;

    if (this.elements.globalActivityText) {
      this.elements.globalActivityText.textContent = this.loadingMessage;
    }

    if (this.elements.globalActivity) {
      this.elements.globalActivity.classList.toggle("visible", this.isLoading);
      this.elements.globalActivity.setAttribute(
        "aria-hidden",
        this.isLoading ? "false" : "true",
      );
    }

    // Add loading states to buttons
    const buttons = document.querySelectorAll('button[type="submit"]');
    buttons.forEach((button) => {
      if (this.isLoading) {
        button.disabled = true;
        button.style.opacity = "0.6";
      } else {
        button.disabled = false;
        button.style.opacity = "1";
      }
    });
  }
}

// Initialize the app when the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.app = new GistKeepApp();
});
