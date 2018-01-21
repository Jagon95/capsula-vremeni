$.fn.owlCarousel.Constructor.prototype.preloadAutoWidthImages = function (images) {
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

    images.slice(0, owl.settings.items).each($.proxy(function (i, element) {
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