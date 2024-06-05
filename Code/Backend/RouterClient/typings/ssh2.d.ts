declare module 'ssh2' {
    import { EventEmitter } from 'events';
    import { Readable, Writable } from 'stream';

    class Client extends EventEmitter {
        connect(config: ConnectConfig): this;
        end(): this;
        destroy(): this;
        exec(command: string, options: ExecOptions, callback: (err: Error, channel: ClientChannel) => void): this;
        exec(command: string, callback: (err: Error, channel: ClientChannel) => void): this;
        sftp(callback: (err: Error, sftp: SFTPWrapper) => void): this;
    }

    interface ConnectConfig {
        host: string;
        port?: number;
        username: string;
        password?: string;
        privateKey?: string | Buffer;
        passphrase?: string;
        agent?: string;
        agentForward?: boolean;
        readyTimeout?: number;
        keepaliveInterval?: number;
        keepaliveCountMax?: number;
        tryKeyboard?: boolean;
        authHandler?: (methodsLeft: string[], partialSuccess: boolean, callback: (nextAuthMethods: string[]) => void) => void;
        debug?: (information: string) => void;
    }

    interface ExecOptions {
        pty?: boolean;
        env?: NodeJS.ProcessEnv;
    }

    interface SFTPWrapper extends EventEmitter {
        // Define SFTP methods if needed
    }

    interface ClientChannel extends Readable, Writable {
        // Define channel methods if needed
    }
}
