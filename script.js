const JSONBIN_BIN_ID = "6a66b074f5f4af5e29c584d7";
const JSONBIN_API_KEY = "$2a$10$/.0ucWqnyelIvKg8aItYu.I6fWQm689MIf4Cx89kAwSPT18Kzm5TS"; 

const ADMIN_PASS = "hinata056";
let isAdmin = false;
let currentTab = "anime";
let activeFolderName = null; // Active Folder state

let siteData = {
    anime: { folders: {}, rootLinks: [] },
    games: { folders: {}, rootLinks: [] },
    edu: { folders: {}, rootLinks: [] }
};

window.addEventListener("DOMContentLoaded", () => {
    loadData();
    setTimeout(() => {
        const loader = document.getElementById("preloader");
        loader.style.opacity = "0";
        setTimeout(() => loader.style.display = "none", 500);
    }, 5000);
});

async function loadData() {
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
            headers: { "X-Master-Key": JSONBIN_API_KEY }
        });
        const data = await res.json();
        if (data.record) siteData = data.record;
        render();
        updateFolderDropdown();
    } catch (err) {
        console.error("Data fetch error:", err);
    }
}

async function saveData() {
    try {
        await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Master-Key": JSONBIN_API_KEY
            },
            body: JSON.stringify(siteData)
        });
        render();
    } catch (err) {
        alert("Failed to sync data with server.");
    }
}

function toggleAdmin() {
    if (isAdmin) {
        isAdmin = false;
        document.getElementById("adminPanel").classList.add("hidden");
        document.getElementById("adminBanner").classList.add("hidden");
        document.getElementById("adminBtn").innerHTML = `<i class="fa-solid fa-lock"></i> Admin`;
        render();
    } else {
        const pass = prompt("Enter Admin Password:");
        if (pass === ADMIN_PASS) {
            isAdmin = true;
            document.getElementById("adminPanel").classList.remove("hidden");
            document.getElementById("adminBanner").classList.remove("hidden");
            document.getElementById("adminBtn").innerHTML = `<i class="fa-solid fa-unlock"></i> Exit Admin`;
            render();
        } else if (pass !== null) {
            alert("Access Denied: Incorrect Password");
        }
    }
}

function switchTab(tab, btnElement) {
    currentTab = tab;
    activeFolderName = null; // Reset inside-folder view when switching category
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btnElement.classList.add("active");
    render();
}

function updateFolderDropdown() {
    const cat = document.getElementById("linkCategory").value;
    const folderSelect = document.getElementById("linkFolder");
    folderSelect.innerHTML = '<option value="">No Folder (Root)</option>';
    
    if (siteData[cat] && siteData[cat].folders) {
        Object.keys(siteData[cat].folders).forEach(f => {
            folderSelect.innerHTML += `<option value="${f}">${f}</option>`;
        });
    }
}

function addFolder() {
    const cat = document.getElementById("folderCategory").value;
    const name = document.getElementById("folderNameInput").value.trim();
    if (!name) return alert("Folder name cannot be empty.");

    if (!siteData[cat].folders[name]) {
        siteData[cat].folders[name] = [];
        saveData();
        document.getElementById("folderNameInput").value = "";
        updateFolderDropdown();
    } else {
        alert("Folder name already exists!");
    }
}

function deleteFolder(cat, folderName, event) {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete folder "${folderName}" and all its links?`)) {
        delete siteData[cat].folders[folderName];
        if (activeFolderName === folderName) activeFolderName = null;
        saveData();
        updateFolderDropdown();
    }
}

// Open Specific Folder (Inside Navigation)
function enterFolder(folderName) {
    activeFolderName = folderName;
    render();
}

// Exit Folder Back to Grid
function exitFolder() {
    activeFolderName = null;
    render();
}

function addLink() {
    const cat = document.getElementById("linkCategory").value;
    const folder = document.getElementById("linkFolder").value;
    const title = document.getElementById("linkTitle").value.trim();
    const url = document.getElementById("linkUrl").value.trim();
    const pass = document.getElementById("linkPassword").value;

    if (!title || !url) return alert("Title and URL are required.");

    const newLink = { id: Date.now(), title, url, pass: pass || null };

    if (folder) {
        siteData[cat].folders[folder].push(newLink);
    } else {
        siteData[cat].rootLinks.push(newLink);
    }

    saveData();
    document.getElementById("linkTitle").value = "";
    document.getElementById("linkUrl").value = "";
    document.getElementById("linkPassword").value = "";
}

function openProtectedLink(url, pass) {
    if (!pass) {
        window.open(url, '_blank');
        return;
    }
    const inputPass = prompt("Security Locked: Enter Password to Access Link:");
    if (inputPass === pass) {
        window.open(url, '_blank');
    } else if (inputPass !== null) {
        alert("Incorrect Security Lock Password!");
    }
}

function moveLink(cat, folder, index, direction) {
    let list = folder ? siteData[cat].folders[folder] : siteData[cat].rootLinks;
    if (direction === 'up' && index > 0) {
        [list[index], list[index - 1]] = [list[index - 1], list[index]];
    } else if (direction === 'down' && index < list.length - 1) {
        [list[index], list[index + 1]] = [list[index + 1], list[index]];
    }
    saveData();
}

function deleteLink(cat, folder, index) {
    if (confirm("Delete this link permanently?")) {
        if (folder) siteData[cat].folders[folder].splice(index, 1);
        else siteData[cat].rootLinks.splice(index, 1);
        saveData();
    }
}

function renameLink(cat, folder, index) {
    let list = folder ? siteData[cat].folders[folder] : siteData[cat].rootLinks;
    const newTitle = prompt("Update Title:", list[index].title);
    if (newTitle) {
        list[index].title = newTitle;
        saveData();
    }
}

function renderLinkItem(link, cat, folder, index) {
    return `
        <div class="link-item">
            <a href="#" class="link-title" onclick="openProtectedLink('${link.url}', '${link.pass || ''}')">
                ${link.pass ? '<i class="fa-solid fa-key" style="color:#f59e0b;"></i>' : '<i class="fa-solid fa-arrow-up-right-from-square"></i>'}
                ${link.title}
            </a>
            ${isAdmin ? `
                <div class="actions">
                    <button onclick="moveLink('${cat}', '${folder || ''}', ${index}, 'up')"><i class="fa-solid fa-arrow-up"></i></button>
                    <button onclick="moveLink('${cat}', '${folder || ''}', ${index}, 'down')"><i class="fa-solid fa-arrow-down"></i></button>
                    <button onclick="renameLink('${cat}', '${folder || ''}', ${index})"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="deleteLink('${cat}', '${folder || ''}', ${index})"><i class="fa-solid fa-trash" style="color:var(--danger);"></i></button>
                </div>
            ` : ''}
        </div>
    `;
}

function render() {
    const area = document.getElementById("contentArea");
    const navHeader = document.getElementById("navigationHeader");
    const categoryTabs = document.getElementById("categoryTabs");
    const data = siteData[currentTab];
    area.innerHTML = "";

    // CASE 1: Inside A Folder View
    if (activeFolderName) {
        categoryTabs.classList.add("hidden");
        navHeader.classList.remove("hidden");
        document.getElementById("currentFolderName").innerHTML = `<i class="fa-solid fa-folder-open"></i> ${activeFolderName}`;

        let folderLinks = data.folders[activeFolderName] || [];
        let linksHTML = folderLinks.map((link, idx) => renderLinkItem(link, currentTab, activeFolderName, idx)).join("");

        area.innerHTML = `
            <div class="link-list-container">
                ${linksHTML || '<p style="color:var(--text-muted); text-align:center; padding: 2rem 0;">No links in this folder yet.</p>'}
            </div>
        `;
        return;
    }

    // CASE 2: Main Category View (Folders Grid + Direct Links)
    categoryTabs.classList.remove("hidden");
    navHeader.classList.add("hidden");

    let foldersHTML = "";
    for (let fName in data.folders) {
        let count = data.folders[fName].length;
        foldersHTML += `
            <div class="folder-box" onclick="enterFolder('${fName}')">
                ${isAdmin ? `
                    <button class="btn-delete-folder-box" onclick="deleteFolder('${currentTab}', '${fName}', event)" title="Delete Folder">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                ` : ''}
                <i class="fa-solid fa-folder folder-box-icon"></i>
                <div class="folder-box-name">${fName}</div>
                <div class="folder-box-count">${count} Item${count === 1 ? '' : 's'}</div>
            </div>
        `;
    }

    let mainHTML = "";
    if (foldersHTML) {
        mainHTML += `
            <h4 style="color:var(--text-muted); margin-bottom: 1rem;"><i class="fa-solid fa-folder"></i> Folders</h4>
            <div class="folders-grid">${foldersHTML}</div>
        `;
    }

    // Direct / Root Links View
    if (data.rootLinks.length > 0) {
        let rootHTML = data.rootLinks.map((link, idx) => renderLinkItem(link, currentTab, null, idx)).join("");
        mainHTML += `
            <h4 style="color:var(--text-muted); margin: 1.5rem 0 1rem;"><i class="fa-solid fa-layer-group"></i> Direct Links</h4>
            <div class="link-list-container">${rootHTML}</div>
        `;
    }

    if (!foldersHTML && data.rootLinks.length === 0) {
        mainHTML = `<p style="color:var(--text-muted); text-align:center; padding: 3rem 0;">No folders or links available in this category.</p>`;
    }

    area.innerHTML = mainHTML;
}
