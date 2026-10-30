
const desktop = document.getElementById("desktop");
const startButton = document.getElementById("start-button");
const startMenu = document.getElementById("start-menu");
const taskbar = document.getElementById("taskbar-windows");

let highestZ = 10;
let activeWindow = null;

// Load portfolio information
fetch("profile.json")
  .then(response => {
    if (!response.ok) throw new Error("Could not load profile.json");
    return response.json();
  })
  .then(profile => {
    document.title = `${profile.name} | My Desktop`;

    const bio = document.getElementById("bio");
    if (bio) bio.textContent = profile.bio;

    const projects = document.getElementById("projects");

    if (projects) {
      projects.innerHTML = (profile.projects || []).map(project => `
        <article class="project-card">
          <h2>${escapeHTML(project.title)}</h2>
          <p>${escapeHTML(project.desc)}</p>
          <a href="${safeURL(project.link)}"
             target="_blank" rel="noopener">
            OPEN PROJECT
          </a>
        </article>
      `).join("");
    }
  })
  .catch(error => console.error(error));

// Keep inserted profile text safe
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function safeURL(url) {
  return /^https?:\/\//i.test(url) ? url : "#";
}

// Get all desktop windows
const windows = [...document.querySelectorAll(".window")];

// Create taskbar buttons
windows.forEach(windowElement => {
  const button = document.createElement("button");

  button.className = "taskbar-window";
  button.textContent = windowElement.dataset.title ||
    windowElement.id.replace("-window", "");

  button.addEventListener("click", () => {
    if (windowElement.classList.contains("minimized")) {
      restoreWindow(windowElement);
    } else if (windowElement === activeWindow) {
      minimizeWindow(windowElement);
    } else {
      focusWindow(windowElement);
    }
  });

  taskbar.appendChild(button);
  windowElement.taskbarButton = button;

  // Close and minimize controls
  windowElement.querySelector(".close").addEventListener("click", () => {
    closeWindow(windowElement);
  });

  windowElement.querySelector(".minimize").addEventListener("click", () => {
    minimizeWindow(windowElement);
  });

  // Clicking a window brings it forward
  windowElement.addEventListener("pointerdown", () => {
    if (!windowElement.classList.contains("minimized")) {
      focusWindow(windowElement);
    }
  });
});

// Open a window
function openWindow(id) {
  const windowElement = document.getElementById(id);
  if (!windowElement) return;

  windowElement.classList.remove("closed", "minimized");
  windowElement.hidden = false;

  focusWindow(windowElement);
  updateTaskbar();
}

// Close a window
function closeWindow(windowElement) {
  windowElement.classList.add("closed");
  windowElement.classList.remove("minimized");

  if (activeWindow === windowElement) {
    activeWindow = null;
  }

  updateTaskbar();
}

// Minimize a window
function minimizeWindow(windowElement) {
  windowElement.classList.add("minimized");

  if (activeWindow === windowElement) {
    activeWindow = null;
  }

  updateTaskbar();
}

// Restore a minimized window
function restoreWindow(windowElement) {
  windowElement.classList.remove("minimized");
  focusWindow(windowElement);
}

// Bring a window to the front
function focusWindow(windowElement) {
  if (!windowElement) return;

  highestZ++;
  windowElement.style.zIndex = highestZ;
  activeWindow = windowElement;

  windows.forEach(item => {
    item.classList.toggle("active", item === windowElement);
  });

  updateTaskbar();
}

// Update taskbar button states
function updateTaskbar() {
  windows.forEach(windowElement => {
    const button = windowElement.taskbarButton;

    button.classList.toggle(
      "taskbar-active",
      windowElement === activeWindow
    );

    button.classList.toggle(
      "taskbar-minimized",
      windowElement.classList.contains("minimized")
    );

    button.classList.toggle(
      "taskbar-hidden",
      windowElement.classList.contains("closed")
    );
  });
}

// Desktop icons and Start menu items
document.querySelectorAll("[data-open]").forEach(button => {
  button.addEventListener("click", () => {
    openWindow(button.dataset.open);
    startMenu.hidden = true;
  });
});

// Start menu
startButton.addEventListener("click", event => {
  event.stopPropagation();
  startMenu.hidden = !startMenu.hidden;
});

document.addEventListener("pointerdown", event => {
  if (
    !startMenu.hidden &&
    !startMenu.contains(event.target) &&
    event.target !== startButton
  ) {
    startMenu.hidden = true;
  }
});

// Drag windows using their title bars
windows.forEach(windowElement => {
  const titlebar = windowElement.querySelector(".window-titlebar");

  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  titlebar.addEventListener("pointerdown", event => {
    if (event.target.closest(".window-controls")) return;
    if (window.innerWidth <= 600) return;

    dragging = true;
    focusWindow(windowElement);

    const rect = windowElement.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;

    titlebar.setPointerCapture(event.pointerId);
  });

  titlebar.addEventListener("pointermove", event => {
    if (!dragging) return;

    const bounds = desktop.getBoundingClientRect();

    let x = event.clientX - bounds.left - offsetX;
    let y = event.clientY - bounds.top - offsetY;

    x = Math.max(0, Math.min(x, bounds.width - windowElement.offsetWidth));
    y = Math.max(0, Math.min(y, bounds.height - windowElement.offsetHeight));

    windowElement.style.left = `${x}px`;
    windowElement.style.top = `${y}px`;
  });

  titlebar.addEventListener("pointerup", () => {
    dragging = false;
  });

  titlebar.addEventListener("pointercancel", () => {
    dragging = false;
  });
});

// Set up initial taskbar state
updateTaskbar();
