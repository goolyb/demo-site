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
    $("f-category").innerHTML = data.map(c =>
        `<option value="${c.id}">${c.name}</option>`).join("");
    $("cat-list").innerHTML = data.map(c => `
        <div>
            ${c.image_url ? `<img src="${c.image_url}" style="max-width:80px;">` : "(нет фото)"}
            <b>${c.name}</b>
            <input type="file" accept="image/*" onchange="uploadCatPhoto(${c.id}, this)">
        </div>
    `).join("");
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

$("add-cat-btn").onclick = async () => {
    const name = $("cat-name").value.trim();
    if (!name) return;
    const { error } = await db.from("categories").insert({ name });
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
            <button onclick="editItem(${i.id})">✏️</button>
            <button onclick="deleteItem(${i.id})">🗑️</button>
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

window.editItem = (id) => {
    const item = window._items.find(i => i.id === id);
    $("form-title").textContent = "Редактировать";
    $("f-id").value = item.id;
    $("f-category").value = item.category_id;
    $("f-name").value = item.name;
    $("f-description").value = item.description || "";
    $("f-price").value = item.price;
    window._editingImage = item.image_url;
    if (item.image_url) {
        $("f-preview").src = item.image_url;
        $("f-preview").style.display = "block";
    }
    $("cancel-btn").style.display = "inline";
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
