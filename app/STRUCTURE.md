# App folder layout

```
app/
  components/
    auth/          Account, session provider
    canvas/        Grid, viewport, context menu, shortcuts
      overlays/    Toasts, loading, welcome
      viewport/    Pan/zoom surface + video detail panel
    shared/        Cross-feature UI (keyboard chord display)
    toolbar/       Header, playlist input, pan buttons, settings dialog
    ui/            Primitive UI (kbd)
  hooks/
    canvas/        Tiles, camera, persistence, pointer, clipboard
    playlist/      Load playlists, cache helpers
    toolbar/       Toolbar press feedback, onboarding placements
  lib/
    canvas/        Layout, storage, import/export, ordering, selection, clipboard
    playlist/      Video wire format, cache, source helpers
    youtube/       YouTube Data API client
  types/           Shared TypeScript types
  api/             Route handlers
```

When adding a feature, put files in the matching domain folder instead of the `app/` root.
