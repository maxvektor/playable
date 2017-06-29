import VIDEO_EVENTS from '../constants/events/video';


export const REPORT_REASONS = {
  LONG_INITIAL_VIDEO_PARTS_LOADING: 'long-initial-video-parts-loading',
  LONG_METADATA_LOADING: 'long-metadata-loading',
  LONG_SEEK_PROCESSING: 'long-seek-processing',
  BUFFER_EMPTY_FOR_CURRENT_SEGMENT: 'buffer-empty-for-current-segment',
  LONG_PLAY_REQUESTED_PROCESSING: 'long-play-requested-processing'
};

export const DELAYED_REPORT_TYPES = {
  INITIAL_VIDEO_PARTS_LOADING: { id: '_initialVideoPartsLoading', timeoutTime: 5000 },
  METADATA_LOADING: { id: '_metadataLoading', timeoutTime: 5000 },
  RUNTIME_LOADING: { id: '_runtimeLoading', timeoutTime: 5000 }
};

export default class AnomalyBloodhound {
  static dependencies = ['eventEmitter', 'engine', 'config'];

  constructor({ engine, eventEmitter, config }) {
    this._config = {
      ...config.anomalyBloodhound
    };
    this._engine = engine;
    this._eventEmitter = eventEmitter;

    this._timeoutContainer = Object.create(null);

    this._bindEvents();
  }

  _bindEvents() {
    this._eventEmitter.on(VIDEO_EVENTS.STATE_CHANGED, this._processStateChange, this);
  }

  _unbindEvents() {
    this._eventEmitter.off(VIDEO_EVENTS.STATE_CHANGED, this._processStateChange, this);
  }

  _processStateChange({ prevState, nextState }) {
    const { STATES } = this._engine;

    switch (nextState) {
      case STATES.LOAD_STARTED:
        if (this._engine.isAutoPlayAvailable || this._engine.isPreloadAvailable) {
          this.startDelayedReport(
            DELAYED_REPORT_TYPES.METADATA_LOADING,
            REPORT_REASONS.LONG_METADATA_LOADING
          );
        }
        break;

      case STATES.METADATA_LOADED:
        if (this.isDelayedReportExist(DELAYED_REPORT_TYPES.METADATA_LOADING)) {
          this.stopDelayedReport(DELAYED_REPORT_TYPES.METADATA_LOADING);

          if (this._engine.getPreload() !== 'metadata') {
            this.startDelayedReport(
              DELAYED_REPORT_TYPES.INITIAL_VIDEO_PARTS_LOADING,
              REPORT_REASONS.LONG_INITIAL_VIDEO_PARTS_LOADING
            );
          }
        }
        break;

      case STATES.READY_TO_PLAY:
        if (this.isDelayedReportExist(DELAYED_REPORT_TYPES.INITIAL_VIDEO_PARTS_LOADING)) {
          this.stopDelayedReport(DELAYED_REPORT_TYPES.INITIAL_VIDEO_PARTS_LOADING);
        }
        if (this.isDelayedReportExist(DELAYED_REPORT_TYPES.RUNTIME_LOADING)) {
          this.stopDelayedReport(DELAYED_REPORT_TYPES.RUNTIME_LOADING);
        }
        break;

      case STATES.SEEK_IN_PROGRESS:
        if (prevState === STATES.PAUSED) {
          this.startDelayedReport(
            DELAYED_REPORT_TYPES.RUNTIME_LOADING,
            REPORT_REASONS.LONG_SEEK_PROCESSING
          );
        }
        break;

      case STATES.WAITING:
        switch (prevState) {
          case STATES.PLAYING:
            this.reportDebugInfo({ reason: REPORT_REASONS.BUFFER_EMPTY_FOR_CURRENT_SEGMENT });
            break;

          case STATES.PLAY_REQUESTED:
            if (!this.isDelayedReportExist(DELAYED_REPORT_TYPES.RUNTIME_LOADING)) {
              this.startDelayedReport(
                DELAYED_REPORT_TYPES.RUNTIME_LOADING,
                REPORT_REASONS.LONG_PLAY_REQUESTED_PROCESSING
              );
            }
            break;

          default: break;
        }
        break;

      case STATES.PLAYING:
        if (this.isDelayedReportExist(DELAYED_REPORT_TYPES.RUNTIME_LOADING)) {
          this.stopDelayedReport(DELAYED_REPORT_TYPES.RUNTIME_LOADING);
        }
        break;
      default: break;
    }
  }

  isDelayedReportExist(type) {
    return Boolean(this._timeoutContainer[type.id]);
  }

  startDelayedReport(type, reason) {
    if (this.isDelayedReportExist(type)) {
      this.stopDelayedReport(type);
    }

    const startTS = Date.now();
    this._timeoutContainer[type.id] = setTimeout(
      () => {
        const endTS = Date.now();
        this._timeoutContainer[type.id] = null;
        this.reportDebugInfo({
          reason,
          startTS,
          endTS
        });
      },
      type.timeoutTime
    );
  }

  stopDelayedReport(type) {
    clearTimeout(this._timeoutContainer[type.id]);
    this._timeoutContainer[type.id] = null;
  }

  stopAllDelayedReports() {
    Object.keys(this._timeoutContainer).forEach(key => {
      clearTimeout(this._timeoutContainer[key]);
      this._timeoutContainer[key] = null;
    });
  }

  reportDebugInfo({ reason, startTS, endTS }) {
    if (typeof this._config.callback === 'function') {
      this._config.callback({
        reason,
        startTS,
        endTS,
        ...this._engine.getDebugInfo()
      });
    } else {
      console.log( // eslint-disable-line no-console
        `REASON: ${reason}; startTS: ${startTS}; endTS: ${endTS}`,
        this._engine.getDebugInfo()
      );
    }
  }

  destroy() {
    this.stopAllDelayedReports();

    this._unbindEvents();

    delete this._eventEmitter;
    delete this._engine;
    delete this._timeoutContainer;
    delete this._config;
  }
}
