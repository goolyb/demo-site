const SUPABASE_URL = "https://rrpqgyqhjnjodgvjnswn.supabase.co";
const SUPABASE_KEY = "sb_publishable_4I03VtIyHTUlzkbJ5AlndQ_tbHrhue5";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function badgeStyle(color) {
    if (!color) return "";
    const hex = color.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const text = luminance > 0.6 ? "#3a1c08" : "#fff";
    return `background:${color};color:${text};`;
}

function skeletonMarkup(categories = 3, itemsPer = 5) {
    const rows = n => Array.from({ length: n }, () => `
        <div class="menu-item">
            <div class="menu-item-row">
                <span class="sk sk-name"></span>
                <span class="leader"></span>
                <span class="sk sk-price"></span>
            </div>
            <span class="sk sk-desc"></span>
        </div>`).join("");

    return Array.from({ length: categories }, () => `
        <section class="menu-category">
            <div class="cat-photo"><span class="sk sk-photo"></span></div>
            <div class="cat-body">
                <span class="sk sk-title"></span>
                <div class="cat-items">${rows(itemsPer)}</div>
            </div>
        </section>`).join("");
}

async function loadMenu() {
    const root = document.getElementById("menu-root");
    root.innerHTML = skeletonMarkup();

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
                                ${i.badge ? `<span class="badge" style="${badgeStyle(i.badge_color)}">${i.badge}</span>` : ""}
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
