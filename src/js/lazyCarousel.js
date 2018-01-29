$.fn.owlCarousel.Constructor.prototype.preloadAutoWidthImages = function (images) {
    const owl = this;

    function onLoadImg(e) {
        if (e.type === 'error') {
            this.closest('.owl-item').remove();
        } else {
            this.attr('src', e.target.src);
            this.css('opacity', 1);
        }
        owl.leave('pre-loading');
        !owl.is('initializing') && owl.refresh();
        this.trigger('lazyload-after');
    }

    function loadImg($el) {
        owl.enter('pre-loading');
        return $(new Image()).attr('src', $el.attr('src')
            || $el.attr('data-src')
            || $el.attr('data-src-retina'));
    }

    function loadAfter($el, $prev) {
        if ($prev.offset().left + $prev.width() < $(window).width()) {
            loadImg($el).one('load error', $.proxy(onLoadImg, $el));
        } else {
            owl.$element.trigger($.Event('owl.load-visible', {element: owl.$element}));
            owl.$element.one('translated.owl.carousel resized.owl.carousel',
                () => loadAfter($el, $prev));
        }
    }

    images.slice(0, owl.settings.items).each($.proxy(function (i, element) {
        let $el = $(element);
        loadImg($el).one('load error', $.proxy(onLoadImg, $el));
    }));

    this.$element.one('initialized.owl.carousel', () => {
        let $el = $(images.get(owl.settings.items));
        loadImg($el).one('load error', $.proxy(onLoadImg, $el));
        for (let i = owl.settings.items + 1; i < images.length; ++i) {
            let $el = $(images.get(i));
            let $prev = $(images.get(i - 1));
            $prev.one('lazyload-after', () => {
                loadAfter($el, $prev);
            });
        }
    });
};