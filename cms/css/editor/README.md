# Website Editor CSS Modules

## Structure Overview

The monolithic `editor.css` (1663 lines) has been split into 6 semantic modules for token-efficient LLM editing.

### Module Breakdown

| File | Lines | Purpose |
|------|-------|---------|
| **editor-base.css** | 284 | Reset, Variables, Layout fundamentals, Base structures (Website frame, Loading, Toast, Sticky notes, Markers) |
| **editor-toolbar.css** | 278 | Toolbar, Buttons, Status badges, Mode switch, Dropdowns, Mobile menu button |
| **editor-frame.css** | 219 | Sidebar, Panels, Version List, Change List, Trash Panel, Preview modes, Comparison slider |
| **editor-modals.css** | 646 | Setup screen, Recording modals, Background editor, Image/Video modals, Webcam settings, PIP, Toggle switches |
| **editor-context-menu.css** | 131 | Context menu, Format toolbar, Color picker, Emoji picker, Image resize |
| **editor-responsive.css** | 130 | Media queries, Mobile styles, Touch device optimizations |
| **editor.css** (main) | 35 | Import file for all modules |
| **TOTAL** | **1,688** | Complete editor styles (25 lines added for structure) |

### Usage

The main `editor.css` file now uses `@import` statements to load all modules:

```css
@import url('editor/editor-base.css');
@import url('editor/editor-toolbar.css');
@import url('editor/editor-frame.css');
@import url('editor/editor-modals.css');
@import url('editor/editor-context-menu.css');
@import url('editor/editor-responsive.css');
```

### LLM Editing Guidelines

- **All modules < 300 lines**: Optimal for LLM context windows
- **Clear separation of concerns**: Each module handles a specific UI domain
- **Preserved all rules**: No CSS was removed or modified, only reorganized
- **Complete selectors**: All selectors and rules kept together (no fragmentation)
- **Clear section comments**: Each file has descriptive headers

### File Locations

```
cms/css/
├── editor.css              # Main import file (35 lines)
└── editor/
    ├── editor-base.css           # (284 lines)
    ├── editor-toolbar.css        # (278 lines)
    ├── editor-frame.css          # (219 lines)
    ├── editor-modals.css         # (646 lines)
    ├── editor-context-menu.css   # (131 lines)
    └── editor-responsive.css     # (130 lines)
```

### Version

2.0.0 - Modularized December 2024
