// Файл: ./game/BaseModule.js
export class BaseModule {
    // NAME -----------------------------------------------
    #name = 'Название игры..'; // Приватное поле

    // Геттер для чтения приватного поля
    get name() {
        return this.#name;
    }

    // Сеттер для изменения приватного поля (доступен в наследуемом классе)
    set name(value) {
        this.#name = value;
    }

    //-----------------------------------------------

    start() {
        throw new Error('Метод start должен быть реализован');
    }

    pause() {
        throw new Error('Метод pause должен быть реализован');
    }

    clear() {
        throw new Error('Метод clear должен быть реализован');
    }

    update() {
        throw new Error('Метод update должен быть реализован');
    }

    toggleCell(x, y) {
        throw new Error('Метод toggleCell должен быть реализован');
    }

    handleLeftClick(x, y) {
        throw new Error('Метод handleLeftClick должен быть реализован');
    }

    handleRightClick(x, y) {
        throw new Error('Метод handleRightClick должен быть реализован');
    }

    bindMouseEvents(gridManager) {
        throw new Error('Метод bindMouseEvents должен быть реализован');
    }

    showContextMenu(x, y) {
        throw new Error('Метод showContextMenu должен быть реализован');
    }

    setup(gridManager) {
        throw new Error('Метод setup должен быть реализован');
    }

    log(message) {
        console.log(`[${this.name}] ${message}`);
    }
}