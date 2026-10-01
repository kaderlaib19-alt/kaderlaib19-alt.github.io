/*
    REAL GITHUB FILE EXPLORER

    Repository:

    https://github.com/kaderlaib19-alt/m3allKanfor
*/


const OWNER = "kaderlaib19-alt";

const REPOSITORY = "m3allKanfor";


const API_URL =
  `https://api.github.com/repos/${OWNER}/${REPOSITORY}/contents/`;


let allFiles = [];

let currentFilter = "all";

let listMode = false;


/*
    File type detection
*/

const fileTypes = {

  pdf: {
    category: "pdf",
    icon: "📕"
  },

  doc: {
    category: "docx",
    icon: "📘"
  },

  docx: {
    category: "docx",
    icon: "📘"
  },

  rar: {
    category: "archive",
    icon: "📦"
  },

  zip: {
    category: "archive",
    icon: "📦"
  },

  "7z": {
    category: "archive",
    icon: "📦"
  },

  tar: {
    category: "archive",
    icon: "📦"
  },

  gz: {
    category: "archive",
    icon: "📦"
  },

  jpg: {
    category: "image",
    icon: "🖼️"
  },

  jpeg: {
    category: "image",
    icon: "🖼️"
  },

  png: {
    category: "image",
    icon: "🖼️"
  },

  gif: {
    category: "image",
    icon: "🖼️"
  },

  webp: {
    category: "image",
    icon: "🖼️"
  },

  svg: {
    category: "image",
    icon: "🖼️"
  },

  mp4: {
    category: "video",
    icon: "🎬"
  },

  mkv: {
    category: "video",
    icon: "🎬"
  },

  webm: {
    category: "video",
    icon: "🎬"
  },

  avi: {
    category: "video",
    icon: "🎬"
  },

  mov: {
    category: "video",
    icon: "🎬"
  },

  mp3: {
    category: "audio",
    icon: "🎵"
  },

  wav: {
    category: "audio",
    icon: "🎵"
  },

  ogg: {
    category: "audio",
    icon: "🎵"
  },

  m4a: {
    category: "audio",
    icon: "🎵"
  },

  flac: {
    category: "audio",
    icon: "🎵"
  }

};


/*
    Get extension
*/

function getExtension(filename) {

  const parts =
    filename
      .toLowerCase()
      .split(".");

  return parts.length > 1
    ? parts.pop()
    : "";

}


/*
    Get file type
*/

function getFileType(filename) {

  const extension =
    getExtension(filename);

  return fileTypes[extension] || {

    category: "file",

    icon: "📄"

  };

}


/*
    Format file size
*/

function formatSize(bytes) {

  if (!bytes) {

    return "Unknown size";

  }


  const units = [
    "Bytes",
    "KB",
    "MB",
    "GB"
  ];


  let size = bytes;

  let unit = 0;


  while (
    size >= 1024 &&
    unit < units.length - 1
  ) {

    size /= 1024;

    unit++;

  }


  if (unit === 0) {

    return `${size} ${units[unit]}`;

  }


  return `${size.toFixed(1)} ${units[unit]}`;

}


/*
    Escape HTML
*/

function escapeHTML(text) {

  return text.replace(
    /[&<>"']/g,
    character => {

      const map = {

        "&": "&amp;",

        "<": "&lt;",

        ">": "&gt;",

        '"': "&quot;",

        "'": "&#039;"

      };

      return map[character];

    }
  );

}


/*
    Get all files from GitHub

    This also enters folders recursively.
*/

async function getFiles(url) {

  const response =
    await fetch(url);


  if (!response.ok) {

    throw new Error(
      `GitHub API Error: ${response.status}`
    );

  }


  const items =
    await response.json();


  let result = [];


  for (const item of items) {

    if (item.type === "file") {

      result.push(item);

    }


    else if (item.type === "dir") {

      try {

        const folderFiles =
          await getFiles(item.url);

        result =
          result.concat(folderFiles);

      }

      catch (error) {

        console.warn(
          "Folder skipped:",
          item.path
        );

      }

    }

  }


  return result;

}


/*
    Load repository
*/

async function loadRepository() {

  const container =
    document.getElementById(
      "filesContainer"
    );


  const status =
    document.getElementById(
      "fileStatus"
    );


  const error =
    document.getElementById(
      "errorMessage"
    );


  error.hidden = true;


  container.innerHTML = "";


  status.textContent =
    "Loading real GitHub files...";


  try {

    allFiles =
      await getFiles(API_URL);


    updateCounters();

    renderFiles();

  }

  catch (errorObject) {

    console.error(
      errorObject
    );


    error.hidden = false;

    status.textContent =
      "Failed to load repository.";

  }

}


/*
    Update sidebar counters
*/

function updateCounters() {

  const counters = {

    all: allFiles.length,

    pdf: 0,

    docx: 0,

    archive: 0,

    image: 0,

    video: 0,

    audio: 0

  };


  allFiles.forEach(file => {

    const type =
      getFileType(file.name);


    if (
      counters[type.category]
      !== undefined
    ) {

      counters[type.category]++;

    }

  });


  document.getElementById(
    "allCount"
  ).textContent =
    counters.all;


  document.getElementById(
    "pdfCount"
  ).textContent =
    counters.pdf;


  document.getElementById(
    "docxCount"
  ).textContent =
    counters.docx;


  document.getElementById(
    "archiveCount"
  ).textContent =
    counters.archive;


  document.getElementById(
    "imageCount"
  ).textContent =
    counters.image;


  document.getElementById(
    "videoCount"
  ).textContent =
    counters.video;


  document.getElementById(
    "audioCount"
  ).textContent =
    counters.audio;

}


/*
    Render files
*/

function renderFiles() {

  const container =
    document.getElementById(
      "filesContainer"
    );


  const empty =
    document.getElementById(
      "emptyMessage"
    );


  const search =
    document.getElementById(
      "searchInput"
    );


  const status =
    document.getElementById(
      "fileStatus"
    );


  const query =
    search.value
      .trim()
      .toLowerCase();


  let files =
    allFiles.filter(file => {

      const type =
        getFileType(file.name);


      const filterMatch =
        currentFilter === "all" ||

        type.category ===
          currentFilter ||

        (
          currentFilter === "recent"
          &&
          file.name
        );


      const searchMatch =
        !query ||

        file.name
          .toLowerCase()
          .includes(query);


      return (
        filterMatch &&
        searchMatch
      );

    });


  /*
      Sorting
  */

  const sort =
    document.getElementById(
      "sortSelect"
    ).value;


  if (sort === "name") {

    files.sort(
      (a,b) =>
        a.name.localeCompare(
          b.name
        )
    );

  }


  if (sort === "size") {

    files.sort(
      (a,b) =>
        (b.size || 0) -
        (a.size || 0)
    );

  }


  if (sort === "type") {

    files.sort(
      (a,b) => {

        const typeA =
          getFileType(a.name)
            .category;

        const typeB =
          getFileType(b.name)
            .category;

        return typeA.localeCompare(
          typeB
        );

      }
    );

  }


  /*
      Update title
  */

  const titles = {

    all: "All Files",

    pdf: "PDF",

    docx: "Documents",

    archive: "Archives",

    image: "Images",

    video: "Videos",

    audio: "Audio",

    recent: "Recent"

  };


  document.getElementById(
    "sectionTitle"
  ).textContent =
    titles[currentFilter];


  status.textContent =
    `${files.length} file(s) • Live GitHub data`;


  /*
      Grid/List
  */

  container.className =
    listMode
      ? "files-list"
      : "files-grid";


  /*
      No files
  */

  if (!files.length) {

    container.innerHTML = "";

    empty.style.display =
      "block";

    return;

  }


  empty.style.display =
    "none";


  /*
      Create cards
  */

  container.innerHTML =
    files.map(file => {

      const type =
        getFileType(
          file.name
        );


      const safeName =
        escapeHTML(
          file.name
        );


      const size =
        formatSize(
          file.size
        );


      return `

        <article class="file-card">

          <div
            class="file-icon icon-${type.category}">
            ${type.icon}
          </div>


          <div>

            <div
              class="file-name"
              title="${safeName}">

              ${safeName}

            </div>


            <div class="file-meta">

              ${size}
              •
              ${type.category.toUpperCase()}

            </div>

          </div>


          <div class="file-bottom">

            <span class="file-type">

              ${type.category.toUpperCase()}

            </span>


            <a
              class="open-file"
              href="${file.html_url}"
              target="_blank"
              rel="noopener">

              Open

            </a>

          </div>

        </article>

      `;

    }).join("");

}


/*
    Sidebar
*/

document
  .querySelectorAll(
    ".nav[data-type]"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(
            ".nav"
          )
          .forEach(item =>
            item.classList
              .remove("active")
          );


        button.classList
          .add("active");


        currentFilter =
          button.dataset.type;


        renderFiles();


        document
          .getElementById(
            "sidebar"
          )
          .classList
          .remove("open");

      }
    );

  });


/*
    Search
*/

document
  .getElementById(
    "searchInput"
  )
  .addEventListener(
    "input",
    renderFiles
  );


/*
    Clear search
*/

document
  .getElementById(
    "clearSearch"
  )
  .addEventListener(
    "click",
    () => {

      document
        .getElementById(
          "searchInput"
        ).value = "";


      renderFiles();

    }
  );


/*
    Sort
*/

document
  .getElementById(
    "sortSelect"
  )
  .addEventListener(
    "change",
    renderFiles
  );


/*
    Grid
*/

document
  .getElementById(
    "gridButton"
  )
  .addEventListener(
    "click",
    () => {

      listMode = false;

      document
        .getElementById(
          "gridButton"
        )
        .classList
        .add("active");


      document
        .getElementById(
          "listButton"
        )
        .classList
        .remove("active");


      renderFiles();

    }
  );


/*
    List
*/

document
  .getElementById(
    "listButton"
  )
  .addEventListener(
    "click",
    () => {

      listMode = true;

      document
        .getElementById(
          "listButton"
        )
        .classList
        .add("active");


      document
        .getElementById(
          "gridButton"
        )
        .classList
        .remove("active");


      renderFiles();

    }
  );


/*
    Header view button
*/

document
  .getElementById(
    "viewBtn"
  )
  .addEventListener(
    "click",
    () => {

      document
        .getElementById(
          "listButton"
        )
        .click();

    }
  );


/*
    Mobile menu
*/

document
  .getElementById(
    "menuBtn"
  )
  .addEventListener(
    "click",
    () => {

      document
        .getElementById(
          "sidebar"
        )
        .classList
        .toggle("open");

    }
  );


/*
    Dark mode
*/

document
  .getElementById(
    "themeBtn"
  )
  .addEventListener(
    "click",
    () => {

      document
        .body
        .classList
        .toggle("dark");


      localStorage.setItem(
        "orilo-theme",
        document
          .body
          .classList
          .contains("dark")
          ? "dark"
          : "light"
      );

    }
  );


/*
    Restore dark mode
*/

if (
  localStorage.getItem(
    "orilo-theme"
  ) === "dark"
) {

  document
    .body
    .classList
    .add("dark");

}


/*
    START

*/

loadRepository();
