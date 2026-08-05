export class GridManager {
    constructor(controls) {
        this.controls = controls;
        this.container = typeof document !== 'undefined'
            ? document.getElementById('container')
            : null;
        this.backgroundColor = '#11161f';
        this.defaultTileSize = 12;
        this.defaultGap = 4;
        this.tileSize = this.defaultTileSize;
        this.gap = this.defaultGap;
        this.totalSize = this.tileSize + this.gap;
        this.selectedTiles = {};

        const viewport = this.getViewportSize();
        this.stage = new Konva.Stage({
            container: 'container',
            width: viewport.width,
            height: viewport.height,
        });
        this.layer = new Konva.Layer({ listening: true });
        this.stage.add(this.layer);

        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);
    }

    setGridMetrics(tileSize = this.defaultTileSize, gap = this.defaultGap) {
        this.tileSize = Math.max(6, Number(tileSize) || this.defaultTileSize);
        this.gap = Math.max(0, Number(gap) || 0);
        this.totalSize = this.tileSize + this.gap;
    }

    getViewportSize() {
        const fallbackWidth = typeof window !== 'undefined' ? Number(window.innerWidth) : 1;
        const fallbackHeight = typeof window !== 'undefined' ? Number(window.innerHeight) : 1;
        const containerWidth = Number(this.container?.clientWidth);
        const containerHeight = Number(this.container?.clientHeight);
        const width = Number.isFinite(containerWidth) ? Math.max(1, containerWidth) : Math.max(1, fallbackWidth || 1);
        const height = Number.isFinite(containerHeight) ? Math.max(1, containerHeight) : Math.max(1, fallbackHeight || 1);
        return { width, height };
    }

    getViewportAnchor() {
        const screenX = this.stage.width() / 2;
        const screenY = this.stage.height() / 2;
        return {
            screenX,
            screenY,
            gridX: (screenX - this.stage.x()) / this.totalSize,
            gridY: (screenY - this.stage.y()) / this.totalSize,
        };
    }

    restoreViewportAnchor(anchor) {
        if (!anchor) return;
        const screenX = this.stage.width() / 2;
        const screenY = this.stage.height() / 2;
        this.stage.x(screenX - anchor.gridX * this.totalSize);
        this.stage.y(screenY - anchor.gridY * this.totalSize);
    }

    setViewportTop(value = 0, { notifyModule = false } = {}) {
        const top = Math.max(0, Math.round(Number(value) || 0));
        if (this.container?.style) this.container.style.top = `${top}px`;
        return this.resizeToViewport({ notifyModule });
    }

    resizeToViewport({ notifyModule = true } = {}) {
        const viewport = this.getViewportSize();
        const changed = this.stage.width() !== viewport.width || this.stage.height() !== viewport.height;

        this.stage.width(viewport.width);
        this.stage.height(viewport.height);

        if (changed && notifyModule) this.controls?.currentModule?.onResize?.();
        this.updateVisibleTiles();
        return changed;
    }

    resetView() {
        this.setGridMetrics();
        this.stage.x(0);
        this.stage.y(0);
        this.selectedTiles = {};
        this.updateVisibleTiles();
    }

    clear() {
        this.selectedTiles = {};
        this.updateVisibleTiles();
    }

    handleResize() {
        const viewportTop = this.controls?.getGameViewportTop?.() ?? 0;
        const changed = this.setViewportTop(viewportTop, { notifyModule: false });
        const scaleChanged = this.controls?.reconcileGridScaleToViewport?.() ?? false;
        if (changed && !scaleChanged) this.controls?.currentModule?.onResize?.();
    }

    getGridPosition(pointerPosition = this.stage.getPointerPosition()) {
        if (!pointerPosition) return null;
        return {
            x: Math.floor((pointerPosition.x - this.stage.x()) / this.totalSize),
            y: Math.floor((pointerPosition.y - this.stage.y()) / this.totalSize),
        };
    }

    createTile(x, y, descriptor = this.selectedTiles[`${x},${y}`]) {
        if (!descriptor) return null;

        const pixelX = x * this.totalSize;
        const pixelY = y * this.totalSize;
        const tileWidth = descriptor.width ?? this.tileSize;
        const tileHeight = descriptor.height ?? this.tileSize;

        if (descriptor.type === 'text') {
            return new Konva.Text({
                id: `${x},${y}`,
                x: pixelX,
                y: pixelY,
                text: String(descriptor.text ?? ''),
                fontSize: descriptor.fontSize ?? Math.max(12, this.tileSize),
                fontFamily: descriptor.fontFamily ?? 'Arial, sans-serif',
                fontStyle: descriptor.fontStyle ?? 'bold',
                fill: descriptor.color ?? '#f3f6fb',
                width: (descriptor.widthCells ?? 10) * this.totalSize,
                height: (descriptor.heightCells ?? 1) * this.totalSize,
                align: descriptor.align ?? 'left',
                verticalAlign: descriptor.verticalAlign ?? 'middle',
                listening: false,
            });
        }

        const rotation = Number(descriptor.rotation) || 0;
        const group = new Konva.Group({
            id: `${x},${y}`,
            x: pixelX + (rotation ? tileWidth / 2 : 0),
            y: pixelY + (rotation ? tileHeight / 2 : 0),
            offsetX: rotation ? tileWidth / 2 : 0,
            offsetY: rotation ? tileHeight / 2 : 0,
            rotation,
            listening: descriptor.listening !== false,
        });

        group.add(new Konva.Rect({
            width: tileWidth,
            height: tileHeight,
            fill: descriptor.color ?? 'transparent',
            cornerRadius: descriptor.cornerRadius ?? Math.min(3, this.tileSize / 4),
            stroke: descriptor.stroke ?? null,
            strokeWidth: descriptor.strokeWidth ?? 0,
            listening: false,
        }));

        if (Object.prototype.hasOwnProperty.call(descriptor, 'text')) {
            group.add(new Konva.Text({
                width: tileWidth,
                height: tileHeight,
                text: String(descriptor.text ?? ''),
                fontSize: descriptor.fontSize ?? Math.max(10, Math.floor(this.tileSize * 0.72)),
                fontFamily: descriptor.fontFamily ?? 'Arial, sans-serif',
                fontStyle: descriptor.fontStyle ?? 'bold',
                fill: descriptor.textColor ?? '#11161f',
                align: 'center',
                verticalAlign: 'middle',
                listening: false,
            }));
        }

        return group;
    }

    updateVisibleTiles() {
        this.layer.destroyChildren();

        const startX = Math.floor(-this.stage.x() / this.totalSize) - 1;
        const startY = Math.floor(-this.stage.y() / this.totalSize) - 1;
        const endX = startX + Math.ceil(this.stage.width() / this.totalSize) + 3;
        const endY = startY + Math.ceil(this.stage.height() / this.totalSize) + 3;

        for (const [key, descriptor] of Object.entries(this.selectedTiles)) {
            let [x, y] = key.split(',').map(Number);
            if (!Number.isFinite(x) || !Number.isFinite(y)) {
                x = Number(descriptor?.x);
                y = Number(descriptor?.y);
            }
            if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
            if (x < startX || x > endX || y < startY || y > endY) continue;

            const tile = this.createTile(x, y, descriptor);
            if (tile) this.layer.add(tile);
        }

        this.layer.batchDraw();
    }

    destroy() {
        window.removeEventListener('resize', this.handleResize);
        this.stage.destroy();
    }
}
