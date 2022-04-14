import { Injectable } from '@angular/core';

import { Observable, timer, Subject } from 'rxjs';

import { first, switchMap } from 'rxjs/operators';

import {
    PLGraphQLService,
} from '@root/index';

// tslint:disable: no-require-imports
const listTasksQuery = require('./list-tasks.graphql');

@Injectable()
export class PLTasksService {
    private tasksSubject = new Subject();
    private incompleteTasksSubject = new Subject();

    constructor(
        private plGraphQL: PLGraphQLService,
    ) { }

    start() {
        // refresh every 5 minutes
        timer(0, 300000)
            .pipe(
                switchMap(() => this.fetch()),
            )
            .subscribe((res: any) => {
                this.notifyObservers(res);
            });
    }

    refresh() {
        this.fetch().subscribe((res: any) => {
            this.notifyObservers(res);
        });
    }

    getTasks(): Observable<any> {
        return this.tasksSubject.asObservable();
    }

    getHasIncompleteTasks(): Observable<any> {
        return this.incompleteTasksSubject.asObservable();
    }

    private fetch() {
        return this.plGraphQL.query(listTasksQuery, {}, {}).pipe(first());
    }

    private notifyObservers(res: any) {
        this.tasksSubject.next(res);

        const taskStatus = {
            hasTasks: false,
            hasUnreadTasks: false,
        };

        taskStatus.hasTasks = res.tasks.filter((x: any) => x.completedOn === null).length > 0;
        taskStatus.hasUnreadTasks = res.tasks.filter(
            (x: any) => x.owners.filter((y: any) => y.read === false).length > 0,
        ).length > 0;

        this.incompleteTasksSubject.next(taskStatus);
    }
}
