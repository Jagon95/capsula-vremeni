import help from "./helpers";
import cities from 'data/cities';
import {delivery} from 'data/product'
import 'semantic/components/dropdown';
import pay from 'exports-loader?pay!./tinkoff';

export default class Order {
    /*eslint-disable */
    ui = {
        steps: '.process-order__steps',
        carousel: '.process-order__carousel',
        deliveryForm: '.process-order__delivery-form',
        processDeliveryButton: '.process-order__delivery .process-order__button-next',
        citiesSelector: '.process-order__city',
        stepBackButton: '.process-order__button-prev',
        processPaymentButton: '.process-order__payment-form .process-order__button-next',
        paymentDescription: '.process-order__payment__description',
        paymentAmount: '.process-order__payment__amount',
        paymentForm: '.process-order__payment-form',
        paymentNumber: '.process-order__payment__number',
        confirmContent: '.process-order__confirm-content',
        confirmNumber: '.process-order__confirm-number',
        confirmDescription: '.process-order__confirm-description',
        confirmResult: '.process-order__confirm-result',
        confirmTel: '.process-order__confirm-tel',
        confirmAddress: '.process-order__confirm-addr',
        confirmName: '.process-order__confirm-name',
    };

    constructor($el) {
        this.wrapper = $el;
        this._initUi();
        this.cityId = null;
        this.data = {};
        this.shoppingCart = null;
        this.steps = ['delivery', 'payment', 'confirm'];
        this.currentStep = this.ui.steps.find('.step.active:first').data('step') || this.steps[0];

        const now = new Date();
        this.data['number'] = (now.getDate() / 100).toFixed(2).slice(2) +
            (now.getMonth() + 1 / 100).toFixed(2).slice(2) +
            (now.getFullYear() / 100).toFixed(2).slice(3) +
            '-0' + Math.random().toFixed(5).slice(2, 5);

        this.ui.carousel
            .on('initialized.owl.carousel', () => {
                help.refreshWaypoints();
                this.ui.processDeliveryButton.click(this.processDelivery.bind(this));
                this.ui.deliveryForm.submit(this.processDelivery.bind(this));
                this.ui.stepBackButton.click(this.stepBack.bind(this));
                this.ui.paymentForm.submit(this.processPayment.bind(this));
                // this.ui.processPaymentButton.click(this.ui.paymentForm.submit.bind(this.ui.paymentForm));
                this.ui.citiesSelector.dropdown();
            })
            .owlCarousel(settings.carousel.order);
    }

    /*eslint-enable */

    _initUi() {
        for (let name of Object.keys(this.ui)) {
            this.ui[name] = $(this.ui[name], this.wrapper);
        }
    }

    /**
     *
     * @param {ShoppingCart} cart
     */
    setShoppingCart(cart) {
        this.shoppingCart = cart;
    }

    _getStep(s) {
        return this.ui.steps.find(`.step[data-step="${s}"]`);
    }

    stepBack() {
        if (this.steps.indexOf(this.currentStep) > 0) {
            let prevStepId = this.steps.indexOf(this.currentStep) - 1;
            this.stepTo(this.steps[prevStepId]);
        }
    }

    stepNext() {
        if (this.steps.indexOf(this.currentStep) !== this.steps.length - 1) {
            let nextStepId = this.steps.indexOf(this.currentStep) + 1;
            this.stepTo(this.steps[nextStepId]);
        }
    }

    stepTo(s) {
        if (!this.steps.includes(s)) {
            return;
        }
        let step = this._getStep(s);
        this.ui.steps.find('.step').removeClass('disabled active completed');
        step.prevAll('.step').addClass('completed');
        step.addClass('active');
        step.nextAll('.step').addClass('disabled');
        this.ui.carousel.trigger('to.owl.carousel', this.steps.indexOf(s));
        this.currentStep = s;
    }

    processDelivery() {
        let cityIndex = parseInt(this.ui.citiesSelector.val());
        if (!Number.isInteger(cityIndex)) {
            $('.process-order__city_field', this.ui.deliveryForm).addClass('error')
                .one('click', function () {
                    $(this).removeClass('error');
                });
            return false;
        }
        let product = {
            ...delivery,
            price: cities[cityIndex]['price'],
            title: delivery['title'] + ' в ' + cities[cityIndex]['name'], // todo i18n
        };
        if (cityIndex !== this.cityId) {
            this.shoppingCart.removeProduct('delivery');
            this.shoppingCart.addProduct(product);
            this.cityId = cityIndex;
        }

        Object.assign(this.data, {
            comment: this.ui.deliveryForm.find('[name="comment"]').val(),
            street: this.ui.deliveryForm.find('[name="street"]').val(),
            house: this.ui.deliveryForm.find('[name="house"]').val(),
            city: cities[cityIndex]['name'],
        });
        this.stepNext();
        return false;
    }

    processPayment(e) {     //todo lock shopping cart
        Object.assign(this.data, {
            description: this.shoppingCart.getProductsDescription(),
            result: this.shoppingCart.getResult(),
            name: this.ui.paymentForm.find('[name="name"]').val(),
            email: this.ui.paymentForm.find('[name="email"]').val(),
            phone: this.ui.paymentForm.find('[name="phone"]').val()
        });

        this.ui.paymentAmount.attr('value', this.data['result']);
        this.ui.paymentDescription.attr('value', this.data['description']);
        this.ui.paymentNumber.attr('value', this.data['number']);
        pay(this.ui.paymentForm.get(0), this.successPayment.bind(this), this.successPayment.bind(this));

        this.shoppingCart.disable();
        return false;
    }

    successPayment() {
        this.stepTo('confirm');
        const c = this.ui.confirmContent;
        c.append($('<p>').append($('<b>').text(help.i18N('order.number') + ': ')).append(this.data['number']));
        c.append($('<p>').append($('<b>').text(help.i18N('order.description') + ': ')).append(this.data['description']));
        c.append($('<p>').append($('<b>').text(help.i18N('order.result') + ': ')).append(this.data['result']));
        c.append($('<p>').append($('<b>').text(help.i18N('order.confirm.tel') + ': ')).append(this.data['phone']));
        c.append($('<p>').append($('<b>').text(help.i18N('order.confirm.name') + ': ')).append(this.data['name']));
        c.append($('<p>').append($('<b>').text(help.i18N('order.confirm.address') + ': '))
            .append(`${this.data['city']}, ${this.data['street']}, ${this.data['house']}`));
    }
};