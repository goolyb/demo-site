const SUPABASE_URL = "https://rrpqgyqhjnjodgvjnswn.supabase.co";
const SUPABASE_KEY = "sb_publishable_4I03VtIyHTUlzkbJ5AlndQ_tbHrhue5";
const BUCKET = "menu-images";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (id) => document.getElementById(id);

async function refreshUI() {
    const { data: { session } } = await db.auth.getSession();
    if (session) {
        $("login-box").style.display = "none";
        $("admin-box").style.display = "block";
        await loadCategories();
        await loadItems();
    } else {
        $("login-box").style.display = "block";
        $("admin-box").style.display = "none";
    }
}

$("login-btn").onclick = async () => {
    $("login-error").textContent = "";
    const { error } = await db.auth.signInWithPassword({
        email: $("email").value,
        password: $("password").value,
    });
    if (error) $("login-error").textContent = error.message;
    else refreshUI();
};

$("logout-btn").onclick = async () => {
    await db.auth.signOut();
    refreshUI();
};

async function loadCategories() {
    const { data } = await db.from("categories").select("*").order("sort_order");
    window._cats = data;
    $("f-category").innerHTML = data.map(c =>
        `<option value="${c.id}">${c.name}</option>`).join("");
    $("cat-list").innerHTML = data.map(c => `
        <div class="cat-row" draggable="true" data-id="${c.id}">
            <span class="drag-handle">⠿</span>
            ${c.image_url ? `<img src="${c.image_url}" style="max-width:80px;">` : "(no photo)"}
            <b>${c.name}</b>
            <label class="file-btn" for="cat-file-${c.id}">Photo</label>
            <input id="cat-file-${c.id}" type="file" accept="image/*" hidden onchange="uploadCatPhoto(${c.id}, this)">
            <button onclick="renameCat(${c.id})"><i class="fa-solid fa-pencil"></i></button>
            <button onclick="deleteCat(${c.id})"><i class="fa-solid fa-trash-can"></i></button>
        </div>
    `).join("");
    enableCatDnd();
}

let _dragId = null;

function enableCatDnd() {
    $("cat-list").querySelectorAll(".cat-row").forEach(row => {
        row.ondragstart = () => { _dragId = Number(row.dataset.id); };
        row.ondragover = (e) => e.preventDefault();
        row.ondrop = (e) => {
            e.preventDefault();
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
    const nextOrder = (window._cats?.length
        ? Math.max(...window._cats.map(c => c.sort_order)) : 0) + 1;
    const { error } = await db.from("categories").insert({ name, sort_order: nextOrder });
    if (error) { alert(error.message); return; }
    $("cat-name").value = "";
    await loadCategories();
};

async function loadItems() {
    const { data, error } = await db.from("menu_items").select("*").order("sort_order");
    if (error) { $("items-list").textContent = error.message; return; }
    window._items = data;
    const catOptions = (window._cats || []).map(c => `<option value="${c.id}">${c.name}</option>`).join("");
    $("items-list").innerHTML = data.map(i => `
        <div class="item-card${i.is_available ? "" : " is-hidden"}">
            <div class="item-row">
                <b>${i.name}</b> — € ${Number(i.price).toFixed(2)}
                ${i.is_available ? "" : `<span class="hidden-tag">hidden</span>`}
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
                    <input class="e-name" type="text" placeholder="Name" value="${i.name}">
                    <select class="e-cat">${catOptions}</select>
                    <input class="e-price" type="number" step="0.10" placeholder="Price" value="${i.price}">
                    <input class="e-desc" type="text" placeholder="Description" value="${i.description || ""}">
                    <input class="e-badge" type="text" placeholder="Badge (optional)" value="${i.badge || ""}">
                    ${i.image_url ? `<img class="e-preview" src="${i.image_url}">` : ""}
                   
                    <div class="item-edit-btns">
                        <input class="e-image" type="file" accept="image/*">
                        <button onclick="saveItem(${i.id})">Save</button>
                        <button class="btn-ghost" onclick="editItem(${i.id})">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    `).join("");
    data.forEach(i => { $("edit-" + i.id).querySelector(".e-cat").value = i.category_id; });
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

window.toggleAvailable = async (id) => {
    const item = (window._items || []).find(i => i.id === id);
    const { error } = await db.from("menu_items")
        .update({ is_available: !item.is_available }).eq("id", id);
    if (error) { alert(error.message); return; }
    await loadItems();
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
    $("f-price").value = "";
    $("f-image").value = "";
    $("f-filename").textContent = "No file chosen";
    $("f-preview").style.display = "none";
    window._editingImage = null;
    $("cancel-btn").style.display = "none";
    $("form-msg").textContent = "";
}

refreshUI();
