export const logger_e = (msg: string, ...args: any[]) => {
    logger(msg,  '41;37', ...args);
}
export const logger_s = (msg: string, ...args: any[]) => {
    logger(msg,  '42;37', ...args);
}

export const logger_w = (msg: string,  ...args: any[]) => {
    logger(msg,  '43;30', ...args);
}
export const logger_i = (msg: string, ...args: any[]) => {
    logger(msg, '44;37', ...args);
}

export const logger_in = (msg: string, ...args: any[]) => {
    logger(msg, '46;37', ...args);
}

const logger = (msg: string,  ansi: string, ...args: any[]) => {
    const err = new Error();
    const stackLines = err.stack?.split('\n');
    const callerLine = stackLines && stackLines.length > 3 ? stackLines[3].trim() : 'Caller not found';
    // console.log(`Called from: ${callerLine}`);
    const title = callerLine.split('\\').pop()?.trim() || 'Unknown';
    const message = `\x1b[${ansi};4;1m${title.replace(')', '')}\x1b[0m: ${msg}`;
    if (!args)
        console.log(message);
    else {
         process.stdout.write(message); 
         process.stdout.write('\t');
         console.log(...Object.entries(args).map(([key, value]) => value));
    }
}