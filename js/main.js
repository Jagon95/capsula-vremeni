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
            ...item,
            src: src + '/' + item['name'],
            msrc: msrc ? msrc + '/' + item['name'] : ''
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
    $('.tumbnail').click(function () {
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
    

});