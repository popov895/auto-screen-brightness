'use strict';

const { Gio } = imports.gi;
const { loadInterfaceXML } = imports.misc.fileUtils;

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const { Preferences } = Extension.imports.lib.preferences;

const brightnessInterfaceXml = loadInterfaceXML(`org.gnome.SettingsDaemon.Power.Screen`);
const powerManagerInterfaceXml = loadInterfaceXML(`org.freedesktop.UPower`);

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

        try {
            const brightnessInterfaceInfo = Gio.DBusInterfaceInfo.new_for_xml(brightnessInterfaceXml);
            this._brightnessProxy = new Gio.DBusProxy({
                g_bus_type: Gio.BusType.SESSION,
                g_name: `org.gnome.SettingsDaemon.Power`,
                g_object_path: `/org/gnome/SettingsDaemon/Power`,
                g_interface_info: brightnessInterfaceInfo,
                g_interface_name: brightnessInterfaceInfo.name,
                g_flags: Gio.DBusProxyFlags.NONE,
            });
            this._brightnessProxy.init(null);

            const powerManagerInterfaceInfo = Gio.DBusInterfaceInfo.new_for_xml(powerManagerInterfaceXml);
            this._powerManagerProxy = new Gio.DBusProxy({
                g_bus_type: Gio.BusType.SYSTEM,
                g_name: `org.freedesktop.UPower`,
                g_object_path: `/org/freedesktop/UPower`,
                g_interface_info: powerManagerInterfaceInfo,
                g_interface_name: powerManagerInterfaceInfo.name,
                g_flags: Gio.DBusProxyFlags.NONE,
            });
            this._powerManagerProxy.init(null);
            this._powerManagerProxy.connectObject(`g-properties-changed`, (...[, properties]) => {
                if (properties.lookup_value(`OnBattery`, null) !== null) {
                    this._updateScreenBrightness();
                }
            }, this);

            if (this._brightnessProxy.Brightness !== null) {
                this._updateScreenBrightness();
            } else {
                this._brightnessProxy.connectObject(`g-properties-changed`, (...[, properties]) => {
                    if (properties.lookup_value(`Brightness`, null) !== null) {
                        this._brightnessProxy.disconnectObject(this);
                        this._updateScreenBrightness();
                    }
                }, this);
            }
        } catch (error) {
            console.error(`${Extension.uuid}:`, error);
        }
    }

    disable() {
        // This extension uses the 'unlock-dialog' session mode to be able
        // to switch the screen brightness when the screen is locked.
        this._powerManagerProxy?.disconnectObject(this);
        delete this._powerManagerProxy;

        this._brightnessProxy?.disconnectObject(this);
        delete this._brightnessProxy;

        this._preferences.disconnectObject(this);
        this._preferences.destroy();
        delete this._preferences;
    }

    _updateScreenBrightness() {
        if (this._powerManagerProxy.OnBattery) {
            this._brightnessProxy.Brightness = this._preferences.brightnessOnBattery;
        } else {
            this._brightnessProxy.Brightness = this._preferences.brightnessOnAc;
        }
    }
}

var init = () => {
    return new ExtensionImpl();
};
