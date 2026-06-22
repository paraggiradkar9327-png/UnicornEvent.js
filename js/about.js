/* ═══════════════════════════════════════════════════
   HOW WE WORK · how-we-work.js
   Unicorn Events — all content + interaction logic
   ═══════════════════════════════════════════════════ */

(function () {

    var COPY = {
        eyebrow: 'Our Process',
        heading: 'How We <em>Work</em>',

        deliverablesLabel: 'Key Deliverables'
    };

    var STEPS = [
        {
            trackLabel: 'Brief', cardNum: '01', cardTag: 'Discovery', cardTitle: 'The Brief',
            cardDesc: 'We immerse ourselves in your world — your brand, audience, ambitions, and budget. We ask the questions others skip.',
            cardPills: ['Brand Audit', 'Goal Setting', 'Budget Scoping'],
            detailLabel: 'Discovery',
            detailText: "Every great event starts with listening. We immerse ourselves in your world — your brand, your audience, your ambitions, and your budget. We ask the questions others skip, because the brief isn't just what you want. It's who you are.",
            deliverables: ['Client intake meeting', 'Brand & audience analysis', 'Objectives framework', 'Budget allocation plan']
        },
        {
            trackLabel: 'Concept', cardNum: '02', cardTag: 'Ideation', cardTitle: 'The Concept',
            cardDesc: 'Bold, original concepts tailored to your objectives. Mood boards, theme directions, and experience blueprints that make the vision vivid.',
            cardPills: ['Mood Boards', 'Theme Direction', 'Experience Map'],
            detailLabel: 'Ideation',
            detailText: "This is where imagination takes over. Our creative team develops bold, original concepts tailored specifically to your objectives — mood boards, theme directions, and experience blueprints that give you a vivid picture of what's possible.",
            deliverables: ['Creative concept deck', 'Mood board presentation', 'Theme direction options', 'Experience blueprint']
        },
        {
            trackLabel: 'Plan', cardNum: '03', cardTag: 'Strategy', cardTitle: 'The Plan',
            cardDesc: 'A meticulous master plan — venues, vendors, logistics, timelines, and contingencies. Every moving part accounted for before day one.',
            cardPills: ['Venue Selection', 'Run-of-Show', 'Risk Planning'],
            detailLabel: 'Strategy',
            detailText: 'Creativity without structure is chaos. Once your concept is approved, our production team builds a meticulous master plan — venue, vendors, logistics, timelines, and contingencies — so every moving part is accounted for well before day one.',
            deliverables: ['Master production plan', 'Venue shortlist & selection', 'Vendor contracts', 'Risk & contingency register']
        },
        {
            trackLabel: 'Build', cardNum: '04', cardTag: 'Production', cardTitle: 'The Build',
            cardDesc: 'Stage construction, lighting rigs, décor, digital displays — our team transforms empty spaces into immersive worlds with surgical precision.',
            cardPills: ['Set Construction', 'AV & Lighting', 'Tech Rehearsals'],
            detailLabel: 'Production',
            detailText: 'From stage construction to lighting rigs, from décor to digital displays — our on-ground team transforms empty spaces into immersive worlds. We manage every contractor and every cue with surgical precision so nothing is left to chance.',
            deliverables: ['Set & stage build', 'AV & lighting installation', 'Décor & branding setup', 'Full technical rehearsal']
        },
        {
            trackLabel: 'Event', cardNum: '05', cardTag: 'Execution', cardTitle: 'The Event',
            cardDesc: 'Our directors command the floor with calm authority. You stay present and relaxed. We handle everything behind the scenes — invisibly, flawlessly.',
            cardPills: ['On-Site Direction', 'Guest Experience', 'Live Coordination'],
            detailLabel: 'Execution',
            detailText: 'Showtime. Our event directors command the floor with calm authority, orchestrating every moment from guest arrival to final curtain call. You stay present, relaxed, and fully in the moment. We handle everything invisibly behind the scenes.',
            deliverables: ['On-site event direction', 'Guest experience management', 'Live crew coordination', 'Real-time crisis response']
        },
        {
            trackLabel: 'Legacy', cardNum: '06', cardTag: 'Delivery', cardTitle: 'The Legacy',
            cardDesc: "The event ends. The impact doesn't. Full post-event review, media docs, audience insights, and a debrief that shapes your next extraordinary experience.",
            cardPills: ['Post-Event Report', 'Media Docs', 'Audience Insights'],
            detailLabel: 'Delivery',
            detailText: "The event ends. The impact doesn't. We provide a full post-event review, media documentation, audience feedback reports, and a debrief session — giving you measurable proof of success and insights that shape your next extraordinary experience.",
            deliverables: ['Post-event impact report', 'Professional media package', 'Audience feedback analysis', 'Strategic next-steps brief']
        }
    ];

    var STATS = [


    ];

    var active = 0;

    /* ── BUILD ── */

    function buildHeader() {
        document.getElementById('hwa-eyebrow').textContent = COPY.eyebrow;
        document.getElementById('hwa-heading').innerHTML = COPY.heading;
        document.getElementById('hwa-intro').textContent = COPY.intro;
        document.getElementById('hwa-detail-deliverables-heading').textContent = COPY.deliverablesLabel;
    }

    function buildTrack() {
        var html = '';
        for (var i = 0; i < STEPS.length; i++) {
            html += '<div class="hwa-track-item">';
            /* button — always receives clicks regardless of siblings */
            html += '<button class="hwa-dot-wrap' + (i === 0 ? ' active' : '') + '" data-step="' + i + '" type="button">';
            html += '<div class="hwa-dot"></div>';
            html += '<span class="hwa-dot-label">' + STEPS[i].trackLabel + '</span>';
            html += '</button>';
            /* connector is a visual-only sibling, not inside the button */
            if (i < STEPS.length - 1) {
                html += '<div class="hwa-connector"><div class="hwa-connector-fill" id="hwa-fill-' + i + '"></div></div>';
            }
            html += '</div>';
        }
        document.getElementById('hwa-track').innerHTML = html;
    }

    function buildCards() {
        var html = '';
        for (var i = 0; i < STEPS.length; i++) {
            var s = STEPS[i];
            html += '<div class="hwa-card' + (i === 0 ? ' active' : '') + '" data-card="' + i + '">';
            html += '<div class="hwa-card-num">' + s.cardNum + '</div>';
            html += '<div class="hwa-card-tag">' + s.cardTag + '</div>';
            html += '<h3 class="hwa-card-title">' + s.cardTitle + '</h3>';
            html += '<div class="hwa-card-rule"></div>';
            html += '<p class="hwa-card-desc">' + s.cardDesc + '</p>';
            html += '<div class="hwa-card-pills">';
            for (var j = 0; j < s.cardPills.length; j++) {
                html += '<span class="hwa-cpill">' + s.cardPills[j] + '</span>';
            }
            html += '</div></div>';
        }
        document.getElementById('hwa-cards-track').innerHTML = html;
    }

    function buildFooter() {
        var html = '';
        for (var i = 0; i < STATS.length; i++) {
            html += '<div class="hwa-stat">';
            html += '<span class="hwa-stat-n">' + STATS[i].number + '</span>';
            html += '<div class="hwa-stat-rule"></div>';
            html += '<span class="hwa-stat-label">' + STATS[i].label + '</span>';
            html += '</div>';
        }
        document.getElementById('hwa-footer').innerHTML = html;
    }

    /* ── SLIDE ── */


    function slideToStep(i) {
        var rail = document.getElementById('hwa-rail-wrap');
        var track = document.getElementById('hwa-cards-track');
        if (!rail || !track) return;

        var isMobile = window.innerWidth <= 768;
        var isTablet = window.innerWidth <= 1024;
        var vis = isMobile ? 1 : (isTablet ? 2 : 3);
        var gap = isMobile ? 0 : 18;
        var style = window.getComputedStyle(rail);
        var w = rail.offsetWidth
            - parseFloat(style.paddingLeft)
            - parseFloat(style.paddingRight);
        var cw = isMobile ? w : (w - gap * (vis - 1)) / vis;
        var max = STEPS.length - vis;

        // On mobile: slide by exact card width (no gap)
        // On desktop: centre the active card in the visible window
        var off = isMobile
            ? i
            : Math.max(0, Math.min(i - Math.floor(vis / 2), max));

        track.style.transform = 'translateX(-' + (off * (cw + gap)) + 'px)';
    }

    /* ── SET ACTIVE ── */

    function setActive(i) {
        active = i;

        /* dots */
        var dots = document.querySelectorAll('.hwa-dot-wrap');
        for (var d = 0; d < dots.length; d++) {
            dots[d].classList.toggle('active', parseInt(dots[d].getAttribute('data-step'), 10) === i);
        }

        /* connector fills */
        var fills = document.querySelectorAll('.hwa-connector-fill');
        for (var f = 0; f < fills.length; f++) {
            fills[f].style.width = f < i ? '100%' : '0%';
        }

        /* cards */
        var cards = document.querySelectorAll('.hwa-card');
        for (var c = 0; c < cards.length; c++) {
            cards[c].classList.toggle('active', parseInt(cards[c].getAttribute('data-card'), 10) === i);
        }

        /* slide */
        slideToStep(i);

        /* detail panel */
        var s = STEPS[i];
        document.getElementById('hwa-detail-label').textContent = s.detailLabel;
        document.getElementById('hwa-detail-text').textContent = s.detailText;
        var listHTML = '';
        for (var li = 0; li < s.deliverables.length; li++) {
            listHTML += '<li>' + s.deliverables[li] + '</li>';
        }
        document.getElementById('hwa-detail-list').innerHTML = listHTML;
        document.getElementById('hwa-detail-panel').classList.add('open');
    }

    /* ── BIND EVENTS ── */

    function bindEvents() {
        /* dots — use IIFE to capture correct index in loop */
        var dots = document.querySelectorAll('.hwa-dot-wrap');
        for (var d = 0; d < dots.length; d++) {
            (function (btn) {
                btn.addEventListener('click', function () {
                    setActive(parseInt(btn.getAttribute('data-step'), 10));
                });
            })(dots[d]);
        }

        /* cards */
        var cards = document.querySelectorAll('.hwa-card');
        for (var c = 0; c < cards.length; c++) {
            (function (card) {
                card.addEventListener('click', function () {
                    setActive(parseInt(card.getAttribute('data-card'), 10));
                });
            })(cards[c]);
        }

        /* prev / next */
        document.getElementById('hwa-btn-prev').addEventListener('click', function () {
            if (active > 0) setActive(active - 1);
        });
        document.getElementById('hwa-btn-next').addEventListener('click', function () {
            if (active < STEPS.length - 1) setActive(active + 1);
        });

        /* resize */
        window.addEventListener('resize', function () { slideToStep(active); });
    }

    /* ── INIT ── */

    function init() {
        buildHeader();
        buildTrack();
        buildCards();
        buildFooter();
        bindEvents();
        requestAnimationFrame(function () { setActive(0); });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();