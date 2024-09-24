'use strict';

const { Gio } = imports.gi;
const { loadInterfaceXML } = imports.misc.fileUtils;

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const { Preferences } = Extension.imports.lib.preferences;

const BrightnessProxy = Gio.DBusProxy.makeProxyWrapper(
    loadInterfaceXML(`org.gnome.SettingsDaemon.Power.Screen`)
);

const PowerManagerProxy = Gio.DBusProxy.makeProxyWrapper(
    loadInterfaceXML(`org.freedesktop.UPower`)
);

class ExtensionImpl {
    enable() {
        this._preferences = new Preferences();
        this._preferences.connectObject(`notify::brightnessOnAc`, () => {
            if (this._powerManagerProxy?.OnBattery === false) {
                this._updateScreenBrightness();
            }
        }, this);
        this._preferences.connectObject(`notify::brightnessOnBattery`, () => {
            if (this._powerManagerProxy?.OnBattery === true) {
                this._updateScreenBrightness();
            }
        }, this);

        this._brightnessProxy = new BrightnessProxy(
            Gio.DBus.session,
            `org.gnome.SettingsDaemon.Power`,
            `/org/gnome/SettingsDaemon/Power`,
            (...[, error]) => {
                if (error) {
                    this._logError(error);
                }
            }
        );
        this._brightnessProxy.connectObject(`g-properties-changed`, (...[, properties]) => {
            if (properties.lookup_value(`Brightness`, null) !== null) {
                this._brightnessProxy.disconnectObject(this);
                this._updateScreenBrightness();
            }
        }, this);

        this._powerManagerProxy = new PowerManagerProxy(
            Gio.DBus.system,
            `org.freedesktop.UPower`,
            `/org/freedesktop/UPower`,
            (...[, error]) => {
                if (error) {
                    this._logError(error);
                }
            }
        );
        this._powerManagerProxy.connectObject(`g-properties-changed`, (...[, properties]) => {
            if (properties.lookup_value(`OnBattery`, null) !== null) {
                this._updateScreenBrightness();
            }
        }, this);
    }

    disable() {
        // This extension uses the 'unlock-dialog' session mode to be able
        // to switch the screen brightness when the screen is locked.
        this._powerManagerProxy.disconnectObject(this);
        delete this._powerManagerProxy;

        this._brightnessProxy.disconnectObject(this);
        delete this._brightnessProxy;

        this._preferences.disconnectObject(this);
        this._preferences.destroy();
        delete this._preferences;
    }

    _updateScreenBrightness() {
        if (this._brightnessProxy.Brightness === null || this._powerManagerProxy.OnBattery === null) {
            return;
        }

        if (this._powerManagerProxy.OnBattery) {
            this._brightnessProxy.Brightness = this._preferences.brightnessOnBattery;
        } else {
            this._brightnessProxy.Brightness = this._preferences.brightnessOnAc;
        }
    }

    _logError(error) {
        console.error(`${Extension.uuid}:`, error);
    }
}

var init = () => {
    return new ExtensionImpl();
};
