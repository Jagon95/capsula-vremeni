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
import _imageSizes from 'image_sizes';
import _photos from 'data/photos';
import cities from 'data/cities';
import {product as productI18n, processOrder as orderI18n} from 'data/i18n';
import pay from 'exports-loader?pay!./tinkoff'
import Raven from 'raven-js';
Raven
    .config(settings.sentry.id, settings.sentry.options)
    .install();

//todo move all this function in another place

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
        return $(new Image()).attr('src', $el.attr('src') || $el.attr('data-src') || $el.attr('data-src-retina'));
    }

    function loadAfter ($el, $prev) {               //todo process loading fails
        if($prev.offset().left + $prev.width() < $(window).width()) {
            loadImg($el).one('load', $.proxy(onLoadImg, $el));
        } else {
            owl.$element.one('translated.owl.carousel resized.owl.carousel', () => loadAfter($el, $prev));
        }
    }

    images.slice(0, owl.settings.items).each($.proxy(function(i, element) {
        let $el = $(element);
        loadImg($el).one('load', $.proxy(onLoadImg, $el));
    }));

    for(let i = owl.settings.items; i < images.length; ++i){
        let $el = $(images.get(i));
        let $prev = $(images.get(i - 1));
        $prev.one('load', () => {
            loadAfter($el, $prev);
        });
    }
};

const i18n = {
    product: productI18n,
    order: orderI18n
};

function get(obj, i) {
    try {
        return i.split('.').reduce((o, i) => o[i], obj);
    } catch (e) {
        console.error(e.message, 'required key: ' + i);
        return '';
    }
}

function I18N(index) {
    return get(i18n, index);
}

function prettyNumber(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

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
        if(imageSizes.hasOwnProperty(item)) {
            res.push({
                src: src + '/' + item,
                msrc: msrc ? msrc + '/' + item : '',
                w: imageSizes[item]['width'],
                h: imageSizes[item]['height']
            });
        } else {
            console.error(item, 'is not exist in imageSizes object');
        }
        return res;
    }, []);
}

function addListiners(wrapper, context) {
    $('[data-thumbnail-id]', wrapper).css('cursor', 'pointer').click(function () {
        let productId = $(this).data('thumbnailId');
        let items = processImageItems(products[productId]['images'], settings.images.srcBase, settings.images.thumbSrcBase);
        openPhotoSwipe(items);
    });
    if(context) {
        $('[data-request-function]', wrapper).click(function () {
            let el = $(this);
            context[el.data('requestFunction')](el.data('functionArgument'));
        });
    }
    if (!isMobile()) {
        $('[data-behavior-dimmer]', wrapper).dimmer({
            on: 'hover'
        });
    }
}

function refreshWaypoints() {
    setTimeout(() => {
        Waypoint.refreshAll();
        $(document).trigger('resize');
    }, 10);
}

function prepareData() {
    if (!settings.logging && console) {
        console.log = function(){};
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
        $('[data-product-template]');
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
            removeFromCart: this.removeProduct.bind(this)
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
            price: prettyNumber(product.price),
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
                refreshWaypoints();
            }
        });
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

    getProductsDescription() {
        return this.items.reduce((res, i) => res.concat(products[i]['title']), []).join(', ');
    }

    _updateResult() {
        let res = this.items.reduce((sum, productId) => {
            return sum + products[productId]['price'];
        }, 0);
        this.ui.result.html(prettyNumber(res));
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

        const now = new Date();
        this.number = (now.getDate() / 100).toFixed(2).slice(2) +
            (now.getMonth() + 1 / 100).toFixed(2).slice(2) +
            (now.getFullYear() / 100).toFixed(2).slice(3) +
            '-0' + Math.random().toFixed(5).slice(2, 5);

        this.ui.carousel.owlCarousel({
            items: 1,
            mouseDrag: false,
            touchDrag: false,
            dots: false,
            onInitialized: () => {
                refreshWaypoints();
                this.ui.processDeliveryButton.click(this.processDelivery.bind(this));
                this.ui.deliveryForm.submit(this.processDelivery.bind(this));
                this.ui.stepBackButton.click(this.stepBack.bind(this));
                this.ui.paymentForm.submit(this.processPayment.bind(this));
                this.ui.citiesSelector.dropdown();
            }
        });
    }

    _initUi() {             //todo refactor this
        this.ui = {
            steps: $('.process-order__steps', this.wrapper),
            carousel: $('.process-order__carousel', this.wrapper),
            deliveryForm: $('.process-order__delivery-form', this.wrapper),
            processDeliveryButton: $('.process-order__delivery .process-order__button-next', this.wrapper),
            citiesSelector: $('.process-order__city', this.wrapper),
            stepBackButton: $('.process-order__button-prev', this.wrapper),
            paymentDescription: $('.process-order__payment__description', this.wrapper),
            paymentAmount: $('.process-order__payment__amount', this.wrapper),
            paymentForm: $('.process-order__payment-form', this.wrapper),
            paymentNumber: $('.process-order__payment__number', this.wrapper),
            confirmNumber: $('.process-order__confirm-number', this.wrapper),
            confirmDescription: $('.process-order__confirm-description', this.wrapper),
            confirmResult: $('.process-order__confirm-result', this.wrapper),
            confirmTel: $('.process-order__confirm-tel', this.wrapper),
            confirmAddress: $('.process-order__confirm-addr', this.wrapper),
            confirmName: $('.process-order__confirm-name', this.wrapper),
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
        let cityIndex = parseInt(this.ui.citiesSelector.val());
        if(!Number.isInteger(cityIndex)) {
            $('.process-order__city_field', this.ui.deliveryForm).addClass('error').one('click', function () {
                $(this).removeClass('error');
            });
            return false
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
        return false;
    }

    processPayment(e) {
        this.ui.paymentAmount.attr('value', this.shoppingCart.getResult());
        this.ui.paymentDescription.attr('value', this.shoppingCart.getProductsDescription());
        this.ui.paymentNumber.attr('value', this.number);
        pay(e.target, this.successPayment.bind(this), this.successPayment.bind(this));
        return false;
    }

    successPayment() {
        this.stepTo('confirm');
        this.ui.confirmNumber.text(I18N('order.number') + ': ' +  this.number);
        this.ui.confirmDescription.text(I18N('order.description') + ': ' +  this.shoppingCart.getProductsDescription());
        this.ui.confirmResult.text(I18N('order.result') + ': ' +  this.shoppingCart.getResult());
        this.ui.confirmTel.text(I18N('order.confirm.tel') + ': ');
        this.ui.confirmAddress.text(I18N('order.confirm.address') + ': ');
        this.ui.confirmName.text(I18N('order.confirm.name') + ': ');
    }
}

function startApp() {
    prepareData();

    if (!isMobile()) {
        $('.titanium-capsule-parallax:first').removeClass('d-none').waypoint(Raven.wrap(function () {
            if(!this.isCalled) {
                this.isCalled = true;
                let $el = $(this.element);
                $($el.find('.titanium-capsule-parallax__template', $el).remove().html()).appendTo($el.find('.titanium-capsule-parallax__wrapper'));
                $el.find('img').on('load', () => {
                    $(window).trigger('resize')
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
            if(!this.isCalled) {
                this.isCalled = true;
                console.log('init Events');
                const carousel = $('.events__carousel', this.element).owlCarousel({
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

                const calculateImageOffset = ($el, items) => {      //todo remove duplication
                    if ($el.width() / $(document).width() * items > 1.2) {
                        $el.css('transform', `translateX(${($(document).width() / items - $el.width()) / 2}px)`)
                    } else {
                        $el.css('transform', '');
                    }
                };

                carousel.on('loaded.owl.lazy', (event) => {
                    calculateImageOffset(event.element, event.page.size);
                    console.log(event);
                });

                carousel.on('resize.owl.carousel', function (event) {
                    let $el = $(this);
                    $el.find('.clients__image[src]').each(function () {
                        calculateImageOffset($(this), event.page.size);
                    });
                });


                this.destroy();
            }
        }), settings.waypoint.pageSettings);

    }

    let header = new Headhesive('.menu-header__wrapper', {
        offset: '#introduction',
        offsetSide: 'bottom',
        classes: {
            clone: 'header--clone',
            stick: 'header--stick',
            unstick: 'header--unstick'
        },
        onInit: function () {
            $(this.elem).add(this.clonedElem).find('.menu-header__toggler').click(function () {
                $(this).siblings('.menu-header__menu-wrapper').collapse('toggle');
            });
            $(this.elem).add(this.clonedElem).find('.menu-header__link').click(function () {
                $(this).closest('.menu-header__menu-wrapper').collapse('hide');
            });
        }
    });

    $('.about-capsule__embed:first').embed({
        id: "wa2f1Bkq0_0",
        source: "youtube",
        placeholder: './img/photos/video_placeholder.jpg'
    });

    $('.capsule-content__page:first').waypoint(Raven.wrap(function () {
        if(!this.isCalled) {
            this.isCalled = true;
            console.log('init Capsule content');
            const $el = $(this.element);
            const switchers = $('.card-tab-switcher__wrapper', this.element)
            const carousel = $('.tab-page__carousel', this.element).owlCarousel({
                items: 1,
                loop: true,
                mouseDrag: false,
                dots: true,
                autoplay: true,
                autoplayTimeout: 4000,
                animateOut: 'fadeOut',
                onInitialized: function (e) {
                    refreshWaypoints();
                    switchers.filter(`[data-index=0]`).addClass('blue');
                    switchers.click(function () {
                        const $this = $(this);
                        // switchers.removeClass('blue');
                        // $this.addClass('blue');
                        carousel.trigger('to.owl.carousel', $this.data('index'));
                    });
                },
                onChanged: function (e) {
                    switchers.removeClass('blue');
                    const currentIndex = (e.item.index - 3 + e.item.count) % e.item.count;
                    switchers.filter(`[data-index=${currentIndex}]`).addClass('blue');
                }
            });
            this.destroy();
        }
    }), settings.waypoint.pageSettings);

    const shoppingCart = new ShoppingCart($('.shopping-cart__wrapper:first'));

    $('.market__page:first').waypoint(Raven.wrap(function () {
        if(!this.isCalled) {
            this.isCalled = true;
            console.log('init Market');

            function showModalProductDescription(productId) {
                let product = products[productId];
                let $m = $('.product-description__modal');
                $m.find('.product-description__image').attr('src', settings.images.thumbSrcBase + '/' + product.images[0]);
                $m.find('.product-description__title').text(product.title);
                let descItems = product.description.split('\n').map((text) => $('<p>').text(text));
                $m.find('.product-description__description').empty().append(descItems);
                $m.find('.product-description__price').text(prettyNumber(product.price) + ' ' + I18N('product.currency'));
                $m.modal({
                    onApprove : function() {
                        shoppingCart.addProduct(productId)
                    }
                })
                    .modal('show')
                ;
            }

            const requests = {
                addToCart: shoppingCart.addProduct.bind(shoppingCart),
                removeFromCart: shoppingCart.removeProduct.bind(shoppingCart),
                showDescription: showModalProductDescription
            };
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
                onInitialized: function () {
                    refreshWaypoints();
                    addListiners(this.$element, requests);
                }
            });

            // $('.product__buy-button').click(function (e) {       //todo better button click
            //     let el = $(this);
            //     el.addClass('active').off('click');
            //     addToCart(el.data('productId'));
            // });

            this.destroy();
        }
    }), settings.waypoint.pageSettings);

    $('.shopping-cart__page:first').waypoint(Raven.wrap(function () {
        if(!this.isCalled) {
            this.isCalled = true;
            const order = new Order($('.process-order__wrapper:first'));
            order.setShoppingCart(shoppingCart);
            this.destroy();
        }
    }), settings.waypoint.pageSettings);
    $('.clients__page:first').waypoint(Raven.wrap(function () {
        if(!this.isCalled) {
            this.isCalled = true;
            console.log('init Clients');
            let carousel = $('.clients__carousel', this.element).owlCarousel({
                items: 1,
                loop: true,
                lazyLoad: true,
                mouseDrag: false,
                dots: isMobile(),
                autoplay: true,
                autoplayTimeout: 4000,
                animateOut: 'fadeOut',
                onInitialized: refreshWaypoints
            });

            const calculateImageOffset = ($el) => {
                if ($el.width() / $(document).width() > 1.2) {
                    $el.css('transform', `translateX(${($(document).width() - $el.width()) / 2}px)`)
                } else {
                    $el.css('transform', '');
                }
            };

            carousel.on('loaded.owl.lazy', (event) => {
                calculateImageOffset(event.element);
            });

            carousel.on('resize.owl.carousel', function (event) {
                let $el = $(this);
                $el.find('.clients__image[src]').each(function () {
                    calculateImageOffset($(this));
                });
            });

            let toggles = $('.clients__client-image-wrapper');

            if (!isMobile()) {
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
                $('.ui.modal').modal({
                    onHide: function () {
                        $('.ui.embed').embed('destroy')
                    }
                }).modal('show');
                if ($('.ui.embed').embed('get url')) {
                    $('.ui.embed').embed('change', $this.data('video').source, $this.data('video').id);
                } else {
                    $('.ui.embed').embed($this.data('video'));
                }
                console.log($this.data('video'));
            });

            this.destroy();
        }
    }), settings.waypoint.pageSettings);

    $('.gallery__page:first').waypoint(Raven.wrap(function () {
        if(!this.isCalled) {
            this.isCalled = true;
            console.log('init Gallery');
            let gallery = $('.gallery__carousel', this.element);
            gallery.owlCarousel({
                responsive: {
                    0: {
                        items: 1
                    },
                    768: {
                        items: 3
                    },
                    1280: {
                        items: 4
                    },
                    1900: {
                        items: 5
                    }
                },
                autoplay: true,
                autoplayTimeout: 3000,
                margin: 10,
                autoWidth: true,
                lazyLoad: true,
                onInitialized: function () {
                    addListiners(this.$element);
                    refreshWaypoints();
                }
            });

            let isDragged;
            const items = processImageItems(_photos.reduce((r, photo) => [...r, photo.image], []), settings.images.srcBase, settings.images.thumbSrcBase);
            gallery.on('drag.owl.carousel', (e) => setTimeout(() => {
                isDragged = true
            }, 220))
                .on('dragged.owl.carousel', (e) => setTimeout(() => {
                    isDragged = false
                }, 220));
            $('.gallery__item').click(function () {
                if (!isDragged) {
                    openPhotoSwipe(items, $(this).data('thumbnailIndex'));
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