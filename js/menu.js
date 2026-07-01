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

function categoryHTML(cat, items, index) {
    const dir = index % 2 === 0 ? "reveal-left" : "reveal-right";
    return `
        <section class="menu-category reveal ${dir}">
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

let pageBuilders = [];
let pageIndex = 0;
let animating = false;

function renderPage() {
    const root = document.getElementById("menu-root");
    root.innerHTML = pageBuilders[pageIndex]();
    revealScan(root);
    updateNav();
}

function updateNav() {
    document.getElementById("page-prev").disabled = pageIndex === 0;
    document.getElementById("page-next").disabled = pageIndex === pageBuilders.length - 1;
    document.getElementById("page-indicator").textContent = `${pageIndex + 1} / ${pageBuilders.length}`;
}

// слайд вбок: текущая уезжает, новая въезжает с другой стороны
function goToPage(target) {
    if (target < 0 || target >= pageBuilders.length || animating) return;
    const root = document.getElementById("menu-root");
    const dir = target > pageIndex ? 1 : -1;
    animating = true;

    root.style.transition = "transform 0.4s ease, opacity 0.4s ease";
    root.style.transform = `translateX(${-60 * dir}px)`;
    root.style.opacity = "0";

    setTimeout(() => {
        pageIndex = target;
        renderPage();
        window.scrollTo(0, 0);

        root.style.transition = "none";
        root.style.transform = `translateX(${60 * dir}px)`;
        requestAnimationFrame(() => {
            root.style.transition = "transform 0.4s ease, opacity 0.4s ease";
            root.style.transform = "translateX(0)";
            root.style.opacity = "1";
            setTimeout(() => { animating = false; }, 400);
        });
    }, 400);
}

async function loadMenu() {
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
        document.getElementById("menu-root").textContent = "Failed to load menu :(";
        console.error(catErr || itemErr);
        return;
    }

    const pageNums = [...new Set(categories.map(c => c.page ?? 1))].sort((a, b) => a - b);
    pageBuilders = pageNums.map(pn => () =>
        categories
            .filter(c => (c.page ?? 1) === pn)
            .map((cat, i) => categoryHTML(cat, items, i))
            .join("")
    );
    pageIndex = 0;
    renderPage();

    document.getElementById("page-prev").onclick = () => goToPage(pageIndex - 1);
    document.getElementById("page-next").onclick = () => goToPage(pageIndex + 1);
}

loadMenu();
