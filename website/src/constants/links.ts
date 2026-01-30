export const REPO_PORTWATCH = "https://github.com/Blackrose-blackhat/run-state";


export const LINKS = {
  GITHUB: REPO_PORTWATCH,
  RELEASES: `${REPO_PORTWATCH}/releases`,
  RELEASES_LATEST: `${REPO_PORTWATCH}/releases/latest`,
  
  // Specific Download Links
  DOWNLOADS: {
    APPIMAGE: `${REPO_PORTWATCH}/releases/download/AppImage/PortWatch_0.1.0_amd64.AppImage`,
    DEBIAN: `${REPO_PORTWATCH}/releases/download/Download/PortWatch_0.1.0_amd64.deb`,
    RPM: `${REPO_PORTWATCH}/releases/download/RPM/app-0.1.0-1.x86_64.rpm`,
  },
// https://github.com/Blackrose-blackhat/run-state/releases/download/Download/PortWatch_0.1.0_amd64.deb
  // Direct Download Curl Commands (matching the specific versions above)
  CURL: {
    DEBIAN: `curl -L -o portwatch.deb ${REPO_PORTWATCH}/releases/download/Download/PortWatch_0.1.0_amd64.deb`,
    APPIMAGE: `curl -L -o portwatch.AppImage ${REPO_PORTWATCH}/releases/download/AppImage/app_0.1.0_amd64.AppImage`,
    RPM: `curl -L -o portwatch.rpm ${REPO_PORTWATCH}/releases/download/RPM/PortWatch-0.1.0-1.x86_64.rpm`,
  }
};
