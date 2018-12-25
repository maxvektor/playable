import View from '../core/view';
import { IView } from '../core/types';

import htmlToElement from '../core/htmlToElement';
import getElementByHook from '../core/getElementByHook';

import {
  topButtonsTemplate,
  infoButtonTemplate,
  buyButtonTemplate,
  cardsButtonTemplate,
  commentsButtonTemplate,
  shareButtonTemplate,
} from './templates';

import {
  ITopButtonsViewStyles,
  ITopButtonsViewConfig,
  ITopButtonsViewCallbacks,
} from './types';

import styles from './top-buttons.scss';
import { TEXT_LABELS } from '../../../constants';
import { ITooltipReference, ITooltipService } from '../core/tooltip/types';
import { ITextMap } from '../../text-map/types';

class TopButtonsView extends View<ITopButtonsViewStyles>
  implements IView<ITopButtonsViewStyles> {
  private _$rootElement: HTMLElement;
  private _$buttonsContainer: HTMLElement;
  private _$toggler: HTMLElement;
  private _$infoButton: HTMLElement;
  private _$buyButton: HTMLElement;
  private _$cardsButton: HTMLElement;
  private _$commentsButton: HTMLElement;
  private _$shareButton: HTMLElement;

  private _callbacks: ITopButtonsViewCallbacks;

  private _buyTooltipReference: ITooltipReference;
  private _infoTooltipReference: ITooltipReference;
  private _shareTooltipReference: ITooltipReference;
  private _cardsTooltipReference: ITooltipReference;
  private _commentsTooltipReference: ITooltipReference;

  private _timeoutID: number;
  constructor(config: ITopButtonsViewConfig) {
    super();

    const { callbacks, tooltipService, textMap } = config;
    this._callbacks = callbacks;

    this._bindCallbacks();

    this._initDOM(textMap);
    this._createTooltips(tooltipService, textMap);

    this._bindEvents();

    this.reset();
  }

  getElement() {
    return this._$rootElement;
  }

  private _initDOM(textMap: ITextMap) {
    this._$rootElement = htmlToElement(
      topButtonsTemplate({
        styles: this.styleNames,
      }),
    );

    this._$buttonsContainer = getElementByHook(
      this._$rootElement,
      'buttons-container',
    );

    this._$toggler = getElementByHook(this._$rootElement, 'toggler');
    this._$infoButton = htmlToElement(
      infoButtonTemplate({
        styles: this.styleNames,
        texts: {
          label: textMap.get(TEXT_LABELS.INFO_BUTTON_LABEL),
        },
      }),
    );
    this._$buyButton = htmlToElement(
      buyButtonTemplate({
        styles: this.styleNames,
        texts: {
          label: textMap.get(TEXT_LABELS.BUY_BUTTON_DEFAULT_LABEL),
        },
      }),
    );
    this._$cardsButton = htmlToElement(
      cardsButtonTemplate({
        styles: this.styleNames,
        texts: {
          label: textMap.get(TEXT_LABELS.CARDS_BUTTON_LABEL),
        },
      }),
    );
    this._$commentsButton = htmlToElement(
      commentsButtonTemplate({
        styles: this.styleNames,
        texts: {
          label: textMap.get(TEXT_LABELS.COMMENTS_BUTTON_LABEL),
        },
      }),
    );
    this._$shareButton = htmlToElement(
      shareButtonTemplate({
        styles: this.styleNames,
        texts: {
          label: textMap.get(TEXT_LABELS.SHARE_BUTTON_LABEL),
        },
      }),
    );

    this._$buttonsContainer.appendChild(this._$infoButton);
    this._$buttonsContainer.appendChild(this._$buyButton);
    this._$buttonsContainer.appendChild(this._$cardsButton);
    this._$buttonsContainer.appendChild(this._$commentsButton);
    this._$buttonsContainer.appendChild(this._$shareButton);
  }

  private _createTooltips(tooltipService: ITooltipService, textMap: ITextMap) {
    this._buyTooltipReference = tooltipService.createReference(
      this._$buyButton,
      { text: textMap.get(TEXT_LABELS.BUY_BUTTON_DEFAULT_TOOLTIP) },
    );
    this._infoTooltipReference = tooltipService.createReference(
      this._$infoButton,
      { text: textMap.get(TEXT_LABELS.INFO_BUTTON_TOOLTIP) },
    );
    this._cardsTooltipReference = tooltipService.createReference(
      this._$cardsButton,
      { text: textMap.get(TEXT_LABELS.CARDS_BUTTON_TOOLTIP) },
    );
    this._commentsTooltipReference = tooltipService.createReference(
      this._$commentsButton,
      { text: textMap.get(TEXT_LABELS.COMMENTS_BUTTON_TOOLTIP) },
    );
    this._shareTooltipReference = tooltipService.createReference(
      this._$shareButton,
      { text: textMap.get(TEXT_LABELS.SHARE_BUTTON_TOOLTIP) },
    );
  }

  getInfoButtonElement() {
    return this._$infoButton;
  }

  getBuyButtonElement() {
    return this._$buyButton;
  }

  getShareButtonElement() {
    return this._$shareButton;
  }

  getCardsButtonElement() {
    return this._$cardsButton;
  }

  getCommentsButtonElement() {
    return this._$commentsButton;
  }

  setBuyButtonTooltip(tooltipText: string) {
    this._buyTooltipReference.setText(tooltipText);
  }

  showInfoButton() {
    this._$infoButton.classList.remove(this.styleNames.hidden);
  }

  hideInfoButton() {
    this._$infoButton.classList.add(this.styleNames.hidden);
  }

  showShareoButton() {
    this._$shareButton.classList.remove(this.styleNames.hidden);
  }

  hideShareButton() {
    this._$shareButton.classList.add(this.styleNames.hidden);
  }

  showBuyButton() {
    this._$buyButton.classList.remove(this.styleNames.hidden);
  }

  hideBuyButton() {
    this._$buyButton.classList.add(this.styleNames.hidden);
  }

  showCardsButton() {
    this._$cardsButton.classList.remove(this.styleNames.hidden);
  }

  hideCardsButton() {
    this._$cardsButton.classList.add(this.styleNames.hidden);
  }

  showCommentsButton() {
    this._$commentsButton.classList.remove(this.styleNames.hidden);
  }

  hideCommentsButton() {
    this._$commentsButton.classList.add(this.styleNames.hidden);
  }

  setCommentsButtonIndicatorActive() {
    this._$commentsButton.classList.add(this.styleNames.hasComments);
  }

  setCommentsButtonIndicatorDisabled() {
    this._$commentsButton.classList.remove(this.styleNames.hasComments);
  }

  private _bindCallbacks() {
    this._onResize = this._onResize.bind(this);
    this._growButtons = this._growButtons.bind(this);
    this._shrinkButtons = this._shrinkButtons.bind(this);
    this._checkShow = this._checkShow.bind(this);
    this._triggerShow = this._triggerShow.bind(this);
    this._triggerHide = this._triggerHide.bind(this);
  }

  private _bindEvents() {
    this._$toggler.addEventListener('click', this._growButtons);
    this._$toggler.addEventListener('mouseenter', this._triggerShow);
    this._$rootElement.addEventListener('mouseleave', this._triggerHide);
    this._$rootElement.addEventListener('mouseenter', this._checkShow);

    this._$infoButton.addEventListener('click', this._callbacks.infoClick);
    this._$buyButton.addEventListener('click', this._callbacks.buyClick);
    this._$shareButton.addEventListener('click', this._callbacks.shareClick);
    this._$cardsButton.addEventListener('click', this._callbacks.cardsClick);
    this._$commentsButton.addEventListener(
      'click',
      this._callbacks.commentsClick,
    );
  }

  private _unbindEvents() {
    this._$toggler.removeEventListener('click', this._growButtons);
    this._$toggler.removeEventListener('mouseenter', this._triggerShow);
    this._$rootElement.removeEventListener('mouseleave', this._triggerHide);
    this._$rootElement.removeEventListener('mouseenter', this._checkShow);

    this._$infoButton.removeEventListener('click', this._callbacks.infoClick);
    this._$buyButton.removeEventListener('click', this._callbacks.buyClick);
    this._$shareButton.removeEventListener('click', this._callbacks.shareClick);
    this._$cardsButton.removeEventListener('click', this._callbacks.cardsClick);
    this._$commentsButton.removeEventListener(
      'click',
      this._callbacks.commentsClick,
    );
  }

  private _growButtons() {
    this._$rootElement.classList.remove(this.styleNames.shrinked);
  }

  private _shrinkButtons() {
    this._$rootElement.classList.add(this.styleNames.shrinked);
  }

  private _onResize([element]: ResizeObserverEntry[]) {
    const {
      contentRect: { width, height },
    } = element;

    this._$buttonsContainer.style.width = `${width}px`;
    this._$buttonsContainer.style.maxWidth = `${width}px`;

    this._$buttonsContainer.style.height = `${height}px`;
    this._$buttonsContainer.style.minHeight = `${height}px`;
  }

  private _triggerShow() {
    this._clearHideTimeout();

    this._growButtons();
  }

  private _triggerHide() {
    if (!this._timeoutID) {
      this._clearHideTimeout();

      this._timeoutID = window.setTimeout(this._shrinkButtons, 1000);
    }
  }

  private _checkShow() {
    if (this._timeoutID) {
      this._clearHideTimeout();
    }
  }

  private _clearHideTimeout() {
    clearTimeout(this._timeoutID);
    this._timeoutID = null;
  }

  reset() {
    this._$rootElement.classList.add(this.styleNames.shrinked);
  }

  destroy() {
    this._unbindEvents();
    if (this._$rootElement.parentNode) {
      this._$rootElement.parentNode.removeChild(this._$rootElement);
    }

    this._buyTooltipReference.destroy();
    this._infoTooltipReference.destroy();
    this._shareTooltipReference.destroy();
    this._commentsTooltipReference.destroy();
    this._cardsTooltipReference.destroy();

    this._buyTooltipReference = null;
    this._infoTooltipReference = null;
    this._shareTooltipReference = null;
    this._commentsTooltipReference = null;
    this._cardsTooltipReference = null;

    this._$rootElement = null;
    this._$infoButton = null;
    this._$buyButton = null;
    this._$cardsButton = null;
    this._$commentsButton = null;
    this._$shareButton = null;
  }
}

TopButtonsView.extendStyleNames(styles);

export default TopButtonsView;
