$(function () {

    // Header Scroll
    $(window).scroll(function () {
        if ($(window).scrollTop() >= 60) {
            $("header").addClass("fixed-header");
        } else {
            $("header").removeClass("fixed-header");
        }
    });


    // Featured Owl Carousel
    $('.featured-projects-slider .owl-carousel').owlCarousel({
        center: true,
        loop: true,
        margin: 30,
        nav: false,
        dots: false,
        navElement: 'button type="button"',
        autoplay: true,
        autoplayTimeout: 5000,
        autoplayHoverPause: false,
        responsive: {
            0: {
                items: 1
            },
            600: {
                items: 2
            },
            1000: {
                items: 3
            },
            1200: {
                items: 4
            }
        }
    })


    // Count
    $('.count').each(function () {
		$(this).prop('Counter', 0).animate({
			Counter: $(this).text()
		}, {
			duration: 1000,
			easing: 'swing',
			step: function (now) {
				$(this).text(Math.ceil(now));
			}
		});
	});


    // ScrollToTop
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    const btn = document.getElementById("scrollToTopBtn");
    btn.addEventListener("click", scrollToTop);

    window.onscroll = function () {
        const btn = document.getElementById("scrollToTopBtn");
        if (document.documentElement.scrollTop > 100 || document.body.scrollTop > 100) {
            btn.style.display = "flex";
        } else {
            btn.style.display = "none";
        }
    };


    // Aos
	AOS.init({
		once: true,
	});

    // Nav active state - derived from the first URL segment (/about/, /services/web-development/ ...)
    // so the same header markup can be synced across every page.
    var section = (window.location.pathname.split('/').filter(Boolean)[0] || '').toLowerCase();
    var navKey = {
        '': 'home',
        'index.html': 'home',
        'about': 'about',
        'projects': 'projects',
        'services': 'services',
        'courses': 'courses',
        'internship-pollachi': 'courses',
        'contact': 'contact'
    }[section] || null;
    // Industry and area pages live at the root but belong under Services.
    if (!navKey && /software|website-development|web-design|digital-marketing/.test(section)) {
        navKey = 'services';
    }
    // Pages that are not nav destinations (legal, 404) leave every item inactive.
    $('[data-nav]').removeClass('active').removeAttr('aria-current');
    if (navKey) {
        $('[data-nav="' + navKey + '"]').addClass('active');
    }
    // aria-current only on the link that is this exact page
    var path = window.location.pathname.replace(/index\.html$/, '');
    $('.header a[href="' + path + '"]').attr('aria-current', 'page');

    // Desktop sub-menus: the chevron toggles, Escape and outside clicks close
    var $subs = $('.header-nav .nav-has-sub');
    function closeSubs($except) {
        $subs.not($except).removeClass('is-open').children('.nav-sub-toggle').attr('aria-expanded', 'false');
    }
    $subs.children('.nav-sub-toggle').on('click', function () {
        var $item = $(this).parent();
        var open = !$item.hasClass('is-open');
        closeSubs($item);
        $item.toggleClass('is-open', open).removeClass('is-dismissed');
        $(this).attr('aria-expanded', open ? 'true' : 'false');
    });
    $subs.on('mouseenter', function () {
        $(this).removeClass('is-dismissed');
    });
    $subs.on('mouseleave focusout', function (e) {
        if (e.type === 'mouseleave' || !this.contains(e.relatedTarget)) {
            $(this).removeClass('is-dismissed');
            if (e.type === 'focusout') {
                $(this).removeClass('is-open').children('.nav-sub-toggle').attr('aria-expanded', 'false');
            }
        }
    });
    $(document).on('keydown', function (e) {
        if (e.key !== 'Escape') return;
        var $item = $subs.filter(function () { return this.matches('.is-open, :focus-within, :hover'); });
        if ($item.length) {
            closeSubs();
            $item.addClass('is-dismissed');
            $item.children('.nav-sub-toggle').trigger('focus');
        }
    });
    $(document).on('click', function (e) {
        if (!$(e.target).closest('.nav-has-sub').length) closeSubs();
    });

    // Mobile menu: inside clicks no longer auto-close it, so the X does
    $('.mobile-menu .btn-close').on('click', function () {
        var toggle = document.querySelector('.header .toggle-menu');
        if (toggle && window.bootstrap) bootstrap.Dropdown.getOrCreateInstance(toggle).hide();
    });
    // Open the sub-list that holds the current page
    $('.mobile-sub a[aria-current="page"]').closest('.collapse').addClass('show')
        .each(function () {
            $('[data-bs-target="#' + this.id + '"]').removeClass('collapsed').attr('aria-expanded', 'true');
        });

});