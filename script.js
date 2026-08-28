const JSONBIN_BIN_ID = "6a66b074f5f4af5e29c584d7";
const JSONBIN_API_KEY = "$2a$10$/.0ucWqnyelIvKg8aItYu.I6fWQm689MIf4Cx89kAwSPT18Kzm5TS"; 

const ADMIN_PASS = "hinata056";
let isAdmin = false;
let currentTab = "anime";

let siteData = {
    anime: { folders: {}, rootLinks: [] },
    games: { folders: {}, rootLinks: [] },
    edu: { folders: {}, rootLinks: [] }
};

// 5 Seconds Forced Preloader
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
    area.innerHTML = "";
    const data = siteData[currentTab];

    for (let fName in data.folders) {
        let linksHTML = data.folders[fName].map((link, idx) => renderLinkItem(link, currentTab, fName, idx)).join("");
        area.innerHTML += `
            <div class="folder-card">
                <div class="folder-header"><i class="fa-solid fa-folder-open"></i> ${fName}</div>
                <div>${linksHTML || '<small style="color:var(--text-muted)">No links added yet.</small>'}</div>
            </div>
        `;
    }

    if (data.rootLinks.length > 0) {
        let rootHTML = data.rootLinks.map((link, idx) => renderLinkItem(link, currentTab, null, idx)).join("");
        area.innerHTML += `
            <div class="folder-card">
                <div class="folder-header"><i class="fa-solid fa-layer-group"></i> Direct Links</div>
                <div>${rootHTML}</div>
            </div>
        `;
    }
}
