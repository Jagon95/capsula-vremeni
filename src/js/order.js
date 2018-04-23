import help from "./helpers";
import cities from 'data/cities';
import {delivery} from 'data/product'
import 'semantic/components/dropdown';
import 'semantic/components/form';
import 'semantic/components/checkbox';
import 'imports-loader?this=>window!micro-requirejs';
import Raven from 'raven-js';

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
        paymentForm: '.process-order__payment-form',
        confirmContent: '.process-order__confirm-content',
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
            ((now.getMonth() + 1) / 100).toFixed(2).slice(2) +
            (now.getFullYear() / 100).toFixed(2).slice(3) +
            '-0' + Math.random().toFixed(5).slice(2, 5);

        this.ui.stepBackButton.click(() => {
            this.stepBack();
            this.wrapper.find('.error').removeClass('error');
            this.wrapper.find('.ui.prompt').remove();
        });
        this.wrapper.find('.ui.checkbox').checkbox();
        this.ui.citiesSelector.dropdown({
            direction: 'downward'
        });

        this.ui.deliveryForm.form({
            fields: {               //todo i18n
                city: {
                    rules: [{
                        type: 'integer',
                        value: `0..${cities.length}`,
                        prompt: 'Выберите {name}'
                    }]
                },
            },
            // inline: true,
            on: 'blur',
            onSuccess: this.processDelivery.bind(this)
        });
        this.ui.paymentForm.form({
            fields: {
                terms: {
                    rules: [{
                        type: 'checked',
                        prompt: 'Необходимо согласиться на обработку персональных данных'
                    }]
                },
                name: {
                    rules: [{
                        type: 'empty',
                        prompt: 'Введите {name}'
                    }]
                },
                email: {
                    rules: [{
                        type: 'email',
                        prompt: 'Введите {name}'
                    }]
                },
                phone: {
                    rules: [{
                        type: 'regExp',
                        value: /^\+?[\d\-\s()]{5,24}$/,
                        prompt: 'Введите номер телефона в формате +7 123 456 78 90'
                    }]
                }
                // name: 'empty',
                // email: 'email',
                // phone: 'regExp[/^\\+?[\\d\\-\\s\\(\\)]{5,24}$/]'
            },
            on: 'blur',
            // inline: true,
            onSuccess: this.processPayment.bind(this)
        });

        this.ui.carousel
            .on('initialized.owl.carousel', () => {
                help.refreshWaypoints();
                // this.ui.processDeliveryButton.click(this.processDelivery.bind(this));
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
        const form = this.ui.deliveryForm;
        let cityIndex = parseInt(this.ui.citiesSelector.val());
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
        const address = help.i18N('order.city') + ': ' + cities[cityIndex]['name'] + ', ' +
            help.i18N('order.street.label') + ': ' + (form.find('[name="street"]').val() || '-') + ', ' +
            help.i18N('order.house.label')  + ': ' + (form.find('[name="house"]').val()  || '-');

        Object.assign(this.data, {
            comment: form.find('[name="comment"]').val(),
            delivery: address,
        });

        this.stepTo('payment');
        return false;
    }

    processPayment() {
        Object.assign(this.data, {
            description: this.shoppingCart.getProductsDescription(),
            result: this.shoppingCart.getResult(),
            name: this.ui.paymentForm.find('[name="name"]').val(),
            email: this.ui.paymentForm.find('[name="email"]').val(),
            phone: this.ui.paymentForm.find('[name="phone"]').val()
        });

        $.ajax('action.php?action=order', {
            method: 'POST',
            data: this.data
        }).fail(() => {
            Raven.captureMessage('Fail to send data to action.php', {
                level: 'error',
                extra: this.data
            });
        });
        this.sendPayment();

        this.shoppingCart.disable();
        return false;
    }

    sendPayment() {
        rjs.define( '//static.yandex.net/checkout/ui/v1?yapayui.js', 'yaPayUi');
        rjs.require(['yaPayUi'], () => {
            const $checkout = YandexCheckoutUI(123456, {
                language: 'ru',                 // TODO: move to config
                domSelector: '.my-selector',
                amount: this.data.result
            });
            $checkout.open();

            $checkout.on('yc_success', () => {
                this.successPayment();
            });
            $checkout.on('yc_error', response => {
                Raven.captureMessage('Fail to process payment', {
                    level: 'error',
                    extra: response
                });
            });
        });
    }

    successPayment() {
        this.stepTo('confirm');         //todo refactor
        const c = this.ui.confirmContent;
        c.append($('<p>').append($('<b>').text(help.i18N('order.number') + ': ')).append(this.data['number']));
        c.append($('<p>').append($('<b>').text(help.i18N('order.description') + ': ')).append(this.data['description']));
        c.append($('<p>').append($('<b>').html(help.i18N('order.result') + ': ')).append(help.prettyNumber(this.data['result']) +
            ' ' + help.i18N('product.currency')));
        c.append($('<p>').append($('<b>').text(help.i18N('order.confirm.tel') + ': ')).append(this.data['phone']));
        c.append($('<p>').append($('<b>').text(help.i18N('order.confirm.name') + ': ')).append(this.data['name']));
        c.append($('<p>').append($('<b>').text(help.i18N('order.confirm.address') + ': ')).append(this.data['delivery']));
    }
};