// Navigation Background Change on Scroll
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
});

// Mobile Hamburger Menu Toggle
const mobileMenu = document.getElementById('mobile-menu');
const navLinks = document.querySelector('.nav-links');

if (mobileMenu && navLinks) {
    mobileMenu.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = mobileMenu.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.className = 'fa-solid fa-xmark';
        } else {
            icon.className = 'fa-solid fa-bars';
        }
    });
}

// Close Mobile Menu on Link Click
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        if (navLinks && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            if (mobileMenu) {
                const icon = mobileMenu.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-bars';
            }
        }
    });
});

// Scroll Reveal Animation
const revealElements = document.querySelectorAll('.reveal');

const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    const revealPoint = 100;

    revealElements.forEach(el => {
        const revealTop = el.getBoundingClientRect().top;
        if (revealTop < windowHeight - revealPoint) {
            el.classList.add('active');
        }
    });
};

window.addEventListener('scroll', revealOnScroll);
window.addEventListener('load', revealOnScroll);

// Smooth Scrolling for Nav Links (with offset for sticky navbar)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            e.preventDefault();
            const navbarHeight = document.getElementById('navbar').offsetHeight || 80;
            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Micro-interactions: Live Billiard Timer Incrementor
function incrementTimer(timeStr) {
    const parts = timeStr.split(':');
    let hrs = parseInt(parts[0], 10);
    let mins = parseInt(parts[1], 10);
    let secs = parseInt(parts[2], 10);

    secs++;
    if (secs >= 60) {
        secs = 0;
        mins++;
        if (mins >= 60) {
            mins = 0;
            hrs++;
        }
    }

    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

// Update billiard timers every second
setInterval(() => {
    const timerElements = document.querySelectorAll('.billiard-table.active .table-timer');
    timerElements.forEach(el => {
        // Extract plain text time
        const rawText = el.textContent.trim();
        // Time format is like "01:24:10"
        const timeMatch = rawText.match(/\d{2}:\d{2}:\d{2}/);
        if (timeMatch) {
            const nextTime = incrementTimer(timeMatch[0]);
            el.innerHTML = `<i class="fa-regular fa-clock"></i> ${nextTime}`;
        }
    });
}, 1000);

// Micro-interactions: Animate Mechanic Queue progress bars dynamically
setInterval(() => {
    const progressFill = document.querySelector('.queue-card.item-progress .progress-bar-fill');
    if (progressFill) {
        let width = parseFloat(progressFill.style.width);
        if (isNaN(width)) width = 75;
        
        width += (Math.random() - 0.4) * 2; // slow fluctuate up and down, but trending up
        if (width > 99) width = 60; // reset
        if (width < 30) width = 30;
        
        progressFill.style.width = width.toFixed(1) + '%';
    }
}, 3000);

// Micro-interactions: Animate Phone progress bar dynamically
setInterval(() => {
    const phoneProgressFill = document.querySelector('.phone-screen .progress-fill-bar');
    const phoneProgressPercent = document.querySelector('.phone-screen .proj-percent');
    if (phoneProgressFill && phoneProgressPercent) {
        let percent = parseFloat(phoneProgressPercent.textContent);
        if (isNaN(percent)) percent = 82;
        
        percent += (Math.random() > 0.5 ? 1 : -1) * 0.15; // slow fluctuate
        if (percent > 99) percent = 70; // reset
        if (percent < 50) percent = 50;
        
        phoneProgressPercent.textContent = Math.round(percent) + '%';
        phoneProgressFill.style.width = percent.toFixed(1) + '%';
    }
}, 2000);
