'use strict';

import Adw from 'gi://Adw';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import { Preferences } from './lib/preferences.js';
import { _ } from './lib/utils.js';

export default class extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window._preferences = new Preferences(this);
        window.connect(`close-request`, () => {
            window._preferences.destroy();
        });

        const brightnessOnAcSpinBox = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 100,
                step_increment: 1,
            }),
            valign: Gtk.Align.CENTER,
        });
        window._preferences.bind_property(
            `brightnessOnAc`,
            brightnessOnAcSpinBox,
            `value`,
            GObject.BindingFlags.BIDIRECTIONAL | GObject.BindingFlags.SYNC_CREATE
        );

        const brightnessOnAcRow = new Adw.ActionRow({
            activatable_widget: brightnessOnAcSpinBox,
            title: _(`On AC`),
        });
        brightnessOnAcRow.add_suffix(brightnessOnAcSpinBox);

        const brightnessOnBatterySpinBox = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 100,
                step_increment: 1,
            }),
            valign: Gtk.Align.CENTER,
        });
        window._preferences.bind_property(
            `brightnessOnBattery`,
            brightnessOnBatterySpinBox,
            `value`,
            GObject.BindingFlags.BIDIRECTIONAL | GObject.BindingFlags.SYNC_CREATE
        );

        const brightnessOnBatteryRow = new Adw.ActionRow({
            activatable_widget: brightnessOnBatterySpinBox,
            title: _(`On Battery`),
        });
        brightnessOnBatteryRow.add_suffix(brightnessOnBatterySpinBox);

        const screenBrightnessGroup = new Adw.PreferencesGroup({
            title: _(`Screen Brightness`),
        });
        screenBrightnessGroup.add(brightnessOnAcRow);
        screenBrightnessGroup.add(brightnessOnBatteryRow);

        const page = new Adw.PreferencesPage();
        page.add(screenBrightnessGroup);

        window.add(page);
    }
}
