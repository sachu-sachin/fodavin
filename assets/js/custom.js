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
        'contact': 'contact'
    }[section] || null;
    // Pages that are not nav destinations (legal, 404) leave every item inactive.
    $('[data-nav]').removeClass('active').removeAttr('aria-current');
    if (navKey) {
        $('[data-nav="' + navKey + '"]').addClass('active').attr('aria-current', 'page');
    }

});