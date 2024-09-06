'use strict';

import Gio from 'gi://Gio';
import { loadInterfaceXML } from 'resource:///org/gnome/shell/misc/fileUtils.js';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import { Preferences } from './lib/preferences.js';

const BrightnessInterface = loadInterfaceXML(`org.gnome.SettingsDaemon.Power.Screen`);
const BrightnessProxy = Gio.DBusProxy.makeProxyWrapper(BrightnessInterface);

const PowerManagerInterface = loadInterfaceXML(`org.freedesktop.UPower`);
const PowerManagerProxy = Gio.DBusProxy.makeProxyWrapper(PowerManagerInterface);

export default class extends Extension {
    async enable() {
        this._preferences = new Preferences(this);
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

        try {
            this._brightnessProxy = await new Promise((resolve, reject) => {
                new BrightnessProxy(
                    Gio.DBus.session,
                    `org.gnome.SettingsDaemon.Power`,
                    `/org/gnome/SettingsDaemon/Power`,
                    (proxy, error) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(proxy);
                        }
                    }
                );
            });

            this._powerManagerProxy = await new Promise((resolve, reject) => {
                new PowerManagerProxy(
                    Gio.DBus.system,
                    `org.freedesktop.UPower`,
                    `/org/freedesktop/UPower`,
                    (proxy, error) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(proxy);
                        }
                    }
                );
            });
            this._updateScreenBrightness();
            this._powerManagerProxy.connectObject(`g-properties-changed`, (...[, properties]) => {
                if (properties.lookup_value(`OnBattery`, null) !== null) {
                    this._updateScreenBrightness();
                }
            }, this);
        } catch (error) {
            console.error(`${Extension.uuid}:`, error);
        }
    }

    disable() {
        // This extension uses the 'unlock-dialog' session mode to be able
        // to switch the screen brightness when the screen is locked.
        this._powerManagerProxy?.disconnectObject(this);
        delete this._powerManagerProxy;

        delete this._brightnessProxy;

        this._preferences.disconnectObject(this);
        this._preferences.destroy();
        delete this._preferences;
    }

    _updateScreenBrightness() {
        if (!this._brightnessProxy || !this._powerManagerProxy) {
            return;
        }

        if (this._powerManagerProxy.OnBattery) {
            this._brightnessProxy.Brightness = this._preferences.brightnessOnBattery;
        } else {
            this._brightnessProxy.Brightness = this._preferences.brightnessOnAc;
        }
    }
}
