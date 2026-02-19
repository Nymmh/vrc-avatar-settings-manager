!include "LogicLib.nsh"

!macro customWelcomePage
    !define MUI_WELCOMEPAGE_TITLE "VRC Avatar Settings Manager Setup"
    !define MUI_WELCOMEPAGE_TEXT "Only install this application if you downloaded it from the official GitHub repository:$\r$\n$\r$\nhttps://github.com/Nymmh/vrc-avatar-settings-manager$\r$\n$\r$\nOr my Jinxxy https://jinxxy.com/Nymh/ASM$\r$\n$\r$\nIf you obtained this installer from any other source, DO NOT PROCEED as it may be malicious or modified.$\r$\n$\r$\nClick Next to continue only if you downloaded from the official repository."
    !insertmacro MUI_PAGE_WELCOME
!macroend

!macro customUnInstall
    ReadEnvStr $0 USERPROFILE
    ${If} ${FileExists} "$0\OneDrive\Documents\VRCAvatarSettingsManager\*.*"
        MessageBox MB_YESNO|MB_ICONQUESTION "Do you want to keep your VRC Avatar Settings Manager data? This includes all exported avatars, configurations, and presets.$\r$\n$\r$\nClick Yes to keep your data, or No to permanently delete all data." IDYES skipRemove IDNO removeOneDrive
        removeOneDrive:
            RMDir /r "$0\OneDrive\Documents\VRCAvatarSettingsManager"
            Goto skipRemove
    ${ElseIf} ${FileExists} "$0\Documents\VRCAvatarSettingsManager\*.*"
        MessageBox MB_YESNO|MB_ICONQUESTION "Do you want to keep your VRC Avatar Settings Manager data? This includes all exported avatars, configurations, and presets.$\r$\n$\r$\nClick Yes to keep your data, or No to permanently delete all data." IDYES skipRemove IDNO removeRegular
        removeRegular:
        RMDir /r "$0\Documents\VRCAvatarSettingsManager"
    ${EndIf}
        skipRemove:
!macroend
