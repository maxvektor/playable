import { IChromecastManager } from './types';
import { IEventEmitter } from '../event-emitter/types';
import { IMediaSource, IPlaybackEngine } from '../playback-engine/types';
import CastContext = cast.framework.CastContext;
import RemotePlayerController = cast.framework.RemotePlayerController;
import RemotePlayerChangedEvent = cast.framework.RemotePlayerChangedEvent;

type PatchedWindow = Window & {
  __onGCastApiAvailable: Function;
};

const FRAMEWORK_LINK =
  'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';

export default class ChromecastManager implements IChromecastManager {
  static moduleName = 'chromecastManager';
  static dependencies = ['eventEmitter', 'engine', 'rootContainer'];

  private _eventEmitter: IEventEmitter;
  private _engine: IPlaybackEngine;
  private _context: CastContext;
  private _remotePlayar: RemotePlayerController;

  constructor({
    eventEmitter,
    engine,
  }: {
    engine: IPlaybackEngine;
    eventEmitter: IEventEmitter;
  }) {
    this._eventEmitter = eventEmitter;
    this._engine = engine;

    this._initCastFramework = this._initCastFramework.bind(this);
    this._onChange = this._onChange.bind(this);

    this._bindEvents();
    this._insertCastCallback();

    console.log(this._eventEmitter, this._engine);
  }

  _insertCastCallback() {
    (window as PatchedWindow).__onGCastApiAvailable = this._initCastFramework;

    const head = document.getElementsByTagName('head')[0];
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = FRAMEWORK_LINK;
    head.appendChild(script);
  }

  _initCastFramework(isAvailable: boolean) {
    if (isAvailable) {
      this._context = cast.framework.CastContext.getInstance();

      this._context.setOptions({
        receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      });

      this._bindToContextEvents();
      this._bindToRemotePlayer();
    }
  }

  private _bindToRemotePlayer() {
    const player = new cast.framework.RemotePlayer();
    const playerController = new cast.framework.RemotePlayerController(player);

    this._remotePlayar = playerController;

    const onCurrentTimeChange = this._onCurrentTimeChange.bind(this);

    this._remotePlayar.addEventListener(
      cast.framework.RemotePlayerEventType.ANY_CHANGE,
      e => {
        switch (e.field) {
          case 'currentTime':
            onCurrentTimeChange(e);
            break;

          default:
            console.log('EVENT', e);
            break;
        }
      },
    );
  }

  private _bindToContextEvents() {
    const context = this._context;
    const engine = this._engine;
    console.log('this._engine', this._engine);

    context.addEventListener(
      cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
      function(event) {
        console.log('event', event);

        switch (event.sessionState) {
          case cast.framework.SessionState.SESSION_STARTED:
            const { url, type } = engine.getSrc() as IMediaSource;
            const startTime = engine.getCurrentTime();

            const castSession = context.getCurrentSession();
            const mediaInfo = new chrome.cast.media.MediaInfo(url, type);
            const request = new chrome.cast.media.LoadRequest(mediaInfo);
            request.currentTime = startTime;

            engine.pause();

            castSession
              .loadMedia(request)
              .then(e => console.log('yes!', e))
              .catch(e => console.log('noooo!', e));

            break;
          case cast.framework.SessionState.SESSION_RESUMED:
            console.log(event.sessionState);
            break;
          case cast.framework.SessionState.SESSION_ENDED:
            console.log(event.sessionState);
            console.log('CastContext: CastSession disconnected');
            // Update locally as necessary
            break;
          default:
            break;
        }
      },
    );
  }

  private _onChange() {
    return false;
  }

  private _bindEvents() {
    return false;
  }

  private _onCurrentTimeChange(e: RemotePlayerChangedEvent) {
    this._engine.seekTo(e.value);
  }

  get isCasting() {
    return false;
  }

  get isEnabled() {
    return false;
  }

  destroy() {
    this._eventEmitter = null;
    this._engine = null;
  }
}
