const SUPABASE_URL = "https://rrpqgyqhjnjodgvjnswn.supabase.co";
const SUPABASE_KEY = "sb_publishable_4I03VtIyHTUlzkbJ5AlndQ_tbHrhue5";
const BUCKET = "menu-images";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (id) => document.getElementById(id);

function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

let recovering = false;

async function refreshUI() {
    if (recovering) return;
    const { data: { session } } = await db.auth.getSession();
    if (session) {
        $("login-box").style.display = "none";
        $("reset-box").style.display = "none";
        $("admin-box").style.display = "block";
        await loadCategories();
        await loadItems();
    } else {
        $("login-box").style.display = "block";
        $("reset-box").style.display = "none";
        $("admin-box").style.display = "none";
    }
}

$("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("login-error").textContent = "";
    const { error } = await db.auth.signInWithPassword({
        email: $("email").value,
        password: $("password").value,
    });
    if (error) $("login-error").textContent = error.message;
    else refreshUI();
});

$("toggle-password").onclick = () => {
    const inp = $("password");
    const show = inp.type === "password";
    inp.type = show ? "text" : "password";
    $("toggle-password").querySelector("i").className = show ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
    $("toggle-password").setAttribute("aria-label", show ? "Hide password" : "Show password");
};

$("forgot-btn").onclick = async () => {
    const email = $("email").value.trim();
    $("login-error").textContent = "";
    if (!email) { $("login-error").textContent = "Enter your email first, then click again."; return; }
    const { error } = await db.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.href.split("#")[0],
    });
    $("login-error").textContent = error
        ? error.message
        : "Recovery link sent — check your inbox.";
};

// возврат по ссылке из письма: Supabase кидает событие PASSWORD_RECOVERY
db.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") {
        recovering = true;
        $("login-box").style.display = "none";
        $("admin-box").style.display = "none";
        $("reset-box").style.display = "block";
    }
});

$("reset-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("reset-msg").textContent = "";
    const pw = $("new-password").value;
    if (pw.length < 6) { $("reset-msg").textContent = "At least 6 characters."; return; }
    const { error } = await db.auth.updateUser({ password: pw });
    if (error) { $("reset-msg").textContent = error.message; return; }
    recovering = false;
    $("new-password").value = "";
    await refreshUI();
});

$("logout-btn").onclick = async () => {
    await db.auth.signOut();
    refreshUI();
};

async function loadCategories() {
    const { data } = await db.from("categories").select("*").order("sort_order");
    window._cats = data;
    const pages = [...new Set(data.map(c => c.page ?? 1))].sort((a, b) => a - b);

    $("f-category").innerHTML = data.map(c =>
        `<option value="${c.id}">${esc(c.name)}</option>`).join("");

    const catCard = (c) => `
        <div class="cat-row" draggable="true" data-id="${c.id}">
            <span class="drag-handle">⠿</span>
            ${c.image_url ? `<img src="${esc(c.image_url)}" alt="${esc(c.name)}" style="max-width:80px;">` : "(no photo)"}
            <b>${esc(c.name)}</b>
            <label class="cat-page">page <input type="number" min="1" value="${c.page ?? 1}" onchange="setCatPage(${c.id}, this.value)"></label>
            <label class="file-btn" for="cat-file-${c.id}">Photo</label>
            <input id="cat-file-${c.id}" type="file" accept="image/*" hidden onchange="uploadCatPhoto(${c.id}, this)">
            <button onclick="renameCat(${c.id})"><i class="fa-solid fa-pencil"></i></button>
            <button onclick="deleteCat(${c.id})"><i class="fa-solid fa-trash-can"></i></button>
        </div>`;

    $("cat-list").innerHTML = pages.map(pn => `
        <div class="page-block">
            <h3>Page ${pn}</h3>
            ${data.filter(c => (c.page ?? 1) === pn).map(catCard).join("")}
        </div>
    `).join("");

    enableCatDnd();
}

let _dragId = null;

function enableCatDnd() {
    $("cat-list").querySelectorAll(".cat-row").forEach(row => {
        row.ondragstart = () => { _dragId = Number(row.dataset.id); row.classList.add("dragging"); };
        row.ondragend = () => row.classList.remove("dragging");
        row.ondragover = (e) => { e.preventDefault(); row.classList.add("drag-over"); };
        row.ondragleave = () => row.classList.remove("drag-over");
        row.ondrop = (e) => {
            e.preventDefault();
            row.classList.remove("drag-over");
            reorderCats(_dragId, Number(row.dataset.id));
        };
    });
}

async function reorderCats(fromId, toId) {
    if (!fromId || fromId === toId) return;
    const cats = window._cats;
    const from = cats.findIndex(c => c.id === fromId);
    const to = cats.findIndex(c => c.id === toId);
    const [moved] = cats.splice(from, 1);
    cats.splice(to, 0, moved);
    for (let i = 0; i < cats.length; i++) {
        await db.from("categories").update({ sort_order: i + 1 }).eq("id", cats[i].id);
    }
    await loadCategories();
}

window.uploadCatPhoto = async (catId, input) => {
    const file = input.files[0];
    if (!file) return;
    try {
        const url = await uploadPhoto(file);
        const { error } = await db.from("categories")
            .update({ image_url: url }).eq("id", catId);
        if (error) throw error;
        await loadCategories();
    } catch (e) {
        alert("Error: " + e.message);
    }
};

window.renameCat = async (catId) => {
    const cat = window._cats.find(c => c.id === catId);
    const name = prompt("New category name:", cat.name);
    if (!name || !name.trim()) return;
    const { error } = await db.from("categories")
        .update({ name: name.trim() }).eq("id", catId);
    if (error) { alert(error.message); return; }
    await loadCategories();
};

window.setCatPage = async (catId, value) => {
    const page = Math.max(1, parseInt(value) || 1);
    const { error } = await db.from("categories").update({ page }).eq("id", catId);
    if (error) alert(error.message);
};

window.deleteCat = async (catId) => {
    if (!confirm("Delete this category? All items in it will be deleted too!")) return;
    const { error } = await db.from("categories").delete().eq("id", catId);
    if (error) { alert(error.message); return; }
    await loadCategories();
    await loadItems();
};

$("add-cat-btn").onclick = async () => {
    const name = $("cat-name").value.trim();
    if (!name) return;
    const page = Math.max(1, parseInt($("cat-page-new").value) || 1);
    const nextOrder = (window._cats?.length
        ? Math.max(...window._cats.map(c => c.sort_order)) : 0) + 1;
    const { error } = await db.from("categories").insert({ name, page, sort_order: nextOrder });
    if (error) { alert(error.message); return; }
    $("cat-name").value = "";
    $("cat-page-new").value = "1";
    await loadCategories();
};

async function loadItems() {
    const { data, error } = await db.from("menu_items").select("*").order("sort_order").order("id");
    if (error) { $("items-list").textContent = error.message; return; }
    window._items = data;
    const cats = window._cats || [];
    const catOptions = cats.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join("");
    const pages = [...new Set(cats.map(c => c.page ?? 1))].sort((a, b) => a - b);

    const renderCard = (i) => `
        <div class="item-card${i.is_available ? "" : " is-hidden"}" data-id="${i.id}" data-cat="${i.category_id}">
            <div class="item-row">
                <span class="drag-handle" title="Drag to reorder">⠿</span>
                <b>${esc(i.name)}</b>
                <span class="hidden-tag">hidden</span>
                <span class="item-price">€ ${Number(i.price).toFixed(2)}</span>
                <span class="item-actions">
                    <button onclick="toggleAvailable(${i.id})" title="Show / hide">
                        <i class="fa-solid ${i.is_available ? "fa-eye" : "fa-eye-slash"}"></i>
                    </button>
                    <button onclick="editItem(${i.id})"><i class="fa-solid fa-pencil"></i></button>
                    <button onclick="deleteItem(${i.id})"><i class="fa-solid fa-trash-can"></i></button>
                </span>
            </div>
            <div class="item-edit" id="edit-${i.id}">
                <div class="item-edit-inner">
                    <input class="e-name" type="text" placeholder="Name" value="${esc(i.name)}">
                    <select class="e-cat">${catOptions}</select>
                    <input class="e-price" type="number" step="0.10" placeholder="Price" value="${i.price}">
                    <input class="e-desc" type="text" placeholder="Description" value="${esc(i.description || "")}">
                    <div class="badge-row">
                        <input class="e-badge" type="text" placeholder="Badge (optional)" value="${esc(i.badge || "")}">
                        <input class="e-badge-color" type="color" value="${i.badge_color || "#e6a24a"}" title="Badge color">
                    </div>
                    ${i.image_url ? `<img class="e-preview" src="${esc(i.image_url)}" alt="">` : ""}

                    <div class="item-edit-btns">
                        <input class="e-image" type="file" accept="image/*">
                        <button onclick="saveItem(${i.id})">Save</button>
                        <button class="btn-ghost" onclick="editItem(${i.id})">Cancel</button>
                    </div>
                </div>
            </div>
        </div>`;

    const renderGroup = (title, items, catId) => `
        <div class="item-group" data-cat="${catId}">
            <h3 class="item-group-title">${esc(title)} <span class="item-group-count">${items.length}</span></h3>
            ${items.length ? items.map(renderCard).join("") : `<p class="item-group-empty">No items yet</p>`}
        </div>`;

    let html = pages.map(pn => `
        <div class="page-block">
            <h3>Page ${pn}</h3>
            ${cats.filter(c => (c.page ?? 1) === pn)
                .map(c => renderGroup(c.name, data.filter(i => i.category_id === c.id), c.id))
                .join("")}
        </div>`).join("");
    const orphans = data.filter(i => !cats.some(c => c.id === i.category_id));
    if (orphans.length) html += renderGroup("Uncategorized", orphans, "");

    $("items-list").innerHTML = html;
    data.forEach(i => { $("edit-" + i.id).querySelector(".e-cat").value = i.category_id; });
    enableItemDnd();
}

let _dragItemId = null;

function enableItemDnd() {
    $("items-list").querySelectorAll(".item-card").forEach(card => {
        const handle = card.querySelector(".drag-handle");
        handle.draggable = true;
        handle.ondragstart = (e) => {
            _dragItemId = Number(card.dataset.id);
            e.dataTransfer.effectAllowed = "move";
            card.classList.add("dragging");
        };
        handle.ondragend = () => card.classList.remove("dragging");
        card.ondragover = (e) => { e.preventDefault(); e.stopPropagation(); card.classList.add("drag-over"); };
        card.ondragleave = () => card.classList.remove("drag-over");
        card.ondrop = (e) => {
            e.preventDefault();
            e.stopPropagation();
            card.classList.remove("drag-over");
            dropOnItem(Number(card.dataset.id), Number(card.dataset.cat));
        };
    });
    $("items-list").querySelectorAll(".item-group").forEach(group => {
        group.ondragover = (e) => { e.preventDefault(); group.classList.add("drag-over"); };
        group.ondragleave = () => group.classList.remove("drag-over");
        group.ondrop = (e) => {
            e.preventDefault();
            group.classList.remove("drag-over");
            const cat = group.dataset.cat;
            if (cat) dropOnGroup(Number(cat));
        };
    });
}

async function dropOnItem(targetId, targetCat) {
    if (!_dragItemId || _dragItemId === targetId) return;
    const items = window._items;
    const moved = items.splice(items.findIndex(i => i.id === _dragItemId), 1)[0];
    moved.category_id = targetCat;
    items.splice(items.findIndex(i => i.id === targetId), 0, moved);
    await persistItemOrder();
}

async function dropOnGroup(catId) {
    if (!_dragItemId) return;
    const items = window._items;
    const moved = items.splice(items.findIndex(i => i.id === _dragItemId), 1)[0];
    moved.category_id = catId;
    let lastIdx = -1;
    items.forEach((it, idx) => { if (it.category_id === catId) lastIdx = idx; });
    items.splice(lastIdx + 1, 0, moved);
    await persistItemOrder();
}

async function persistItemOrder() {
    for (let i = 0; i < window._items.length; i++) {
        const it = window._items[i];
        await db.from("menu_items")
            .update({ sort_order: i + 1, category_id: it.category_id })
            .eq("id", it.id);
    }
    await loadItems();
}

async function uploadPhoto(file) {
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await db.storage.from(BUCKET).upload(path, file);
    if (error) throw error;
    const { data } = db.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
}

$("save-btn").onclick = async () => {
    $("form-msg").textContent = "Saving...";
    try {
        let imageUrl = window._editingImage || null;
        const file = $("f-image").files[0];
        if (file) imageUrl = await uploadPhoto(file);

        const payload = {
            category_id: Number($("f-category").value),
            name: $("f-name").value,
            description: $("f-description").value || null,
            badge: $("f-badge").value.trim() || null,
            badge_color: $("f-badge").value.trim() ? $("f-badge-color").value : null,
            price: Number($("f-price").value),
            image_url: imageUrl,
        };

        const id = $("f-id").value;
        const { error } = id
            ? await db.from("menu_items").update(payload).eq("id", id)
            : await db.from("menu_items").insert(payload);

        if (error) throw error;
        resetForm();
        await loadItems();
        $("form-msg").textContent = "Done " + String.fromCharCode(0x2713);
    } catch (e) {
        $("form-msg").textContent = "Error: " + e.message;
    }
};

window.editItem = (id) => {
    $("edit-" + id).classList.toggle("open");
};

window.saveItem = async (id) => {
    const panel = $("edit-" + id);
    const payload = {
        name: panel.querySelector(".e-name").value.trim(),
        category_id: Number(panel.querySelector(".e-cat").value),
        price: Number(panel.querySelector(".e-price").value),
        description: panel.querySelector(".e-desc").value.trim() || null,
        badge: panel.querySelector(".e-badge").value.trim() || null,
        badge_color: panel.querySelector(".e-badge").value.trim()
            ? panel.querySelector(".e-badge-color").value : null,
    };
    try {
        const file = panel.querySelector(".e-image").files[0];
        if (file) payload.image_url = await uploadPhoto(file);
        const { error } = await db.from("menu_items").update(payload).eq("id", id);
        if (error) throw error;
    } catch (e) { alert(e.message); return; }

    panel.classList.remove("open");
    setTimeout(loadItems, 300);
};

function paintAvailability(id, available) {
    const card = document.querySelector(`.item-card[data-id="${id}"]`);
    if (!card) return;
    card.classList.toggle("is-hidden", !available);
    const icon = card.querySelector(".item-actions .fa-eye, .item-actions .fa-eye-slash");
    if (icon) {
        icon.classList.toggle("fa-eye", available);
        icon.classList.toggle("fa-eye-slash", !available);
    }
}

window.toggleAvailable = async (id) => {
    const item = (window._items || []).find(i => i.id === id);
    if (!item) return;
    const next = !item.is_available;

    item.is_available = next;
    paintAvailability(id, next);

    const { error } = await db.from("menu_items")
        .update({ is_available: next }).eq("id", id);
    if (error) {
        item.is_available = !next;
        paintAvailability(id, !next);
        alert(error.message);
    }
};

window.deleteItem = async (id) => {
    if (!confirm("Delete this item?")) return;
    const { error } = await db.from("menu_items").delete().eq("id", id);
    if (error) alert(error.message);
    else loadItems();
};

$("f-image").onchange = () => {
    const file = $("f-image").files[0];
    $("f-filename").textContent = file ? file.name : "No file chosen";
};

$("cancel-btn").onclick = resetForm;

function resetForm() {
    $("form-title").textContent = "New item";
    $("f-id").value = "";
    $("f-name").value = "";
    $("f-description").value = "";
    $("f-badge").value = "";
    $("f-badge-color").value = "#e6a24a";
    $("f-price").value = "";
    $("f-image").value = "";
    $("f-filename").textContent = "No file chosen";
    $("f-preview").style.display = "none";
    window._editingImage = null;
    $("cancel-btn").style.display = "none";
    $("form-msg").textContent = "";
}

refreshUI();
