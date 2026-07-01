const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function animateCount(el) {
    const m = el.textContent.trim().match(/^(\D*)([\d.]+)(\D*)$/);
    if (!m) return;
    const [, prefix, numStr, suffix] = m;
    const target = parseFloat(numStr);
    const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;
    const duration = 1200;
    let start = null;

    const step = (ts) => {
        if (start === null) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const value = (target * eased).toFixed(decimals);
        el.textContent = prefix + value + suffix;
        if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

function reveal(el) {
    el.classList.add("in");
    el.querySelectorAll("[data-count]").forEach(animateCount);
    setTimeout(() => {
        [...el.classList].forEach((c) => {
            if (c === "in" || c.startsWith("reveal")) el.classList.remove(c);
        });
    }, 1400);
}

const observer = reduceMotion ? null : new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            reveal(entry.target);
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

// сканирует .reveal и запускает наблюдение. Можно звать повторно
// после того как в DOM добавили новые .reveal (напр. подгруженное меню).
function revealScan(root = document) {
    root.querySelectorAll(".reveal").forEach((el) => {
        if (reduceMotion) el.classList.add("in");
        else observer.observe(el);
    });
}

revealScan();
window.revealScan = revealScan;
