const SUPABASE_URL = "https://rrpqgyqhjnjodgvjnswn.supabase.co";
const SUPABASE_KEY = "sb_publishable_4I03VtIyHTUlzkbJ5AlndQ_tbHrhue5";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function loadMenu() {
    const root = document.getElementById("menu-root");

    const { data: categories, error: catErr } = await db
        .from("categories")
        .select("*")
        .order("sort_order");

    const { data: items, error: itemErr } = await db
        .from("menu_items")
        .select("*")
        .eq("is_available", true)
        .order("sort_order");

    if (catErr || itemErr) {
        root.textContent = "Failed to load menu :(";
        console.error(catErr || itemErr);
        return;
    }

    root.innerHTML = categories.map(cat => `
        <section class="menu-category">
            <h2>${cat.name}</h2>
            <div class="menu-items">
                ${items.filter(i => i.category_id === cat.id).map(i => `
                    <div class="menu-item">
                        ${i.image_url ? `<img src="${i.image_url}" alt="${i.name}">` : ""}
                        <div class="menu-item-name">${i.name}${i.badge ? ` <span class="badge">${i.badge}</span>` : ""}</div>
                        ${i.description ? `<div class="menu-item-desc">${i.description}</div>` : ""}
                        <div class="menu-item-price">€ ${Number(i.price).toFixed(2)}</div>
                    </div>
                `).join("")}
            </div>
        </section>
    `).join("");
}

loadMenu();
