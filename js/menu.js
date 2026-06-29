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
        .order("sort_order")
        .order("id");

    if (catErr || itemErr) {
        root.textContent = "Failed to load menu :(";
        console.error(catErr || itemErr);
        return;
    }

    root.innerHTML = categories.map(cat => `
        <section class="menu-category">
            ${cat.image_url ? `
                <div class="cat-photo">
                    <img src="${cat.image_url}" alt="${cat.name}">
                </div>` : ""}
            <div class="cat-body">
                <h2 class="cat-title">${cat.name}</h2>
                <div class="cat-items">
                    ${items.filter(i => i.category_id === cat.id).map(i => `
                        <div class="menu-item">
                            <div class="menu-item-row">
                                <span class="menu-item-name">${i.name}</span>
                                ${i.badge ? `<span class="badge">${i.badge}</span>` : ""}
                                <span class="leader"></span>
                                <span class="menu-item-price">€ ${Number(i.price).toFixed(2)}</span>
                            </div>
                            ${i.description ? `<p class="menu-item-desc">${i.description}</p>` : ""}
                        </div>
                    `).join("")}
                </div>
            </div>
        </section>
    `).join("");
}

loadMenu();
