const now = new Date(); // time now

const card1 = document.getElementById("review1"); // gets info from box with id review1
const review_time = new Date(card1.dataset.review); // gets date variable
const diff1 = now - review_time; // in milliseconds
const months1 = Math.floor(diff1 / 1000 / 60 / 60 / 24 / 30);


const card2 = document.getElementById("review2");
const review_time2 = new Date(card2.dataset.review);
const diff2 = now - review_time2;
const months2 = Math.floor(diff2 / 1000 / 60 / 60 / 24 / 30);


const card3 = document.getElementById("review3");
const review_time3 = new Date(card3.dataset.review);
const diff3 = now - review_time3;
const months3 = Math.floor(diff3 / 1000 / 60 / 60 / 24 / 30);

document.getElementById("time1").textContent = `${months1} months ago`;
document.getElementById("time2").textContent = `${months2} months ago`;
document.getElementById("time3").textContent = `${months3} months ago`;

const header = document.querySelector('header');
const btnUp = document.getElementById("btn-up");
const btnDown = document.getElementById("btn-down");

const massive = document.querySelectorAll('.review-card');
let isAnimating = false;

function setActive(card) {
    const avatar = card.querySelector('.review-avatar');
    const text = card.querySelector('.review-text1');
    const info = card.querySelector('.review-info');
    const inner = card.querySelector('.review-inner');
    if (Number(card.dataset.pos) === 1) {
        avatar.classList.add('active');
        if (inner) inner.classList.add('active');
        text.classList.remove('faded');
        info.classList.remove('faded')
        info.classList.add('active');
    } else {
        avatar.classList.remove('active');
        if (inner) inner.classList.remove('active');
        text.classList.add('faded');
        info.classList.remove('active')
        info.classList.add('faded')
    }
}

function placeCard(card) {
    card.style.transform = `translateY(${Number(card.dataset.pos) * 170}px)`;
    setActive(card);
}

function wrapCard(card, offScreenY, landingY) {
    const info = card.querySelector('.review-info');
    const text = card.querySelector('.review-text1');
    card.style.transform = `translateY(${offScreenY}px)`;
    card.classList.add('hidden');
    info.classList.add('hidden');
    setTimeout(function () {
        card.style.transition = 'none';
        info.style.transition = 'none';
        text.style.transition = 'none';
        card.style.transform = `translateY(${landingY}px)`;
        setTimeout(function () {
            card.style.transition = '';
            info.style.transition = '';
            text.style.transition = '';
            card.classList.remove('hidden');
            info.classList.remove('hidden');
        }, 20);
    }, 400);
}

function myUpFunction(card) {
    const number = Number(card.dataset.pos);
    card.dataset.pos = (number + 2) % 3;
    placeCard(card);
    if (number === 0) {
        wrapCard(card, -170, 340);
    }
}

function myDownFunction(card) {
    const number = Number(card.dataset.pos);
    card.dataset.pos = (number + 1) % 3;
    placeCard(card);
    if (number === 2) {
        wrapCard(card, 510, 0);
    }
}

btnUp.addEventListener("click", function () {
    if (isAnimating) return;
    isAnimating = true;
    massive.forEach(myUpFunction);
    setTimeout(() => isAnimating = false, 800);
});

btnDown.addEventListener("click", function () {
    if (isAnimating) return;
    isAnimating = true;
    massive.forEach(myDownFunction);
    setTimeout(() => isAnimating = false, 800);
});

massive.forEach(placeCard);

let lastScroll = 0;
let hideTimer;
window.addEventListener('scroll', function () {
    const current = window.scrollY;
    if (current > lastScroll) {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => header.classList.add('hidden'), 2000)
    } else {
        clearTimeout(hideTimer);
        header.classList.remove('hidden');
    }

    if (current < 50) {
        clearTimeout(hideTimer);
        header.classList.remove('hidden');
    }
    lastScroll = current;
});
