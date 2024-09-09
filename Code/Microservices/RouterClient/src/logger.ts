import * as winston from 'winston';

class Logger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp({
          format: () => {
            const date = new Date().toLocaleString('en-US', {
              timeZone: 'Israel',
              hour12: false,
            });
            return date;
          }
        }),
        winston.format.printf((info) => `${info.timestamp} - ${info.level}: ${info.message}`)
      ),
      transports: [
        new winston.transports.Console()
      ]
    });
  }

  public debug(message: string): void {
    this.logger.debug(message);
  }

  public info(message: string): void {
    this.logger.info(message);
  }

  public warn(message: string): void {
    this.logger.warn(message);
  }

  public error(message: string): void {
    this.logger.error(message);
  }
}

const logger = new Logger();
export default logger;
