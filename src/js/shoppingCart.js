import help from 'js/helpers';
import products from 'data/product'
import 'semantic/components/transition';

export default class ShoppingCart {
    /**
     *
     * @param {jquery} $el
     */
    constructor($el) {
        this.wrapper = $el;
        this._initUi();
        this._initEvents();
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
    /*eslint-disable */     //todo make this works

    ui = {
        emptyHandler: '.shopping-cart__empty-handler',
        body: '.shopping-cart__body',
        result: '.shopping-cart__result-price-cell',
    };

    events = ['addProduct', 'removeProduct'];
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
        if (this.items.indexOf(product.id) !== -1) {
            return;
        }
        if (this.items.length === 0) {
            this.ui.emptyHandler.transition('fade out', {duration: 0});
        }
        this.items.push(product.id);
        this._fireEvent('addProduct', product.id);
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
        let index = this.items.indexOf(id);
        if (index === -1) {
            return;
        }
        this.items.splice(index, 1);
        this._fireEvent('removeProduct', id);
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
        return this.items.reduce((res, i) => res.concat(products[i]['title']), []).join(', ');
    }

    _updateResult() {
        let res = this.items.reduce((sum, productId) => {
            return sum + products[productId]['price'];
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