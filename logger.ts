import * as colors from 'colors'

export enum SubSystem {
    MONGO = '[MONGO]',
    MQTT = '[MQTT]',
    DL = '[DL]',
    API = '[API]',
}

function time(): string {
    return colors.grey((new Date).toLocaleString());
}

function prepareSys(sys: SubSystem): string {
    switch(sys) {
        case SubSystem.MONGO: return colors.green(SubSystem.MONGO)
        case SubSystem.MQTT: return colors.magenta(SubSystem.MQTT)
        case SubSystem.DL: return colors.blue(SubSystem.DL)
        case SubSystem.API: return colors.cyan(SubSystem.API)

    }
}

export const loggerGenerator = (sys: SubSystem) => ({
    err: (msg: any) => console.log(`${time()} ${prepareSys(sys)} ${colors.red(msg)}`),
    info: (msg: any) => console.log(`${time()} ${prepareSys(sys)} ${colors.white(msg)}`),
})