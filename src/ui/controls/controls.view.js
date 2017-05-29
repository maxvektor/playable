import $ from 'jbone';

import styles from './controls.scss';


export default class ControlsView {
  constructor({ callbacks, ui }) {
    this._callbacks = callbacks;
    this.$node = $('<div>', {
      class: styles['controls-block'],
      tabIndex: 0
    });

    this.$wrapper = $('<div>', {
      class: styles['controls-wrapper'],
      tabIndex: 0
    });

    const background = $('<div>', {
      class: styles['gradient-background']
    });

    this.$controlsContainer = $('<div>', {
      class: styles.controls
    });

    this.$wrapper
      .append(background)
      .append(this.$controlsContainer);

    this.$node.append(this.$wrapper);

    this._ui = ui;

    this._bindEvents();
  }

  _bindEvents() {
    const node = this._ui.node;

    node.addEventListener('mousemove', this._callbacks.onWrapperMouseMove);
    node.addEventListener('mouseleave', this._callbacks.onWrapperMouseOut);

    this.$controlsContainer.on('click', this._callbacks.onControlsBlockMouseClick);
    this.$controlsContainer.on('mousemove', this._callbacks.onControlsBlockMouseMove);
    this.$controlsContainer.on('mouseleave', this._callbacks.onControlsBlockMouseOut);
  }

  show() {
    this.$node.toggleClass(styles.hidden, false);
  }

  hide() {
    this.$node.toggleClass(styles.hidden, true);
  }

  getNode() {
    return this.$node[0];
  }

  appendControlNode(node) {
    this.$controlsContainer.append(node);
  }

  showControlsBlock() {
    this.$wrapper.toggleClass(styles.activated, true);
  }

  hideControlsBlock() {
    this.$wrapper.toggleClass(styles.activated, false);
  }

  _unbindEvents() {
    const node = this._ui.node;

    node.removeEventListener('mousemove', this._callbacks.onWrapperMouseMove);
    node.removeEventListener('mouseleave', this._callbacks.onWrapperMouseOut);

    this.$controlsContainer.off('click', this._callbacks.onControlsBlockMouseClick);
    this.$controlsContainer.off('mousemove', this._callbacks.onControlsBlockMouseMove);
    this.$controlsContainer.off('mouseleave', this._callbacks.onControlsBlockMouseOut);
  }

  destroy() {
    this._unbindEvents();
    this.$node.remove();

    delete this._ui;

    delete this.$wrapper;
    delete this.$controlsContainer;
    delete this.$node;
  }
}
