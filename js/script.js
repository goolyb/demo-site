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