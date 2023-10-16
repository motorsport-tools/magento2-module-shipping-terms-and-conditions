define([
    'jquery',
    "underscore",
    'ko',
    'uiComponent',
    'Magento_Checkout/js/model/quote',
    'Magento_InventoryInStorePickupFrontend/js/model/pickup-locations-service',
], function ($, _, ko, Component, quote, pickupLocationsService) {
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
            template: 'Zero1_ShippingTermsAndConditions/checkout/shipping/terms-and-conditions',
        },
        currentShippingMethod: ko.observable(null),
        buttonDisabled: ko.observable(false),
        enable: config.enable,
        patterns: [],
        initialize: function () {
            this._super();
            var self = this;
            if(!self.enable){
                return this;
            }
            this.buttonDisabled.subscribe( function(value) {
                value ? self.disableNext() : self.enableNext();
            });

            quote.shippingMethod.subscribe(function (newValue) {
                
                if ((newValue === true) || (newValue == null) || (quote.shippingMethod() == null)) {
                    self.currentShippingMethod(null);
                    return;
                }
                var method = newValue.carrier_code + '_' + newValue.method_code;
                this.currentShippingMethod(method);
            }, this);

            pickupLocationsService.selectedLocation.subscribe(function(newValue) {
                console.log(newValue);
                setTimeout( function() {
                    self.checkTC();
                }, 4000);
            });

            self.currentShippingMethod.subscribe(function(newValue){
                self.checkTC();
            });
            _.each(config.patterns, function(patternConfig){
                let pattern = new Pattern(patternConfig);
                pattern.isChecked.subscribe(function(checked){
                    self.checkTC();
                });
                self.patterns.push(pattern);
            })
            /* Not the best way, but it works */
            /* Need a little delay to let the Instore Btn KO to enable the button on load with store select */
            setTimeout( function() {
                self.checkTC();
            }, 4000);
            
            return this;
        },
        checkTC: function () {
            var d = false;
            _.each(this.patterns, function(pattern){
                if( ( pattern.isApplicable() && pattern.hasCheckbox && !pattern.isChecked() ) || quote.shippingAddress().postcode == null){
                    d = true;
                }
            })
            this.buttonDisabled(d);
        },
        getButton: function() {
            return $('#checkout-step-store-selector').find('button[data-role="opc-continue"]');
        },
        disableNext: function() {
            this.getButton().attr('disabled', 'disabled');
        },
        enableNext: function() {
            this.getButton().removeAttr('disabled');
        },
    });
});


