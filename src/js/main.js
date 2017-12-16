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
            src: src + '/' + item['name'],
            msrc: msrc ? msrc + '/' + item['name'] : '',
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

    let items = {
        safe: [
            {
                name: 'vip3.jpg',
                w: 1000,
                h: 1000
            },
            {
                name: 'vip4.jpg',
                w: 997,
                h: 1200
            },
        ]
    };
    $('.thumbnail').click(function () {
        let _items = processSrcPaths(items[$(this).data('imageCategory')], 'img/photos', 'img/thumbnails');
        openPhotoSwipe(_items);
    });

    let header = new Headhesive('.menu-header', {
        offset: '#second',
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
        tabs.addClass('d-none');
        controls.removeClass('blue');
        tabs.filter(`[data-tab="${tab}"]`).removeClass('d-none');
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
    

});