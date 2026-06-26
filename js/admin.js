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
            ${c.image_url ? `<img src="${c.image_url}" style="max-width:80px;">` : "(нет фото)"}
            <b>${c.name}</b>
            <input type="file" accept="image/*" onchange="uploadCatPhoto(${c.id}, this)">
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
        alert("Ошибка: " + e.message);
    }
};

window.renameCat = async (catId) => {
    const cat = window._cats.find(c => c.id === catId);
    const name = prompt("Новое название категории:", cat.name);
    if (!name || !name.trim()) return;
    const { error } = await db.from("categories")
        .update({ name: name.trim() }).eq("id", catId);
    if (error) { alert(error.message); return; }
    await loadCategories();
};

window.deleteCat = async (catId) => {
    if (!confirm("Удалить категорию? Все блюда в ней тоже удалятся!")) return;
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
    $("items-list").innerHTML = data.map(i => `
        <div>
            ${i.image_url ? `<img src="${i.image_url}" style="max-width:60px;">` : ""}
            <b>${i.name}</b> — € ${Number(i.price).toFixed(2)}
            <button onclick="editItem(${i.id})"><i class="fa-solid fa-pencil"></i></button>
            <button onclick="deleteItem(${i.id})"><i class="fa-solid fa-trash-can"></i></button>
        </div>
    `).join("");
    window._items = data;
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
    $("form-msg").textContent = "Сохраняю...";
    try {
        let imageUrl = window._editingImage || null;
        const file = $("f-image").files[0];
        if (file) imageUrl = await uploadPhoto(file);

        const payload = {
            category_id: Number($("f-category").value),
            name: $("f-name").value,
            description: $("f-description").value || null,
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
        $("form-msg").textContent = "Готово ✅";
    } catch (e) {
        $("form-msg").textContent = "Ошибка: " + e.message;
    }
};

window.editItem = async (id) => {
    const item = window._items.find(i => i.id === id);

    const name = prompt("Название:", item.name);
    if (name === null) return;
    const priceStr = prompt("Цена:", item.price);
    if (priceStr === null) return;
    const description = prompt("Описание:", item.description || "");
    if (description === null) return;

    const { error } = await db.from("menu_items").update({
        name: name.trim(),
        price: Number(priceStr),
        description: description.trim() || null,
    }).eq("id", id);

    if (error) { alert(error.message); return; }
    await loadItems();
};

window.deleteItem = async (id) => {
    if (!confirm("Удалить позицию?")) return;
    const { error } = await db.from("menu_items").delete().eq("id", id);
    if (error) alert(error.message);
    else loadItems();
};

$("cancel-btn").onclick = resetForm;

function resetForm() {
    $("form-title").textContent = "Новое блюдо";
    $("f-id").value = "";
    $("f-name").value = "";
    $("f-description").value = "";
    $("f-price").value = "";
    $("f-image").value = "";
    $("f-preview").style.display = "none";
    window._editingImage = null;
    $("cancel-btn").style.display = "none";
    $("form-msg").textContent = "";
}

refreshUI();
