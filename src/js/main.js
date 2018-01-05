import 'imports-loader?jQuery=jquery!owl.carousel';
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
import products from '../data/product';
import _imageSizes from 'image_sizes';
import _photos from 'data/photos';
import cities from 'data/cities';
import settings from 'data/settings';
import {product as productI18n} from 'data/i18n';
import Raven from 'raven-js';
Raven
    .config('https://5f8a5a89b1294f0dab6dbdd0039d349d@sentry.io/267051', {
        shouldSendCallback: false
    })
    .install();

const i18n = {
    product: productI18n
};
const imageSizes = _imageSizes.reduce(function (obj, item) {
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

function addListiners(wrapper, context) {
    $('[data-thumbnail-id]', wrapper).css('cursor', 'pointer').click(function () {
        let productId = $(this).data('thumbnailId');
        let items = processImageItems(products[productId]['images'], settings.images.srcBase, settings.images.thumbSrcBase);
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

function refreshWaypoints() {
    setTimeout(() => {
        Waypoint.refreshAll();
    }, 10);
}

function prepareData() {
    function get(obj, i) {
        return i.split('.').reduce((o, i) => o[i], obj);
    }

    function I18N(index) {
        return get(i18n, index);
    }

    function translateFields(obj, fields) {
        fields.forEach((i) => {
            obj[i] = I18N(obj[i])
        })
    }

    for(let key of Object.keys(products)) {
        translateFields(products[key], ['title', 'description']);
    }
}

class ShoppingCart {
    /**
     *
     * @param {jquery} $el
     */
    constructor($el) {
        this.wrapper = $el;
        this._initUi();
        this.productTemplate = $(`[data-product-template=${isMobile() ? 'mobile' : 'desktop'}]`, this.wrapper).html();
        $('[data-product-template]').remove();
        this.items = [];
        this.result = 0;
    }

    getResult() {
        return this.result;
    }

    getItems() {
        return this.items;
    }

    _initUi() {
        this.ui = {
            emptyHandler: $('.shopping-cart__empty-handler', this.wrapper),
            body: $('.shopping-cart__body', this.wrapper),
            result: $('.shopping-cart__result-price-cell', this.wrapper)
        }
    }

    addProduct(id) {
        const requests = {
            addToCart: this.addProduct,
            removeFromCart: this.removeProduct
        };
        if (this.items.indexOf(id) !== -1) {
            return;
        }
        if (this.items.length === 0) {
            // $('.shopping-cart__empty-handler').addClass('transition hidden');
            this.ui.emptyHandler.transition('fade out', {duration: 0});
            // $('.shopping-cart__empty-handler').hide();
        }
        this.items.push(id);
        $(`.product__buy-button[data-product-id="${id}"]`).addClass('active');  //todo: remove
        let product = products[id];
        let templateData = {
            ...product,
            file: settings.images.thumbSrcBase + '/' + product.images[0],
            index: this.items.length,
            id
        };
        let template = this.productTemplate.replace(/data-template-(\w+)/ig, (match, field) => templateData[field]);
        let newElement = $('<div>').html(template).children();
        this.ui.body.append(newElement);
        this._updateResult();
        newElement.transition('fade in', {
            duration: 700,
            onComplete: function () {
                addListiners(newElement, requests);
            }
        });
        refreshWaypoints();
    }

    removeProduct(id) {
        let index = this.items.indexOf(id);
        if (index === -1) {
            return;
        }
        this.items.splice(index, 1);
        $(`.product__buy-button[data-product-id="${id}"]`).removeClass('active');   //todo: remove
        let productEl = this.ui.body.find(`[data-product-id=${id}]`);
        productEl.transition('fade', {
            onComplete: () => {
                productEl.remove();
                this._updateIndexes();
                this._updateResult();
                if (this.items.length === 0) {
                    this.ui.emptyHandler.transition('fade in');
                }
            }
        });
        refreshWaypoints();
    }

    _updateResult() {
        let res = this.items.reduce((sum, productId) => {
            return sum + products[productId]['price'];
        }, 0);
        this.ui.result.html(res);
        this.result = res;
    }

    _updateIndexes() {
        let counter = 0;
        this.ui.body.find('.shopping-cart__number_cell').each(function () {
            $(this).html(++counter);
        })
    }
}

class Order {
    constructor($el) {
        this.wrapper = $el;
        this._initUi();
        this.cityId = null;
        this.shoppingCart = null;
        this.steps = ['delivery', 'payment', 'confirm'];
        this.currentStep = this.ui.steps.find('.step.active:first').data('step') || this.steps[0];

        this.ui.carousel.owlCarousel({
            items: 1,
            mouseDrag: false,
            touchDrag: false,
            dots: false,
            onInitialized: refreshWaypoints
        });
        this.ui.processDeliveryButton.click(this.processDelivery.bind(this));
        this.ui.stepBackButton.click(this.stepBack.bind(this));
        this.ui.paymentForm.submit(this.processPayment.bind(this));
        this.ui.cityesSelector.dropdown();
    }

    _initUi() {
        this.ui = {
            steps: $('.process-order__steps', this.wrapper),
            carousel: $('.process-order__carousel', this.wrapper),
            deliveryForm: $('.process-order__delivery', this.wrapper),
            processDeliveryButton: $('.process-order__delivery .process-order__button-next', this.wrapper),
            cityesSelector: $('.process-order__city', this.wrapper),
            stepBackButton: $('.process-order__button-prev', this.wrapper),
            paymentDescription: $('.process-order__payment__description', this.wrapper),
            paymentForm: $('.process-order__payment', this.wrapper),
            // processPaymentButton: $('.process-order__payment .process-order__button-next', this.wrapper),
        };
    }

    /**
     *
     * @param {ShoppingCart} cart
     */
    setShoppingCart(cart){
        this.shoppingCart = cart;
    }

    _getStep(s) {
        return this.ui.steps.find(`.step[data-step="${s}"]`);
    }

    stepBack() {
        if(this.steps.indexOf(this.currentStep) > 0) {
            let prevStepId = this.steps.indexOf(this.currentStep) - 1;
            this.stepTo(this.steps[prevStepId]);
        }
    }

    stepNext() {
        if(this.steps.indexOf(this.currentStep) !== this.steps.length - 1) {
            let nextStepId = this.steps.indexOf(this.currentStep) + 1;
            this.stepTo(this.steps[nextStepId]);
        }
    }

    stepTo(s) {
        if (!this.steps.includes(s)) {
            return
        }
        let step = this._getStep(s);
        this.ui.steps.find('.step').removeClass('disabled active completed');
        step.prevAll('.step').addClass('completed');
        step.addClass('active');
        step.nextAll('.step').addClass('disabled');
        this.ui.carousel.trigger('to.owl.carousel', this.steps.indexOf(s));
        this.currentStep = s;
    }

    processDelivery() {
        let cityIndex = parseInt(this.ui.cityesSelector.val());
        if(!Number.isInteger(cityIndex)) {
            $('.process-order__city_field', this.ui.deliveryForm).addClass('error').one('click', function () {
                $(this).removeClass('error');
            });
            return
        }
        products['currentDelivery'] = {
            ...products['delivery'],
            price: cities[cityIndex]['price'],
            title: products['delivery']['title'] + " в " + cities[cityIndex]['name'] //todo i18n
        };
        if(cityIndex !== this.cityId) {
            this.shoppingCart.removeProduct('currentDelivery');
            this.shoppingCart.addProduct('currentDelivery');
            this.cityId = cityIndex;
        }
        this.stepNext();
    }

    processPayment(e) {
        this.ui.paymentForm.find('.process-order__payment__amount').attr('value', this.shoppingCart.getResult());
        this.ui.paymentForm.find('.process-order__payment__description').attr('value',
            this.shoppingCart.getItems().reduce((res, i) => res.concat(products[i]['title']), []).join(', '));
        console.log(e);
        pay(e.target);
        return false;
    }
}

function startApp() {
    prepareData();

    if (!isMobile()) {
        $('.titanium-capsule-parallax:first').removeClass('d-none').waypoint(function () {
            $(this.element).parallax({
                imageSrc: 'img/IMG_1713.jpg',
                speed: .7,
                bleed: 50
            });
            this.destroy();
        }, settings.waypoint.pageSettings);

        $('.events__page:first').removeClass('d-none').waypoint(function () {
            console.log('init Events');
            $('.events__carousel', this.element).owlCarousel({      //todo move images to center
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
                },
                onInitialized: refreshWaypoints
            });
            this.destroy();
        }, settings.waypoint.pageSettings);

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

    $('.menu-header__toggler').click(function () {
        const isClone = $(this).is('.header--clone');
        $(`${isClone ? '.header--clone' : ''} .menu-header__menu-wrapper`).collapse('toggle');
    });

    $('.menu-header__link').click(function () {
        $(this).closest('.menu-header__menu-wrapper').collapse('hide');
    });

    $('.capsule-content__page:first').waypoint(function () {
        let requests = {
            switchTo
        };
        console.log('init Capsule content');                                    //todo: remove this hell and replace to carousel
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
                        // $(window).trigger('resize').trigger('scroll');
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
    }, settings.waypoint.pageSettings);

    const shoppingCart = new ShoppingCart($('.shopping-cart__wrapper:first'));

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
            },
            onInitialized: refreshWaypoints
        });

        const requests = {
            addToCart: shoppingCart.addProduct.bind(shoppingCart),
            removeFromCart: shoppingCart.removeProduct.bind(shoppingCart)
        };
        console.log('init Market');

        // $('.product__buy-button').click(function (e) {       //todo better button click
        //     let el = $(this);
        //     el.addClass('active').off('click');
        //     addToCart(el.data('productId'));
        // });

        addListiners(this.element, requests);
        this.destroy();
    }, settings.waypoint.pageSettings);

    $('.shopping-cart__page:first').waypoint(function () {
        const order = new Order($('.process-order__wrapper:first'));
        order.setShoppingCart(shoppingCart);
        this.destroy();
    }, settings.waypoint.pageSettings);

    $('.clients__page:first').waypoint(function () {
        console.log('init Clients');
        let carousel = $('.clients__carousel', this.element).owlCarousel({
            items: 1,
            loop: true,
            lazyLoad: true,
            mouseDrag: false,
            dots: isMobile(),
            video:true,
            autoplay: true,
            autoplayTimeout: 4000,
            animateOut: 'fadeOut',
            onInitialized: refreshWaypoints
        });

        const calculateImageOffset = ($el) => {
            if($el.width() / $(document).width() > 1.2) {
                $el.css('transform', `translateX(${($(document).width() - $el.width()) / 2}px)`)
            } else {
                $el.css('transform', '');
            }
        };

        carousel.on('loaded.owl.lazy', (event) => {
            calculateImageOffset(event.element);
        });

        carousel.on('resize.owl.carousel', function(event) {
            let $el = $(this);
            $el.find('.clients__image[src]').each(function () {
                calculateImageOffset($(this));
            });
        });

        let toggles = $('.clients__client-image-wrapper');

        if(!isMobile()) {
            toggles.click(function () {
                let el = $(this);
                carousel.trigger('to.owl.carousel', el.data('index'));
                toggles.removeClass('active');
                el.addClass('active');
            });

            carousel.on('changed.owl.carousel', function (event) {
                toggles.removeClass('active');
                toggles.filter(`[data-index=${event.item.index-3}]`).addClass('active');
            });

            toggles.filter('[data-index=0]').addClass('active');
        } else {
            toggles.remove();
        }

        $('.clients__video-button', this.element).click(function () {
            let $this = $(this);
            $('.ui.modal').modal({
                onHide: function () {
                    $('.ui.embed').embed('destroy')
                }
            }).modal('show');
            if($('.ui.embed').embed('get url')) {
                $('.ui.embed').embed('change', $this.data('video').source, $this.data('video').id);
            } else {
                $('.ui.embed').embed($this.data('video'));
            }
            console.log($this.data('video'));
        });

        this.destroy();
    }, settings.waypoint.pageSettings);

    $('.gallery__page:first').waypoint(function () {
        console.log('init Gallery');
        let gallery =  $('.gallery__carousel', this.element);
        gallery.owlCarousel({
            autoplay: true,
            autoplayTimeout: 3000,
            margin: 10,
            autoWidth: true,
            lazyLoad: true,
            onInitialized: refreshWaypoints
        });

        let isDragged;
        const items = processImageItems(_photos.reduce((r, photo) => [...r, photo.image], []), settings.images.srcBase, settings.images.thumbSrcBase);
        gallery.on('drag.owl.carousel', (e) => setTimeout(() => {isDragged = true}, 220))
            .on('dragged.owl.carousel', (e) => setTimeout(() => {isDragged = false}, 220));
        $('.gallery__image').click(function () {
            if(!isDragged) {
                openPhotoSwipe(items, $(this).data('thumbnailIndex'));
            }
        });
        this.destroy();
    }, settings.waypoint.pageSettings);
}

$(document).ready(() => {
    Raven.context(function () {
        startApp();
    });
});