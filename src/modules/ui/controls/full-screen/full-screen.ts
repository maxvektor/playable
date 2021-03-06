import { UI_EVENTS } from '../../../../constants';

import KeyboardInterceptor, {
  KEYCODES,
} from '../../../../utils/keyboard-interceptor';

import View from './full-screen.view';

import { IEventEmitter } from '../../../event-emitter/types';
import { ITooltipService } from '../../core/tooltip/types';
import { IFullScreenControl, IFullScreenViewConfig } from './types';
import { IFullScreenManager } from '../../../full-screen-manager/types';
import { ITextMap } from '../../../text-map/types';
import { IThemeService } from '../../core/theme';

export default class FullScreenControl implements IFullScreenControl {
  static moduleName = 'fullScreenControl';
  static View = View;
  static dependencies = [
    'eventEmitter',
    'fullScreenManager',
    'textMap',
    'tooltipService',
    'theme',
  ];

  private _eventEmitter: IEventEmitter;
  private _fullScreenManager: IFullScreenManager;
  private _textMap: ITextMap;
  private _interceptor: KeyboardInterceptor;
  private _tooltipService: ITooltipService;
  private _theme: IThemeService;

  private _unbindEvents: Function;

  view: View;
  isHidden: boolean;

  constructor({
    eventEmitter,
    fullScreenManager,
    textMap,
    tooltipService,
    theme,
  }: {
    eventEmitter: IEventEmitter;
    fullScreenManager: IFullScreenManager;
    textMap: ITextMap;
    tooltipService: ITooltipService;
    theme: IThemeService;
  }) {
    this._eventEmitter = eventEmitter;
    this._fullScreenManager = fullScreenManager;
    this._textMap = textMap;
    this._theme = theme;
    this._tooltipService = tooltipService;

    this._bindCallbacks();

    this._initUI();

    this._bindEvents();

    if (!this._fullScreenManager.isEnabled) {
      this.hide();
    }

    this._initInterceptor();
  }

  getElement() {
    return this.view.getElement();
  }

  private _bindCallbacks() {
    this._toggleFullScreen = this._toggleFullScreen.bind(this);
  }

  private _bindEvents() {
    this._unbindEvents = this._eventEmitter.bindEvents(
      [[UI_EVENTS.FULL_SCREEN_STATE_CHANGED, this.view.setFullScreenState]],
      this.view,
    );
  }

  private _initUI() {
    const config: IFullScreenViewConfig = {
      callbacks: {
        onButtonClick: this._toggleFullScreen,
      },
      textMap: this._textMap,
      tooltipService: this._tooltipService,
      theme: this._theme,
    };

    this.view = new FullScreenControl.View(config);
  }

  private _initInterceptor() {
    this._interceptor = new KeyboardInterceptor(this.getElement(), {
      [KEYCODES.SPACE_BAR]: (e: Event) => {
        e.stopPropagation();
        this._eventEmitter.emit(UI_EVENTS.KEYBOARD_KEYDOWN_INTERCEPTED);
      },
      [KEYCODES.ENTER]: (e: Event) => {
        e.stopPropagation();
        this._eventEmitter.emit(UI_EVENTS.KEYBOARD_KEYDOWN_INTERCEPTED);
      },
    });
  }

  private _destroyInterceptor() {
    this._interceptor.destroy();
  }

  private _toggleFullScreen() {
    if (this._fullScreenManager.isInFullScreen) {
      this._fullScreenManager.exitFullScreen();
      this._eventEmitter.emit(UI_EVENTS.EXIT_FULL_SCREEN_CLICK);
    } else {
      this._fullScreenManager.enterFullScreen();
      this._eventEmitter.emit(UI_EVENTS.ENTER_FULL_SCREEN_CLICK);
    }
  }

  hide() {
    this.isHidden = true;
    this.view.hide();
  }

  show() {
    this.isHidden = false;
    this.view.show();
  }

  destroy() {
    this._destroyInterceptor();
    this._unbindEvents();
    this.view.destroy();
    this.view = null;

    this._eventEmitter = null;
    this._fullScreenManager = null;
    this._textMap = null;
    this._theme = null;
  }
}
