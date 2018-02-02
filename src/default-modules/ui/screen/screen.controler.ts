import * as get from 'lodash/get';
import { UI_EVENTS, STATES } from '../../../constants/index';

import View from './screen.view';

const PLAYBACK_CHANGE_TIMEOUT = 300;

const DEFAULT_CONFIG = {
  disableClickProcessing: false,
  nativeControls: false,
};

export interface IScreenConfig {
  disableClickProcessing?: boolean;
  nativeControls?: boolean;
}

export default class Screen {
  static View = View;
  static dependencies = [
    'engine',
    'eventEmitter',
    'config',
    'fullScreenManager',
    'interactionIndicator',
    'rootContainer',
  ];

  private _eventEmitter;
  private _engine;
  private _fullScreenManager;
  private _interactionIndicator;

  private _delayedToggleVideoPlaybackTimeout;

  private _disableClickProcessing: boolean;
  private _isInFullScreen: boolean;

  view: View;
  isHidden: boolean;

  constructor({
    config,
    eventEmitter,
    engine,
    fullScreenManager,
    interactionIndicator,
    rootContainer,
  }) {
    this._eventEmitter = eventEmitter;
    this._engine = engine;
    this._fullScreenManager = fullScreenManager;
    this._interactionIndicator = interactionIndicator;

    this._isInFullScreen = false;
    this.isHidden = false;

    this._delayedToggleVideoPlaybackTimeout = null;

    this._disableClickProcessing = get(
      config.screen,
      'disableClickProcessing',
      DEFAULT_CONFIG.disableClickProcessing,
    );

    this._bindCallbacks();
    this._initUI(
      get(config.screen, 'nativeControls', DEFAULT_CONFIG.nativeControls),
    );
    this._bindEvents();

    rootContainer.appendComponentNode(this.node);
  }

  get node() {
    return this.view.getNode();
  }

  _bindCallbacks() {
    this._processNodeClick = this._processNodeClick.bind(this);
    this._processNodeDblClick = this._processNodeDblClick.bind(this);
    this._toggleVideoPlayback = this._toggleVideoPlayback.bind(this);
  }

  _initUI(isNativeControls) {
    const config = {
      nativeControls: isNativeControls,
      callbacks: {
        onWrapperMouseClick: undefined,
        onWrapperMouseDblClick: undefined,
      },
      playbackViewNode: this._engine.getNode(),
    };

    if (!this._disableClickProcessing) {
      config.callbacks.onWrapperMouseClick = this._processNodeClick;
      config.callbacks.onWrapperMouseDblClick = this._processNodeDblClick;
    }

    this.view = new View(config);
  }

  _bindEvents() {
    this._eventEmitter.on(
      UI_EVENTS.FULLSCREEN_STATUS_CHANGED,
      this._setFullScreenStatus,
      this,
    );
    this._eventEmitter.on(
      UI_EVENTS.PLAY_OVERLAY_TRIGGERED,
      this.view.focusOnNode,
      this.view,
    );
  }

  _unbindEvents() {
    this._eventEmitter.off(
      UI_EVENTS.FULLSCREEN_STATUS_CHANGED,
      this._setFullScreenStatus,
      this,
    );
    this._eventEmitter.off(
      UI_EVENTS.PLAY_OVERLAY_TRIGGERED,
      this.view.focusOnNode,
      this.view,
    );
  }

  showTopShadow() {
    this.view.showTopShadow();
  }

  hideTopShadow() {
    this.view.hideTopShadow();
  }

  showBottomShadow() {
    this.view.showBottomShadow();
  }

  hideBottomShadow() {
    this.view.hideBottomShadow();
  }

  _setFullScreenStatus(isInFullScreen) {
    this._isInFullScreen = isInFullScreen;
  }

  _processNodeClick() {
    this._showPlaybackChangeIndicator();

    if (
      !this._fullScreenManager.isEnabled ||
      this._fullScreenManager._enterFullScreenOnPlay
    ) {
      this._toggleVideoPlayback();
    } else {
      this._setDelayedPlaybackToggle();
    }
  }

  _processNodeDblClick() {
    if (
      this._fullScreenManager.isEnabled ||
      !this._fullScreenManager._enterFullScreenOnPlay
    ) {
      if (this._isDelayedPlaybackToggleExist) {
        this._clearDelayedPlaybackToggle();
        this._hideDelayedPlaybackChangeIndicator();
      }

      this._toggleFullScreen();
    }
  }

  _showPlaybackChangeIndicator() {
    const state = this._engine.getCurrentState();

    if (state === STATES.PLAY_REQUESTED || state === STATES.PLAYING) {
      this._interactionIndicator.showPause();
    } else {
      this._interactionIndicator.showPlay();
    }
  }

  _hideDelayedPlaybackChangeIndicator() {
    this._interactionIndicator.hideIcons();
  }

  _setDelayedPlaybackToggle() {
    this._clearDelayedPlaybackToggle();

    this._delayedToggleVideoPlaybackTimeout = setTimeout(
      this._toggleVideoPlayback,
      PLAYBACK_CHANGE_TIMEOUT,
    );
  }

  _clearDelayedPlaybackToggle() {
    clearTimeout(this._delayedToggleVideoPlaybackTimeout);
    this._delayedToggleVideoPlaybackTimeout = null;
  }

  get _isDelayedPlaybackToggleExist() {
    return Boolean(this._delayedToggleVideoPlaybackTimeout);
  }

  _toggleVideoPlayback() {
    this._clearDelayedPlaybackToggle();

    const state = this._engine.getCurrentState();

    if (state === STATES.PLAY_REQUESTED || state === STATES.PLAYING) {
      this._eventEmitter.emit(UI_EVENTS.PAUSE_WITH_SCREEN_CLICK_TRIGGERED);
      this._engine.pause();
    } else {
      this._eventEmitter.emit(UI_EVENTS.PLAY_WITH_SCREEN_CLICK_TRIGGERED);
      this._engine.play();
    }
  }

  _toggleFullScreen() {
    if (this._isInFullScreen) {
      this._exitFullScreen();
    } else {
      this._enterFullScreen();
    }
  }

  hide() {
    if (!this.isHidden) {
      this.view.hide();
      this.isHidden = true;
    }
  }

  show() {
    if (this.isHidden) {
      this.view.show();
      this.isHidden = false;
    }
  }

  _enterFullScreen() {
    this._fullScreenManager.enterFullScreen();
  }

  _exitFullScreen() {
    this._fullScreenManager.exitFullScreen();
  }

  destroy() {
    this._unbindEvents();

    this._clearDelayedPlaybackToggle();
    this.view.destroy();
    delete this.view;

    delete this._interactionIndicator;
    delete this._eventEmitter;
    delete this._engine;
    delete this._fullScreenManager;
  }
}
