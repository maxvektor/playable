import 'jsdom-global/register';

import { expect } from 'chai';
import sinon from 'sinon';

import $ from 'jbone';
import Vidi from 'vidi';

import ControlsBlock from './controls.controler';

import VIDEO_EVENTS, { VIDI_PLAYBACK_STATUSES } from '../../constants/events/video';
import UI_EVENTS from '../../constants/events/ui';

import EventEmitter from 'eventemitter3';

describe('ControlsBlock', () => {
  const DEFAULT_CONFIG = {
    timeIndicator: true,
    progressControl: true,
    volumeControl: true,
    fullscreenControl: true
  };

  let controls = {};
  let uiView = {};
  let $video = {};
  let vidi = {};
  let eventEmitterSpy = null;
  let eventEmitter = null;
  let spiedVideo = null;

  function generateVideoObjectWithSpies() {
    const video = {
      duration: 100,
      _currentTimeSpy: sinon.spy(),
      _volumeSpy: sinon.spy(),
      _mutedSpy: sinon.spy()
    };

    Object.defineProperties(video, {
      currentTime: {
        set: video._currentTimeSpy
      },
      volume: {
        enumerable: true,
        set: video._volumeSpy
      },
      muted: {
        enumerable: true,
        set: video._mutedSpy
      }
    });

    return video;
  }

  beforeEach(() => {
    uiView = {
      setFullScreenStatus() {

      },
      getNode() {
        return new $('<video>');
      },
      exitFullScreen() {},
      enterFullScreen() {}
    };
    $video = new $('<video>', {
      controls: 'true',
      muted: 'true'
    });
    vidi = new Vidi($video[0]);
    eventEmitter = new EventEmitter();
    controls = new ControlsBlock({
      uiView,
      vidi,
      eventEmitter,
      ...DEFAULT_CONFIG
    });
  });
  describe('constructor', () => {
    it('should create instance ', () => {
      expect(controls).to.exists;
      expect(controls.view).to.exists;
    });
  });



  describe('instance callbacks to controls', () => {
    beforeEach(() => {
      spiedVideo = generateVideoObjectWithSpies();

      eventEmitterSpy = sinon.spy(controls.eventEmitter, 'emit');
    });

    afterEach(() => {
      controls.eventEmitter.emit.restore();
    });

    it('should trigger _toggleVideoPlayback on keyboard input', () => {
      controls.vidi.getPlaybackState = () => ({status: 0});
      const togglePlaybackSpy = sinon.spy(controls, '_toggleVideoPlayback');

      controls._processKeyboardInput({keyCode: 32});
      expect(togglePlaybackSpy.called).to.be.true;
    });

    it('should trigger _toggleVideoPlayback on node click', () => {
      const processClickSpy = sinon.spy(controls, '_processNodeClick');
      controls._bindViewCallbacks();
      controls._initUI();

      controls.view.$node.trigger('click');
      expect(processClickSpy.called).to.be.true;
    });

    it('should remove timeout of delayed playback change and call _toggleFullScreen on _processNodeClick ', () => {
      const timeoutClearSpy = sinon.spy(global, 'clearTimeout');
      const toggleFullscreenSpy = sinon.spy(controls, '_toggleFullScreen');
      const id = setTimeout(()=> {
      }, 0);
      controls._delayedToggleVideoPlaybackTimeout = id;
      controls.fullscreen = {
        request: ()=> {
        }
      };

      controls._processNodeClick();
      expect(timeoutClearSpy.calledWith(id)).to.be.true;
      expect(toggleFullscreenSpy.called).to.be.true;

      timeoutClearSpy.restore();
    });


    it('should emit ui event on enter full screen', () => {
      controls._enterFullScreen(uiView);

      expect(eventEmitterSpy.calledWith(UI_EVENTS.FULLSCREEN_ENTER_TRIGGERED)).to.be.true;
    });

    it('should emit ui event on exit full screen', () => {
      controls._exitFullScreen();

      expect(eventEmitterSpy.calledWith(UI_EVENTS.FULLSCREEN_EXIT_TRIGGERED)).to.be.true;
    });
  });

  describe('instance', () => {
    it('should have method for setting controls focused state', () => {
      expect(controls._setFocusState).to.exist;
      controls._setFocusState();
      expect(controls._isControlsFocused).to.be.true;
    });

    it('should have method for removing controls focused state', () => {
      expect(controls._removeFocusState).to.exist;
      controls._setFocusState();
      controls._removeFocusState({
        stopPropagation: () => {}
      });
      expect(controls._isControlsFocused).to.be.false;
    });

    it('should have method for setting playback status', () => {
      expect(controls._updatePlayingStatus).to.exist;
      const startTimeout = sinon.spy(controls, '_startHideControlsTimeout');
      const hideTimeout = sinon.spy(controls, '_hideContent');
      const showTimeout = sinon.spy(controls, '_showContent');
      controls._updatePlayingStatus(VIDI_PLAYBACK_STATUSES.PLAYING);
      expect(startTimeout.called).to.be.true;
      controls._updatePlayingStatus(VIDI_PLAYBACK_STATUSES.PAUSED);
      expect(showTimeout.called).to.be.true;
      controls._updatePlayingStatus(VIDI_PLAYBACK_STATUSES.ENDED);
      expect(hideTimeout.called).to.be.true;
    });

    it('should have method for hiding controls on timeout', () => {
      const timeoutSpy = sinon.spy(global, 'setTimeout');
      const clearSpy = sinon.spy(global, 'clearTimeout');
      controls._startHideControlsTimeout();
      expect(timeoutSpy.calledWith(controls._hideContent)).to.be.true;
      controls._startHideControlsTimeout();
      expect(clearSpy.called).to.be.true;

      timeoutSpy.restore();
      clearSpy.restore();
    });

    it('should have method for toggling playback', () => {
      let status = VIDI_PLAYBACK_STATUSES.PLAYING;
      const playSpy = sinon.spy();
      const pauseSpy = sinon.spy();
      controls.vidi = {
        getPlaybackState: () => ({ status }),
        play: playSpy,
        pause: pauseSpy
      };
      controls._toggleVideoPlayback();
      expect(pauseSpy.called).to.be.true;
    });
  });

  describe('video events listeners', () => {
    it('should call callback on playback status change', () => {
      const spy = sinon.spy(controls, '_updatePlayingStatus');
      controls._bindEvents();
      eventEmitter.emit(VIDEO_EVENTS.PLAYBACK_STATUS_CHANGED);
      expect(spy.called).to.be.true;
    });
  });

  describe('API', () => {
    it('should have method for showing whole view', () => {
      expect(controls.show).to.exist;
      controls.show();
      expect(controls.isHidden).to.be.false;
    });

    it('should have method for hiding whole view', () => {
      expect(controls.hide).to.exist;
      controls.hide();
      expect(controls.isHidden).to.be.true;
    });

    it('should have method for destroying', () => {
      const spy = sinon.spy(controls, '_unbindEvents');
      expect(controls.destroy).to.exist;
      controls.destroy();
      expect(controls.view).to.not.exist;
      expect(controls.fullscreenControl).to.not.exist;
      expect(controls.playControl).to.not.exist;
      expect(controls.progressControl).to.not.exist;
      expect(controls.timeControl).to.not.exist;
      expect(controls.volumeControl).to.not.exist;
      expect(spy.called).to.be.true;
    });
  });

  describe('View', () => {
    it('should have method for adding node with control', () => {
      expect(controls.view.appendControlNode).to.exist;
    });

    it('should have method for showing block with controls', () => {
      expect(controls.view.showControlsBlock).to.exist;
    });

    it('should have method for hidding block with controls', () => {
      expect(controls.view.hideControlsBlock).to.exist;
    });

    it('should have method for showing itself', () => {
      expect(controls.view.show).to.exist;
    });

    it('should have method for hidding itself', () => {
      expect(controls.view.hide).to.exist;
    });

    it('should have method gettind root node', () => {
      expect(controls.view.getNode).to.exist;
    });

    it('should have method for destroying', () => {
      expect(controls.view.destroy).to.exist;
    });
  });
});
