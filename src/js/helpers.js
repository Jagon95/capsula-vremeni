import {product as productI18n, processOrder as orderI18n} from 'data/i18n';
import _imageSizes from 'image_sizes';
import products from 'data/product';

const i18n = {
    product: productI18n,
    order: orderI18n,
};

const imageSizes = _imageSizes.reduce(function(obj, item) {
    obj[item.name] = item;
    return obj;
}, {});

module.exports = {

    get: function(obj, i) {
        try {
            return i.split('.').reduce((o, i) => o[i], obj);
        } catch (e) {
            console.error(e.message, 'required key: ' + i);
            return '';
        }
    },

    i18N: function(index) {
        return module.exports.get(i18n, index);
    },

    prettyNumber: function(n) {
        return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    },


    isMobile: function() {
        return /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
            .test(navigator.userAgent || navigator.vendor || window.opera);
    },

    openPhotoSwipe: function(items, index) {
        let pswpElement = $('.pswp:first').get(0);
        let options = {
            history: false,
            focus: false,
            bgOpacity: .9,
            showAnimationDuration: 200,
            hideAnimationDuration: 200,
            index,
        };

        let gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
        gallery.init();
    },

    processImageItems: function(items, src, msrc) {
        return items.reduce((res, item) => {
            if (imageSizes.hasOwnProperty(item)) {
                res.push({
                    src: src + '/' + item,
                    msrc: msrc ? msrc + '/' + item : '',
                    w: imageSizes[item]['width'],
                    h: imageSizes[item]['height'],
                });
            } else {
                console.error(item, 'is not exist in imageSizes object');
            }
            return res;
        }, []);
    },

    addListiners: function(wrapper, context) {
        $('[data-thumbnail-id]', wrapper).css('cursor', 'pointer').click(function() {
            let productId = $(this).data('thumbnailId');
            let items = module.exports.processImageItems(products[productId]['images'],
                settings.images.srcBase, settings.images.thumbSrcBase);
            module.exports.openPhotoSwipe(items);
        });
        if (context) {
            $('[data-request-function]', wrapper).click(function() {
                let el = $(this);
                context[el.data('requestFunction')](el.data('functionArgument'));
            });
        }
        if (!module.exports.isMobile()) {
            $('[data-behavior-dimmer]', wrapper).dimmer({
                on: 'hover',
            });
        }
    },

    refreshWaypoints: function() {
        setTimeout(() => {
            Waypoint.refreshAll();
            $(document).trigger('resize');
        }, 10);
    },

    prepareData: function() {
        if (!settings.logging && console) {
            console.log = function() {
            };
        }

        function translateFields(obj, fields) {
            fields.forEach((i) => {
                obj[i] = module.exports.i18N(obj[i]);
            });
        }

        for (let key of Object.keys(products)) {
            translateFields(products[key], ['title', 'description']);
            products[key]['id'] = key;
        }
    },

};
