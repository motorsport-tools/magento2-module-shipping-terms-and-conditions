define([
    'jquery',
    "underscore",
    'ko',
    'uiComponent',
    'Magento_Checkout/js/model/quote',
], function ($, _, ko, Component, quote) {
    'use strict';

    let config = window.checkoutConfig.Zero1_ShippingTermsAndConditions;

    var Pattern = function(config){
        console.log('new Pattern', config);
        var self = this;
        this.regex = new RegExp(config.pattern, config.modifiers);
        this.message = config.message;
        this.hasCheckbox = (config.has_checkbox === 'yes');
        this.label = config.label;
        this.isChecked = ko.observable(false);
        this.currentShippingMethod = ko.observable(null);

        this.isApplicable = function(){
            return self.currentShippingMethod() !== null && self.currentShippingMethod().match(self.regex) !== null;
        };
        console.log('Applicable'+ this.isApplicable);
        
        quote.shippingMethod.subscribe(function (newValue) {
            console.log('Sipping method changed: ', newValue);
            self.isChecked(false);
            if ((newValue === true) || (newValue == null) || (quote.shippingMethod() == null)) {
                self.currentShippingMethod(null);
                return;
            }
            var method = newValue.carrier_code + '_' + newValue.method_code;
            this.currentShippingMethod(method);
        }, this);
    }

    return Component.extend({
        defaults: {
            template: 'Zero1_ShippingTermsAndConditions/checkout/shipping/terms-and-conditions'
        },
        currentShippingMethod: ko.observable(null),
        enable: config.enable,
        patterns: [],
        getButton: function() {
            return $('#shipping-method-buttons-container').find('button[data-role="opc-continue"]');
        },
        disableNext: function() {
            // console.log('DISABLE NEXT');
            this.getButton().attr('disabled', 'disabled');
        },
        enableNext: function() {
            // console.log('ENABLE NEXT');
            this.getButton().removeAttr('disabled');
        },
        initialize: function () {
            this._super();
            var self = this;
            if(!self.enable){
                return this;
            }

            var buttonLogic = function(){
                var disableButton = false;
                _.each(self.patterns, function(pattern){
                    console.log('eval pattern', pattern)
                    if(pattern.isApplicable() && pattern.hasCheckbox && !pattern.isChecked()){
                        console.log('diable button', pattern);
                        disableButton = true;
                    }
                })

                if(disableButton){
                    self.disableNext();
                }else{
                    self.enableNext();
                }
            }

            _.each(config.patterns, function(patternConfig){
                let pattern = new Pattern(patternConfig);
                pattern.isChecked.subscribe(function(checked){
                    // console.log('termsAndConditionsAgreed changed', checked);
                    buttonLogic();
                })
                self.patterns.push(pattern);
            })

            quote.shippingMethod.subscribe(function (newValue) {
                console.log('Sipping methood changed: ', newValue);
                if ((newValue === true) || (newValue == null) || (quote.shippingMethod() == null)) {
                    self.currentShippingMethod(null);
                    return;
                }
                var method = newValue.carrier_code + '_' + newValue.method_code;
                this.currentShippingMethod(method);
            }, this);

            self.currentShippingMethod.subscribe(function(newValue){
                // console.log('shipping_method changed', newValue);
                buttonLogic();
            });
            

            return this;
        }
    });
});


