// import 'owl.carousel/dist/assets/owl.carousel.css';
import $ from "jquery";
import 'imports-loader?jQuery=jquery!owl.carousel';
import 'jquery-parallax.js';
import 'waypoints';
import Headhesive from 'headhesive';
import 'semantic/components/transition';
import 'semantic/components/dimmer';
import _products from 'product.json';
import _imageSizes from 'image_sizes.json';
import _photos from 'photos';

const products = JSON.parse(_products);
const imageSizes = JSON.parse(_imageSizes).reduce(function (obj, item) {
    obj[item.name] = item;
    return obj;
}, {});

function isMobile() {
    return /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || navigator.vendor || window.opera)
}

function openPhotoSwipe(items, index) {
    let pswpElement = $('.pswp:first').get(0);
    let options = {
        history: false,
        focus: false,
        bgOpacity: .9,
        showAnimationDuration: 200,
        hideAnimationDuration: 200,
        index
    };

    let gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
    gallery.init();
}

function processImageItems(items, src, msrc) {
    return items.reduce((res, item) => {
        res.push({
            src: src + '/' + item,
            msrc: msrc ? msrc + '/' + item : '',
            w: imageSizes[item]['width'],
            h: imageSizes[item]['height']
        });
        return res;
    }, []);
}

const transitionSettings = {duration: 700};
const waypointAnimationSettings = {offset: '70%'};
const waypointPageSettings = {
    offset: '110%'
};

function addListiners(wrapper, context) {
    $('[data-thumbnail-id]', wrapper).css('cursor', 'pointer').click(function () {
        let productId = $(this).data('thumbnailId');
        let items = processImageItems(products[productId]['images'], 'img/photos', 'img/thumbnails');
        openPhotoSwipe(items);
    });
    $('[data-request-function]', wrapper).click(function () {
        let el = $(this);
        context[el.data('requestFunction')](el.data('functionArgument'));
    });
    if (!isMobile()) {
        $('[data-behavior-dimmer]', wrapper).dimmer({
            on: 'hover'
        });
    }
}


$(document).ready(function () {
    if (!isMobile()) {
        $('.titanium-capsule-parallax:first').removeClass('d-none').waypoint(function () {
            $(this.element).parallax({
                imageSrc: 'img/IMG_1713.jpg',
                speed: .7,
                bleed: 50
            });
            this.destroy();
        }, waypointPageSettings);

        $('[data-animate-type]').css('visibility', 'hidden').waypoint(function () {
            let el = $(this.element);
            el.transition(el.data('animateType'), transitionSettings);
            this.destroy();
        }, waypointAnimationSettings);

        $('[data-animate-indexed]').css('visibility', 'hidden').waypoint(function () {
            let el = $(this.element);
            let offset = el.data('animate-indexed');
            if (offset <= .25) {
                el.transition('fade left', transitionSettings);
            } else if (offset < .75) {
                el.transition('fade up', transitionSettings);
            } else {
                el.transition('fade right', transitionSettings);
            }
            this.destroy();
        }, waypointAnimationSettings);

        $('.events__page:first').removeClass('d-none').waypoint(function () {
            console.log('init Events');
            $('.events__carousel', this.element).owlCarousel({
                autoheight: true,
                loop: true,
                autoplay: true,
                autoplayTimeout: 4000,
                lazyLoad: true,
                responsive: {
                    0: {
                        items: 1
                    },
                    768: {
                        items: 2
                    },
                    1280: {
                        items: 3
                    }
                }
            });
            this.destroy();
        }, {
            offset: '120%'
        });

    }

    let header = new Headhesive('.menu-header__wrapper', {
        offset: '#introduction',
        offsetSide: 'bottom',
        classes: {
            clone: 'header--clone',
            stick: 'header--stick',
            unstick: 'header--unstick'
        }
    });


    $('.capsule-content__page:first').waypoint(function () {
        let requests = {
            switchTo
        };
        console.log('init Capsule content');
        let controls = $('.card-tab-switcher__wrapper', this.element);
        let tabs = $('.tab-page__content', this.element);
        let tabContainer = $('.tabs-container', this.element);
        let tabsArray = Array.from(tabs, (tab) => {
            return $(tab).data('tab');
        });
        let activeTab = tabsArray[0];

        function switchTo(tab) {
            let _showTab = () => {
                tabs.filter(`[data-tab="${tab}"]`).transition('fade in', {
                    onComplete: () => {
                        $(window).trigger('resize').trigger('scroll');
                    }
                });
            };
            if (tabs.filter(':visible').length > 0) {
                tabs.filter(':visible').transition('fade out', {
                    onComplete: () => {
                        _showTab();
                    }
                });
            } else {
                _showTab();
            }
            controls.filter('.blue').removeClass('blue');
            controls.filter(`[data-tab="${tab}"]`).addClass('blue');
            activeTab = tab;
        }

        function switchNext() {
            let nextIndex = (tabsArray.indexOf(activeTab) + 1) % tabsArray.length;
            switchTo(tabsArray[nextIndex]);
        }

        let timerId;

        function startSwitcher() {
            console.log('start Tabswither');
            clearInterval(timerId);
            timerId = setInterval(switchNext, 4e3);
        }

        function stopSwitcher() {
            console.log('stop Tabswither');
            clearInterval(timerId);
        }

        setTimeout(() => {
            tabContainer.waypoint(function (direction) {
                if (direction === 'down') {
                    startSwitcher();
                } else if (direction === 'up') {
                    stopSwitcher();
                }
            }, {offset: '100%'});
            tabContainer.waypoint(function (direction) {
                if (direction === 'down') {
                    stopSwitcher();
                } else if (direction === 'up') {
                    startSwitcher();
                }
            }, {offset: -100});
        });
        switchTo(activeTab);
        addListiners(this.element, requests);
        this.destroy();
    }, waypointPageSettings);

    $('.market__page:first').waypoint(function () {

        $(".market__carousel", this.element).owlCarousel({
            stagePadding: 50,
            margin: 10,
            autoWidth: true,
            autoheight: true,
            responsive: {
                0: {
                    items: 1
                },
                576: {
                    items: 2
                },
                768: {
                    items: 4
                },
                992: {
                    items: 5
                }
            }
        });

        const requests = {
            addToCart,
            removeFromCart
        };
        console.log('init Market');
        const productTemplate = $(`[data-product-template=${isMobile() ? 'mobile' : 'desktop'}]`).html();
        $('[data-product-template]').remove();
        // let cartCounter = 0;
        let cartItems = [];

        function addToCart(id) {
            if (cartItems.indexOf(id) !== -1) {
                return;
            }
            if (cartItems.length === 0) {
                // $('.shopping-cart__empty-handler').addClass('transition hidden');
                $('.shopping-cart__empty-handler').transition('fade out', {duration: 0});
                // $('.shopping-cart__empty-handler').hide();
            }
            cartItems.push(id);
            $(`.product__buy-button[data-product-id="${id}"]`).addClass('active');
            let product = products[id];
            let templateData = {
                ...product,
                file: 'img/thumbnails/' + product.images[0],
                index: cartItems.length,
                id
            };
            let template = productTemplate.replace(/data-template-(\w+)/ig, (match, field) => templateData[field]);
            let newElement = $('<div>').html(template).children();
            $('.shopping-cart__body').append(newElement);
            updateResultPrice();
            newElement.transition('fade in', {
                duration: 700,
                onComplete: function () {
                    addListiners(newElement, requests);
                }
            });
        }

        let shoppingCart = $('.shopping-cart__page:first');

        function removeFromCart(id) {
            let index = cartItems.indexOf(id);
            if (index === -1) {
                return;
            }
            cartItems.splice(index, 1);
            $(`.product__buy-button[data-product-id="${id}"]`).removeClass('active');
            shoppingCart.find(`[data-product-id=${id}]`).transition('fade', {
                onComplete: function () {
                    this.remove();
                    updateCartIndexes();
                    updateResultPrice();
                    if (cartItems.length === 0) {
                        $('.shopping-cart__empty-handler').transition('fade in');
                    }
                }
            });
        }

        function updateResultPrice() {
            let resEl = $('.shopping-cart__result-price-cell');
            let res = cartItems.reduce((sum, productId) => {
                return sum + products[productId]['price'];
            }, 0);
            resEl.html(res);
        }

        function updateCartIndexes() {
            let counter = 0;
            let indexCells = $('.shopping-cart__body .shopping-cart__number_cell').each(function () {
                $(this).html(++counter);
            })
        }

        // $('.product__buy-button').click(function (e) {
        //     let el = $(this);
        //     el.addClass('active').off('click');
        //     addToCart(el.data('productId'));
        // });

        addListiners(this.element, requests);
        this.destroy();
    }, waypointPageSettings);

    $('.clients__page:first').waypoint(function () {
        console.log('init Clients');
        $('.clients__carousel', this.element).owlCarousel({
            items: 1,
            loop: true,
            lazyLoad: true,
            mouseDrag: false,
            touchDrag: false,
        });

        this.destroy();
    }, waypointPageSettings);

    $('.gallery__page:first').waypoint(function () {
        console.log('init Gallery');
        $('.gallery__carousel', this.element).owlCarousel({
            margin: 10,
            autoWidth: true,
            responsive: {
                0: {
                    items: 1
                },
                576: {
                    items: 2
                },
                768: {
                    items: 4
                },
                992: {
                    items: 5
                }
            }
        });

        const items = processImageItems(JSON.parse(_photos)
            .reduce((r, photo) => [...r, photo.image], []), 'img/photos', 'img/thumbnails');

        $('.gallery__image').click(function () {
            openPhotoSwipe(items, $(this).data('thumbnailIndex'));
        });

        this.destroy();
    }, waypointPageSettings);
});