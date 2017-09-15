import View from './progress.view';

import { getOverallBufferedPercent, getOverallPlayedPercent } from '../../../../utils/video-data';

import { VIDEO_EVENTS, UI_EVENTS, STATES } from '../../../../constants/index';
import { AMOUNT_TO_SKIP_SECONDS } from '../../../keyboard-control/keyboard-control';

import KeyboardInterceptor, { KEYCODES } from '../../../../utils/keyboard-interceptor';


const UPDATE_INTERVAL_DELAY = 1000 / 60;

export default class ProgressControl {
  static View = View;
  static dependencies = ['engine', 'eventEmitter'];

  constructor({ engine, eventEmitter }) {
    this._engine = engine;
    this._eventEmitter = eventEmitter;

    this._isUserInteracting = false;
    this._currentProgress = 0;

    this._bindCallbacks();
    this._initUI();
    this._bindEvents();
    this.view.setState({
      played: 0,
      buffered: 0
    });

    this._initInterceptor();
  }

  get node() {
    return this.view.getNode();
  }

  _bindEvents() {
    this._eventEmitter.on(VIDEO_EVENTS.STATE_CHANGED, this._toggleIntervalUpdates, this);
    this._eventEmitter.on(VIDEO_EVENTS.CHUNK_LOADED, this._updateBufferIndicator, this);
  }

  _initUI() {
    const config = {
      callbacks: {
        onChangePlayedProgress: this._changePlayedProgress,
        onUserInteractionStart: this._onUserInteractionStarts,
        onUserInteractionEnd: this._onUserInteractionEnds
      }
    };

    this.view = new this.constructor.View(config);
  }

  _initInterceptor() {
    this._interceptor = new KeyboardInterceptor({
      node: this.view.$input[0],
      callbacks: {
        [KEYCODES.UP_ARROW]: e => {
          e.stopPropagation();
          e.preventDefault();
          this._eventEmitter.emit(UI_EVENTS.KEYBOARD_KEYDOWN_INTERCEPTED);
          this._eventEmitter.emit(UI_EVENTS.GO_FORWARD_WITH_KEYBOARD_TRIGGERED);
          this._engine.goForward(AMOUNT_TO_SKIP_SECONDS);
        },
        [KEYCODES.DOWN_ARROW]: e => {
          e.stopPropagation();
          e.preventDefault();
          this._eventEmitter.emit(UI_EVENTS.KEYBOARD_KEYDOWN_INTERCEPTED);
          this._eventEmitter.emit(UI_EVENTS.GO_BACKWARD_WITH_KEYBOARD_TRIGGERED);
          this._engine.goBackward(AMOUNT_TO_SKIP_SECONDS);
        },
        [KEYCODES.RIGHT_ARROW]: e => {
          e.stopPropagation();
          e.preventDefault();
          this._eventEmitter.emit(UI_EVENTS.KEYBOARD_KEYDOWN_INTERCEPTED);
          this._eventEmitter.emit(UI_EVENTS.GO_FORWARD_WITH_KEYBOARD_TRIGGERED);
          this._engine.goForward(AMOUNT_TO_SKIP_SECONDS);
        },
        [KEYCODES.LEFT_ARROW]: e => {
          e.stopPropagation();
          e.preventDefault();
          this._eventEmitter.emit(UI_EVENTS.KEYBOARD_KEYDOWN_INTERCEPTED);
          this._eventEmitter.emit(UI_EVENTS.GO_BACKWARD_WITH_KEYBOARD_TRIGGERED);
          this._engine.goBackward(AMOUNT_TO_SKIP_SECONDS);
        }
      }
    });
  }

  _destroyInterceptor() {
    this._interceptor.destroy();
  }

  _bindCallbacks() {
    this._updateControlOnInterval = this._updateControlOnInterval.bind(this);
    this._changePlayedProgress = this._changePlayedProgress.bind(this);
    this._onUserInteractionStarts = this._onUserInteractionStarts.bind(this);
    this._onUserInteractionEnds = this._onUserInteractionEnds.bind(this);
    this._toggleIntervalUpdates = this._toggleIntervalUpdates.bind(this);
    this._playVideoOnProgressManipulationEnd = this._playVideoOnProgressManipulationEnd.bind(this);
  }

  _changePlayedProgress(value) {
    if (this._currentProgress === value) {
      return;
    }

    this._currentProgress = value;
    this._changeCurrentTimeOfVideo(this._currentProgress / 100);
  }

  _startIntervalUpdates() {
    if (this._updateControlInterval) {
      this._stopIntervalUpdates();
    }

    this._updateControlInterval = setInterval(this._updateControlOnInterval, UPDATE_INTERVAL_DELAY);
  }

  _stopIntervalUpdates() {
    clearInterval(this._updateControlInterval);
    this._updateControlInterval = null;
  }

  _onUserInteractionStarts() {
    if (!this._isUserInteracting) {
      this._isUserInteracting = true;
      this._pauseVideoOnProgressManipulationStart();
    }
  }

  _onUserInteractionEnds() {
    if (this._isUserInteracting) {
      this._isUserInteracting = false;
      this._updatePlayedIndicator();
      this._playVideoOnProgressManipulationEnd();
    }
  }

  _updateControlOnInterval() {
    this._updatePlayedIndicator();
    this._updateBufferIndicator();
  }

  _toggleIntervalUpdates({ nextState }) {
    switch (nextState) {
      case STATES.SRC_SET:
        this.reset();
        break;
      case STATES.PLAYING:
        this._startIntervalUpdates();
        break;
      case STATES.SEEK_IN_PROGRESS:
        this._updatePlayedIndicator();
        this._updateBufferIndicator();
        break;
      default:
        this._stopIntervalUpdates();
        break;
    }
  }

  _changeCurrentTimeOfVideo(percent) {
    const duration = this._engine.getDurationTime();

    this._engine.setCurrentTime(duration * percent);

    this._eventEmitter.emit(UI_EVENTS.PROGRESS_CHANGE_TRIGGERED, percent);
  }

  _pauseVideoOnProgressManipulationStart() {
    const currentState = this._engine.getCurrentState();

    if (
      currentState === STATES.PLAYING ||
      currentState === STATES.PLAY_REQUESTED
    ) {
      this._shouldPlayAfterManipulationEnd = true;
      this._engine.pause();
    }
    this._eventEmitter.emit(UI_EVENTS.PROGRESS_MANIPULATION_STARTED);
  }

  _playVideoOnProgressManipulationEnd() {
    if (this._shouldPlayAfterManipulationEnd) {
      this._engine.play();

      this._shouldPlayAfterManipulationEnd = false;
    }

    this._eventEmitter.emit(UI_EVENTS.PROGRESS_MANIPULATION_ENDED);
  }

  _updateBufferIndicator() {
    const currentTime = this._engine.getCurrentTime();
    const buffered = this._engine.getBuffered();
    const duration = this._engine.getDurationTime();

    this.updateBuffered(getOverallBufferedPercent(buffered, currentTime, duration));
  }

  _updatePlayedIndicator() {
    const currentTime = this._engine.getCurrentTime();
    const duration = this._engine.getDurationTime();

    this.updatePlayed(getOverallPlayedPercent(currentTime, duration));
  }

  updatePlayed(percent) {
    if (!this._isUserInteracting) {
      this._currentProgress = percent;
      this.view.setState({ played: this._currentProgress });
    }
  }

  updateBuffered(percent) {
    this.view.setState({ buffered: percent });
  }

  hide() {
    this.isHidden = true;
    this.view.hide();
  }

  show() {
    this.isHidden = false;
    this.view.show();
  }

  _unbindEvents() {
    this._eventEmitter.off(VIDEO_EVENTS.STATE_CHANGED, this._toggleIntervalUpdates, this);
    this._eventEmitter.off(VIDEO_EVENTS.CHUNK_LOADED, this._updateBufferIndicator, this);
  }

  reset() {
    this.updatePlayed(0);
    this.updateBuffered(0);
  }

  destroy() {
    this._destroyInterceptor();
    this._stopIntervalUpdates();
    this._unbindEvents();
    this.view.destroy();
    delete this.view;

    delete this._eventEmitter;
    delete this._engine;

    this._isUserInteracting = null;
    this._currentProgress = null;
    this.isHidden = null;
  }
}
