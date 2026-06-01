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

console.log(`review number 1 was ${months1} mounts ago`)
console.log(`review number 2 was ${months2} mounts ago`)
console.log(`review number 3 was ${months3} mounts ago`)

document.getElementById("time1").textContent = `${months1} months ago`;
document.getElementById("time2").textContent = `${months2} months ago`;
document.getElementById("time3").textContent = `${months3} months ago`;

const btnUp = document.getElementById("btn-up");
const btnDown = document.getElementById("btn-down");

const massive = document.querySelectorAll('.review-card');
let isAnimating = false;

function myUpFunction(card) {
    let number = Number(card.dataset.pos);
        card.dataset.pos = (number + 2) % 3;
        console.log(card.dataset.pos)
        card.style.transform = `translateY(${card.dataset.pos * 170}px)`;
        const avatar = card.querySelector('.review-avatar');
        if (Number(card.dataset.pos) === 1) {
            avatar.classList.add('active');
        } else {
            avatar.classList.remove('active');
        }
        if (number === 0){
            card.style.transform = `translateY(-170px)`;
            card.classList.add('hidden')
            setTimeout(function() {
                card.style.transition = 'none';
                card.style.transform = 'translateY(340px)';
                setTimeout(() => {
                    card.style.transition = '';
                    card.classList.remove('hidden');
                }, 20);
            }, 400);
        }
}

btnUp.addEventListener("click", function (){
    if (isAnimating) return;
    isAnimating = true;
    massive.forEach(myUpFunction);
    setTimeout(() => isAnimating = false, 700);
})
massive.forEach(function(card) {
    let pos = Number(card.dataset.pos);
    card.style.transform = `translateY(${pos * 170}px)`;
    const avatar = card.querySelector('.review-avatar');
    if (pos === 1) avatar.classList.add('active');
})

function myDownFunction(card){
    let number = Number(card.dataset.pos);
    card.dataset.pos = (number + 1) % 3;
    console.log(card.dataset.pos)
    card.style.transform = `translateY(${card.dataset.pos * 170}px)`;
    const avatar = card.querySelector('.review-avatar');
    if (Number(card.dataset.pos) === 1) {
        avatar.classList.add('active');
    } else {
        avatar.classList.remove('active');
    }

    if (number === 2){
        card.style.transform = `translateY(510px)`;
        card.classList.add('hidden')
        setTimeout(function() {
            card.style.transition = 'none';
            card.style.transform = 'translateY(0px)';
            setTimeout(() => {
                card.style.transition = '';
                card.classList.remove('hidden');
            }, 20);
        }, 400);
    }
}

btnDown.addEventListener("click", function (){
    if (isAnimating) return;
    isAnimating = true;
    setTimeout(() => isAnimating = false, 700);
    massive.forEach(myDownFunction)
})

