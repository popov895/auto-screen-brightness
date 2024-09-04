'use strict';

const { GObject } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;

var Preferences = GObject.registerClass(
class Preferences extends GObject.Object {
    static [GObject.GTypeName] = `AutoScreenBrightness_Preferences`;

    static [GObject.properties] = {
        'brightnessOnAc': GObject.ParamSpec.int(
            `brightnessOnAc`, ``, ``,
            GObject.ParamFlags.READWRITE,
            0, 100, 50
        ),
        'brightnessOnBattery': GObject.ParamSpec.int(
            `brightnessOnBattery`, ``, ``,
            GObject.ParamFlags.READWRITE,
            0, 100, 35
        ),
    };

    constructor() {
        super();

        this._keyBrightnessOnAc = `brightness-ac`;
        this._keyBrightnessOnBattery = `brightness-battery`;

        this._settings = ExtensionUtils.getSettings();
        this._settingsChangedHandlerId = this._settings.connect(`changed`, (...[, key]) => {
            switch (key) {
                case this._keyBrightnessOnAc: {
                    this.notify(`brightnessOnAc`);
                    break;
                }
                case this._keyBrightnessOnBattery: {
                    this.notify(`brightnessOnBattery`);
                    break;
                }
                default:
                    break;
            }
        });
    }

    destroy() {
        this._settings.disconnect(this._settingsChangedHandlerId);
    }

    get brightnessOnAc() {
        return this._settings.get_int(this._keyBrightnessOnAc);
    }

    set brightnessOnAc(brightnessOnAc) {
        this._settings.set_int(this._keyBrightnessOnAc, brightnessOnAc);
    }

    get brightnessOnBattery() {
        return this._settings.get_int(this._keyBrightnessOnBattery);
    }

    set brightnessOnBattery(brightnessOnBattery) {
        this._settings.set_int(this._keyBrightnessOnBattery, brightnessOnBattery);
    }
});
