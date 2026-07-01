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

function itemHTML(i) {
    return `
        <div class="menu-item">
            <div class="menu-item-row">
                <span class="menu-item-name">${i.name}</span>
                ${i.badge ? `<span class="badge" style="${badgeStyle(i.badge_color)}">${i.badge}</span>` : ""}
                <span class="leader"></span>
                <span class="menu-item-price">€ ${Number(i.price).toFixed(2)}</span>
            </div>
            ${i.description ? `<p class="menu-item-desc">${i.description}</p>` : ""}
        </div>`;
}

function categoryHTML(cat, items) {
    return `
        <section class="menu-category">
            ${cat.image_url ? `
                <div class="cat-photo">
                    <img src="${cat.image_url}" alt="${cat.name}">
                </div>` : ""}
            <div class="cat-body">
                <h2 class="cat-title">${cat.name}</h2>
                <div class="cat-items">
                    ${items.filter(i => i.category_id === cat.id).map(itemHTML).join("")}
                </div>
            </div>
        </section>`;
}

// пока: одна страница со всеми категориями (как старое меню).
// дальше сюда можно добавлять ещё <div class="page">...</div>.
function buildPages(categories, items) {
    return `
        <div class="page">
            <div class="face front">
                <div class="page-inner">
                    ${categories.map(cat => categoryHTML(cat, items)).join("")}
                </div>
            </div>
            <div class="face back"></div>
        </div>`;
}

// высота книги = высоте контента самой длинной страницы
function fitBookHeight(book) {
    const inner = book.querySelector(".page-inner");
    if (inner) book.style.height = inner.scrollHeight + "px";
}

function initFlip() {
    const pages = [...document.querySelectorAll(".page")];
    let current = 0;
    pages.forEach((p, i) => p.style.zIndex = pages.length - i);

    document.getElementById("flip-in").onclick = () => {
        if (current >= pages.length) return;
        pages[current].classList.add("flipped");
        current++;
    };

    document.getElementById("flip-out").onclick = () => {
        if (current <= 0) return;
        current--;
        pages[current].classList.remove("flipped");
    };
}

async function loadMenu() {
    const book = document.querySelector(".book");

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
        book.innerHTML = `<div class="page">Failed to load menu :(</div>`;
        console.error(catErr || itemErr);
        return;
    }

    book.innerHTML = buildPages(categories, items);
    fitBookHeight(book);
    initFlip();
}

loadMenu();
