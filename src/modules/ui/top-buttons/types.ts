import { ITextMap } from '../../text-map/types';
import { ITooltipService } from '../core/tooltip/types';

interface ITopButtonsViewStyles {
  hidden: string;
  shrinked: string;
  hasComments: string;
}

interface ITopButtonsViewCallbacks {
  buyClick: () => void;
  infoClick: () => void;

  shareClick: () => void;
  cardsClick: () => void;
  commentsClick: () => void;
}

interface ITopButtonsViewConfig {
  callbacks: ITopButtonsViewCallbacks;
  textMap: ITextMap;
  tooltipService: ITooltipService;
}

interface ITopButtons {
  getElement(): HTMLElement;

  destroy(): void;
}

export {
  ITopButtonsViewCallbacks,
  ITopButtonsViewStyles,
  ITopButtons,
  ITopButtonsViewConfig,
};
