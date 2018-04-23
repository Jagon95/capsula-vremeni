import 'babel-polyfill';
import 'picturefill';
import 'imports-loader?jQuery=>$!owl.carousel';
import './lazyCarousel'
import 'jquery-parallax.js';
import 'waypoints';
import Headhesive from 'headhesive';
import 'bootstrap/collapse';
import 'semantic/components/modal';
import 'semantic/components/embed';
import './embedSources';
import _photos from 'data/photos';
import Raven from 'raven-js';
import ShoppingCart from 'js/shoppingCart';
import Order from 'js/order';
import Market from 'js/market';
import help from 'js/helpers';

Raven
    .config(settings.sentry.id, settings.sentry.options)
    .install();

function startApp() {
    if (!settings.logging && console) {
        console.log = () => {};
    }

    if (!help.isMobile()) {
        $('.titanium-capsule-parallax:first').removeClass('d-none').waypoint(Raven.wrap(function () {
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

        $('.events__page:first').removeClass('d-none').waypoint(Raven.wrap(function () {
            if (!this.isCalled) {
                this.isCalled = true;
                console.log('init Events');
                const calculateImageOffset = ($el, items) => { // todo remove duplication
                    if ($el.width() / $(document).width() * items > 1.2) {
                        $el.css('transform', `translateX(${($(document).width()
                            / items - $el.width()) / 2}px)`);
                    } else {
                        $el.css('transform', '');
                    }
                };

                $('.events__carousel', this.element)
                    .on('initialized.owl.carousel', help.refreshWaypoints)
                    .on('loaded.owl.lazy', (event) => {
                        calculateImageOffset(event.element, event.page.size);
                        console.log(event);
                    })
                    .one('loaded.owl.lazy',(e) => {
                        $('.preloader', this.element).transition('fade out');
                    })
                    .on('resize.owl.carousel', function (event) {
                        let $el = $(this);
                        $el.find('.clients__image[src]').each(function () {
                            calculateImageOffset($(this), event.page.size);
                        });
                    })
                    .owlCarousel(settings.carousel.events);

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
        onInit: function () {
            $(this.elem).add(this.clonedElem).find('.menu-header__toggler').click(function () {
                $(this).siblings('.menu-header__menu-wrapper').collapse('toggle');
            });
            $(this.elem).add(this.clonedElem).find('.menu-header__link').click(function () {
                $(this).closest('.menu-header__menu-wrapper').collapse('hide');
            });
        },
    });

    $('.about-capsule__embed:first').embed({
        id: 'wa2f1Bkq0_0',
        source: 'youtube',
        placeholder: './img/photos/video_placeholder.jpg',
    });

    $('.capsule-content__page:first').waypoint(Raven.wrap(function () {
        if (!this.isCalled) {
            this.isCalled = true;
            console.log('init Capsule content');
            const switchers = $('.card-tab-switcher__wrapper', this.element);
            const carousel = $('.tab-page__carousel', this.element)
                .on('initialized.owl.carousel', function (e) {
                    help.refreshWaypoints();
                    switchers.filter(`[data-index=0]`).addClass('blue');
                    switchers.click(function () {
                        const $this = $(this);
                        carousel.trigger('to.owl.carousel', $this.data('index'));
                    });
                })
                .on('changed.owl.carousel', function (e) {
                    switchers.removeClass('blue');
                    const currentIndex = (e.item.index - 3 + e.item.count) % e.item.count;
                    switchers.filter(`[data-index=${currentIndex}]`).addClass('blue');
                })
                .owlCarousel(settings.carousel.content);
            this.destroy();
        }
    }), settings.waypoint.pageSettings);

    const shoppingCart = new ShoppingCart($('.shopping-cart__wrapper:first'));
    const productCounterLabel = $('<div>', {
        class: 'floating ui blue circular small label'
    }).hide().appendTo('[data-menu-item=shopping_cart]');

    function updateCounter() {
        const count = Object.keys(shoppingCart.getItems()).length;
        if(count > 0) {
            productCounterLabel.text(count).is(':not(:visible)') && productCounterLabel.transition('fade in');
        } else {
            productCounterLabel.transition('fade out');
        }
    }

    $('.market__page:first').waypoint(Raven.wrap(function () {
        if (!this.isCalled) {
            this.isCalled = true;
            console.log('init Market');
            const market = new Market($(this.element));
            market.on('addProduct', shoppingCart.addProduct.bind(shoppingCart));
            shoppingCart.on('addProduct', id => {
                market.toggleButton(true, id);
                updateCounter();
            });
            shoppingCart.on('removeProduct', market.toggleButton.bind(market, false));
            shoppingCart.on('removeProduct', id => {
                market.toggleButton(false, id);
                updateCounter();
            });
            shoppingCart.on('disabled', market.disable.bind(market));
            this.destroy();
        }
    }), settings.waypoint.pageSettings);

    $('.shopping-cart__page:first').waypoint(Raven.wrap(function () {
        if (!this.isCalled) {
            this.isCalled = true;
            const order = new Order($('.process-order__wrapper:first'));
            order.setShoppingCart(shoppingCart);
            this.destroy();
        }
    }), settings.waypoint.pageSettings);
    $('.clients__page:first').waypoint(Raven.wrap(function () {
        if (!this.isCalled) {
            this.isCalled = true;
            console.log('init Clients');
            const calculateImageOffset = ($el) => {
                if ($el.width() / $(document).width() > 1.2) {
                    $el.css('transform', `translateX(${($(document).width()
                        - $el.width()) / 2}px)`);
                } else {
                    $el.css('transform', '');
                }
            };

            let carousel = $('.clients__carousel', this.element)
                .on('initialized.owl.carousel', (e) => {
                    help.refreshWaypoints();
                })
                .one('loaded.owl.lazy',(e) => {
                    $('.preloader', this.element).transition('fade out');
                })
                .on('loaded.owl.lazy', (event) => {
                    calculateImageOffset(event.element);
                })
                .on('resize.owl.carousel', function () {
                    let $el = $(this);
                    $el.find('.clients__image[src]').each(function () {
                        calculateImageOffset($(this));
                    });
                })
                .owlCarousel(Object.assign(settings.carousel.clients, {
                    dots: help.isMobile(),
                }));

            let toggles = $('.clients__client-image-wrapper');

            if (!help.isMobile()) {
                toggles.click(function () {
                    let el = $(this);
                    carousel.trigger('to.owl.carousel', el.data('index'));
                    toggles.removeClass('active');
                    el.addClass('active');
                });

                carousel.on('changed.owl.carousel', function (event) {
                    toggles.removeClass('active');
                    toggles.filter(`[data-index=${event.item.index - 3}]`).addClass('active');
                });

                toggles.filter('[data-index=0]').addClass('active');
            } else {
                toggles.remove();
            }

            $('.clients__video-button', this.element).click(function () {
                let $this = $(this);
                let $embed = $('.clients__embed');
                $('.clients__modal').modal({
                    onHide: function () {
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

    $('.gallery__page:first').waypoint(Raven.wrap(function () {
        if (!this.isCalled) {
            this.isCalled = true;
            console.log('init Gallery');

            const items = help.processImageItems(_photos.reduce((r, photo) => [...r, photo.image], []),
                settings.images.srcBase, settings.images.thumbSrcBase);

            let isDragged;
            let gallery = $('.gallery__carousel', this.element);
            gallery
                .on('initialized.owl.carousel', function () {
                    $('.preloader', this.$element).fadeOut('slow', function() {});
                    help.addListiners(this.$element);
                    help.refreshWaypoints();
                })
                .on('drag.owl.carousel', (e) => setTimeout(() => {
                    isDragged = true;
                }, 220))
                .on('dragged.owl.carousel', (e) => setTimeout(() => {
                    isDragged = false;
                }, 220))
                .owlCarousel(settings.carousel.gallery);

            $('.gallery__item').click(function () {
                if (!isDragged) {
                    help.openPhotoSwipe(items, $(this).data('thumbnailIndex'));
                }
            });
            this.destroy();
        }
    }), settings.waypoint.pageSettings);
}

$(document).ready(() => {
    Raven.context(function () {
        startApp();
    });
});
