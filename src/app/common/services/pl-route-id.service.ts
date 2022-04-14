import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { AppStore } from '@app/appstore.model';
import { map, filter, takeUntil } from 'rxjs/operators';

@Injectable()
export class PLRouteIdService {
  constructor(
    protected router: Router,
    protected store$: Store<AppStore>,
  ) {}

  // PUBLIC METHODS
  public changeListener(activatedRoute: ActivatedRoute, pathIdPrefix: string, renderToggle: {toggle: boolean}) {
    const destroyed$ = new Subject<boolean>();
    return {
      changed$: this.changed(pathIdPrefix, destroyed$, activatedRoute),
      destroy: () => {
        destroyed$.next(true);
        destroyed$.complete();
      },
      render: () => {
        this.reRender(renderToggle)
      }
    }
  }

  // PRIVATE METHODS
  private changed(pathIdPrefix: string, destroyed$: Subject<boolean>, activatedRoute: ActivatedRoute) {
    return activatedRoute.params.pipe(
      filter(params => params['id']),
      map(params => params['id'] || this.getIdFromUrl(pathIdPrefix)),
      takeUntil(destroyed$),
    );
  }

  private getIdFromUrl(pathIdPrefix: string) {
    const url = window.location.href;
    const parts = url.split(pathIdPrefix);
    const end = parts[1].indexOf('/');
    return parts[1].substring(0, end);
  }

  private reRender(renderToggle: {toggle: boolean}) {
    renderToggle.toggle = false;
    setTimeout(() => {
      renderToggle.toggle = true;
    }, 0)
  }

}
