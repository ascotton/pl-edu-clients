import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { map } from 'rxjs/operators';

import { CurrentUserService } from './current-user.service';
import { PLJWTDecoder } from '@root/index';
import { PLAbstractRealUserIDService } from '@root/index';

@Injectable()
export class CurrentUserRealUserIDService implements PLAbstractRealUserIDService {
    constructor(private plCurrentUser: CurrentUserService) {}

    realUserID(): Observable<string> {
        return this.plCurrentUser.jwt$.pipe(
            map((jwt: PLJWTDecoder): string => jwt.realUserID),
        );
    }
}
