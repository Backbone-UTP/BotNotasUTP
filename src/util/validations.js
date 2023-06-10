import { IdSyntaxError, InvalidInputError } from "./errors";

export const validateInputLogIn = (id, userInput) => {
    const regexp = /[0-9]+/;

    if (id.match(regexp) == null || id.length != USERS_ID_DEFAULT_LENGTH)
        throw new IdSyntaxError("Por favor ingrese un número de cédula correcto.");

    if (userInput.length != 3) 
        throw new InvalidInputError("Por favor ingrese los datos de la forma: /notas cedula contraseña")
}

