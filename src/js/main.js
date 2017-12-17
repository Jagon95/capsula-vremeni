function openPhotoSwipe (items) {
    let pswpElement = $('.pswp').get(0);
    // build items array
    // define options (if needed)
    let options = {
        // history & focus options are disabled on CodePen
        history: false,
        focus: false,
        bgOpacity: .9,
        showAnimationDuration: 200,
        hideAnimationDuration: 200
    };

    let gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);
    gallery.init();
}

function processSrcPaths (items, src, msrc) {
    return items.map((item) => {
        return {
            src: src + '/' + item['file'],
            msrc: msrc ? msrc + '/' + item['file'] : '',
            ...item
        };
    })
}

let transitionSettings = {duration: 700};
let waypointAnimationSettings = {offset: '70%'};
function addListiners(wrapper, context) {
    $('[data-thumbnail-id]', wrapper).css('cursor', 'pointer').click(function () {
        let productId = $(this).data('thumbnailId');
        let items = processSrcPaths(kapsulaProducts[productId]['images'], 'img/photos', 'img/thumbnails');
        openPhotoSwipe(items);
    });
    $('[data-behavior-dimmer]', wrapper).dimmer({
        on: 'hover'
    });
    $('[data-request-function]', wrapper).click(function () {
        let el = $(this);
        context[el.data('requestFunction')](el.data('functionArgument'));
    });
}


$(document).ready(function(){
    $(".owl-carousel").owlCarousel({
        stagePadding: 50,
        margin: 10,
        autoWidth:true,
        autoheight: true,
        responsive:{
            0:{
                items:1
            },
            576: {
                items: 2
            },
            768:{
                items:4
            },
            992:{
                items:5
            }
        }
    });

    $('[data-animate-type]').css('visibility', 'hidden').waypoint(function (direction) {
        // if (direction)
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

    let header = new Headhesive('.menu-header', {
        offset: '#introduction',
        offsetSide: 'bottom',
        classes: {
            clone:   'header--clone',
            stick:   'header--stick',
            unstick: 'header--unstick'
        }
    });


    $('.capsule-content__page').waypoint(function () {
        let requests = {
            switchTo
        };
        console.log('init Capsule content');
        let controls = $('.tab-controllers [data-tab]', this.element);
        let tabs = $('.tabs [data-tab]', this.element);
        let tabContainer = $('.tabs-container', this.element);
        let tabsArray = Array.from(tabs, (tab) => {
            return $(tab).data('tab');
        });
        tabContainer.data({
            'active-tab': tabs.filter(':visible').data('tab')
        });

        function switchTo(tab) {
            tabs.fadeOut();
            controls.removeClass('blue');
            tabs.filter(`[data-tab="${tab}"]`).fadeIn();
            controls.filter(`[data-tab="${tab}"]`).addClass('blue');
            tabContainer.data('active-tab', tab);
        }

        function switchNext() {
            let nextIndex = (tabsArray.indexOf(tabContainer.data('active-tab')) + 1) % tabsArray.length;
            switchTo(tabsArray[nextIndex]);
        }
        switchNext();
        setInterval(switchNext, 5e3);
        addListiners(this.element, requests);
        this.destroy();
    }, {
        offset: '100%'
    });

    $('.market__page').waypoint(function () {
        const requests = {
            addToCart,
            removeFromCart
        };
        console.log('init Market');
        const productTemplate = $('#product-template').html();
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
            let product = kapsulaProducts[id];
            let templateData = {
                ...product,
                file: 'img/thumbnails/' + product.images[0]['file'],
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

        let shoppingCart = $('.shopping-cart__page');
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
                    if(cartItems.length === 0) {
                        $('.shopping-cart__empty-handler').transition('fade in');
                    }
                }
            });
        }

        function updateResultPrice() {
            let resEl = $('.shopping-cart__result-price-cell');
            let res = cartItems.reduce((sum, productId) => {
                return sum + kapsulaProducts[productId]['price'];
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
    }, {
        offset: '100%'
    });

});