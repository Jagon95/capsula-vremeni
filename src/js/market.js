import help from "./helpers";
import products from 'data/product';
import 'semantic/components/modal';

export default class Market {
    constructor($el) {
        this.wrapper = $el;
        this._initEvents();
        const t = this;

        $('.market__carousel', this.wrapper)
            .on('initialized.owl.carousel', () => {
                this.wrapper.find('.product__title').click(function (e) {
                    let $el = $(this);
                    t.showModalProductDescription($el.data('descriptionId'));
                    e.preventDefault();
                });

                this.wrapper.find('.product__buy-button').click(function () {
                    let $el = $(this);
                    t._fireEvent('addProduct', products[$el.data('productId')]);
                });

                help.refreshWaypoints();
                help.addListiners(this.wrapper);
                this.wrapper.find('.preloader').transition('fade out');
            })
            .owlCarousel(settings.carousel.market);
    }

    toggleButton(active, id) {
        let target = this.wrapper.find(`.product__price-button-group[data-product-id="${id}"]`);
        if(active) {
            target.addClass('active');
        } else {
            target.removeClass('active');
        }
    }

    _fireEvent(event, params) {
        for(let func of this.events[event]) {
            func(params);
        }
    }

    on(event, func) {
        if(this.events.hasOwnProperty(event)) {
            this.events[event].push(func);
        }
    }

    /*eslint-disable */

    events = ['addProduct'];
    /*eslint-enable */
    _initEvents() {
        this.events = this.events.reduce((res, event) => Object.assign(res, {[event]: []}), {});
    }

    showModalProductDescription(productId) {
        let product = products[productId];
        let $m = $('.product-description__modal');
        $m.find('.product-description__image').attr('src',
            settings.images.thumbSrcBase + '/' + product.images[0]);
        $m.find('.product-description__title').text(product.title);
        let descItems = product.description.split('\n').map((text) => $('<p>').text(text));
        $m.find('.product-description__description').empty().append(descItems);
        $m.find('.product-description__price').text(help.prettyNumber(product.price)
            + ' ' + help.i18N('product.currency'));
        $m.modal({
            onApprove: () => {
                this._fireEvent('addProduct', product);
            },
        }).modal('show');
    }

}