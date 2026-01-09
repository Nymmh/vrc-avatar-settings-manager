<script lang="ts" setup>
import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue'
</script>

<template>
  <div class="privacy__wrapper">
    <OverlayScrollbarsComponent
      ref="scrollContainer"
      element="div"
      defer
      :options="{
        scrollbars: {
          autoHide: 'move',
          autoHideDelay: 300
        }
      }"
    >
      <div class="privacy">
        <div class="privacy__section">
          <h1 class="privacy__header">Privacy Policy for Avatar Settings Manager</h1>
          <p class="privacy__text">
            <span class="privacy__bold">Last Updated:</span> December 23, 2025
          </p>
          <p class="privacy__text">
            This Privacy Policy explains what data Avatar Settings Manager (ASM) collects, how it's
            used, and how it's stored.
          </p>
        </div>
        <div class="privacy__section">
          <h2 class="privacy__sub-header">Data Collection and Storage</h2>
          <h3 class="privacy__section-header">What Data is Collected</h3>
          <p class="privacy__text">
            ASM collects and stores the following data locally on your device:
          </p>
          <ul class="privacy__list privacy__text">
            <li>
              <span class="privacy__bold">Avatar Configuration Data:</span> Parameter names, values,
              and settings for your VRChat avatars (Note: VRCFT parameters are excluded by default
              but can be enabled in settings)
            </li>
            <li><span class="privacy__bold">Avatar Metadata: </span>Avatar IDs and names</li>
            <li>
              <span class="privacy__bold">User-Created Presets: </span>Custom preset configurations
              you create
            </li>
            <li>
              <span class="privacy__bold">Application Settings: </span>Your preferences within ASM
              (e.g., face tracking save settings)
            </li>
            <li>
              <span class="privacy__bold">Log Files: </span>Technical logs for troubleshooting
              purposes (stored as <span class="privacy__highlight">meow.log</span>). These logs may
              include your Windows username.
            </li>
          </ul>
          <h3 class="privacy__section-header">Where Data is Stored</h3>
          <p class="privacy__text">
            All data is stored
            <span class="privacy__bold">exclusively on your local computer</span> in:
          </p>
          <ul class="privacy__list privacy__text">
            <li>
              <span class="privacy__bold">Database: </span>
              <span>A SQLite database (</span>
              <span class="privacy__highlight">meow.db</span>) stored in
              <span class="privacy__highlight">
                %APPDATA%\Roaming\vrc-avatar-settings-manager\Meow Storage\
              </span>
            </li>
            <li>
              <span class="privacy__bold">Log Files: </span>
              <span>Stored in</span>
              <span class="privacy__highlight">
                %USERPROFILE%\Documents\VRCAvatarSettingsManager\
              </span>
            </li>
          </ul>
          <p class="privacy__text">
            <span class="privacy__bold">ASM does not use cloud storage.</span>
            All your data remains on your device under your complete control.
          </p>
        </div>
        <div class="privacy__section">
          <h2 class="privacy__sub-header">Data Transmission</h2>
          <h3 class="privacy__section-header">Local Communication Only</h3>
          <p>ASM <span class="privacy__bold">only</span> communicates with:</p>
          <ul class="privacy__list privacy__text">
            <li>
              <span>Your local VRChat client</span> via VRChat's OSC (Open Sound Control) protocol
            </li>
            <li><span>VRChat's local cache files</span> on your computer (read-only access)</li>
          </ul>
          <h3 class="privacy__section-header">External Network Requests</h3>
          <p>The <span class="privacy__bold">only</span> external network request ASM makes is:</p>
          <ul class="privacy__list privacy__text">
            <li>
              <span class="privacy__bold">Update Checks:</span> ASM checks the official GitHub
              repository for software updates
            </li>
          </ul>
          <p class="privacy__text privacy__bold">
            No user data, avatar configurations, settings, or personal information is ever
            transmitted to external servers.
          </p>
        </div>
        <div class="privacy__section">
          <h2 class="privacy__sub-header">Data You Control</h2>
          <h3 class="privacy__section-header">Exported Configuration Files</h3>
          <p class="privacy__text">When you export configurations or presets:</p>
          <ul class="privacy__list privacy__text">
            <li>Files are created on your local computer</li>
            <li>You have complete control over these files</li>
            <li>Files are only shared if you manually choose to share them with others</li>
            <li>ASM does not track, access, or transmit exported files</li>
          </ul>
          <h3 class="privacy__section-header">Data Deletion</h3>
          <p class="privacy__text">You can delete your data at any time by:</p>
          <ul class="privacy__list privacy__text">
            <li>
              <span class="privacy__bold">Manual Deletion:</span> Removing the
              <span class="privacy__highlight">VRCAvatarSettingsManager</span> folder from your
              <span class="privacy__highlight">%USERPROFILE%\Documents</span> directory and the
              <span class="privacy__highlight">vrc-avatar-settings-manager</span> folder from
              <span class="privacy__highlight">%APPDATA%\Roaming</span>
            </li>
            <li>
              <span class="privacy__bold">Uninstaller:</span> During uninstallation, the app data in
              <span class="privacy__highlight">
                %APPDATA%\Roaming\vrc-avatar-settings-manager
              </span>
              is automatically removed. You'll be given the option to also delete your saved
              configurations in
              <span class="privacy__highlight">
                %USERPROFILE%\Documents\VRCAvatarSettingsManager
              </span>
            </li>
          </ul>
        </div>
        <div class="privacy__section">
          <h2 class="privacy__sub-header">Third-Party Services</h2>
          <h3 class="privacy__section-header">VRChat Integration</h3>
          <ul class="privacy__list privacy__text">
            <li>
              ASM reads avatar parameter data from VRChat's
              <span class="privacy__bold">local</span> OSC and cache files
            </li>
            <li>
              ASM uses VRChat's <span class="privacy__bold">OSC Query</span> protocol for local
              communication
            </li>
            <li>
              ASM <span class="privacy__bold">does not</span> modify VRChat game files or memory
            </li>
            <li>ASM is an unofficial third-party utility and is not affiliated with VRChat</li>
          </ul>
          <h3 class="privacy__section-header">No Analytics or Tracking</h3>
          <p class="privacy__text">ASM does <span class="privacy__bold">not</span> use:</p>
          <ul class="privacy__list privacy__text">
            <li>Analytics services</li>
            <li>Telemetry</li>
            <li>Crash reporting services (only local log files are created)</li>
            <li>Advertising networks</li>
            <li>User tracking of any kind</li>
          </ul>
        </div>
        <div class="privacy__section">
          <h2 class="privacy__sub-header">Changes to This Privacy Policy</h2>
          <p class="privacy__text">
            We may update this Privacy Policy from time to time. Changes will be reflected in the
            "Last Updated" date at the top of this document. Material changes will be communicated
            through update notifications, GitHub release notes, and Discord announcements. Continued
            use of ASM after changes constitutes acceptance of the updated Privacy Policy.
          </p>
        </div>
        <div class="privacy__section">
          <h2 class="privacy__sub-header">Age Requirements</h2>
          <p class="privacy__text">
            ASM is intended for users aged 13 and older, consistent with VRChat's Terms of Service
            as referenced in EULA Section 7.1. We do not knowingly collect data from users under 13.
          </p>
        </div>
        <div class="privacy__section">
          <h2 class="privacy__sub-header">Data Security</h2>
          <p class="privacy__text">
            While all data is stored locally on your device, we recommend:
          </p>
          <ul class="privacy__list privacy__text">
            <li>Keeping your computer secure with appropriate security software</li>
            <li>Regularly backing up important configurations if desired</li>
            <li>Being cautious when sharing exported configuration files</li>
            <li>
              When sharing log files for troubleshooting, be aware they may contain your Windows
              username in file paths
            </li>
          </ul>
        </div>
        <div class="privacy__section">
          <h2 class="privacy__sub-header">Your Rights</h2>
          <p class="privacy__text">
            You have complete control over your data, consistent with GDPR and CCPA principles:
          </p>
          <ul class="privacy__list privacy__text">
            <li>
              <span class="privacy__bold">Right to Access:</span> All data is stored locally in
              SQLite format and accessible at any time
            </li>
            <li>
              <span class="privacy__bold">Right to Deletion:</span> You can delete all data at any
              time through manual deletion or the uninstaller (see Section "Data Deletion" above)
            </li>
            <li>
              <span class="privacy__bold">Right to Portability:</span> Export features allow you to
              save and transfer your configurations as specified in EULA Section 6.2
            </li>
            <li>
              <span class="privacy__bold">Right to Control:</span> You retain all rights to your
              configurations and decide what to save and share (EULA Section 6.1)
            </li>
            <li>
              <span class="privacy__bold">Right to Know:</span> This policy discloses all data
              collection and usage practices
            </li>
          </ul>
          <p class="privacy__text">
            Since all data is stored locally on your device, you have direct control without needing
            to submit access or deletion requests.
          </p>
        </div>
        <div class="privacy__section">
          <h2 class="privacy__sub-header">Contact</h2>
          <p class="privacy__text">For questions about this Privacy Policy or data practices:</p>
          <ul class="privacy__list privacy__text">
            <li>
              <span class="privacy__bold">GitHub Issues:</span>
              <a
                href="https://github.com/Nymmh/vrc-avatar-settings-manager/issues"
                target="_blank"
                class="privacy__link"
              >
                https://github.com/Nymmh/vrc-avatar-settings-manager/issues
              </a>
            </li>
            <li>
              <span class="privacy__bold">Discord:</span>
              <a href="https://discord.gg/rcCCkbDsY3" target="_blank" class="privacy__link">
                https://discord.gg/rcCCkbDsY3
              </a>
            </li>
          </ul>
        </div>
        <div class="privacy__section">
          <h2 class="privacy__sub-header">Summary</h2>
          <p class="privacy__text privacy__bold">ASM is a privacy-focused application:</p>
          <ul class="privacy__list privacy__text">
            <li>✅ All data stored locally on your device</li>
            <li>✅ No external data transmission (except update checks)</li>
            <li>✅ No analytics or tracking</li>
            <li>✅ Complete user control over all data</li>
            <li>✅ No account creation or login required</li>
            <li>✅ Source code available for transparency</li>
          </ul>
          <p class="privacy__text">
            You maintain complete ownership and control of all avatar configurations, presets, and
            settings created with ASM.
          </p>
        </div>
      </div>
    </OverlayScrollbarsComponent>
  </div>
</template>

<style lang="scss" scoped>
.privacy {
  display: flex;
  flex-flow: column;
  gap: 32px;
  padding-bottom: 16px;
  padding-top: 16px;
  font-weight: 400;

  &__wrapper {
    display: flex;
    flex-flow: column;
    gap: 28px;
    height: 100%;
    overflow: hidden;
    width: 100%;
  }

  &__section {
    display: flex;
    flex-flow: column;
    gap: 12px;
  }

  &__header {
    font-size: 2.5rem;
    font-weight: 700;
    text-align: left;
  }

  &__text {
    font-size: 1rem;
  }

  &__sub-header {
    font-size: 2rem;
    font-weight: 600;
  }

  &__bold {
    font-weight: 700;
  }

  &__section-header {
    font-size: 1.7rem;
    font-weight: 600;
  }

  &__list {
    list-style-position: inside;
    list-style-type: disc;
  }

  &__highlight {
    color: var(--color--primary-a3);
  }

  &__link {
    color: var(--color--primary-a3);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
