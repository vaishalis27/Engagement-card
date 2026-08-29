// Interaction layer for Vaishali & Abhinav's Engagement Invitation
// (The live 3D backdrop itself lives in scene.js)

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. Sound Effects Registry
    // ==========================================
    const sfxOpen = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav');
    const sfxSuccess = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav');
    sfxOpen.volume = 0.5;
    sfxSuccess.volume = 0.5;

    // ==========================================
    // 2. Entrance Overlay & Audio Engine
    // ==========================================
    const envelope = document.getElementById('envelope');
    const enterBtn = document.getElementById('wax-seal');
    const body = document.body;
    const slokaAudio = document.getElementById('sloka-audio');
    const bgMusic = document.getElementById('bg-music');
    const soundToggle = document.getElementById('sound-toggle');
    const soundHint = document.getElementById('sound-hint');
    let audioMuted = false;
    let audioUnlocked = false;

    function setAudioMuted(muted) {
        audioMuted = muted;
        if (slokaAudio) slokaAudio.muted = muted;
        if (bgMusic) bgMusic.muted = muted;
        if (soundToggle) {
            soundToggle.classList.toggle('muted', muted);
            soundToggle.setAttribute('aria-pressed', String(muted));
            soundToggle.setAttribute('aria-label', muted ? 'Unmute music' : 'Mute music');
        }
    }

    // Try playing sloka when cover is visible
    function attemptPlaySloka() {
        if (!slokaAudio || audioMuted) return;
        if (!envelope || !envelope.classList.contains('opened')) {
            if (slokaAudio.paused) {
                slokaAudio.volume = 0.55;
                const promise = slokaAudio.play();
                if (promise !== undefined) {
                    promise.then(() => {
                        if (soundHint) soundHint.style.opacity = '0';
                    }).catch(() => {
                        // Browsers block autoplay until user gesture
                    });
                }
            }
        }
    }

    // Comprehensive unlock function triggered by any touch/click/key gesture
    function unlockAndPlayAudio(e) {
        if (!audioUnlocked) {
            audioUnlocked = true;
            if (slokaAudio) slokaAudio.load();
            if (bgMusic) bgMusic.load();
        }

        // Avoid triggering audio play logic if clicking wax seal button directly
        if (e && e.target && e.target.closest('#wax-seal')) return;

        attemptPlaySloka();
    }

    // Attempt autoplay immediately
    attemptPlaySloka();

    // Listen to touch/pointer/click gestures across window & cover for browser audio unlock
    const userActivationEvents = ['touchstart', 'touchend', 'click', 'pointerdown', 'keydown'];
    userActivationEvents.forEach((evt) => {
        if (envelope) envelope.addEventListener(evt, unlockAndPlayAudio, { passive: true });
        document.addEventListener(evt, () => {
            if (!audioUnlocked) {
                audioUnlocked = true;
                if (slokaAudio) slokaAudio.load();
                if (bgMusic) bgMusic.load();
            }
        }, { once: true, passive: true });
    });

    if (enterBtn && envelope) {
        enterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sfxOpen.play().catch(() => {});
            if (slokaAudio) {
                slokaAudio.pause();
            }
            if (bgMusic && !audioMuted) {
                bgMusic.volume = 0.45;
                bgMusic.muted = audioMuted;
                bgMusic.currentTime = 0;
                bgMusic.play().catch(() => {});
            }
            envelope.classList.add('opened');
            body.classList.remove('locked');
            initScrollObserver();
            updateScrollProgress();
        });
    }

    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            setAudioMuted(!audioMuted);
        });
    }

    // ==========================================
    // 4. 3D Parallax Tilting Glass Cards (CSS)
    // ==========================================
    const heroCard = document.querySelector('.hero-card');
    const envContainer = document.querySelector('.envelope-container');
    const isMobile = window.matchMedia('(max-width: 900px)').matches;

    function attachTilt(el, strengthX, strengthY) {
        if (!el) return;
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const xc = rect.width / 2;
            const yc = rect.height / 2;
            const rotateX = (yc - y) / strengthX;
            const rotateY = (x - xc) / strengthY;
            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        });
    }

    const rsvpWrapper = document.querySelector('.rsvp-wrapper');
    const eventCards = document.querySelectorAll('.event-card');

    if (!isMobile) {
        attachTilt(heroCard, 28, 32);
        attachTilt(envContainer, 20, 24);
        attachTilt(rsvpWrapper, 50, 60);
        eventCards.forEach((card) => attachTilt(card, 55, 65));
    }

    // ==========================================
    // 3b. Hero background video — pause for reduced-motion users
    // ==========================================
    const heroVideo = document.getElementById('hero-video');
    if (heroVideo && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        heroVideo.pause();
        heroVideo.removeAttribute('autoplay');
    }

    // ==========================================
    // 4a. Hero interactivity — "&" confetti burst + Add to Calendar
    // ==========================================
    const heroAmp = document.getElementById('hero-amp');
    if (heroAmp) {
        const burstAmp = () => {
            heroAmp.classList.remove('pulse');
            void heroAmp.offsetWidth;
            heroAmp.classList.add('pulse');

            if (typeof confetti === 'function') {
                const rect = heroAmp.getBoundingClientRect();
                confetti({
                    particleCount: 36,
                    spread: 60,
                    startVelocity: 20,
                    gravity: 0.9,
                    scalar: 0.7,
                    ticks: 150,
                    origin: {
                        x: (rect.left + rect.width / 2) / window.innerWidth,
                        y: (rect.top + rect.height / 2) / window.innerHeight,
                    },
                    colors: ['#d9821a', '#f4c65a', '#9c6f14', '#fbe8b8'],
                });
            }
        };
        heroAmp.addEventListener('click', burstAmp);
        heroAmp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                burstAmp();
            }
        });
    }

    const addCalendarBtn = document.getElementById('add-calendar-btn');
    if (addCalendarBtn) {
        addCalendarBtn.addEventListener('click', () => {
            const icsContent = [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                'PRODID:-//Vaishali & Abhinav Engagement//EN',
                'BEGIN:VEVENT',
                'UID:' + Date.now() + '@vaishali-abhinav-engagement',
                'DTSTAMP:20260101T000000Z',
                'DTSTART:20261012T050000Z',
                'DTEND:20261012T163000Z',
                'SUMMARY:Vaishali & Abhinav\'s Engagement Ceremony',
                'DESCRIPTION:Join us as we celebrate the engagement of Vaishali Singh and Abhinav Singh Chauhan.',
                'LOCATION:Hotel Damson Plum, Lucknow',
                'END:VEVENT',
                'END:VCALENDAR',
            ].join('\r\n');

            const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'Vaishali-Abhinav-Engagement.ics';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
    }

    // ==========================================
    // 4c. 3D Flip Cards — tap/click an event card to reveal
    // dress code, notes, and the map link on the reverse face.
    // ==========================================
    eventCards.forEach((card) => {
        const toggleFlip = (e) => {
            if (e.target.closest('a')) return;
            card.classList.toggle('flipped');
        };
        card.addEventListener('click', toggleFlip);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.classList.toggle('flipped');
            }
        });
    });

    // ==========================================
    // 4b. Cursor-Follow Spotlight on Glass Cards
    // ==========================================
    document.querySelectorAll('.spotlight').forEach((card) => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const mx = ((e.clientX - rect.left) / rect.width) * 100;
            const my = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty('--mx', `${mx}%`);
            card.style.setProperty('--my', `${my}%`);
        });
    });

    // ==========================================
    // 5. Mobile Navigation Toggle
    // ==========================================
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('open');
            navMenu.classList.toggle('open');
        });

        navMenu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                mobileToggle.classList.remove('open');
                navMenu.classList.remove('open');
            });
        });
    }

    // ==========================================
    // 6. Scroll Progress Ring
    // ==========================================
    const progressBar = document.getElementById('scroll-progress-bar');
    const CIRCUMFERENCE = 119.4;

    function updateScrollProgress() {
        if (!progressBar) return;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        progressBar.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - progress));
    }
    window.addEventListener('scroll', updateScrollProgress, { passive: true });

    // ==========================================
    // 7. Countdown Timer
    // ==========================================
    const targetDate = new Date('October 12, 2026 14:30:00').getTime();

    function updateCountdown() {
        const now = new Date().getTime();
        const difference = targetDate - now;

        const daysElement = document.getElementById('days');
        const hoursElement = document.getElementById('hours');
        const minutesElement = document.getElementById('minutes');
        const secondsElement = document.getElementById('seconds');

        if (difference < 0) {
            const countdownContainer = document.getElementById('countdown');
            if (countdownContainer) {
                countdownContainer.innerHTML = "<div class='event-active-label' style='color: var(--accent-light); font-family: var(--font-display); font-style: italic; font-weight: 500; letter-spacing: 1px;'>The Celebrations Have Begun!</div>";
            }
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        if (daysElement) daysElement.innerText = days.toString().padStart(2, '0');
        if (hoursElement) hoursElement.innerText = hours.toString().padStart(2, '0');
        if (minutesElement) minutesElement.innerText = minutes.toString().padStart(2, '0');
        if (secondsElement) secondsElement.innerText = seconds.toString().padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);

    // ==========================================
    // 8. Scroll Reveal Observer
    // ==========================================
    function initScrollObserver() {
        const revealElements = document.querySelectorAll('.fade-in-up');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

        revealElements.forEach((element) => observer.observe(element));
    }

    // ==========================================
    // 9. Scroll Cue (hero) — smooth scroll to the Celebration
    // ==========================================
    const scrollCue = document.getElementById('scroll-cue');
    if (scrollCue) {
        scrollCue.addEventListener('click', () => {
            document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // ==========================================
    // 10. RSVP Form Handling
    // ==========================================
    const rsvpForm = document.getElementById('rsvp-form');
    const RSVP_WHATSAPP_NUMBER = '917800005080';

    if (rsvpForm) {
        rsvpForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('rsvp-name').value.trim();
            const guests = parseInt(document.getElementById('rsvp-guests').value, 10);
            const guestWord = guests === 1 ? 'guest' : 'guests';

            const rsvpEntry = {
                name, guests,
                timestamp: new Date().toISOString(),
            };

            const currentRSVPs = JSON.parse(localStorage.getItem('engagement_rsvps')) || [];
            currentRSVPs.push(rsvpEntry);
            localStorage.setItem('engagement_rsvps', JSON.stringify(currentRSVPs));

            const whatsappMessage = `This is *${name}* confirming my RSVP for your engagement ceremony on 12th October 2026.\nNumber of ${guestWord}: *${guests}*\n\nLooking forward to celebrating with you!`;
            const whatsappUrl = `https://wa.me/${RSVP_WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;
            window.open(whatsappUrl, '_blank', 'noopener');

            sfxSuccess.play().catch(() => {});

            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ['#d9821a', '#f4c65a', '#9c6f14', '#fbe8b8'],
                });
            }

            showFeedbackModal(name, guests);

            rsvpForm.reset();
        });
    }

    function showFeedbackModal(name, guests) {
        const guestWord = guests === 1 ? 'guest' : 'guests';
        const messageText = `Thanks, ${name}! We've opened WhatsApp with your RSVP for ${guests} ${guestWord} pre-filled — just hit send there to confirm with us. See you in Lucknow!`;

        const modal = document.createElement('div');
        modal.className = 'feedback-modal';
        modal.innerHTML = `
            <div class="feedback-box">
                <div class="feedback-icon">✦</div>
                <h3>Almost there!</h3>
                <p>${messageText}</p>
                <button type="button" class="submit-btn feedback-close">Close</button>
            </div>
        `;
        document.body.appendChild(modal);

        requestAnimationFrame(() => modal.classList.add('active'));

        modal.querySelector('.feedback-close').addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        });
    }
});
