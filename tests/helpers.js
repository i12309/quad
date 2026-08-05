export class FakeStage {
    constructor(width = 960, height = 640) {
        this._width = width;
        this._height = height;
        this._x = 0;
        this._y = 0;
        this.handlers = new Map();
        this.pointerPosition = { x: 0, y: 0 };
        this.containerElement = {
            listeners: new Map(),
            addEventListener(type, handler) { this.listeners.set(type, handler); },
            removeEventListener(type, handler) {
                if (this.listeners.get(type) === handler) this.listeners.delete(type);
            },
        };
    }

    width(value) {
        if (value === undefined) return this._width;
        this._width = value;
        return this;
    }

    height(value) {
        if (value === undefined) return this._height;
        this._height = value;
        return this;
    }

    x(value) {
        if (value === undefined) return this._x;
        this._x = value;
        return this;
    }

    y(value) {
        if (value === undefined) return this._y;
        this._y = value;
        return this;
    }

    on(events, handler) {
        for (const event of events.split(/\s+/)) this.handlers.set(event, handler);
    }

    off(selector = '') {
        if (!selector) {
            this.handlers.clear();
            return;
        }
        for (const event of [...this.handlers.keys()]) {
            if (event === selector || event.endsWith(selector)) this.handlers.delete(event);
        }
    }

    getPointerPosition() {
        return this.pointerPosition;
    }

    container() {
        return this.containerElement;
    }
}

export function createFakeControls() {
    return {
        statuses: [],
        syncCount: 0,
        setStatus(message, tone) {
            this.statuses.push({ message, tone });
        },
        syncControls() {
            this.syncCount += 1;
        },
    };
}

export function createFakeGrid({ width = 960, height = 640, tileSize = 12, gap = 4 } = {}) {
    const controls = createFakeControls();
    return {
        controls,
        stage: new FakeStage(width, height),
        selectedTiles: {},
        tileSize,
        gap,
        totalSize: tileSize + gap,
        drawCount: 0,
        setGridMetrics(nextTileSize = 12, nextGap = 4) {
            this.tileSize = nextTileSize;
            this.gap = nextGap;
            this.totalSize = nextTileSize + nextGap;
        },
        updateVisibleTiles() {
            this.drawCount += 1;
        },
        getGridPosition(position = this.stage.getPointerPosition()) {
            return {
                x: Math.floor((position.x - this.stage.x()) / this.totalSize),
                y: Math.floor((position.y - this.stage.y()) / this.totalSize),
            };
        },
    };
}

export function installDomStubs() {
    const target = () => ({
        listeners: new Map(),
        addEventListener(type, handler) {
            this.listeners.set(type, handler);
        },
        removeEventListener(type, handler) {
            if (this.listeners.get(type) === handler) this.listeners.delete(type);
        },
    });

    globalThis.document = target();
    globalThis.window = Object.assign(target(), { innerWidth: 960, innerHeight: 640 });
}
