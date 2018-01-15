import help from 'js/helpers';

module.exports = class ShoppingCart {
    /**
     *
     * @param {jquery} $el
     * @param {array} products
     */
    constructor($el, products) {
        this.products = products;
        this.wrapper = $el;
        this._initUi();
        this.productTemplate = $(`[data-product-template=${help.isMobile() ? 'mobile' : 'desktop'}]`, this.wrapper).html();
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
    /*eslint-disable */

    ui = {
        emptyHandler: '.shopping-cart__empty-handler',
        body: '.shopping-cart__body',
        result: '.shopping-cart__result-price-cell',
    };
    /*eslint-enable */

    _initUi() {
        this.ui = {
            emptyHandler: $('.shopping-cart__empty-handler', this.wrapper),
            body: $('.shopping-cart__body', this.wrapper),
            result: $('.shopping-cart__result-price-cell', this.wrapper),
        };
    }

    addProduct(product) {
        const requests = {      //todo remove
            removeFromCart: this.removeProduct.bind(this),
        };
        if (this.items.indexOf(product.id) !== -1) {
            return;
        }
        if (this.items.length === 0) {
            this.ui.emptyHandler.transition('fade out', {duration: 0});
        }
        this.items.push(product.id);
        $(`.product__price-button-group[data-product-id="${product.id}"]`).addClass('active'); // todo: remove
        let templateData = {
            ...product,
            file: settings.images.thumbSrcBase + '/' + product.images[0],
            index: this.items.length,
            price: help.prettyNumber(product.price)
        };
        let template = this.productTemplate.replace(/data-template-(\w+)/ig, (match, field) => templateData[field]);
        let newElement = $('<div>').html(template).children();
        this.ui.body.append(newElement);
        this._updateResult();
        newElement.transition('fade in', {
            duration: 700,
            onComplete: function() {
                help.addListiners(newElement, requests);
                help.refreshWaypoints();
            },
        });
    }

    removeProduct(id) {
        let index = this.items.indexOf(id);
        if (index === -1) {
            return;
        }
        this.items.splice(index, 1);
        $(`.product__price-button-group[data-product-id="${id}"]`).removeClass('active'); // todo: remove
        let productEl = this.ui.body.find(`[data-product-id=${id}]`);
        productEl.transition('fade', {
            onComplete: () => {
                productEl.remove();
                this._updateIndexes();
                this._updateResult();
                if (this.items.length === 0) {
                    this.ui.emptyHandler.transition('fade in');
                }
            },
        });
        help.refreshWaypoints();
    }

    getProductsDescription() {
        return this.items.reduce((res, i) => res.concat(this.products[i]['title']), []).join(', ');
    }

    _updateResult() {
        let res = this.items.reduce((sum, productId) => {
            return sum + this.products[productId]['price'];
        }, 0);
        this.ui.result.html(help.prettyNumber(res));
        this.result = res;
    }

    _updateIndexes() {
        let counter = 0;
        this.ui.body.find('.shopping-cart__number_cell').each(function() {
            $(this).html(++counter);
        });
    }
};