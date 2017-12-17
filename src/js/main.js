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

    // $('[data-animate-type]').waypoint(function() {
    //     $(this).addClass('fadeInLeft');
    // }, { offset: '100%'});

    $('[data-animate-type]').addClass('fade animated').waypoint(function () {
        let el = $(this.element);
        el.addClass(el.data('animateType'));
    }, {
        offset: '50%'
    });

    //     let el = $(e);
    //     el.addClass('fade');
    //     new Waypoint({
    //         element: e,
    //         handler: function() {
    //             el.addClass(el.data('animatedType')).removeClass('fade');
    //             console.log(el.data('animatedType'));
    //         }
    //     });
    // });
    // let waypoint = new Waypoint({
    //     element: document.getElementById('basic-waypoint'),
    //     handler: function() {
    //         notify('Basic waypoint triggered')
    //     }
    // });

    $('[data-thumbnail-id]').click(function () {
        let productId = $(this).data('thumbnailId');
        let items = processSrcPaths(kapsulaProducts[productId]['images'], 'img/photos', 'img/thumbnails');
        openPhotoSwipe(items);
    });

    let header = new Headhesive('.menu-header', {
        offset: '#about_capsule',
        offsetSide: 'top',
        classes: {
            clone:   'header--clone',
            stick:   'header--stick',
            unstick: 'header--unstick'
        }
    });


    let controls = $('.tab-controllers [data-tab]');
    let tabs = $('.tabs [data-tab]');
    let tabContainer = $('.tabs-container');
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

    controls.click(function () {
        switchTo($(this).data('tab'))
    });


    const productTemplate = $('#product-template').html();
    let counter = 0;
    function addToCart() {
        let newElement = $('<div>').html(productTemplate).children();
        newElement.find('[data-template-index]').html(++counter);
        $('.shopping-cart__body').append(newElement);
    }
    window.a = addToCart;

});