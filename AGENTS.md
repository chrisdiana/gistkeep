# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

GistKeep is a modernized bookmark management application that stores bookmarks as encrypted Markdown files in GitHub Gists. It features a mail-style UI with a sidebar for categories and a main content area for bookmarks, plus a bookmarklet for quickly saving bookmarks from any webpage.

## Architecture

### Core Components

- **GistKeep Class** (`assets/js/gistkeep.js`): Modernized API class for GitHub Gist operations
  - Async/await patterns with comprehensive error handling
  - CRUD operations on gist files with validation
  - Built-in search and filtering capabilities
  - Bookmark counting and category management utilities
  - Communicates with GitHub API using personal access tokens

- **GistKeepApp Class** (`assets/js/app.js`): Modern application controller with state management
  - Component-based UI state management
  - Event-driven architecture with proper cleanup
  - Modal management for adding bookmarks and settings
  - Real-time search and category filtering
  - Responsive design with mobile sidebar toggle
  - Toast notifications for user feedback

- **Bookmarklet** (`assets/js/bookmarklet.js`): Browser bookmarklet for saving pages
  - Injects responsive UI overlay on any webpage
  - Dynamically loads required scripts
  - Allows quick bookmark saving with category selection

### Modern UI Features

- **Mail-style Layout**: Sidebar with categories + main content area for bookmarks
- **Responsive Design**: Mobile-first approach with collapsible sidebar
- **Search Functionality**: Real-time bookmark search across titles, URLs, and categories
- **Category Management**: Dynamic category creation with bookmark counts
- **Modal Dialogs**: Clean overlay modals for forms and settings
- **Toast Notifications**: Non-blocking feedback for user actions
- **Loading States**: Disabled buttons and visual feedback during operations
- **Empty States**: Helpful placeholder content when no bookmarks exist

### Data Flow

1. **Setup Flow**: User provides GitHub credentials and encryption key
2. **Authentication**: Tokens encrypted with AES and stored locally
3. **Initialization**: App loads gist data and populates categories/bookmarks
4. **Real-time Updates**: All changes immediately reflected in UI and synced to GitHub
5. **Search/Filter**: Dynamic filtering without server round-trips
6. **Bookmarklet Integration**: External pages can save bookmarks through injected UI

## File Structure

- `app.html` - Complete modernized application with responsive layout
- `index.html` - Basic landing page (unchanged)
- `assets/js/gistkeep.js` - Refactored API class with modern patterns and error handling
- `assets/js/app.js` - New modern app controller with state management
- `assets/js/bookmarklet.js` - External page bookmark saving functionality
- `assets/js/crypto-js.min.js` - AES encryption library for token security
- `assets/img/` - Landing page, app, and workflow image assets
- `assets/fonts/` - Local font assets

## Development Commands

### Testing
```bash
# Start local development server
python3 -m http.server 8080

# Open application
open http://localhost:8080/app.html
```

### Dependencies

- **CryptoJS**: AES encryption for securing GitHub tokens in localStorage
- **Inter Font**: Modern Google Fonts typography
- **GitHub API**: All bookmark data stored as Gist files
- **Vanilla JavaScript**: No frameworks or build tools required

### Security Model

- GitHub personal access tokens are AES-encrypted before localStorage storage
- Users must provide encryption key on each session to decrypt tokens
- All gist operations use GitHub's API authentication
- Tokens never stored in plaintext in browser storage

### Markdown Structure

Bookmarks are stored in gist files as structured markdown:
- Introductory content and table of contents
- Categories as `## Category Name` headings
- Bookmarks as markdown links under each category
- Separator `----------` divides metadata from content
- Initial "Getting Started" category created automatically

## Modern Features Added

1. **Responsive Mail-Style UI** - Clean layout with sidebar navigation
2. **Real-time Search** - Filter bookmarks without page refreshes  
3. **Category Management** - Dynamic category creation with counts
4. **Modal Interfaces** - Clean overlay dialogs for forms
5. **Toast Notifications** - Non-blocking user feedback
6. **Loading States** - Visual feedback during async operations
7. **Empty State Handling** - Helpful placeholders and calls-to-action
8. **Mobile Responsive** - Collapsible sidebar for mobile devices
9. **Error Handling** - Comprehensive error messages and recovery
10. **State Management** - Centralized app state with proper updates
