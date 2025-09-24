

import { configDotenv } from "dotenv";

/**
 * Asserts the presence of required environment variables.
 * 
 * @returns {boolean} - Returns true if all required environment variables are present, otherwise false.
 */
const assertDotEnv = () => {
    // check if the environment variables are already set
    if (process.env.JWT_SECRET)
        return true;
    const dotenv = configDotenv();
    if (dotenv.error) {
        console.error("Error loading .env file:", dotenv.error);
        return false;
    }
    return true;
};

/**
 * Interface representing the result of a validation.
 */
interface IResult {
    /**
     * The result of the validation.
     */
    result: boolean;
    
    /**
     * The message associated with the validation result.
     */
    message: string;
}

 /**
 * A class containing static methods for validating email, password, and username.
 */
class Asserter {
     /**
     * Validates an email address.
     * 
     * @param {string} email - The email address to validate.
     * @returns {IResult} - The result of the validation.
     */
    public static email = (email: string) => {
        let result: IResult = { result: false, message: "" };
        if (!email)
            return { result: false, message: "Email is required." };

        let errors = "";
        if (email.length > 255) {
            errors += "Email is too long. ";
        }
        // check for name@domain.com
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors += "Email must be in the format name@domain.com. ";
        }
        // check for .;:/\@, characters
        else if (!/^[^,;:/\\@]+@[^,;:/\\@]+\.[^,;:/\\@]+$/.test(email)) {
            errors += "Email must not contain special characters. ";
        }
        else if (email.length < 5) {
            errors += "Email is too short. ";
        }
        else { result.result = true; }
        result.message = errors;
        return result;
    }

    /**
     * Validates a password.
     * 
     * @param {string} password - The password to validate.
     * @returns {IResult} - The result of the validation.
     */
    public static password = (password: string) => {
        let result: IResult = { result: false, message: "" };
        if (!password)
            return { result: false, message: "Password is required." };

        let errors = "";
        if (password.length > 255) {
            errors += "Password is too long. ";
        }
        else if (password.length < 8) {
            errors += "Password is too short. must be at least 8 characters. ";
        }
        else { result.result = true; }

        result.message = errors;

        return result;
    }

    
    /**
     * Validates a username.
     * 
     * @param {string} username - The username to validate.
     * @returns {IResult} - The result of the validation.
     */
    public static username = (username: string) => {
        let result: IResult = { result: false, message: "" };
        if (!username)
            return { result: false, message: "Username is required." };
        let errors = "";
        if (username.length > 255) {
            errors += "Username is too long. ";
        }
        else if (username.length < 5) {
            errors += "Username is too short. must be at least 5 characters. ";
        }
        else if (!/^[^\W\s]+$/.test(username)) {
            errors += "Username must not contain special characters. ";
        }
        else if (username.toLowerCase().includes("admin")) {
            errors += "Username must not contain the word admin. ";
        }
        else if (username.toLowerCase().includes("root")) {
            errors += "Username must not contain the word root. ";
        }
        else if (username.toLowerCase().includes("superuser")) {
            errors += "Username must not contain the word superuser. ";
        }
        else { result.result = true; }

        result.message = errors;
        return result;
    }
}

export { assertDotEnv, Asserter, IResult };
