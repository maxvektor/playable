import { ITopButtons } from './types';

import View from './top-buttons.view';
import { ITextMap } from '../../text-map/types';
import { ITooltipService } from '../core/tooltip/types';

import KeyboardInterceptor, {
  KEYCODES,
} from '../../../utils/keyboard-interceptor';
import { IEventEmitter } from '../../event-emitter/types';
import { UI_EVENTS } from '../../../constants';

//tslint:disable-next-line
const _noop = () => {};

export default class TopButtons implements ITopButtons {
  static moduleName = 'topButtons';
  static dependencies = ['textMap', 'tooltipService', 'eventEmitter'];
  static View = View;

  private _eventEmitter: IEventEmitter;

  private _buyButtonInterceptor: KeyboardInterceptor;
  private _infoButtonInterceptor: KeyboardInterceptor;
  private _shareButtonInterceptor: KeyboardInterceptor;
  private _cardsButtonInterceptor: KeyboardInterceptor;
  private _commentsButtonInterceptor: KeyboardInterceptor;

  private _infoCallback: () => void = _noop;
  private _buyCallback: () => void = _noop;
  private _shareCallback: () => void = _noop;
  private _cardsCallback: () => void = _noop;
  private _commentsCallback: () => void = _noop;

  isHidden: boolean;
  view: View;

  constructor({
    eventEmitter,
    textMap,
    tooltipService,
  }: {
    eventEmitter: IEventEmitter;
    textMap: ITextMap;
    tooltipService: ITooltipService;
  }) {
    this.isHidden = false;
    this._eventEmitter = eventEmitter;

    this._bindCallbacks();
    this._initUI(textMap, tooltipService);
    this._initInterceptors();
  }

  private _initUI(textMap: ITextMap, tooltipService: ITooltipService) {
    this.view = new TopButtons.View({
      callbacks: {
        buyClick: this._broadcastBuyClick,
        infoClick: this._broadcastInfoClick,
        shareClick: this._broadcastShareClick,
        cardsClick: this._broadcastCardsClick,
        commentsClick: this._broadcastCommentsClick,
      },
      textMap,
      tooltipService,
    });
  }

  private _bindCallbacks() {
    this._broadcastInfoClick = this._broadcastInfoClick.bind(this);
    this._broadcastBuyClick = this._broadcastBuyClick.bind(this);
    this._broadcastShareClick = this._broadcastShareClick.bind(this);
    this._broadcastCardsClick = this._broadcastCardsClick.bind(this);
    this._broadcastCommentsClick = this._broadcastCommentsClick.bind(this);
  }

  private _initInterceptors() {
    this._buyButtonInterceptor = new KeyboardInterceptor(
      this.view.getBuyButtonElement(),
      {
        [KEYCODES.SPACE_BAR]: this._getInterceptor(this._broadcastBuyClick),
        [KEYCODES.ENTER]: this._getInterceptor(this._broadcastBuyClick),
      },
    );
    this._infoButtonInterceptor = new KeyboardInterceptor(
      this.view.getInfoButtonElement(),
      {
        [KEYCODES.SPACE_BAR]: this._getInterceptor(this._broadcastInfoClick),
        [KEYCODES.ENTER]: this._getInterceptor(this._broadcastInfoClick),
      },
    );
    this._shareButtonInterceptor = new KeyboardInterceptor(
      this.view.getShareButtonElement(),
      {
        [KEYCODES.SPACE_BAR]: this._getInterceptor(this._broadcastShareClick),
        [KEYCODES.ENTER]: this._getInterceptor(this._broadcastShareClick),
      },
    );
    this._cardsButtonInterceptor = new KeyboardInterceptor(
      this.view.getCardsButtonElement(),
      {
        [KEYCODES.SPACE_BAR]: this._getInterceptor(this._broadcastCardsClick),
        [KEYCODES.ENTER]: this._getInterceptor(this._broadcastCardsClick),
      },
    );
    this._commentsButtonInterceptor = new KeyboardInterceptor(
      this.view.getCommentsButtonElement(),
      {
        [KEYCODES.SPACE_BAR]: this._getInterceptor(
          this._broadcastCommentsClick,
        ),
        [KEYCODES.ENTER]: this._getInterceptor(this._broadcastCommentsClick),
      },
    );
  }

  private _destroyInterceptor() {
    this._buyButtonInterceptor.destroy();
    this._infoButtonInterceptor.destroy();
    this._shareButtonInterceptor.destroy();
    this._cardsButtonInterceptor.destroy();
    this._commentsButtonInterceptor.destroy();
  }

  private _getInterceptor(callback: () => void) {
    return (e: Event) => {
      e.stopPropagation();

      this._eventEmitter.emit(UI_EVENTS.KEYBOARD_KEYDOWN_INTERCEPTED);
      callback();
    };
  }

  private _broadcastInfoClick() {
    console.log('info click');
    this._infoCallback();
  }

  private _broadcastBuyClick() {
    console.log('buy click');
    this._buyCallback();
  }

  private _broadcastShareClick() {
    console.log('share click');
    this._shareCallback();
  }

  private _broadcastCardsClick() {
    console.log('cards click');
    this._cardsCallback();
  }

  private _broadcastCommentsClick() {
    console.log('comments click');
    this._commentsCallback();
  }

  setClickCallbacks({
    info,
    buy,
    share,
    comments,
    cards,
  }: {
    [key: string]: () => void;
  }) {
    this._infoCallback = info || this._infoCallback;
    this._buyCallback = buy || this._buyCallback;
    this._shareCallback = share || this._shareCallback;
    this._commentsCallback = comments || this._commentsCallback;
    this._cardsCallback = cards || this._cardsCallback;
  }

  setBuyButtonTooltip(text: string) {
    this.view.setBuyButtonTooltip(text);
  }

  getElement() {
    return this.view.getElement();
  }

  destroy() {
    this._destroyInterceptor();
    this.view.destroy();
    this.view = null;
  }
}
