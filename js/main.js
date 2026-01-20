// ============================================
// ThriveStart - Main JavaScript
// ============================================

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navLinks = document.getElementById('navLinks');

if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
    });
}

// Navbar scroll effect & Sticky CTA
const navbar = document.getElementById('navbar');
const stickyCta = document.getElementById('stickyCta');

if (navbar) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Show sticky CTA after scrolling past hero
        if (stickyCta) {
            if (window.scrollY > 600) {
                stickyCta.classList.add('visible');
            } else {
                stickyCta.classList.remove('visible');
            }
        }
    });
}

// FAQ accordion
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all
            faqItems.forEach(i => i.classList.remove('active'));
            
            // Open clicked if it wasn't active
            if (!isActive) {
                item.classList.add('active');
            }
        });
    }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            // Close mobile menu if open
            if (navLinks) {
                navLinks.classList.remove('active');
            }
        }
    });
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.service-card, .pain-card, .stat-card, .pricing-card, .benefit-card, .testimonial-card, .blog-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    observer.observe(el);
});

// Add animation styles dynamically
const style = document.createElement('style');
style.textContent = `
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
        transition: opacity 0.6s ease, transform 0.6s ease;
    }
`;
document.head.appendChild(style);

// Track outbound links (for analytics)
document.querySelectorAll('a[href^="https://calendly"]').forEach(link => {
    link.addEventListener('click', () => {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'click', {
                'event_category': 'outbound',
                'event_label': 'calendly_booking',
                'transport_type': 'beacon'
            });
        }
    });
});

// Form validation helper (for future contact forms)
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Utility: Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Exit Intent Popup
const exitPopup = document.getElementById('exitPopup');
const exitPopupClose = document.getElementById('exitPopupClose');

if (exitPopup) {
    let popupShown = false;

    // Check if popup was already shown this session
    if (sessionStorage.getItem('exitPopupShown')) {
        popupShown = true;
    }

    // Show popup on exit intent (mouse leaving viewport at top)
    document.addEventListener('mouseout', (e) => {
        if (popupShown) return;

        // Only trigger when mouse leaves through top of viewport
        if (e.clientY < 10 && e.relatedTarget === null) {
            showExitPopup();
        }
    });

    // Also show after 45 seconds on page (for mobile/engaged users)
    setTimeout(() => {
        if (!popupShown && window.scrollY > 500) {
            showExitPopup();
        }
    }, 45000);

    function showExitPopup() {
        if (popupShown) return;
        popupShown = true;
        sessionStorage.setItem('exitPopupShown', 'true');
        exitPopup.classList.add('visible');
        document.body.style.overflow = 'hidden';

        // Track popup view
        if (typeof gtag !== 'undefined') {
            gtag('event', 'popup_view', {
                'event_category': 'engagement',
                'event_label': 'exit_intent_popup'
            });
        }
    }

    function closeExitPopup() {
        exitPopup.classList.remove('visible');
        document.body.style.overflow = '';
    }

    // Close on X button
    if (exitPopupClose) {
        exitPopupClose.addEventListener('click', closeExitPopup);
    }

    // Close on overlay click
    exitPopup.addEventListener('click', (e) => {
        if (e.target === exitPopup) {
            closeExitPopup();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && exitPopup.classList.contains('visible')) {
            closeExitPopup();
        }
    });
}

// Console branding
console.log('%cThriveStart', 'color: #c9a227; font-size: 24px; font-weight: bold;');
console.log('%cYour on-demand finance team', 'color: #6b7280; font-size: 14px;');
console.log('%chttps://thrivestart.co', 'color: #0a1628; font-size: 12px;');
