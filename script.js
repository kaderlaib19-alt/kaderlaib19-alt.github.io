const OWNER = "kaderlaib19-alt";
const REPOSITORY = "m3allKanfor";

const API_BASE = `https://api.github.com/repos/${OWNER}/${REPOSITORY}`;

let allFiles = [];
let currentFilter = "all";
let currentView = "grid";

const fileTypes = {
    pdf: {
        category: "pdf",
        icon: "📕",
        label: "PDF"
    },

    doc: {
        category: "documents",
        icon: "📘",
        label: "DOC"
    },

    docx: {
        category: "documents",
        icon: "📘",
        label: "DOCX"
    },

    txt: {
        category: "documents",
        icon: "📄",
        label: "TXT"
    },

    rtf: {
        category: "documents",
        icon: "📄",
        label: "RTF"
    },

    zip: {
        category: "archives",
        icon: "📦",
        label: "ZIP"
    },

    rar: {
        category: "archives",
        icon: "📦",
        label: "RAR"
    },

    "7z": {
        category: "archives",
        icon: "📦",
        label: "7Z"
    },

    tar: {
        category: "archives",
        icon: "📦",
        label: "TAR"
    },

    gz: {
        category: "archives",
        icon: "📦",
        label: "GZ"
    },

    jpg: {
        category: "images",
        icon: "🖼️",
        label: "JPG"
    },

    jpeg: {
        category: "images",
        icon: "🖼️",
        label: "JPEG"
    },

    png: {
        category: "images",
        icon: "🖼️",
        label: "PNG"
    },

    gif: {
        category: "images",
        icon: "🖼️",
        label: "GIF"
    },

    webp: {
        category: "images",
        icon: "🖼️",
        label: "WEBP"
    },

    svg: {
        category: "images",
        icon: "🖼️",
        label: "SVG"
    },

    mp4: {
        category: "videos",
        icon: "🎬",
        label: "MP4"
    },

    mkv: {
        category: "videos",
        icon: "🎬",
        label: "MKV"
    },

    avi: {
        category: "videos",
        icon: "🎬",
        label: "AVI"
    },

    mov: {
        category: "videos",
        icon: "🎬",
        label: "MOV"
    },

    webm: {
        category: "videos",
        icon: "🎬",
        label: "WEBM"
    },

    mp3: {
        category: "audio",
        icon: "🎵",
        label: "MP3"
    },

    wav: {
        category: "audio",
        icon: "🎵",
        label: "WAV"
    },

    ogg: {
        category: "audio",
        icon: "🎵",
        label: "OGG"
    },

    m4a: {
        category: "audio",
        icon: "🎵",
        label: "M4A"
    },

    flac: {
        category: "audio",
        icon: "🎵",
        label: "FLAC"
    }
};


// ==============================
// DOM
// ==============================

const filesContainer = document.getElementById("filesContainer");
const emptyMessage = document.getElementById("emptyMessage");
const errorMessage = document.getElementById("errorMessage");

const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");


// ==============================
// Helpers
// ==============================

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function getExtension(filename) {
    const parts = filename.toLowerCase().split(".");

    if (parts.length < 2) {
        return "";
    }

    return parts.pop();
}


function getFileInfo(filename) {
    const extension = getExtension(filename);

    return fileTypes[extension] || {
        category: "other",
        icon: "📄",
        label: extension ? extension.toUpperCase() : "FILE"
    };
}


function formatSize(bytes) {
    if (!bytes || bytes <= 0) {
        return "Unknown size";
    }

    const units = ["B", "KB", "MB", "GB", "TB"];

    let size = bytes;
    let index = 0;

    while (size >= 1024 && index < units.length - 1) {
        size /= 1024;
        index++;
    }

    return `${size.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}


function getRawURL(path, branch) {
    const encodedPath = path
        .split("/")
        .map(part => encodeURIComponent(part))
        .join("/");

    return `https://raw.githubusercontent.com/${OWNER}/${REPOSITORY}/${encodeURIComponent(branch)}/${encodedPath}`;
}


function getGitHubURL(path, branch) {
    const encodedPath = path
        .split("/")
        .map(part => encodeURIComponent(part))
        .join("/");

    return `https://github.com/${OWNER}/${REPOSITORY}/blob/${encodeURIComponent(branch)}/${encodedPath}`;
}


// ==============================
// Loading
// ==============================

function showLoading() {
    filesContainer.innerHTML = `
        <div class="loading-box">
            <div class="loader"></div>
            <p>Loading files from GitHub...</p>
        </div>
    `;

    if (emptyMessage) {
        emptyMessage.style.display = "none";
    }

    if (errorMessage) {
        errorMessage.style.display = "none";
    }
}


function showError(message) {
    filesContainer.innerHTML = "";

    if (emptyMessage) {
        emptyMessage.style.display = "none";
    }

    if (errorMessage) {
        errorMessage.style.display = "block";
        errorMessage.innerHTML = `
            <div class="error-box">
                <h3>Unable to load files</h3>
                <p>${escapeHTML(message)}</p>
                <button onclick="loadRepository()">Try Again</button>
            </div>
        `;
    }
}


// ==============================
// GitHub API
// ==============================

async function githubRequest(url) {
    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Accept": "application/vnd.github+json"
        },
        cache: "no-store"
    });

    if (!response.ok) {
        let details = "";

        try {
            const data = await response.json();

            if (data && data.message) {
                details = data.message;
            }
        } catch (e) {
            // Ignore JSON error
        }

        throw new Error(
            `GitHub API error ${response.status}${details ? ": " + details : ""}`
        );
    }

    return response.json();
}


async function loadRepository() {
    showLoading();

    try {
        // 1. Get repository information
        const repository = await githubRequest(API_BASE);

        const branch = repository.default_branch || "main";

        console.log("Repository:", repository.full_name);
        console.log("Branch:", branch);

        // 2. Get complete repository tree
        const treeURL =
            `${API_BASE}/git/trees/${encodeURIComponent(branch)}?recursive=1`;

        const treeData = await githubRequest(treeURL);

        if (!treeData || !Array.isArray(treeData.tree)) {
            throw new Error("GitHub returned an invalid file tree.");
        }

        // 3. Keep files only
        allFiles = treeData.tree
            .filter(item => item.type === "blob")
            .map(item => {
                const name = item.path.split("/").pop();

                const info = getFileInfo(name);

                return {
                    name: name,
                    path: item.path,
                    size: item.size || 0,
                    category: info.category,
                    icon: info.icon,
                    type: info.label,
                    branch: branch,
                    url: getGitHubURL(item.path, branch),
                    raw: getRawURL(item.path, branch)
                };
            });

        console.log(`Loaded ${allFiles.length} files`);

        if (allFiles.length === 0) {
            filesContainer.innerHTML = "";

            if (emptyMessage) {
                emptyMessage.style.display = "block";
            }

            return;
        }

        if (errorMessage) {
            errorMessage.style.display = "none";
        }

        renderFiles();

    } catch (error) {
        console.error("GitHub loading error:", error);

        showError(
            error.message ||
            "An unknown error occurred while loading the GitHub repository."
        );
    }
}


// ==============================
// Rendering
// ==============================

function renderFiles() {
    const searchText =
        searchInput?.value.trim().toLowerCase() || "";

    let files = [...allFiles];

    // Category
    if (currentFilter !== "all" && currentFilter !== "recent") {
        files = files.filter(file => {
            return file.category === currentFilter;
        });
    }

    // Search
    if (searchText) {
        files = files.filter(file => {
            return (
                file.name.toLowerCase().includes(searchText) ||
                file.path.toLowerCase().includes(searchText) ||
                file.type.toLowerCase().includes(searchText)
            );
        });
    }

    // Sort
    const sortValue = sortSelect?.value || "name";

    if (sortValue === "name") {
        files.sort((a, b) =>
            a.name.localeCompare(b.name, undefined, {
                numeric: true,
                sensitivity: "base"
            })
        );
    }

    if (sortValue === "size") {
        files.sort((a, b) => b.size - a.size);
    }

    if (sortValue === "type") {
        files.sort((a, b) =>
            a.type.localeCompare(b.type) ||
            a.name.localeCompare(b.name)
        );
    }

    if (files.length === 0) {
        filesContainer.innerHTML = "";

        if (emptyMessage) {
            emptyMessage.style.display = "block";
            emptyMessage.innerHTML = `
                <div class="empty-box">
                    <div class="empty-icon">📂</div>
                    <h3>No files found</h3>
                    <p>There are no files matching your search or filter.</p>
                </div>
            `;
        }

        return;
    }

    if (emptyMessage) {
        emptyMessage.style.display = "none";
    }

    filesContainer.className =
        currentView === "list"
            ? "files-container list-view"
            : "files-container grid-view";

    filesContainer.innerHTML = files
        .map(file => createFileCard(file))
        .join("");
}


function createFileCard(file) {
    const safeName = escapeHTML(file.name);
    const safePath = escapeHTML(file.path);
    const safeType = escapeHTML(file.type);
    const safeSize = escapeHTML(formatSize(file.size));

    return `
        <article class="file-card" data-category="${file.category}">

            <div class="file-icon">
                ${file.icon}
            </div>

            <div class="file-info">

                <h3 title="${safeName}">
                    ${safeName}
                </h3>

                <p class="file-path" title="${safePath}">
                    ${safePath}
                </p>

                <div class="file-meta">
                    <span>${safeType}</span>
                    <span>${safeSize}</span>
                </div>

            </div>

            <div class="file-actions">

                <a
                    class="open-button"
                    href="${file.url}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Open
                </a>

                <a
                    class="download-button"
                    href="${file.raw}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    View
                </a>

            </div>

        </article>
    `;
}


// ==============================
// Filters
// ==============================

function setFilter(filter) {
    currentFilter = filter;

    document
        .querySelectorAll("[data-filter]")
        .forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.filter === filter
            );
        });

    renderFiles();
}


document
    .querySelectorAll("[data-filter]")
    .forEach(button => {
        button.addEventListener("click", () => {
            setFilter(button.dataset.filter);
        });
    });


// ==============================
// Search
// ==============================

if (searchInput) {
    searchInput.addEventListener("input", () => {
        renderFiles();
    });
}


// ==============================
// Sort
// ==============================

if (sortSelect) {
    sortSelect.addEventListener("change", () => {
        renderFiles();
    });
}


// ==============================
// View mode
// ==============================

document
    .querySelectorAll("[data-view]")
    .forEach(button => {

        button.addEventListener("click", () => {

            currentView = button.dataset.view;

            document
                .querySelectorAll("[data-view]")
                .forEach(item => {
                    item.classList.toggle(
                        "active",
                        item.dataset.view === currentView
                    );
                });

            renderFiles();
        });

    });


// ==============================
// Clear search
// ==============================

const clearSearch = document.getElementById("clearSearch");

if (clearSearch) {
    clearSearch.addEventListener("click", () => {

        if (searchInput) {
            searchInput.value = "";
        }

        renderFiles();
    });
}


// ==============================
// Mobile menu
// ==============================

const menuButton = document.getElementById("menuButton");
const sidebar = document.querySelector(".sidebar");

if (menuButton && sidebar) {
    menuButton.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });
}


// ==============================
// Dark mode
// ==============================

const darkModeButton = document.getElementById("darkMode");

if (darkModeButton) {
    darkModeButton.addEventListener("click", () => {

        document.body.classList.toggle("dark-mode");

        localStorage.setItem(
            "darkMode",
            document.body.classList.contains("dark-mode")
                ? "true"
                : "false"
        );

    });
}


if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
}


// ==============================
// Start
// ==============================

document.addEventListener("DOMContentLoaded", () => {
    loadRepository();
});
