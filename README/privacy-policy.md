# Privacy Policy for Avatar Settings Manager

**Last Updated:** December 23, 2025

This Privacy Policy explains what data Avatar Settings Manager (ASM) collects, how it's used, and how it's stored.

## Data Collection and Storage

### What Data is Collected

ASM collects and stores the following data **locally on your computer**:

- **Avatar Configuration Data**: Parameter names, values, and settings for your VRChat avatars (Note: VRCFT parameters are excluded by default but can be enabled in settings)
- **Avatar Metadata**: Avatar IDs and names
- **User-Created Presets**: Custom preset configurations you create
- **Application Settings**: Your preferences within ASM (e.g., face tracking save settings)
- **Log Files**: Technical logs for troubleshooting purposes (stored as `meow.log`). These logs may include your Windows username.

### Where Data is Stored

All data is stored **exclusively on your local computer** in:

- **Database**: A SQLite database (`meow.db`) stored in `%APPDATA%\Roaming\vrc-avatar-settings-manager\Meow Storage\`
- **Log Files**: Stored in `%USERPROFILE%\Documents\VRCAvatarSettingsManager\`

**ASM does not use cloud storage.** All your data remains on your device under your complete control.

## Data Transmission

### Local Communication Only

ASM **only** communicates with:

- **Your local VRChat client** via VRChat's OSC (Open Sound Control) protocol
- **VRChat's local cache files** on your computer (read-only access)

### External Network Requests

The **only** external network request ASM makes is:

- **Update Checks**: ASM checks the official GitHub repository for software updates

**No user data, avatar configurations, settings, or personal information is ever transmitted to external servers.**

## Data You Control

### Exported Configuration Files

When you export configurations or presets:

- Files are created on your local computer
- You have complete control over these files
- Files are only shared if you manually choose to share them with others
- ASM does not track, access, or transmit exported files

### Data Deletion

You can delete your data at any time by:

- **Manual Deletion**: Removing the `VRCAvatarSettingsManager` folder from your `%USERPROFILE%\Documents` directory and the `vrc-avatar-settings-manager` folder from `%APPDATA%\Roaming`
- **Uninstaller**: During uninstallation, the app data in `%APPDATA%\Roaming\vrc-avatar-settings-manager` is automatically removed. You'll be given the option to also delete your saved configurations in `%USERPROFILE%\Documents\VRCAvatarSettingsManager`

## Third-Party Services

### VRChat Integration

- ASM reads avatar parameter data from VRChat's **local** OSC and cache files
- ASM uses VRChat's **OSC Query** protocol for local communication
- ASM **does not** modify VRChat game files or memory
- ASM is an unofficial third-party utility and is not affiliated with VRChat

### No Analytics or Tracking

ASM does **not** use:

- Analytics services
- Telemetry
- Crash reporting services (only local log files are created)
- Advertising networks
- User tracking of any kind

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time. Changes will be reflected in the "Last Updated" date at the top of this document. Material changes will be communicated through update notifications, GitHub release notes, and Discord announcements. Continued use of ASM after changes constitutes acceptance of the updated Privacy Policy.

## Age Requirements

ASM is intended for users aged 13 and older, consistent with VRChat's Terms of Service as referenced in EULA Section 7.1. We do not knowingly collect data from users under 13.

## Data Security

While all data is stored locally on your device, we recommend:

- Keeping your computer secure with appropriate security software
- Regularly backing up important configurations if desired
- Being cautious when sharing exported configuration files
- When sharing log files for troubleshooting, be aware they may contain your Windows username in file paths

## Your Rights

You have complete control over your data, consistent with GDPR and CCPA principles:

- **Right to Access**: All data is stored locally in SQLite format and accessible at any time
- **Right to Deletion**: You can delete all data at any time through manual deletion or the uninstaller (see Section "Data Deletion" above)
- **Right to Portability**: Export features allow you to save and transfer your configurations as specified in EULA Section 6.2
- **Right to Control**: You retain all rights to your configurations and decide what to save and share (EULA Section 6.1)
- **Right to Know**: This policy discloses all data collection and usage practices

Since all data is stored locally on your device, you have direct control without needing to submit access or deletion requests.

## Contact

For questions about this Privacy Policy or data practices:

- **GitHub Issues**: https://github.com/Nymmh/vrc-avatar-settings-manager/issues
- **Discord**: https://discord.gg/rcCCkbDsY3

## Summary

**ASM is a privacy-focused application:**

- ✅ All data stored locally on your device
- ✅ No external data transmission (except update checks)
- ✅ No analytics or tracking
- ✅ Complete user control over all data
- ✅ No account creation or login required
- ✅ Source code available for transparency

You maintain complete ownership and control of all avatar configurations, presets, and settings created with ASM.
