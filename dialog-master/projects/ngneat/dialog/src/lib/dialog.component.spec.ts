import { Provider } from '@angular/core';
import { Spectator, createComponentFactory, byText } from '@ngneat/spectator';
import { Subject } from 'rxjs';

import { DialogComponent } from './dialog.component';
import { NODES_TO_INSERT, DIALOG_CONFIG } from './tokens';
import { InternalDialogRef } from './dialog-ref';
import { DialogDraggableDirective } from './draggable.directive';
import { DialogConfig } from './config';

describe('DialogComponent', () => {
  const defaultConfig: Partial<DialogConfig> = {
    id: 'test',
    container: document.body,
    backdrop: true,
    enableClose: true,
    draggable: false,
    resizable: false,
    size: 'md',
    windowClass: undefined,
    sizes: undefined,
    width: undefined,
    height: undefined,
    data: undefined,
    vcr: undefined
  };

  function withConfig(config: Partial<DialogConfig> = {}): { providers: Provider[] } {
    return {
      providers: [
        {
          provide: DIALOG_CONFIG,
          useValue: { ...defaultConfig, ...config }
        }
      ]
    };
  }

  let spectator: Spectator<DialogComponent>;

  const createComponent = createComponentFactory({
    component: DialogComponent,
    declarations: [DialogDraggableDirective],
    providers: [
      {
        provide: DIALOG_CONFIG,
        useValue: {}
      },
      {
        provide: InternalDialogRef,
        useFactory: () => ({
          close: jasmine.createSpy(),
          backdropClick$: new Subject()
        })
      },
      {
        provide: NODES_TO_INSERT,
        useValue: [document.createTextNode('nodes '), document.createTextNode('inserted')]
      }
    ]
  });

  afterEach(() => {
    const containerEls = document.querySelectorAll('.ngneat-dialog-content');
    const backdropEls = document.querySelectorAll('.ngneat-dialog-backdrop');

    [...Array.from(containerEls), ...Array.from(backdropEls)].filter(Boolean).forEach(el => el.remove());
  });

  it('should create', () => {
    spectator = createComponent();
    expect(spectator.component).toBeTruthy();
  });

  it('should set id in its host', () => {
    spectator = createComponent(withConfig({ id: 'test' }));

    spectator.detectChanges();

    expect(spectator.element.id).toBe('test');
  });

  it('should place nodes into dialog-content', () => {
    spectator = createComponent();

    expect(spectator.query(byText('nodes inserted'))).toBeTruthy();
  });

  describe('when backdrop is enabled', () => {
    beforeEach(() => (spectator = createComponent(withConfig({ backdrop: true }))));

    it('should create backdrop div, and set its class', () => {
      expect(spectator.query('.ngneat-dialog-backdrop')).toBeTruthy();
    });

    it('backdropClick$ should point to element', () => {
      let backdropClicked = false;
      spectator.get(InternalDialogRef).backdropClick$.subscribe({
        next: () => (backdropClicked = true)
      });

      spectator.dispatchMouseEvent('.ngneat-dialog-backdrop', 'mouseup');

      expect(backdropClicked).toBeTrue();
    });
  });

  describe('when backdrop is disabled', () => {
    beforeEach(() => (spectator = createComponent(withConfig({ backdrop: false }))));

    it('should create backdrop div, and set its class', () => {
      expect(spectator.query('.ngneat-dialog-backdrop')).toBeHidden();
    });

    it('backdropClick$ should point to body', () => {
      let backdropClicked = false;
      spectator.get(InternalDialogRef).backdropClick$.subscribe({
        next: () => (backdropClicked = true)
      });

      spectator.dispatchMouseEvent(document.body, 'mouseup');

      expect(backdropClicked).toBeTrue();
    });
  });

  describe('when enableClose is enabled should call close', () => {
    beforeEach(() => (spectator = createComponent(withConfig({ enableClose: true }))));

    it('on escape', () => {
      const { close } = spectator.get(InternalDialogRef);

      spectator.dispatchKeyboardEvent(document.body, 'keyup', 'Enter');

      expect(close).not.toHaveBeenCalled();

      spectator.dispatchKeyboardEvent(document.body, 'keyup', 'Escape');

      expect(close).toHaveBeenCalled();
    });

    it('on click backdrop', () => {
      const { close } = spectator.get(InternalDialogRef);

      spectator.dispatchMouseEvent('.ngneat-dialog-content', 'mouseup');

      expect(close).not.toHaveBeenCalled();

      spectator.dispatchMouseEvent(document.body, 'mouseup');

      expect(close).not.toHaveBeenCalled();

      spectator.dispatchMouseEvent('.ngneat-dialog-backdrop', 'mouseup');

      expect(close).toHaveBeenCalled();
    });
  });

  describe('when enableClose is disabled should not call close', () => {
    beforeEach(() => (spectator = createComponent(withConfig({ enableClose: false }))));

    it('on escape', () => {
      const { close } = spectator.get(InternalDialogRef);

      spectator.dispatchKeyboardEvent(document.body, 'keyup', 'Escape');

      expect(close).not.toHaveBeenCalled();
    });

    it('on click backdrop', () => {
      const { close: close } = spectator.get(InternalDialogRef);

      spectator.dispatchMouseEvent('.ngneat-dialog-content', 'mouseup');

      expect(close).not.toHaveBeenCalled();

      spectator.dispatchMouseEvent(document.body, 'mouseup');

      expect(close).not.toHaveBeenCalled();

      spectator.dispatchMouseEvent('.ngneat-dialog-backdrop', 'mouseup');

      expect(close).not.toHaveBeenCalled();
    });
  });

  describe('when draggable is enabled', () => {
    beforeEach(() => (spectator = createComponent(withConfig({ draggable: true }))));

    it('should show draggable marker and instance draggable directive', () => {
      expect(spectator.query('.ngneat-drag-marker')).toBeTruthy();
      expect(spectator.query(DialogDraggableDirective)).toBeTruthy();
    });
  });

  describe('when draggable is disabled', () => {
    beforeEach(() => (spectator = createComponent(withConfig({ draggable: false }))));

    it('should not show draggable marker and not instance draggable directive', () => {
      expect(spectator.query('.ngneat-drag-marker')).toBeFalsy();
      expect(spectator.query(DialogDraggableDirective)).toBeFalsy();
    });
  });

  it('when resizable is enabled should set its class', () => {
    spectator = createComponent(withConfig({ resizable: true }));

    expect(spectator.query('.ngneat-dialog-resizable')).toBeTruthy();
  });

  it('should set windowClass at host element', () => {
    spectator = createComponent(withConfig({ windowClass: 'this-is-a-test-class' }));

    const host = spectator.query('.this-is-a-test-class', { root: true });

    expect(host).toBeTruthy();
    expect(host).toBe(spectator.fixture.nativeElement);
  });
});
