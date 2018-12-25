import { ITopButtons } from './types';

import View from './top-buttons.view';

export default class TopButtons implements ITopButtons {
  static moduleName = 'topButtons';
  static View = View;

  isHidden: boolean;
  view: View;

  constructor() {
    this.isHidden = false;

    this._initUI();
  }

  private _initUI() {
    this.view = new TopButtons.View();
  }

  getElement() {
    return this.view.getElement();
  }

  destroy() {
    this.view.destroy();
    this.view = null;
  }
}
