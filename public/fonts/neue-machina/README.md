# PP Neue Machina Inktrap

Licensed from Pangram Pangram. Put the web-font files here with these exact names:

| File | Weight | Used for |
| --- | --- | --- |
| `PPNeueMachina-InktrapRegular.woff2` | 400 | All headlines (required) |
| `PPNeueMachina-InktrapLight.woff2` | 300 | Optional — declared, not used yet |
| `PPNeueMachina-InktrapUltrabold.woff2` | 800 | Optional — declared, not used yet |

The `@font-face` rules at the top of `src/app/globals.css` already point here, so
nothing else needs to change. Until the Regular file is present, headlines fall back to
Plus Jakarta Sans.
