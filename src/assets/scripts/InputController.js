/* eslint-disable camelcase, no-underscore-dangle, no-mixed-operators, object-shorthand, class-methods-use-this, no-undef, expected-return*/
import $ from 'jquery';
import _clamp from 'lodash/clamp';
import _get from 'lodash/get';
import _map from 'lodash/map';
import { SELECTORS } from './constants/selectors';

// Temporary const declaration here to attach to the window AND use as internal propert
const input = {};

/**
 * Enumeration of mouse events returned from $event.which
 *
 * These codes can only be used with jQuery event object.
 *
 * @property MOUSE_EVENTS
 * @type {Object}
 * @final
 */
const MOUSE_EVENTS = {
    LEFT_PRESS: 1,
    MIDDLE_PESS: 2,
    RIGHT_PRESS: 3
};

/**
 * Enumeration of key codes used for inputs.
 *
 * @property KEY_CODES
 * @type {Object}
 * @final
 */
const KEY_CODES = {
    // `+`
    ADD: 107,
    // `-`
    DASH: 189,
    DASH_FIREFOX: 173,
    DIVIDE: 111,
    DOWN_ARROW: 40,
    ENTER: 13,
    // `=`
    EQUALS: 187,
    EQUALS_FIREFOX: 61,
    // `esc`
    ESCAPE: 27,
    LEFT_ARROW: 37,
    MULTIPLY: 106,
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    RIGHT_ARROW: 39,
    SUBTRACT: 109,
    TAB: 9,
    UP_ARROW: 38
};

/**
 * @class InputController
 */
export default class InputController {
    /**
     * @constructor
     */
    constructor($element) {
        this.$element = $element;
        this.$window = null;
        this.$commandInput = null;
        this.$canvases = null;
        this.$sidebar = null;

        this.input = input;
        this.input.command = '';
        this.input.callsign = '';
        this.input.data = '';
        this.input.history = [];
        this.input.history_item = null;
        this.input.click = [0, 0];
        this.input.positions = '';
        this.input.tab_compl = {};
        this.input.mouseDelta = [0, 0];
        this.input.mouseDown = [0, 0];
        this.input.isMouseDown = false;

        this.createChildren()
            .setupHandlers()
            .enable();
    }

    /**
     * @for InputController
     * @method createChildren
     */
    createChildren() {
        this.$window = $(window);
        this.$commandInput = this.$element.find(SELECTORS.DOM_SELECTORS.COMMAND);
        this.$canvases = this.$element.find(SELECTORS.DOM_SELECTORS.CANVASES);
        this.$sidebar = this.$element.find(SELECTORS.DOM_SELECTORS.SIDEBAR);

        return this;
    }

    /**
     * @for InputController
     * @method setupHandlers
     */
    setupHandlers() {
        return this;
    }

    /**
     * @for InputController
     * @method enable
     */
    enable() {
        this.$commandInput.on('keydown', (event) => this.input_keydown(event));
        this.$commandInput.on('input', (event) => this.input_change(event));

        return this;
    }

    /**
     * @for InputController
     * @method disable
     */
    disable() {
        this.$commandInput.off('keydown', (event) => this.input_keydown(event));
        this.$commandInput.off('input', (event) => this.input_change(event));

        return this.destroy();
    }

    /**
     * @for InputController
     * @method destroy
     */
    destroy() {
        this.$element = null;
        this.$window = null;
        this.$commandInput = null;
        this.$canvases = null;
        this.$sidebar = null;

        this.input = input;
        this.input.command = '';
        this.input.callsign = '';
        this.input.data = '';
        this.input.history = [];
        this.input.history_item = null;
        this.input.click = [0, 0];
        this.input.positions = '';
        this.input.tab_compl = {};
        this.input.mouseDelta = [0, 0];
        this.input.mouseDown = [0, 0];
        this.input.isMouseDown = false;

        return this;
    }

    /**
     * @for InputController
     * @method input_init_pre
     */
    input_init_pre() {
        prop.input = input;
        prop.input.command = '';
        prop.input.callsign = '';
        prop.input.data = '';
        prop.input.history = [];
        prop.input.history_item = null;
        prop.input.click = [0, 0];
        prop.input.positions = '';
        prop.input.tab_compl = {};
        prop.input.mouseDelta = [0, 0];
        prop.input.mouseDown = [0, 0];
        prop.input.isMouseDown = false;
    }

    /**
     * @for InputController
     * @method input_init
     */
    input_init() {
        // For firefox see: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
        const is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

        this.$window.keydown((event) => {
            if (event.which === KEY_CODES.ESCAPE) {
                if (prop.tutorial.open) {
                    window.tutorialView.tutorial_close();
                } else if ($(SELECTORS.DOM_SELECTORS.AIRPORT_SWITCH).hasClass(SELECTORS.CLASSNAMES.OPEN)) {
                    ui_airport_close();
                }
            }

            if (event.which === KEY_CODES.DASH || (is_firefox && event.which === KEY_CODES.DASH_FIREFOX)) {
                // Minus key to zoom out, plus to zoom in
                ui_zoom_out();
                return false;
            } else if (event.which === KEY_CODES.EQUALS || (is_firefox && event.which === KEY_CODES.EQUALS_FIREFOX)) {
                if (event.shiftKey) {
                    ui_zoom_in();
                } else {
                    ui_zoom_reset();
                }

                return false;
            }

            if (!prop.tutorial.open) {
                return;
            }

            if (event.which === KEY_CODES.PAGE_UP) {
                window.tutorialView.tutorial_prev();
                event.preventDefault();
            } else if (event.which === KEY_CODES.PAGE_DOWN) {
                window.tutorialView.tutorial_next();
                event.preventDefault();
            }
        });

        this.$canvases.bind('DOMMouseScroll mousewheel', (event) => {
            if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
                ui_zoom_in();
            } else {
                ui_zoom_out();
            }
        });

        this.$canvases.mousemove((event) => {
            if (prop.input.isMouseDown) {
                prop.input.mouseDelta = [
                    event.pageX - prop.input.mouseDown[0],
                    event.pageY - prop.input.mouseDown[1]
                ];
                prop.canvas.panX = prop.input.mouseDelta[0];
                prop.canvas.panY = prop.input.mouseDelta[1];
                prop.canvas.dirty = true;
            }
        });

        this.$canvases.mouseup((event) => {
            prop.input.isMouseDown = false;
        });

        this.$canvases.mousedown((event) => {
            event.preventDefault();

            if (event.which === MOUSE_EVENTS.MIDDLE_PESS) {
                ui_zoom_reset();
            } else if (event.which === MOUSE_EVENTS.LEFT_PRESS) {
                // Record mouse down position for panning
                prop.input.mouseDown = [
                    event.pageX - prop.canvas.panX,
                    event.pageY - prop.canvas.panY
                ];
                prop.input.isMouseDown = true;

                // Aircraft label selection
                let position = [event.pageX, -event.pageY];
                position[0] -= prop.canvas.size.width / 2;
                position[1] += prop.canvas.size.height / 2;

                const nearest = window.aircraftController.aircraft_get_nearest([
                    px_to_km(position[0] - prop.canvas.panX),
                    px_to_km(position[1] + prop.canvas.panY)
                ]);

                if (nearest[0]) {
                    if (nearest[1] < px_to_km(80)) {
                        this.input_select(nearest[0].getCallsign().toUpperCase());
                    } else {
                        this.input_select();
                    }
                }

                position = [
                    px_to_km(position[0]),
                    px_to_km(position[1])
                ];

                position[0] = parseFloat(position[0].toFixed(2));
                position[1] = parseFloat(position[1].toFixed(2));
                prop.input.positions += `[${position.join(',')}]`;

                return false;
            }
        });

        this.$window.keydown(() => {
            if (!window.gameController.game_paused()) {
                this.$commandInput.focus();
            }
        });

        // this.$commandInput.on('keydown', (event) => this.input_keydown(event));
        // this.$commandInput.on('input', (event) => this.input_change(event));
    }

    // _onMouseScroll(event) {
    //     if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
    //         ui_zoom_in();
    //     } else {
    //         ui_zoom_out();
    //     }
    // }

    // _onMouseMove(event) {
    //     if (!prop.input.isMouseDown) {
    //         return this;
    //     }
    //
    //     prop.input.mouseDelta = [
    //         event.pageX - prop.input.mouseDown[0],
    //         event.pageY - prop.input.mouseDown[1]
    //     ];
    //     prop.canvas.panX = prop.input.mouseDelta[0];
    //     prop.canvas.panY = prop.input.mouseDelta[1];
    //     prop.canvas.dirty = true;
    // }

    // _onMouseUp(event) {
    //     prop.input.isMouseDown = false;
    // }

    // _onMouseDown(event) {
    //     event.preventDefault();
    //
    //     if (event.which === MOUSE_EVENTS.MIDDLE_PESS) {
    //         ui_zoom_reset();
    //     } else if (event.which === MOUSE_EVENTS.LEFT_PRESS) {
    //         // Record mouse down position for panning
    //         prop.input.mouseDown = [
    //             event.pageX - prop.canvas.panX,
    //             event.pageY - prop.canvas.panY
    //         ];
    //         prop.input.isMouseDown = true;
    //
    //         // Aircraft label selection
    //         let position = [event.pageX, -event.pageY];
    //         position[0] -= prop.canvas.size.width / 2;
    //         position[1] += prop.canvas.size.height / 2;
    //
    //         const nearest = window.aircraftController.aircraft_get_nearest([
    //             px_to_km(position[0] - prop.canvas.panX),
    //             px_to_km(position[1] + prop.canvas.panY)
    //         ]);
    //
    //         if (nearest[0]) {
    //             if (nearest[1] < px_to_km(80)) {
    //                 this.input_select(nearest[0].getCallsign().toUpperCase());
    //             } else {
    //                 this.input_select();
    //             }
    //         }
    //
    //         position = [
    //             px_to_km(position[0]),
    //             px_to_km(position[1])
    //         ];
    //
    //         position[0] = parseFloat(position[0].toFixed(2));
    //         position[1] = parseFloat(position[1].toFixed(2));
    //         prop.input.positions += `[${position.join(',')}]`;
    //
    //         return false;
    //     }
    // }

    // _onKeydown(event) {
    //     // For firefox see: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
    //     const is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    //
    //     if (!window.gameController.game_paused()) {
    //         this.$commandInput.focus();
    //     }
    //
    //     if (event.which === KEY_CODES.ESCAPE) {
    //         if (prop.tutorial.open) {
    //             window.tutorialView.tutorial_close();
    //         } else if ($(SELECTORS.DOM_SELECTORS.AIRPORT_SWITCH).hasClass(SELECTORS.CLASSNAMES.OPEN)) {
    //             ui_airport_close();
    //         }
    //     }
    //
    //     if (event.which === KEY_CODES.DASH || (is_firefox && event.which === KEY_CODES.DASH_FIREFOX)) {
    //         // Minus key to zoom out, plus to zoom in
    //         ui_zoom_out();
    //         return false;
    //     } else if (event.which === KEY_CODES.EQUALS || (is_firefox && event.which === KEY_CODES.EQUALS_FIREFOX)) {
    //         if (event.shiftKey) {
    //             ui_zoom_in();
    //         } else {
    //             ui_zoom_reset();
    //         }
    //
    //         return false;
    //     }
    //
    //     if (!prop.tutorial.open) {
    //         return;
    //     }
    //
    //     if (event.which === KEY_CODES.PAGE_UP) {
    //         window.tutorialView.tutorial_prev();
    //         event.preventDefault();
    //     } else if (event.which === KEY_CODES.PAGE_DOWN) {
    //         window.tutorialView.tutorial_next();
    //         event.preventDefault();
    //     }
    // }

    /**
     * @for InputController
     * @method input_parse
     */
    input_parse() {
        const $strip = this.$element.find(SELECTORS.DOM_SELECTORS.STRIP);
        $strip.removeClass(SELECTORS.CLASSNAMES.ACTIVE);

        prop.input.callsign = '';
        prop.input.data = '';

        if (prop.input.command.length === 0) {
            return;
        }

        let match = /^\s*(\w+)/.exec(prop.input.command);

        if (!match) {
            return;
        }

        prop.input.callsign = match[1];
        let number = 0;
        // FIXME: this is a very mutable property. perhaps it should be something else?
        match = null;
        prop.canvas.dirty = true;

        for (let i = 0; i < prop.aircraft.list.length; i++) {
            const aircraft = prop.aircraft.list[i];

            if (aircraft.matchCallsign(prop.input.callsign)) {
                number += 1;
                match = aircraft;
                aircraft.html.addClass(SELECTORS.CLASSNAMES.ACTIVE);
            }
        }

        // TODO: this logic block should be either abstracted or simplified.
        if (number === 1 && (
                match.html.offset().top < 0 ||
                (
                    (match.html.offset().top + match.html.height() - this.$sidebar.offset().top) >
                    this.$sidebar.height()
                )
            )
        ) {
            this.$sidebar.scrollTop(this.$sidebar.scrollTop() + match.html.offset().top - (this.$sidebar.height() / 2));
        }
    }

    /**
     * @for InputController
     * @method input_change
     */
    input_change() {
        this.tab_completion_reset();

        prop.input.command = this.$commandInput.val();

        this.input_parse();
    }

    /**
     * @for InputController
     * @method input_select
     * @param callsign {string}
     */
    input_select(callsign) {
        if (callsign) {
            this.$commandInput.val(`${callsign} `);
        } else {
            this.$commandInput.val('');
        }

        this.$commandInput.focus();

        this.input_change();
    }

    /**
     * @for InputController
     * @method input_keydown
     */
    input_keydown(e) {
        const currentCommandInputValue = this.$commandInput.val();

        switch (e.which) {
            case KEY_CODES.ENTER:
                this.input_parse();

                if (this.input_run()) {
                    prop.input.history.unshift(prop.input.callsign);
                    this.$commandInput.val('');
                    prop.input.command = '';

                    this.tab_completion_reset();
                    this.input_parse();
                }

                prop.input.history_item = null;

                break;

            case KEY_CODES.PAGE_UP:
                // recall previous callsign
                this.input_history_prev();
                e.preventDefault();
                break;

            case KEY_CODES.PAGE_DOWN:
                // recall subsequent callsign
                this.input_history_next();
                e.preventDefault();
                break;

            case KEY_CODES.LEFT_ARROW:
                // shortKeys in use
                if (prop.game.option.get('controlMethod') === 'arrows') {
                    this.$commandInput.val(`${currentCommandInputValue} \u2BA2`);
                    e.preventDefault();
                    this.input_change();
                }

                break;

            case KEY_CODES.UP_ARROW:
                if (prop.game.option.get('controlMethod') === 'arrows') { // shortKeys in use
                    this.$commandInput.val(`${currentCommandInputValue} \u2B61`);
                    e.preventDefault();
                    this.input_change();
                } else {
                    // recall previous callsign
                    this.input_history_prev();
                    e.preventDefault();
                }
                break;

            case KEY_CODES.RIGHT_ARROW:
                // shortKeys in use
                if (prop.game.option.get('controlMethod') === 'arrows') {
                    this.$commandInput.val(`${currentCommandInputValue} \u2BA3`);
                    e.preventDefault();
                    this.input_change();
                }

                break;

            case KEY_CODES.DOWN_ARROW:
                if (prop.game.option.get('controlMethod') === 'arrows') { // shortKeys in use
                    this.$commandInput.val(`${currentCommandInputValue} \u2B63`);
                    e.preventDefault();
                    this.input_change();
                } else {
                    // recall previous callsign
                    this.input_history_prev();
                    e.preventDefault();
                }

                break;

            case KEY_CODES.MULTIPLY:
                this.$commandInput.val(`${currentCommandInputValue} \u2B50`);
                e.preventDefault();
                this.input_change();

                break;

            case KEY_CODES.ADD:
                this.$commandInput.val(`${currentCommandInputValue} +`);
                e.preventDefault();
                this.input_change();

                break;

            case KEY_CODES.EQUALS: // mac + (actually `=`)
                this.$commandInput.val(`${currentCommandInputValue} +`);
                e.preventDefault();
                this.input_change();

                break;

            case KEY_CODES.SUBTRACT:
                this.$commandInput.val(`${currentCommandInputValue} -`);
                e.preventDefault();
                this.input_change();

                break;

            case KEY_CODES.DASH: // mac -
                this.$commandInput.val(`${currentCommandInputValue} -`);
                e.preventDefault();
                this.input_change();

                break;

            case KEY_CODES.DIVIDE:
                this.$commandInput.val(`${currentCommandInputValue} takeoff`);
                e.preventDefault();
                this.input_change();

                break;

            case KEY_CODES.TAB:
                if (!prop.input.tab_compl.matches) {
                    this.tab_completion_match();
                }

                this.tab_completion_cycle({ backwards: e.shiftKey });
                e.preventDefault();

                break;

            case KEY_CODES.ESCAPE:
                this.$commandInput.val('');
                e.preventDefault();

                break;
            default:
                break;
        }
    }

    /**
     * @for InputController
     * @method tab_completion_cycle
     * @param opt
     */
    tab_completion_cycle(opt) {
        const matches = prop.input.tab_compl.matches;

        if (!matches || matches.length === 0) {
            return;
        }

        // TODO: this block needs some work. this initial assignment looks to be overwritten every time.
        let i = prop.input.tab_compl.cycle_item;
        if (opt.backwards) {
            i = (i <= 0) ? matches.length - 1 : i - 1;
        } else {
            i = (i >= matches.length - 1) ? 0 : i + 1;
        }

        this.$commandInput.val(matches[i] + ' ');

        prop.input.command = matches[i];
        prop.input.tab_compl.cycle_item = i;

        this.input_parse();
    }

    /**
     * @for InputController
     * @method tab_completion_match
     */
    tab_completion_match() {
        let matches;
        const val = this.$commandInput.val();
        let aircrafts = prop.aircraft.list;

        if (prop.input.callsign) {
            aircrafts = aircrafts.filter(function(a) {
                return a.matchCallsign(prop.input.callsign);
            });
        }

        matches = _map(aircrafts, (aircraft) => {
            return aircraft.getCallsign();
        });

        if (aircrafts.length === 1 && (prop.input.data || val[val.length - 1] === ' ')) {
            // TODO: update inline functions
            matches = aircrafts[0].COMMANDS.filter(function(c) {
                return c.toLowerCase().indexOf(prop.input.data.toLowerCase()) === 0;
            })
            .map(function(c) {
                return val.substring(0, prop.input.callsign.length + 1) + c;
            });
        }

        this.tab_completion_reset();

        prop.input.tab_compl.matches = matches;
        prop.input.tab_compl.cycle_item = -1;
    }

    /**
     * @for InputController
     * @method tab_completion_reset
     */
    tab_completion_reset() {
        prop.input.tab_compl = {};
    }

    /**
     * @for InputController
     * @method input_history_clamp
     */
    input_history_clamp() {
        prop.input.history_item = _clamp(0, prop.input.history_item, prop.input.history.length - 1);
    }

    /**
     * @for InputController
     * @method input_history_prev
     */
    input_history_prev() {
        if (prop.input.history.length === 0) {
            return;
        }

        if (prop.input.history_item == null) {
            prop.input.history.unshift(prop.input.command);
            prop.input.history_item = 0;
        }

        prop.input.history_item += 1;
        this.input_history_clamp();

        const command = `${prop.input.history[prop.input.history_item]} `;
        this.$commandInput.val(command.toUpperCase());

        this.input_change();
    }

    /**
     * @for InputController
     * @method input_history_next
     */
    input_history_next() {
        if (prop.input.history.length === 0 || !prop.input.history_item) {
            return;
        }

        prop.input.history_item -= 1;

        if (prop.input.history_item <= 0) {
            this.$commandInput.val(prop.input.history[0]);

            this.input_change();

            prop.input.history.splice(0, 1);
            prop.input.history_item = null;

            return;
        }

        this.input_history_clamp();

        const command = `${prop.input.history[prop.input.history_item]} `;

        this.$commandInput.val(command.toUpperCase());
        this.input_change();
    }

    /**
     * @for InputController
     * @method input_run
     */
    input_run() {
        let result;

        // TODO: does this need to be in a try/catch?
        // TODO: abstract this to another method and only hanlde the return with this method.
        try {
            result = zlsa.atc.Parser.parse(prop.input.command.trim().toLowerCase());
        } catch (error) {
            if (_get(error, 'name', '') === 'SyntaxError') {
                ui_log('Command not understood');

                return;
            }

            throw error;
        }

        // TODO: convert `result.command === { }` to a switch statement
        if (result.command === 'version') {
            ui_log(`Air Traffic Control simulator version ${prop.version.join('.')}`);

            return true;
        } else if (result.command === 'tutorial') {
            window.tutorialView.tutorial_toggle();

            return true;
        } else if (result.command === 'auto') {
            // TODO: this is undefined
            aircraft_toggle_auto();

            if (prop.aircraft.auto.enabled) {
                ui_log('automatic controller ENGAGED');
            } else {
                ui_log('automatic controller OFF');
            }

            return true;
        } else if (result.command === 'pause') {
            window.gameController.game_pause_toggle();
            return true;
        } else if (result.command === 'timewarp') {
            if (result.args) {
                prop.game.speedup = result.args;
            } else {
                window.gameController.game_timewarp_toggle();
            }

            return true;
        } else if (result.command === 'clear') {
            localStorage.clear();
            location.reload();
        } else if (result.command === 'airport') {
            if (result.args) {
                if (result.args.toLowerCase() in prop.airport.airports) {
                    window.airportController.airport_set(result.args.toLowerCase());
                } else {
                    ui_airport_toggle();
                }
            } else {
                ui_airport_toggle();
            }

            return true;
        } else if (result.command === 'rate') {
            if (result.args && result.args > 0) {
                prop.game.frequency = result.args;
            }

            return true;
        } else if (result.command !== 'transmit') {
            return true;
        }

        let matches = 0;
        let match = -1;

        for (let i = 0; i < prop.aircraft.list.length; i++) {
            const aircraft = prop.aircraft.list[i];

            if (aircraft.matchCallsign(result.callsign)) {
                matches += 1;
                match = i;
            }
        }

        if (matches > 1) {
            ui_log('multiple aircraft match the callsign, say again');

            return true;
        }

        if (match === -1) {
            ui_log('no such aircraft, say again');

            return true;
        }

        const aircraft = prop.aircraft.list[match];

        return aircraft.runCommands(result.args);
    }
}
