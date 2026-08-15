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

    // Nav active state - derived from the current filename so the same
    // header markup can be synced across every page.
    var page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    var navKey = null;
    if (page === '' || page.indexOf('index') === 0) {
        navKey = 'home';
    } else if (page.indexOf('about') === 0) {
        navKey = 'about';
    } else if (page.indexOf('project') === 0) {
        navKey = 'projects';
    } else if (page.indexOf('contact') === 0) {
        navKey = 'contact';
    } else if (page.indexOf('services') === 0) {
        navKey = 'services';
    }
    // Pages that are not nav destinations (legal, 404) leave every item inactive.
    $('[data-nav]').removeClass('active').removeAttr('aria-current');
    if (navKey) {
        $('[data-nav="' + navKey + '"]').addClass('active').attr('aria-current', 'page');
    }

});