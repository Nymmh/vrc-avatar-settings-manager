<script lang="ts" setup>
import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue'
</script>

<template>
  <div class="terms__wrapper">
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
      <div class="terms">
        <div class="terms__section">
          <h1 class="terms__header">
            End-User License Agreement (EULA) for Avatar Settings Manager
          </h1>
          <p class="terms__text">
            <span class="terms__bold">Last Updated:</span> January, 29, 2026
          </p>
        </div>
        <div class="terms__section">
          <h2 class="terms__sub-header">1. Acceptance of Terms</h2>
          <p class="terms__text">
            By downloading, installing, or using Avatar Settings Manager ("ASM", "the Software"),
            you agree to be bound by this End-User License Agreement. If you do not agree to these
            terms, do not install or use the Software.
          </p>
        </div>
        <div class="terms__section">
          <h2 class="terms__sub-header">2. License Grant</h2>
          <p class="terms__text">
            Subject to the terms of this Agreement, Nymh grants you a limited, non-exclusive,
            non-transferable, revocable license to use ASM for personal use. Commercial use of
            exported configurations and presets is permitted under the conditions specified in
            Section 3.2.
          </p>
          <p class="terms__text">
            By using ASM, you confirm that you are at least 13 years of age. If you are under 13
            years old, you may not use this Software. This age requirement is consistent with
            VRChat's Terms of Service.
          </p>
        </div>
        <div class="terms__section">
          <h2 class="terms__sub-header">3. Permitted Use</h2>
          <h3 class="terms__section-header">3.1 Personal Use</h3>
          <p class="terms__text">You may:</p>
          <ul class="terms__list terms__text">
            <li>Install and use ASM on any number of devices you own or control</li>
            <li>Create, save, export, and share avatar configuration files</li>
            <li>Use the Unity package addon with your VRChat avatars</li>
            <li>Modify configurations and presets for personal use</li>
          </ul>
          <h3 class="terms__section-header">3.2 Commercial Use of Exported Configurations</h3>
          <p class="terms__text">
            You may include ASM exported configurations and presets in commercial avatar projects
            (such as avatar sales or commissions), and you may bundle the ASM Unity package,
            provided you meet the following requirements:
          </p>
          <ul class="terms__list terms__text">
            <li>You must provide clear attribution to Avatar Settings Manager</li>
            <li>
              You must include a link to one of the ASM download pages:
              <a
                href="https://github.com/Nymmh/vrc-avatar-settings-manager"
                target="_blank"
                class="terms__link"
              >
                https://github.com/Nymmh/vrc-avatar-settings-manager
              </a>
              <a href="https://jinxxy.com/Nymh/ASM" target="_blank" class="terms__link">
                https://jinxxy.com/Nymh/ASM
              </a>
            </li>
            <li>
              Attribution must be visible to end users (e.g., in documentation, credits, or avatar
              description)
            </li>
            <li>
              Example attribution: "Configurations created with Avatar Settings Manager (ASM) -
              <a
                href="https://github.com/Nymmh/vrc-avatar-settings-manager"
                target="_blank"
                class="terms__link"
              >
                https://github.com/Nymmh/vrc-avatar-settings-manager </a
              >"
            </li>
            <li>
              Exported configurations may be shared as individual config files, avatar exports, or
              as part of batch exports
            </li>
          </ul>
        </div>
        <div class="terms__section">
          <h2 class="terms__sub-header">4. Restrictions</h2>
          <p class="terms__text">You may not:</p>
          <ul class="terms__list terms__text">
            <li>Sell, rent, lease, or sublicense the Software itself</li>
            <li>
              Reverse engineer, decompile, or disassemble the Software for any purpose other than
              contributing improvements
            </li>
            <li>Use the Software for any illegal or unauthorized purpose</li>
            <li>Remove or alter any proprietary notices or labels on the Software</li>
            <li>Use the Software in a manner that violates VRChat's Terms of Service</li>
            <li>Claim ownership of the Software or present it as your own work</li>
            <li>Redistribute modified versions of the Software outside of official channels</li>
          </ul>
          <h3 class="terms__section-header">4.1 Contributing Improvements</h3>
          <p class="terms__text">If you wish to improve the Software:</p>
          <ul class="terms__list terms__text">
            <li>
              The source code is available at
              <a
                href="https://github.com/Nymmh/vrc-avatar-settings-manager"
                target="_blank"
                class="terms__link"
              >
                https://github.com/Nymmh/vrc-avatar-settings-manager
              </a>
            </li>
            <li>You may examine the source code for the purpose of creating improvements</li>
            <li>All improvements must be submitted as pull requests to the official repository</li>
            <li>You may not distribute modified versions independently</li>
            <li>Contributions are subject to the project's license</li>
          </ul>
        </div>
        <div class="terms__section">
          <h2 class="terms__sub-header">5. Data and Privacy</h2>
          <h3 class="terms__section-header">5.1 Local Data Storage</h3>
          <ul class="terms__list terms__text">
            <li>
              All configuration data, avatar settings, and presets are stored locally on your device
            </li>
            <li>ASM creates a SQLite database on your system</li>
            <li>
              Log files are generated and stored locally for troubleshooting purposes. These log
              files may include your Windows username in file paths
            </li>
          </ul>
          <h3 class="terms__section-header">5.2 Data Transmission</h3>
          <ul class="terms__list terms__text">
            <li>ASM communicates only with your local VRChat client</li>
            <li>
              The only external network request made by ASM is to check for software updates from
              the GitHub repository
            </li>
            <li>
              No user data, configurations, or personal information is transmitted to external
              servers or third parties
            </li>
            <li>
              Exported configuration files remain under your control and are only shared if you
              choose to do so
            </li>
          </ul>
          <h3 class="terms__section-header">5.3 VRChat Integration</h3>
          <ul class="terms__list terms__text">
            <li>ASM reads avatar parameter data from VRChat's local OSC and cache files</li>
            <li>ASM uses VRChat's OSC Query protocol for communication</li>
            <li>ASM does not modify VRChat game files or memory</li>
          </ul>
        </div>
        <div class="terms__section">
          <h2 class="terms__sub-header">6. User-Generated Content</h2>
          <h3 class="terms__section-header">6.1 Configuration Files</h3>
          <ul class="terms__list terms__text">
            <li>You retain all rights to configuration files you create, export, or share</li>
            <li>You are responsible for any configurations you share with others</li>
            <li>Configurations marked as NSFW must be appropriately tagged</li>
          </ul>
          <h3 class="terms__section-header">6.2 Sharing and Distribution</h3>
          <ul class="terms__list terms__text">
            <li>You may share exported configuration files with others at your discretion</li>
            <li>
              You are responsible for ensuring shared content does not violate any laws or
              third-party rights
            </li>
            <li>Recipients of shared configurations use them at their own risk</li>
          </ul>
        </div>
        <div class="terms__section">
          <h2 class="terms__sub-header">7. Third-Party Services</h2>
          <h3 class="terms__section-header">7.1 VRChat</h3>
          <ul class="terms__list terms__text">
            <li>
              ASM is an unofficial third-party utility and is not affiliated with, endorsed by, or
              sponsored by VRChat.
            </li>
            <li>Use of ASM with VRChat is subject to VRChat's Terms of Service</li>
          </ul>
          <h3 class="terms__section-header">7.2 Unity Package</h3>
          <ul class="terms__list terms__text">
            <li>The optional Unity package addon is provided for use with VRChat SDK3 avatars</li>
            <li>
              You are responsible for properly implementing the package in your avatar projects
            </li>
          </ul>
        </div>
        <div class="terms__section">
          <h2 class="terms__sub-header">8. Disclaimer of Warranties</h2>
          <p class="terms__text">
            THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
            INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
            PURPOSE, AND NONINFRINGEMENT.
          </p>
          <h3 class="terms__section-header">8.1 No Guarantee of Functionality</h3>
          <ul class="terms__list terms__text">
            <li>ASM may not work with all avatars or configurations</li>
            <li>Updates to VRChat may temporarily or permanently affect ASM's functionality</li>
            <li>Configuration imports may produce unexpected results if avatar IDs do not match</li>
          </ul>
          <h3 class="terms__section-header">8.2 Data Loss</h3>
          <ul class="terms__list terms__text">
            <li>While ASM is designed to preserve avatar settings, data loss may occur</li>
            <li>You are responsible for maintaining backups of important configurations</li>
            <li>Nymh is not liable for any loss of data, configurations, or avatar settings</li>
          </ul>
        </div>
        <div class="terms__section">
          <h2 class="terms__sub-header">9. Limitation of Liability</h2>
          <p class="terms__text">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL NYMH BE LIABLE FOR ANY
            SPECIAL, INCIDENTAL, INDIRECT, OR CONSEQUENTIAL DAMAGES WHATSOEVER (INCLUDING, WITHOUT
            LIMITATION, DAMAGES FOR LOSS OF DATA, BUSINESS INTERRUPTION, OR ANY OTHER COMMERCIAL
            DAMAGES OR LOSSES) ARISING OUT OF OR RELATED TO YOUR USE OR INABILITY TO USE THE
            SOFTWARE.
          </p>
        </div>
        <div class="terms__section">
          <h2 class="terms__sub-header">10. VRChat Account Safety</h2>
          <h3 class="terms__section-header">10.1 User Responsibility</h3>
          <ul class="terms__list terms__text">
            <li>
              You acknowledge that using any third-party tool with VRChat carries inherent risks
            </li>
            <li>You are solely responsible for your VRChat account security and standing</li>
            <li>Nymh is not responsible for any actions taken against your VRChat account</li>
          </ul>
          <h3 class="terms__section-header">10.2 Compliance</h3>
          <ul class="terms__list terms__text">
            <li>
              You agree to use ASM in compliance with VRChat's Terms of Service and Community
              Guidelines
            </li>
            <li>You acknowledge that ASM does not modify game files, memory, or network traffic</li>
            <li>You understand that ASM uses only officially supported VRChat features</li>
          </ul>
        </div>
        <div class="terms__section">
          <h2 class="terms__sub-header">11. Updates and Modifications</h2>
          <h3 class="terms__section-header">11.1 Software Updates</h3>
          <ul class="terms__list terms__text">
            <li>Nymh may release updates, patches, or new versions of ASM at any time</li>
            <li>Updates may add, modify, or remove features</li>
            <li>
              You are not obligated to install updates, but older versions may not function
              correctly
            </li>
          </ul>
          <h3 class="terms__section-header">11.2 Terms Updates</h3>
          <ul class="terms__list terms__text">
            <li>This Agreement may be updated from time to time</li>
            <li>
              Continued use of the Software after changes constitutes acceptance of the updated
              terms
            </li>
            <li>Material changes will be communicated through the GitHub repository</li>
          </ul>
        </div>
        <div class="terms__section">
          <h2 class="terms__sub-header">12. Source Code and Dependencies</h2>
          <h3 class="terms__section-header">12.1 Third-Party Libraries</h3>
          <ul class="terms__list terms__text">
            <li>ASM uses various open-source libraries and dependencies</li>
            <li>These libraries are subject to their respective licenses</li>
            <li>See the project repository for a complete list of dependencies</li>
          </ul>
          <h3 class="terms__section-header">12.2 Source Code</h3>
          <ul class="terms__list terms__text">
            <li>
              ASM's source code is available at
              <a
                href="https://github.com/Nymmh/vrc-avatar-settings-manager"
                target="_blank"
                class="terms__link"
              >
                https://github.com/Nymmh/vrc-avatar-settings-manager
              </a>
            </li>
            <li>Contributions and modifications are subject to this EULA</li>
          </ul>
        </div>
        <div class="terms__section">
          <h2 class="terms__sub-header">13. Termination</h2>
          <h3 class="terms__section-header">13.1 Termination by User</h3>
          <ul class="terms__list terms__text">
            <li>
              You may terminate this Agreement at any time by uninstalling ASM and deleting all
              associated files
            </li>
          </ul>
          <h3 class="terms__section-header">13.2 Termination by Licensor</h3>
          <ul class="terms__list terms__text">
            <li>
              Nymh reserves the right to terminate this license if you breach any terms of this
              Agreement
            </li>
            <li>Upon termination, you must cease all use of the Software and delete all copies</li>
          </ul>
        </div>
        <div class="terms__section">
          <h2 class="terms__sub-header">14. Geographic Restrictions</h2>
          <p class="terms__text">
            This Software is provided globally, but you are responsible for compliance with local
            laws and regulations regarding software use, data storage, and online services.
          </p>
        </div>
        <div class="terms__section">
          <h2 class="terms__sub-header">15. Support and Maintenance</h2>
          <h3 class="terms__section-header">15.1 Community Support</h3>
          <ul class="terms__list terms__text">
            <li>Support is provided on a volunteer basis through GitHub Issues and Discord</li>
            <li>No guaranteed response time or resolution is promised</li>
            <li>
              Log files (meow.log) may be required for troubleshooting. Be aware that these log
              files may contain your Windows username in file paths
            </li>
          </ul>
          <h3 class="terms__section-header">15.2 No Service Level Agreement</h3>
          <ul class="terms__list terms__text">
            <li>ASM is provided free of charge without any service guarantees</li>
            <li>Nymh has no obligation to maintain, update, or support the Software</li>
          </ul>
        </div>
        <div class="terms__section">
          <h2 class="terms__sub-header">16. Severability</h2>
          <p class="terms__text">
            If any provision of this Agreement is found to be unenforceable or invalid, that
            provision shall be limited or eliminated to the minimum extent necessary so that this
            Agreement shall otherwise remain in full force and effect.
          </p>
        </div>
        <div class="terms__section">
          <h2 class="terms__sub-header">17. Entire Agreement</h2>
          <p class="terms__text">
            This Agreement constitutes the entire agreement between you and Nymh regarding ASM and
            supersedes all prior agreements and understandings, whether written or oral.
          </p>
        </div>
        <div class="terms__section">
          <h2 class="terms__sub-header">18. Contact Information</h2>
          <p class="terms__text">For questions about this Agreement, please contact:</p>
          <ul class="terms__list terms__text">
            <li>
              <span class="terms__bold">GitHub:</span>
              <a
                href="https://github.com/Nymmh/vrc-avatar-settings-manager/issues"
                target="_blank"
                class="terms__link"
              >
                https://github.com/Nymmh/vrc-avatar-settings-manager/issues
              </a>
            </li>
            <li>
              <span class="terms__bold">Discord:</span>
              <a href="https://discord.gg/rcCCkbDsY3" target="_blank" class="terms__link">
                https://discord.gg/rcCCkbDsY3
              </a>
            </li>
          </ul>
        </div>
        <div class="terms__section">
          <h2 class="terms__sub-header">19. Acknowledgment</h2>
          <p class="terms__text">
            BY INSTALLING OR USING AVATAR SETTINGS MANAGER, YOU ACKNOWLEDGE THAT YOU HAVE READ THIS
            AGREEMENT, UNDERSTAND IT, AND AGREE TO BE BOUND BY ITS TERMS AND CONDITIONS.
          </p>
        </div>
      </div>
    </OverlayScrollbarsComponent>
  </div>
</template>

<style lang="scss" scoped>
.terms {
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
