# ASM FAQ

## Is ASM against VRChat TOS?

No, ASM is not against VRChat TOS.

ASM does not modify your game in any way and uses features and data provided by VRChat. It is not a mod or cheat.

## Do I need to login to my VRChat account?

No, you do not have to login to your VRChat account. ASM never needs any details from your account.

## What kind of avatar settings can be saved?

Any avatar parameters can be saved! GoGoLoco parameters are excluded from being saved. VRCFT settings are also excluded by default but can be enabled in ASM settings.

## Does this work with all avatars?

Yes! ASM works with all avatars, including cloned avatars.

## Where is the data stored?

All of ASM's data is stored locally on your computer in:

- **Database**: `%APPDATA%\Roaming\vrc-avatar-settings-manager\Meow Storage\meow.db`
- **Exported Files**: `%USERPROFILE%\Documents\VRCAvatarSettingsManager\exports`
- **Log Files**: `%USERPROFILE%\Documents\VRCAvatarSettingsManager\meow.log`

ASM only transmits data to your local VRChat client. The only external network request is to check for software updates from the official GitHub repository. No user data, configurations, or personal information is transmitted externally.

## Do I need anything special to run ASM?

All you need is VRChat with OSC enabled.

## Will this conflict with other OSC applications?

No, it should not conflict. ASM uses VRChat's OSC Query feature to properly manage multiple OSC applications.

## Will this conflict with avatar preset saving prefabs?

No, ASM is compatible with avatar preset saving prefabs and will save those parameter values. If you experience any issues, please ask in the [Discord](https://discord.gg/rcCCkbDsY3).

## Does ASM always need to be running?

Yes, for real-time monitoring and the ASM Unity package to function properly. ASM runs in the background to automatically track parameter changes.

If ASM is started while you're already in-game, switch to a different avatar and then back to capture the current state.

## How can I share configs with other people?

You can use the Copy Share Code function to copy a single configuration, which can be shared and imported by others. You can also export your configuration and send the file to a friend, who can then import it into their ASM. You can read the detailed explanation on exporting and importing [here](./detailed-export-import.md).

## What does the Copy Share Code button do?

Copy Share Code compresses your configuration into a compact text string and automatically copies it to your clipboard for easy sharing on Discord or other messaging platforms. If the configuration is too large to send via Discord, ASM will display an error indicating it exceeds the message length limit.

## What kind of data is included in the exported file?

Exported files contain the avatar ID, avatar name, configuration name, parameter values, and metadata required for importing. All data is stored in JSON format for easy sharing and backup.

## Why is the Incoming 0 params/sec?

This could be caused by several issues:

- VRChat is not running
- OSC is not enabled in VRChat
- The avatar has no parameters

If the issue persists, please ask in the [Discord](https://discord.gg/rcCCkbDsY3) and include a copy of `meow.log` if requested to.

## Why is the app not opening?

This can occur when ASM cannot locate required files, most often because the installation directory was changed. Reinstall ASM using the default installation location. If the issue persists, please ask in the [Discord](https://discord.gg/rcCCkbDsY3) and include a copy of `meow.log` if requested.

## Can I include ASM configs with my commercial avatars?

Yes! Avatar creators are welcome to include ASM-exported configurations and presets with their commercial avatar products. When doing so, please provide attribution by crediting Avatar Settings Manager and linking to the download page (https://github.com/Nymmh/vrc-avatar-settings-manager/releases). This allows your customers to easily load and use the configurations you've created. See Section 3.2 of the [EULA](./terms.md#32-commercial-use-of-exported-configurations) for complete details.
