import help from 'js/helpers';
import products from 'data/product'
import 'semantic/components/transition';

export default class ShoppingCart {
    /**
     *
     * @param {jquery} $el
     */
    constructor($el) {
        this.disabled = false;
        this.wrapper = $el;
        this._initUi();
        this._initEvents();
        this.productTemplate = $(`[data-product-template=${help.isMobile() ? 'mobile' : 'desktop'}]`, this.wrapper).html();
        $('[data-product-template]');
        this.items = {};
        this.result = 0;
    }

    getResult() {
        return this.result;
    }

    getItems() {
        return this.items;
    }

    /*eslint-disable */     //todo make this works

    ui = {
        emptyHandler: '.shopping-cart__empty-handler',
        body: '.shopping-cart__body',
        result: '.shopping-cart__result-price-cell',
    };

    events = ['addProduct', 'removeProduct', 'disabled'];
    /*eslint-enable */

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

    _initUi() {
        for (let name of Object.keys(this.ui)) {
            this.ui[name] = $(this.ui[name], this.wrapper);
        }
    }

    _initEvents() {
        this.events = this.events.reduce((res, event) => Object.assign(res, {[event]: []}), {});
    }

    addProduct(product) {
        if (this.disabled) {
            return;
        }
        if (this.items.hasOwnProperty(product.id)) {
            return;
        }
        if (Object.keys(this.items).length === 0) {
            this.ui.emptyHandler.transition('fade out', {duration: 0});
        }
        this.items[product.id] = product;
        this._fireEvent('addProduct', product.id);
        let templateData = {
            ...product,
            file: settings.images.thumbSrcBase + '/' + product.images[0],
            index: Object.keys(this.items).length,
            price: help.prettyNumber(product.price)
        };
        let template = this.productTemplate.replace(/data-template-(\w+)/ig, (match, field) => templateData[field]);
        let newElement = $('<div>').html(template).children();
        this.ui.body.append(newElement);
        this._updateResult();
        newElement.transition('fade in', {
            duration: 700,
            onComplete: () => {
                this._addListinersToProduct(newElement);
                help.refreshWaypoints();
            },
        });
    }

    _addListinersToProduct($el) {
        let delBtn = $el.find('.shopping-cart__delete');
        delBtn.click(this.removeProduct.bind(this, delBtn.data('productId')));

        help.addListiners($el);
    }

    removeProduct(id) {
        if (this.disabled) {
            return;
        }
        if (!this.items.hasOwnProperty(id)) {
            return;
        }
        delete this.items[id];
        this._fireEvent('removeProduct', id);
        let productEl = this.ui.body.find(`[data-product-id=${id}]`);
        productEl.transition('fade', {
            onComplete: () => {
                productEl.remove();
                this._updateIndexes();
                this._updateResult();
                if (Object.keys(this.items).length === 0) {
                    this.ui.emptyHandler.transition('fade in');
                }
            },
        });
        help.refreshWaypoints();
    }

    disable() {
        this.disabled = true;
        this._fireEvent('disabled');
    }

    getProductsDescription() {
        return Object.values(this.items).reduce((res, i) => res.concat(i['title']), []).join(', ');
    }

    _updateResult() {
        let res = Object.values(this.items).reduce((sum, product) => {
            return sum + product['price'];
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