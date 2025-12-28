/**
 * Templo de Umbanda Guardião da Luz
 * Main JavaScript File
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    initNavigation();
    initScrollEffects();
    initParticles();
    initOrixasFilter();
    initScrollAnimations();
    initSmoothScroll();
    initCookieConsent();
    initPrivacyModal();
    initGiraSelector();
});

/**
 * Sidebar Navigation Module
 */
function initNavigation() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarLinks = document.querySelectorAll('.sidebar__link');

    // Toggle sidebar
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            if (window.innerWidth >= 1100) {
                // Desktop: toggle expand/collapse
                toggleSidebarDesktop();
            } else {
                // Mobile: toggle open/close
                const isActive = sidebar.classList.contains('active');
                if (isActive) {
                    closeSidebarMobile();
                } else {
                    openSidebarMobile();
                }
            }
        });
    }

    // Close sidebar when clicking overlay (mobile only)
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebarMobile);
    }

    // Close sidebar when clicking on a link (mobile only)
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Only close on mobile
            if (window.innerWidth < 1100) {
                closeSidebarMobile();
            }

            // Update active state
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Close sidebar with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (window.innerWidth >= 1100) {
                collapseSidebarDesktop();
            } else if (sidebar.classList.contains('active')) {
                closeSidebarMobile();
            }
        }
    });

    // Update active link on scroll
    window.addEventListener('scroll', updateActiveNavLink);

    // Desktop: Toggle expand/collapse
    function toggleSidebarDesktop() {
        const isExpanded = sidebar.classList.contains('expanded');
        if (isExpanded) {
            collapseSidebarDesktop();
        } else {
            expandSidebarDesktop();
        }
    }

    function expandSidebarDesktop() {
        sidebar.classList.add('expanded');
        sidebarToggle.classList.add('expanded');
        document.body.classList.add('sidebar-expanded');
    }

    function collapseSidebarDesktop() {
        sidebar.classList.remove('expanded');
        sidebarToggle.classList.remove('expanded');
        document.body.classList.remove('sidebar-expanded');
    }

    // Mobile: Open/close sidebar
    function openSidebarMobile() {
        sidebar.classList.add('active');
        sidebarToggle.classList.add('active');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebarMobile() {
        sidebar.classList.remove('active');
        sidebarToggle.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Update active navigation link based on scroll position
 */
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const sidebarLinks = document.querySelectorAll('.sidebar__link');
    const scrollPosition = window.pageYOffset + 150;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            sidebarLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

/**
 * Scroll Effects Module
 */
function initScrollEffects() {
    // Parallax effect for hero section
    const hero = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero__content');

    if (hero && heroContent) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * 0.3;

            if (scrolled < window.innerHeight) {
                heroContent.style.transform = `translateY(${rate}px)`;
                heroContent.style.opacity = 1 - (scrolled / window.innerHeight) * 0.5;
            }
        });
    }
}

/**
 * Particles Animation Module
 */
function initParticles() {
    const particlesContainer = document.getElementById('particles');

    if (!particlesContainer) return;

    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        createParticle(particlesContainer);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    // Random position
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;

    // Random size
    const size = Math.random() * 4 + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    // Random animation delay
    particle.style.animationDelay = `${Math.random() * 15}s`;

    // Random animation duration
    particle.style.animationDuration = `${Math.random() * 10 + 10}s`;

    // Random opacity
    particle.style.opacity = Math.random() * 0.5 + 0.2;

    container.appendChild(particle);
}

/**
 * Orixás Filter Module
 */
function initOrixasFilter() {
    const filterBtns = document.querySelectorAll('.filter__btn');
    const orixaCards = document.querySelectorAll('.orixa__card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;

            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter cards
            orixaCards.forEach(card => {
                const genero = card.dataset.genero;

                if (filter === 'todos' || genero === filter) {
                    card.classList.remove('hidden');
                    card.style.animation = 'fadeInUp 0.5s ease forwards';
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });
}

/**
 * Scroll Animations Module
 */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll(
        '.sobre__card, .fundamento__card, .trono__card, .orixa__card, .linha__card, .dia__card, .sacerdote__card, .teologia__card, .hierarquia__card, .ritual__card, .elemento__card, .ponto__card, .etica__card, .glossario__item, .timeline__item'
    );

    // Add animation class to elements
    animatedElements.forEach(el => {
        el.classList.add('animate-on-scroll');
    });

    // Create intersection observer
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all animated elements
    animatedElements.forEach(el => {
        observer.observe(el);
    });
}

/**
 * Smooth Scroll Module
 */
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');

            if (href === '#') return;

            e.preventDefault();

            const target = document.querySelector(href);

            if (target) {
                const headerHeight = document.getElementById('header').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Utility Functions
 */

// Debounce function for performance
function debounce(func, wait = 20) {
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

// Throttle function for scroll events
function throttle(func, limit = 100) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Trono Card Hover Effect
 */
document.querySelectorAll('.trono__card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-10px) scale(1.02)';
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
    });
});

/**
 * Orixa Card Click to Expand (Mobile)
 */
if (window.innerWidth <= 768) {
    document.querySelectorAll('.orixa__card').forEach(card => {
        const body = card.querySelector('.orixa__body');

        card.addEventListener('click', () => {
            const isExpanded = card.classList.contains('expanded');

            // Close all other cards
            document.querySelectorAll('.orixa__card.expanded').forEach(c => {
                if (c !== card) {
                    c.classList.remove('expanded');
                }
            });

            // Toggle current card
            card.classList.toggle('expanded');
        });
    });
}

/**
 * Counter Animation for Stats (if needed in future)
 */
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);

    const timer = setInterval(() => {
        start += increment;
        element.textContent = Math.floor(start);

        if (start >= target) {
            element.textContent = target;
            clearInterval(timer);
        }
    }, 16);
}

/**
 * Lazy Loading Images
 */
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

/**
 * Keyboard Navigation Support
 */
document.addEventListener('keydown', (e) => {
    // ESC key closes mobile menu
    if (e.key === 'Escape') {
        const navMenu = document.getElementById('nav-menu');
        if (navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
});

/**
 * Focus Management for Accessibility
 */
const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function trapFocus(element) {
    const focusable = element.querySelectorAll(focusableElements);
    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    element.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            if (e.shiftKey && document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            } else if (!e.shiftKey && document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    });
}

/**
 * Print functionality
 */
function printPage() {
    window.print();
}

/**
 * Share functionality (if social sharing is needed)
 */
function shareContent(platform) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);

    const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
        twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
        whatsapp: `https://api.whatsapp.com/send?text=${title} ${url}`,
        telegram: `https://t.me/share/url?url=${url}&text=${title}`
    };

    if (shareUrls[platform]) {
        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
}

/**
 * Theme Toggle (for future dark/light mode)
 */
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Load saved theme preference
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
}

// Initialize theme on load
loadTheme();

/**
 * Service Worker Registration (for PWA support in future)
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment when you have a service worker file
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered'))
        //     .catch(error => console.log('SW registration failed'));
    });
}

/**
 * Cookie Consent Module (LGPD)
 */
function initCookieConsent() {
    const cookieBanner = document.getElementById('cookie-banner');
    const acceptBtn = document.getElementById('accept-cookies');
    const declineBtn = document.getElementById('decline-cookies');

    if (!cookieBanner) return;

    // Check if user already made a choice
    const cookieConsent = localStorage.getItem('cookieConsent');

    if (!cookieConsent) {
        // Show banner after a short delay
        setTimeout(() => {
            cookieBanner.classList.add('active');
        }, 1000);
    }

    // Accept cookies
    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'accepted');
            localStorage.setItem('cookieConsentDate', new Date().toISOString());
            cookieBanner.classList.remove('active');
        });
    }

    // Decline cookies
    if (declineBtn) {
        declineBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'declined');
            localStorage.setItem('cookieConsentDate', new Date().toISOString());
            cookieBanner.classList.remove('active');

            // Clear any non-essential cookies/storage
            clearNonEssentialData();
        });
    }
}

/**
 * Clear non-essential data when cookies are declined
 */
function clearNonEssentialData() {
    // Remove theme preference (non-essential)
    localStorage.removeItem('theme');

    // Note: We cannot remove third-party cookies (Google Fonts, Maps)
    // Those are handled by the browser's cookie settings
}

/**
 * Privacy Modal Module
 */
function initPrivacyModal() {
    const modal = document.getElementById('privacy-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');
    const privacyLinks = document.querySelectorAll('#privacy-link, #cookie-privacy-link, #terms-link');

    if (!modal) return;

    // Open modal when clicking privacy/terms links
    privacyLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    });

    // Close modal
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
    }

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    function openModal() {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // Focus on close button
        setTimeout(() => {
            modalClose.focus();
        }, 100);
    }

    function closeModal() {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }
}

/**
 * Gira Selector Module
 */
function initGiraSelector() {
    const giraBtns = document.querySelectorAll('.gira__btn');
    const giraContainers = document.querySelectorAll('.gira__container');

    if (!giraBtns.length) return;

    giraBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const giraType = btn.dataset.gira;

            // Update active button
            giraBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show corresponding gira container
            giraContainers.forEach(container => {
                container.classList.remove('active');
                if (container.id === `gira-${giraType}`) {
                    container.classList.add('active');
                }
            });
        });
    });

    // Add animation to timeline items on scroll
    const timelineItems = document.querySelectorAll('.timeline__item');

    if (timelineItems.length && 'IntersectionObserver' in window) {
        const timelineObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Add staggered animation delay
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateX(0)';
                    }, index * 100);
                    timelineObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        timelineItems.forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
            item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            timelineObserver.observe(item);
        });
    }

    // Back buttons functionality
    const voltarBtns = document.querySelectorAll('[data-voltar-gira]');
    const seletor = document.querySelector('.cronologia__seletor');

    voltarBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Hide all gira containers
            giraContainers.forEach(container => {
                container.classList.remove('active');
            });

            // Remove active from all buttons
            giraBtns.forEach(b => b.classList.remove('active'));

            // Scroll to selector with smooth animation
            if (seletor) {
                seletor.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

                // Add a highlight effect to selector
                seletor.style.animation = 'pulseHighlight 1s ease';
                setTimeout(() => {
                    seletor.style.animation = '';
                }, 1000);
            }
        });
    });
}

/**
 * Console Easter Egg
 */
console.log('%c🙏 Saravá! %cBem-vindo ao Templo de Umbanda Guardião da Luz!',
    'color: #d4af37; font-size: 24px; font-weight: bold;',
    'color: #1a1a2e; font-size: 14px;'
);
console.log('%cQue Oxalá abençoe a todos!',
    'color: #d4af37; font-size: 16px; font-style: italic;'
);
