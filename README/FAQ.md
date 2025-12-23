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

All of ASM's data is stored locally on your computer and will only transmit data to your VRChat client. None of your data is sent anywhere externally.

## Do I need anything special to run ASM?

All you need is VRChat with OSC enabled.

## Will this conflict with other OSC applications?

No, it should not conflict. ASM uses VRChat's OSC Query feature to properly manage multiple OSC applications.

## Does ASM always need to be running?

For real-time monitoring, yes. ASM needs to be running in the background to automatically track changes.

If you open ASM while already in-game, switch to a different avatar and then switch back to the one you want to save, this allows ASM to capture the current state.

## How can I share configs with other people?

Export your configuration and send the file to a friend, who can then import it into their ASM. You can read the detailed explanation on exporting and importing [here](./detailed-export-import.md).

## Why is the Incoming 0 params/sec?

This could be caused by several issues:

- VRChat is not running
- OSC is not enabled in VRChat
- The avatar has no parameters

If the issue persists, please ask in the [Discord](https://discord.gg/rcCCkbDsY3) and include a copy of `Meow.log`.

## Can I include ASM configs with my commercial avatars?

Yes! Avatar creators are welcome to include ASM-exported configurations and presets with their commercial avatar products. When doing so, please provide attribution by crediting Avatar Settings Manager and linking to the download page (https://github.com/Nymmh/vrc-avatar-settings-manager/releases). This allows your customers to easily load and use the configurations you've created. See Section 3.2 of the [EULA](./terms.md#32-commercial-use-of-exported-configurations) for complete details.
