import 'jsdom-global/register';

import { expect } from 'chai';

import * as sinon from 'sinon';
import logger from './logger';
import KeyboardInterceptor from './keyboard-interceptor';

describe('KeyboardInterceptor', () => {
  let element: HTMLElement;
  let interceptor: KeyboardInterceptor;
  const keydownEvent: any = new Event('keydown');

  beforeEach(() => {
    element = document.createElement('div');
  });

  describe('', () => {
    afterEach(() => {
      interceptor.destroy();
    });

    it('should intercept and broadcast keydown events', () => {
      const testKeyCode1 = 10;
      const testKeyCode2 = 20;
      const callbacks = {
        [testKeyCode1]: sinon.spy(),
        [testKeyCode2]: sinon.spy(),
      };

      interceptor = new KeyboardInterceptor(element, callbacks);

      keydownEvent.keyCode = testKeyCode1;
      element.dispatchEvent(keydownEvent);

      expect(callbacks[testKeyCode1].calledWith(keydownEvent)).to.be.true;
      expect(callbacks[testKeyCode2].called).to.be.false;

      keydownEvent.keyCode = testKeyCode2;
      element.dispatchEvent(keydownEvent);

      expect(callbacks[testKeyCode2].calledWith(keydownEvent)).to.be.true;
    });

    it('should have ability to add callbacks in runtime', () => {
      const testKeyCode = 30;
      const additionCallbacks = {
        [testKeyCode]: sinon.spy(),
      };

      interceptor = new KeyboardInterceptor(element);

      keydownEvent.keyCode = testKeyCode;
      element.dispatchEvent(keydownEvent);

      expect(additionCallbacks[testKeyCode].called).to.be.false;

      interceptor.addCallbacks(additionCallbacks);

      keydownEvent.keyCode = testKeyCode;
      element.dispatchEvent(keydownEvent);

      expect(additionCallbacks[testKeyCode].called).to.be.true;
    });
  });
  it('should clear everything on destroy', () => {
    const testKeyCode = 10;
    const callbacks = {
      [testKeyCode]: sinon.spy(),
    };

    interceptor = new KeyboardInterceptor(element, callbacks);

    interceptor.destroy();

    keydownEvent.keyCode = testKeyCode;
    element.dispatchEvent(keydownEvent);

    expect(callbacks[testKeyCode].called).to.be.false;
  });
  it('should call warn on destroy after destroy', () => {
    const warnSpy = sinon.stub(logger, 'warn');

    interceptor = new KeyboardInterceptor(element);

    interceptor.destroy();
    interceptor.destroy();

    expect(warnSpy.calledOnce).to.be.true;
    warnSpy.restore();
  });
});
