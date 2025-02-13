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
        
        quote.shippingMethod.subscribe(function (newValue) {
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
            this.getButton().attr('disabled', 'disabled');
        },
        enableNext: function() {
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
                    if(pattern.isApplicable() && pattern.hasCheckbox && !pattern.isChecked()){
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
                    buttonLogic();
                })
                self.patterns.push(pattern);
            })

            quote.shippingMethod.subscribe(function (newValue) {
                if ((newValue === true) || (newValue == null) || (quote.shippingMethod() == null)) {
                    self.currentShippingMethod(null);
                    return;
                }
                var method = newValue.carrier_code + '_' + newValue.method_code;
                this.currentShippingMethod(method);
            }, this);

            self.currentShippingMethod.subscribe(function(newValue){
                buttonLogic();
            });
            

            return this;
        }
    });
});


