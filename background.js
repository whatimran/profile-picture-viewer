importScripts("facebook.js");

const MENU_ID = "openFullSizeProfilePicture";
const SITE_PATTERNS = [
  "*://*.facebook.com/*",
  "*://*.messenger.com/*"
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: "Unlock full size profile picture",
      contexts: ["all"],
      documentUrlPatterns: SITE_PATTERNS
    });
  });
});

// Context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID) return;
  tryOpenFullSize().catch(report_error);
});

// Message from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "viewFullSize") {
    tryOpenFullSize()
      .then(() => sendResponse({ ok: true }))
      .catch(err => sendResponse({ ok: false, error: err.message || "Could not extract Profile Picture" }));
    return true; // keep the message channel open for async response
  }
});

function tryOpenFullSize() {
  return get_current_tab_url()
    .then(url => {
      const host = hostname_of(url);
      if (host_matches(host, "facebook.com") || host_matches(host, "messenger.com")) {
        return get_facebook_profile_picture();
      }
      throw new Error("Open a Facebook profile page first.");
    });
}

// Helper: Get the current tab's URL
function get_current_tab_url() {
  return get_active_tab().then(tab => {
    if (!tab.url) {
      throw new Error("No active tab found");
    }
    return tab.url;
  });
}

// Helper: Get the current tab
function get_active_tab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query(
      {
        active: true,
        lastFocusedWindow: true
      },
      tabs => {
        const tab = tabs[0];
        if (tab && tab.id !== undefined) {
          resolve(tab);
        } else {
          reject(new Error("No active tab found"));
        }
      }
    );
  });
}

function hostname_of(url) {
  try {
    return new URL(url).hostname;
  } catch (err) {
    return "";
  }
}

// Match the domain itself or a subdomain of it
function host_matches(host, domain) {
  return host === domain || host.endsWith(`.${domain}`);
}

function open_photo_tab(url) {
  chrome.tabs.create({ url });
}

// For context-menu path we still show an alert on error
function report_error(err) {
  console.error(err);
  return show_page_alert((err && err.message) || "Could not extract Profile Picture");
}

function show_page_alert(message) {
  return get_active_tab()
    .then(tab =>
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        args: [message],
        func: text => alert(text)
      })
    )
    .catch(err => console.error(err));
}
