# Custom Modifications by crazykivi (Никита Редько)

This document outlines the custom enhancements and fixes made to the original [File Browser](https://github.com/filebrowser/filebrowser) project.

> These changes are **not part of the official File Browser** and are maintained separately.

---

## Summary of Changes

### UI & UX Improvements
- **Dynamic file listing refresh** after upload (no manual page reload needed)
- **"Create" button** in header and context menu → opens quick modal to create files/folders
- **Persistent UI state**: sort/group settings are preserved across navigation
- **Responsive context menus** with improved positioning
- **Long-press to select**: on touch devices, holding a file/folder automatically enables multi-selection mode and selects the item (mimics native mobile file managers)

### Date-based File Grouping
- **"Sort by creation date"** toggle button (`По дате создания`)
- Files are grouped by **month/year** (e.g., *декабрь 2025*)
- Uses `modified` timestamp from server, but UI displays it as logical "creation"

### Upload & File System
- **Preserves original file modification time (mtime)** during upload (when provided by client)
- **TUS upload handler patched** to respect client-sent timestamps
- Fixed **partial upload state inconsistency** (files now appear immediately after replace/skip)

### Media & Preview Enhancements
- **Added WebP image format support** for resolution detection and metadata extraction  
  (enables correct display of dimensions in file listings and avoids “unknown format” errors)

### Deployment
- Created **dedicated Docker images** under [`crazykivi/filebrowser`](https://hub.docker.com/r/crazykivi/filebrowser)
- Supports versioned tags (`v1`, `latest`, etc.) instead of relying on `latest`

---

## License Notice

This work is based on [File Browser](https://github.com/filebrowser/filebrowser),  
copyright © 2018 File Browser Contributors,  
licensed under [Apache License 2.0](LICENSE).

All modifications in this repository are copyright © 2025 Никита Редько (crazykivi)  
and are distributed under the same Apache License 2.0 terms.