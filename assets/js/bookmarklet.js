function bookmarklet(id, token) {
  var gh = new GistKeep(token);
  gh.setId(id);

  var el = {
    style: document.createElement('style'),
    message: document.createElement('div'),
    bookmark: document.createElement('div'),
    bookmarkBtn: document.createElement('button'),
    category: document.createElement('select'),
    option: document.createElement('option'),
    categoryBtn: document.createElement('button'),
  };

  el.style.innerText = `
    /* CSS Reset and Isolation for GistKeep bookmarklet */
    #gistkeep-bookmarklet {
      all: initial !important;
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      width: 380px !important;
      max-width: calc(100vw - 40px) !important;
      padding: 0 !important;
      margin: 0 !important;
      z-index: 2147483647 !important; /* Maximum possible z-index */
      font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif !important;
      font-size: 14px !important;
      line-height: 1.4 !important;
      color: #0f172a !important;
      background: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 12px !important;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
      backdrop-filter: blur(8px) !important;
      text-align: left !important;
      box-sizing: border-box !important;
    }
    
    #gistkeep-bookmarklet * {
      all: unset !important;
      box-sizing: border-box !important;
    }
    
    #gistkeep-bookmarklet .bookmarklet-header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 16px !important;
      border-bottom: 1px solid #e2e8f0 !important;
      background: #f8fafc !important;
      border-radius: 12px 12px 0 0 !important;
    }
    
    #gistkeep-bookmarklet .bookmarklet-logo {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      font-weight: 600 !important;
      font-size: 16px !important;
      color: #0f172a !important;
    }
    
    #gistkeep-bookmarklet .bookmarklet-logo::before {
      content: "🔖" !important;
      font-size: 18px !important;
    }
    
    #gistkeep-bookmarklet .bookmarklet-close {
      width: 24px !important;
      height: 24px !important;
      border: none !important;
      background: none !important;
      cursor: pointer !important;
      font-size: 16px !important;
      color: #64748b !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 6px !important;
      transition: background-color 0.2s !important;
    }
    
    #gistkeep-bookmarklet .bookmarklet-close:hover {
      background: #e2e8f0 !important;
    }
    
    #gistkeep-bookmarklet .bookmarklet-body {
      padding: 16px !important;
    }
    
    #gistkeep-bookmarklet .bookmark-info {
      margin-bottom: 16px !important;
    }
    
    #gistkeep-bookmarklet .bookmark-title {
      font-weight: 500 !important;
      font-size: 15px !important;
      color: #0f172a !important;
      margin-bottom: 4px !important;
      display: block !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }
    
    #gistkeep-bookmarklet .bookmark-url {
      font-size: 12px !important;
      color: #64748b !important;
      display: block !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }
    
    #gistkeep-bookmarklet .form-group {
      margin-bottom: 16px !important;
    }
    
    #gistkeep-bookmarklet .form-label {
      display: block !important;
      font-weight: 500 !important;
      color: #0f172a !important;
      margin-bottom: 6px !important;
      font-size: 14px !important;
    }
    
    #gistkeep-bookmarklet .form-input {
      width: 100% !important;
      padding: 8px 12px !important;
      border: 1px solid #d1d5db !important;
      border-radius: 6px !important;
      font-size: 14px !important;
      background: #ffffff !important;
      color: #0f172a !important;
      transition: all 0.2s !important;
    }
    
    #gistkeep-bookmarklet .form-input:focus {
      outline: none !important;
      border-color: #3b82f6 !important;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
    }
    
    #gistkeep-bookmarklet .button-group {
      display: flex !important;
      gap: 8px !important;
      margin-top: 16px !important;
    }
    
    #gistkeep-bookmarklet .btn {
      padding: 8px 16px !important;
      border: none !important;
      border-radius: 6px !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      cursor: pointer !important;
      transition: all 0.2s !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      text-decoration: none !important;
      flex: 1 !important;
    }
    
    #gistkeep-bookmarklet .btn-primary {
      background: #3b82f6 !important;
      color: #ffffff !important;
    }
    
    #gistkeep-bookmarklet .btn-primary:hover {
      background: #2563eb !important;
    }
    
    #gistkeep-bookmarklet .btn-secondary {
      background: #f1f5f9 !important;
      color: #475569 !important;
      border: 1px solid #e2e8f0 !important;
    }
    
    #gistkeep-bookmarklet .btn-secondary:hover {
      background: #e2e8f0 !important;
    }
    
    #gistkeep-bookmarklet .notification {
      padding: 12px !important;
      border-radius: 6px !important;
      margin-bottom: 16px !important;
      font-size: 14px !important;
      display: none !important;
    }
    
    #gistkeep-bookmarklet .notification.success {
      background: #dcfce7 !important;
      color: #166534 !important;
      border: 1px solid #bbf7d0 !important;
    }
    
    #gistkeep-bookmarklet .notification.error {
      background: #fef2f2 !important;
      color: #dc2626 !important;
      border: 1px solid #fecaca !important;
    }
    
    #gistkeep-bookmarklet .notification.show {
      display: block !important;
    }
    
    /* Mobile optimizations */
    @media (max-width: 480px) {
      #gistkeep-bookmarklet {
        top: 10px !important;
        right: 10px !important;
        left: 10px !important;
        width: auto !important;
        max-width: none !important;
      }
      
      #gistkeep-bookmarklet .bookmarklet-header {
        padding: 12px !important;
      }
      
      #gistkeep-bookmarklet .bookmarklet-body {
        padding: 12px !important;
      }
      
      #gistkeep-bookmarklet .button-group {
        flex-direction: column !important;
      }
    }
  `;

  const sleep = delay => new Promise(resolve => setTimeout(resolve, delay));

  function showMsg(text, error=false) {
    const notificationType = error ? 'error' : 'success';
    el.message.className = `notification ${notificationType} show`;
    el.message.innerHTML = text;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      el.message.classList.remove('show');
    }, 3000);
  }

  function addCategoryOption(category) {
    var optionEl = document.createElement('option');
    optionEl.value = category;
    optionEl.innerHTML = category;
    el.category.appendChild(optionEl);
  }

  async function addCategory() {
    let category = window.prompt('Choose a list name');
    if (!category) return;
    
    category = category.trim();
    if(category.length) {
      try {
        await gh.addCategory(category);
        addCategoryOption(category);
        el.category.value = category;
        showMsg(`List "${category}" created successfully!`);
      } catch (error) {
        showMsg('Error creating list: ' + error.message, true);
      }
    } else {
      showMsg('List name cannot be empty.', true);
    }
  }

  async function saveBookmark() {
    const category = el.category.value;
    if(category === "") {
      showMsg('Please select a list', true);
      return;
    }
    
    try {
      // Disable the save button to prevent double-clicks
      el.bookmarkBtn.disabled = true;
      el.bookmarkBtn.innerHTML = 'Saving...';
      
      await gh.saveBookmark(document.title, window.location.href, category);
      showMsg('Bookmark saved successfully!');
      
      // Close after successful save
      setTimeout(() => {
        closeBookmarklet();
      }, 1500);
    } catch (error) {
      showMsg('Error saving bookmark: ' + error.message, true);
      el.bookmarkBtn.disabled = false;
      el.bookmarkBtn.innerHTML = 'Save Bookmark';
    }
  }
  
  function closeBookmarklet() {
    if (el.bookmark && el.bookmark.parentNode) {
      el.bookmark.parentNode.removeChild(el.bookmark);
    }
  }

  async function init() {
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'bookmarklet-close';
    closeBtn.innerHTML = '✕';
    closeBtn.addEventListener('click', closeBookmarklet);

    // Set up main container
    el.bookmark.id = 'gistkeep-bookmarklet';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'bookmarklet-header';
    
    const logo = document.createElement('div');
    logo.className = 'bookmarklet-logo';
    logo.textContent = 'GistKeep';
    
    header.appendChild(logo);
    header.appendChild(closeBtn);
    
    // Create body
    const body = document.createElement('div');
    body.className = 'bookmarklet-body';
    
    // Add notification area
    el.message.className = 'notification';
    body.appendChild(el.message);
    
    // Create bookmark info
    const bookmarkInfo = document.createElement('div');
    bookmarkInfo.className = 'bookmark-info';
    
    const title = document.createElement('div');
    title.className = 'bookmark-title';
    title.textContent = document.title;
    title.title = document.title; // Show full title on hover
    
    const url = document.createElement('div');
    url.className = 'bookmark-url';
    url.textContent = window.location.href;
    url.title = window.location.href; // Show full URL on hover
    
    bookmarkInfo.appendChild(title);
    bookmarkInfo.appendChild(url);
    body.appendChild(bookmarkInfo);

    // Create form group for list
    const categoryGroup = document.createElement('div');
    categoryGroup.className = 'form-group';
    
    const categoryLabel = document.createElement('label');
    categoryLabel.className = 'form-label';
    categoryLabel.textContent = 'List';
    
    el.category.className = 'form-input';
    el.option.value = "";
    el.option.innerHTML = 'Select a list';
    el.category.appendChild(el.option);
    
    categoryGroup.appendChild(categoryLabel);
    categoryGroup.appendChild(el.category);
    body.appendChild(categoryGroup);

    // Create button group
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';
    
    el.bookmarkBtn.className = 'btn btn-primary';
    el.bookmarkBtn.innerHTML = 'Save Bookmark';
    el.bookmarkBtn.addEventListener('click', saveBookmark);
    
    el.categoryBtn.className = 'btn btn-secondary';
    el.categoryBtn.innerHTML = 'New List';
    el.categoryBtn.addEventListener('click', addCategory);
    
    buttonGroup.appendChild(el.bookmarkBtn);
    buttonGroup.appendChild(el.categoryBtn);
    body.appendChild(buttonGroup);

    // Assemble the complete structure
    el.bookmark.appendChild(header);
    el.bookmark.appendChild(body);

    try {
      showMsg('Loading lists...', false);
      const response = await gh.getGist();
      const categories = gh.getCategories();
      
      if (categories.length === 0) {
        showMsg('No lists found. Create one first.', true);
      } else {
        categories.forEach(addCategoryOption);
        el.message.classList.remove('show'); // Hide loading message
      }
    } catch(error) {
      showMsg('Error loading: ' + error.message, true);
    }

    // Add styles and show bookmarklet
    document.head.appendChild(el.style);
    document.body.appendChild(el.bookmark);
  }

  window.onerror = () => { return true; };
  init();
}
