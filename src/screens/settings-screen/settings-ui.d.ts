// Types for the platform-resolved `./settings-ui` module. The bundler picks
// `settings-ui.ios.tsx`, `settings-ui.android.tsx` or `settings-ui.web.tsx`; TypeScript
// resolves the specifier to this declaration.
//
// The contract itself lives in `./settings-ui.types`, so the implementations can import it
// and be checked against it.
import type { SettingsUIModule } from "./settings-ui.types";

export * from "./settings-ui.types";

export declare const SettingsUI: SettingsUIModule;
