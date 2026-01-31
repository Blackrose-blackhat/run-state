export const REPO_PORTWATCH = "https://github.com/Blackrose-blackhat/run-state";
export const LATEST_VERSION = "0.1.0";

export const LINKS = {
  GITHUB: REPO_PORTWATCH,
  RELEASES: `${REPO_PORTWATCH}/releases`,
  RELEASES_LATEST: `${REPO_PORTWATCH}/releases/latest`,
  
  // Specific Download Links
  DOWNLOADS: {
    APPIMAGE: `${REPO_PORTWATCH}/releases/download/v${LATEST_VERSION}/PortWatch_${LATEST_VERSION}_amd64.AppImage`,
    DEBIAN: `${REPO_PORTWATCH}/releases/download/v${LATEST_VERSION}/PortWatch_${LATEST_VERSION}_amd64.deb`,
    RPM: `${REPO_PORTWATCH}/releases/download/v${LATEST_VERSION}/PortWatch-${LATEST_VERSION}-1.x86_64.rpm`,
  },

  // Direct Download Curl Commands
  CURL: {
    DEBIAN: `curl -L -o portwatch.deb ${REPO_PORTWATCH}/releases/download/v${LATEST_VERSION}/PortWatch_${LATEST_VERSION}_amd64.deb`,
    APPIMAGE: `curl -L -o portwatch.AppImage ${REPO_PORTWATCH}/releases/download/v${LATEST_VERSION}/PortWatch_${LATEST_VERSION}_amd64.AppImage`,
    RPM: `curl -L -o portwatch.rpm ${REPO_PORTWATCH}/releases/download/v${LATEST_VERSION}/PortWatch-${LATEST_VERSION}-1.x86_64.rpm`,
  }
};
