export class IdSyntaxError extends Error {
    constructor(message) {
        super(message)
        this.message = message
        this.name = 'IdSyntaxError'
    }
}

export class InvalidInputError extends Error {
    constructor(message) {
        super(message)
        this.message = message
        this.name = 'InvalidInputError'
    }
}

export class IncorrectData extends Error {
    constructor(message) {
        super(message)
        this.message = message
        this.name = 'IncorrectData'
    }
}
