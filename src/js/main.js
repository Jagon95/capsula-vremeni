import 'babel-polyfill';
import 'picturefill';
import 'imports-loader?jQuery=>$!owl.carousel';
import 'jquery-parallax.js';
import 'waypoints';
import Headhesive from 'headhesive';
import 'bootstrap/collapse';
import 'semantic/components/transition';
import 'semantic/components/dimmer';
import 'semantic/components/modal';
import 'semantic/components/embed';
import 'semantic/components/dropdown';
import './embedSources';
import products from 'data/product';
import _photos from 'data/photos';
import pay from 'exports-loader?pay!./tinkoff';
import Raven from 'raven-js';
import ShoppingCart from 'js/shoppingCart'
import Order from 'js/Order'
import help from 'js/helpers'

Raven
    .config(settings.sentry.id, settings.sentry.options)
    .install();

$.fn.owlCarousel.Constructor.prototype.preloadAutoWidthImages = function(images) {
    const owl = this;

    function onLoadImg(e) {
        this.attr('src', e.target.src);
        this.css('opacity', 1);
        owl.leave('pre-loading');
        !owl.is('pre-loading') && !owl.is('initializing') && owl.refresh();
    }

    function loadImg($el) {
        owl.enter('pre-loading');
        return $(new Image()).attr('src', $el.attr('src')
            || $el.attr('data-src')
            || $el.attr('data-src-retina'));
    }

    function loadAfter($el, $prev) { // todo process loading fails
        if ($prev.offset().left + $prev.width() < $(window).width()) {
            loadImg($el).one('load', $.proxy(onLoadImg, $el));
        } else {
            owl.$element.one('translated.owl.carousel resized.owl.carousel',
                () => loadAfter($el, $prev));
        }
    }

    images.slice(0, owl.settings.items).each($.proxy(function(i, element) {
        let $el = $(element);
        loadImg($el).one('load', $.proxy(onLoadImg, $el));
    }));

    for (let i = owl.settings.items; i < images.length; ++i) {
        let $el = $(images.get(i));
        let $prev = $(images.get(i - 1));
        $prev.one('load', () => {
            loadAfter($el, $prev);
        });
    }
};

function startApp() {
    help.prepareData(products);

    if (!help.isMobile()) {
        $('.titanium-capsule-parallax:first').removeClass('d-none').waypoint(Raven.wrap(function() {
            if (!this.isCalled) {
                this.isCalled = true;
                let $el = $(this.element);
                $($el.find('.titanium-capsule-parallax__template', $el).remove().html())
                    .appendTo($el.find('.titanium-capsule-parallax__wrapper'));
                $el.find('img').on('load', () => {
                    $(window).trigger('resize');
                });
                $(this.element).parallax({
                    speed: .7,
                    bleed: 50,
                    sliderSelector: '>.titanium-capsule-parallax__wrapper',
                });
                this.destroy();
            }
        }), settings.waypoint.pageSettings);

        $('.events__page:first').removeClass('d-none').waypoint(Raven.wrap(function() {
            if (!this.isCalled) {
                this.isCalled = true;
                console.log('init Events');
                const carousel = $('.events__carousel', this.element).owlCarousel({
                    loop: true,
                    autoplay: true,
                    autoplayTimeout: 4000,
                    lazyLoad: true,
                    responsive: {
                        0: {
                            items: 1,
                        },
                        768: {
                            items: 2,
                        },
                        1280: {
                            items: 3,
                        },
                    },
                    onInitialized: help.refreshWaypoints,
                });

                const calculateImageOffset = ($el, items) => { // todo remove duplication
                    if ($el.width() / $(document).width() * items > 1.2) {
                        $el.css('transform', `translateX(${($(document).width()
                            / items - $el.width()) / 2}px)`);
                    } else {
                        $el.css('transform', '');
                    }
                };

                carousel.on('loaded.owl.lazy', (event) => {
                    calculateImageOffset(event.element, event.page.size);
                    console.log(event);
                });

                carousel.on('resize.owl.carousel', function(event) {
                    let $el = $(this);
                    $el.find('.clients__image[src]').each(function() {
                        calculateImageOffset($(this), event.page.size);
                    });
                });


                this.destroy();
            }
        }), settings.waypoint.pageSettings);
    }

    new Headhesive('.menu-header__wrapper', {
        offset: '#introduction',
        offsetSide: 'bottom',
        classes: {
            clone: 'header--clone',
            stick: 'header--stick',
            unstick: 'header--unstick',
        },
        onInit: function() {
            $(this.elem).add(this.clonedElem).find('.menu-header__toggler').click(function() {
                $(this).siblings('.menu-header__menu-wrapper').collapse('toggle');
            });
            $(this.elem).add(this.clonedElem).find('.menu-header__link').click(function() {
                $(this).closest('.menu-header__menu-wrapper').collapse('hide');
            });
        },
    });

    $('.about-capsule__embed:first').embed({
        id: 'wa2f1Bkq0_0',
        source: 'youtube',
        placeholder: './img/photos/video_placeholder.jpg',
    });

    $('.capsule-content__page:first').waypoint(Raven.wrap(function() {
        if (!this.isCalled) {
            this.isCalled = true;
            console.log('init Capsule content');
            const switchers = $('.card-tab-switcher__wrapper', this.element);
            const carousel = $('.tab-page__carousel', this.element).owlCarousel({
                items: 1,
                loop: true,
                mouseDrag: false,
                dots: true,
                autoplay: true,
                autoplayTimeout: 4000,
                animateOut: 'fadeOut',
                onInitialized: function(e) {
                    help.refreshWaypoints();
                    switchers.filter(`[data-index=0]`).addClass('blue');
                    switchers.click(function() {
                        const $this = $(this);
                        // switchers.removeClass('blue');
                        // $this.addClass('blue');
                        carousel.trigger('to.owl.carousel', $this.data('index'));
                    });
                },
                onChanged: function(e) {
                    switchers.removeClass('blue');
                    const currentIndex = (e.item.index - 3 + e.item.count) % e.item.count;
                    switchers.filter(`[data-index=${currentIndex}]`).addClass('blue');
                },
            });
            this.destroy();
        }
    }), settings.waypoint.pageSettings);

    const shoppingCart = new ShoppingCart($('.shopping-cart__wrapper:first'), products);

    $('.market__page:first').waypoint(Raven.wrap(function() {           //todo make class
        if (!this.isCalled) {
            this.isCalled = true;
            console.log('init Market');

            function showModalProductDescription(productId) {
                let product = products[productId];
                let $m = $('.product-description__modal');
                $m.find('.product-description__image').attr('src',
                    settings.images.thumbSrcBase + '/' + product.images[0]);
                $m.find('.product-description__title').text(product.title);
                let descItems = product.description.split('\n').map((text) => $('<p>').text(text));
                $m.find('.product-description__description').empty().append(descItems);
                $m.find('.product-description__price').text(help.prettyNumber(product.price)
                    + ' ' + help.i18N('product.currency'));
                $m.modal({
                    onApprove: function() {
                        shoppingCart.addProduct(product);
                    },
                })
                    .modal('show')
                ;
            }

            $('.product__buy-button', this.element).click(function () {
                let $el = $(this);
                shoppingCart.addProduct(products[$el.data('productId')])
            });

            const requests = {      //todo remove this
                removeFromCart: shoppingCart.removeProduct.bind(shoppingCart),
                showDescription: showModalProductDescription,
            };
            $('.market__carousel', this.element).owlCarousel({
                stagePadding: 50,
                margin: 10,
                autoWidth: true,
                autoheight: true,
                responsive: {
                    0: {
                        items: 1,
                    },
                    576: {
                        items: 2,
                    },
                    768: {
                        items: 4,
                    },
                    992: {
                        items: 5,
                    },
                },
                onInitialized: function() {
                    help.refreshWaypoints();
                    help.addListiners(this.$element, requests);
                },
            });

            this.destroy();
        }
    }), settings.waypoint.pageSettings);

    $('.shopping-cart__page:first').waypoint(Raven.wrap(function() {
        if (!this.isCalled) {
            this.isCalled = true;
            const order = new Order($('.process-order__wrapper:first'));
            order.setShoppingCart(shoppingCart);
            this.destroy();
        }
    }), settings.waypoint.pageSettings);
    $('.clients__page:first').waypoint(Raven.wrap(function() {
        if (!this.isCalled) {
            this.isCalled = true;
            console.log('init Clients');
            let carousel = $('.clients__carousel', this.element).owlCarousel({
                items: 1,
                loop: true,
                lazyLoad: true,
                mouseDrag: false,
                dots: help.isMobile(),
                autoplay: true,
                autoplayTimeout: 4000,
                animateOut: 'fadeOut',
                onInitialized: help.refreshWaypoints,
            });

            const calculateImageOffset = ($el) => {
                if ($el.width() / $(document).width() > 1.2) {
                    $el.css('transform', `translateX(${($(document).width()
                        - $el.width()) / 2}px)`);
                } else {
                    $el.css('transform', '');
                }
            };

            carousel.on('loaded.owl.lazy', (event) => {
                calculateImageOffset(event.element);
            });

            carousel.on('resize.owl.carousel', function() {
                let $el = $(this);
                $el.find('.clients__image[src]').each(function() {
                    calculateImageOffset($(this));
                });
            });

            let toggles = $('.clients__client-image-wrapper');

            if (!help.isMobile()) {
                toggles.click(function() {
                    let el = $(this);
                    carousel.trigger('to.owl.carousel', el.data('index'));
                    toggles.removeClass('active');
                    el.addClass('active');
                });

                carousel.on('changed.owl.carousel', function(event) {
                    toggles.removeClass('active');
                    toggles.filter(`[data-index=${event.item.index - 3}]`).addClass('active');
                });

                toggles.filter('[data-index=0]').addClass('active');
            } else {
                toggles.remove();
            }

            $('.clients__video-button', this.element).click(function() {
                let $this = $(this);
                let $embed = $('.clients__embed');
                $('.clients__modal').modal({
                    onHide: function() {
                        $embed.embed('destroy');
                    },
                }).modal('show');
                if ($embed.embed('get url')) {
                    $embed.embed('change', $this.data('video').source, $this.data('video').id);
                } else {
                    $embed.embed($this.data('video'));
                }
                console.log($this.data('video'));
            });

            this.destroy();
        }
    }), settings.waypoint.pageSettings);

    $('.gallery__page:first').waypoint(Raven.wrap(function() {
        if (!this.isCalled) {
            this.isCalled = true;
            console.log('init Gallery');
            let gallery = $('.gallery__carousel', this.element);
            gallery.owlCarousel({
                responsive: {
                    0: {
                        items: 1,
                    },
                    768: {
                        items: 3,
                    },
                    1280: {
                        items: 4,
                    },
                    1900: {
                        items: 5,
                    },
                },
                autoplay: true,
                autoplayTimeout: 3000,
                margin: 10,
                autoWidth: true,
                lazyLoad: true,
                onInitialized: function() {
                    help.addListiners(this.$element);
                    help.refreshWaypoints();
                },
            });

            let isDragged;
            const items = help.processImageItems(_photos.reduce((r, photo) => [...r, photo.image], []),
                settings.images.srcBase, settings.images.thumbSrcBase);
            gallery.on('drag.owl.carousel', (e) => setTimeout(() => {
                isDragged = true;
            }, 220))
                .on('dragged.owl.carousel', (e) => setTimeout(() => {
                    isDragged = false;
                }, 220));
            $('.gallery__item').click(function() {
                if (!isDragged) {
                    help.openPhotoSwipe(items, $(this).data('thumbnailIndex'));
                }
            });
            this.destroy();
        }
    }), settings.waypoint.pageSettings);
}

$(document).ready(() => {
    Raven.context(function() {
        startApp();
    });
});
