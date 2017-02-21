import VIDEO_EVENTS, { VIDI_PLAYBACK_STATUSES } from '../../constants/events/video';
import UI_EVENTS from '../../constants/events/ui';

import View from './overlay.view';

import styles from './overlay.scss';


const DEFAULT_CONFIG = {
  poster: ''
};

export default class Overlay {
  constructor({ config, eventEmitter, vidi }) {
    this.eventEmitter = eventEmitter;
    this.isHidden = false;
    this.isContentHidden = false;
    this.enabled = true;
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
    this.vidi = vidi;

    this._initUI(this.config.poster);
    this._bindEvents();
  }

  get node() {
    return this.view.$node;
  }

  _initUI(src) {
    this.view = new View(src);
  }

  _bindEvents() {
    this._playVideo = this._playVideo.bind(this);

    this.view.$playWrapper.on('click', this._playVideo);

    this.eventEmitter.on(VIDEO_EVENTS.PLAYBACK_STATUS_CHANGED, this._updatePlayingStatus, this);
  }

  _updatePlayingStatus(status) {
    if (status === VIDI_PLAYBACK_STATUSES.PLAYING || status === VIDI_PLAYBACK_STATUSES.PLAYING_BUFFERING) {
      if (!this.isContentHidden) {
        this._hideContent();
      }
    } else if (status === VIDI_PLAYBACK_STATUSES.ENDED) {
      this._showContent();
    }
  }

  _playVideo() {
    this.vidi.play();
    this._hideContent();

    this.eventEmitter.emit(UI_EVENTS.PLAY_OVERLAY_TRIGGERED);
  }

  _hideContent() {
    this.isContentHidden = true;
    this.view.$content.addClass(styles.hidden);
  }

  _showContent() {
    this.isContentHidden = false;
    this.view.$content.removeClass(styles.hidden);
  }

  setBackgroundSrc(src) {
    this.view.$content.css('background-image', `url('${src}')`);
  }

  hide() {
    this._hideContent();
    this.isHidden = true;
    this.view.$node.addClass(styles.hidden);
  }

  show() {
    this._showContent();
    this.isHidden = false;
    this.view.$node.removeClass(styles.hidden);
  }

  _unbindEvents() {
    this.view.$playWrapper.off('click', this._playVideo);

    this.eventEmitter.off(VIDEO_EVENTS.PLAYBACK_STATUS_CHANGED, this._updatePlayingStatus, this);
  }

  destroy() {
    this._unbindEvents();
    this.view.destroy();
    delete this.view;

    delete this.eventEmitter;
    delete this.vidi;
  }
}
