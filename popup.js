const viewBtn = document.getElementById("viewBtn");
const statusEl = document.getElementById("status");

function setStatus(msg, type = "") {
  statusEl.textContent = msg;
  statusEl.className = "status" + (type ? " " + type : "");
}

viewBtn.addEventListener("click", async () => {
  viewBtn.disabled = true;
  setStatus("Looking for profile picture...");

  try {
    // Ask the background script to open the full-size photo
    const response = await chrome.runtime.sendMessage({ action: "viewFullSize" });

    if (response && response.ok) {
      setStatus("Opened in new tab!", "success");
      // Close the popup after a short delay
      setTimeout(() => window.close(), 800);
    } else {
      setStatus(response?.error || "Could not find profile picture", "error");
      viewBtn.disabled = false;
    }
  } catch (err) {
    setStatus("Error: " + (err.message || "Something went wrong"), "error");
    viewBtn.disabled = false;
  }
});
