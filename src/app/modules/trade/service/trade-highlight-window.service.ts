import { Injectable } from '@angular/core';
import { WindowName } from '@app/config';
import { EventEmitter } from '@app/event';
import { OWGames, OWWindow } from '@app/odk';
import { ProcessStorageService } from '@app/storage';
import { WindowService } from '@shared/module/poe/window';
import { Observable } from 'rxjs';
import { flatMap } from 'rxjs/operators';

const WINDOW_DATA_KEY = 'TRADE_HIGHLIGHT_WINDOW_DATA';

export interface TradeHighlightWindowData {
    top?: number;
    left?: number;
    stash?: string;
    items: string[];
    gridTop?: number;
    gridSize?: number;
}

@Injectable({
    providedIn: 'root'
})
export class TradeHighlightWindowService {
    private readonly window: OWWindow;

    constructor(
        private readonly storage: ProcessStorageService,
        private readonly poeWindow: WindowService) {
        this.window = new OWWindow(WindowName.TradeHighlight);
    }

    public get data$(): EventEmitter<TradeHighlightWindowData> {
        return this.storage.get(WINDOW_DATA_KEY, () => new EventEmitter<TradeHighlightWindowData>());
    }

    public toggle(data: TradeHighlightWindowData): Observable<void> {
        return OWGames.getRunningGameInfo().pipe(
            flatMap(({ height }) => {
                const width = this.poeWindow.calculateWidth(height);

                data.gridTop = Math.round((height / 20) * 3);
                data.gridSize = Math.floor(width / 12);
                for (let j = data.gridSize; j >= 1; --j) {
                    const fraction = width / j;
                    if (fraction >= 12.5 && fraction <= 12.8) {
                        data.gridSize = j;
                        break;
                    }
                    if (fraction > 13) {
                        break;
                    }
                }
                this.data$.next(data);

                return this.window.toggle().pipe(
                    flatMap(() => this.window.changeSize(width, height).pipe(
                        flatMap(() => this.window.changePosition(0, 0))
                    ))
                );
            })
        );
    }

    public close(): Observable<void> {
        return this.window.close();
    }
}
