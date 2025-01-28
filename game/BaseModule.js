// Файл: ./game/BaseModule.js (абстрактный класс реализующий интерфейс)
export class BaseModule {

// NAME -----------------------------------------------
    #name = 'Название игры..'; // Приватное поле
    // Геттер для чтения приватного поля
    get name() {return this.#name;}
    // Сеттер для изменения приватного поля (доступен в наследуемом классе)
    set name(value) {this.#name = value;}
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

//-----------------------------------------------
    showContextMenu(x, y) {
        throw new Error('Метод showContextMenu должен быть реализован');
    }
}