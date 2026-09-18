# Version 1.1.0 - 2026-04-16

## Changes

- Moved Import All and Export All from the footer to the Settings window.
- Moved All Data buttons into tabs to reduce confusion and improve organization.

## Additions

- Added Config Buffer:
- - Helps apply saved configurations if your avatar struggles to apply them.
- - Can be enabled in the Settings window.
- Added Low Performance Mode:
- - Disables UI animations to improve performance.
- - Restarting ASM after enabling is recommended, but not required.
- ASM can now automatically detect when VRChat is running:
- - Automatically retrieves your avatar ID.
- Added a Refresh button to the "Not Found" window.
- Added `VRCAvatarSettingsManagerBackup` folder in Documents:
- - Will be used for backups and expanded functionality in the future.

## Fixes

- Lighting settings are now preserved when applying saved configurations:
- - Brightness will no longer reset to 0.
- - Unsaved values (Avatar Parameters) will no longer reset to 0.
- Converted Apply Config into a promise:
- - Improves reliability and predictability.
- Fixed an issue where duplicate requests were received in certain scenarios.
- ASM storage is now seeded with your avatar’s parameters on load and refresh.
- Normalized parameter names and optimized hot paths:
- - Improved matching, lookups, and exclusions for better reliability.
- - Reduced overhead in frequently used operations for faster performance.
- Improved the apply-config pipeline:
- - Safer execution.
- - Unmatched parameters are now set to 0.

---

# Version 1: 2026 - 02 - 19

Public release
