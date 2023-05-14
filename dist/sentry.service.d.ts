import { ConsoleLogger, OnApplicationShutdown } from '@nestjs/common';
import { SentryModuleOptions } from './sentry.interfaces';
export declare class SentryService extends ConsoleLogger implements OnApplicationShutdown {
    readonly opts?: SentryModuleOptions;
    private static serviceInstance;
    private static sentry;
    constructor(opts?: SentryModuleOptions);
    static SentryServiceInstance(): SentryService;
    get sdk(): any;
    log(message: string, context?: string, asBreadcrumb?: boolean): void;
    error(message: string, trace?: string, context?: string): void;
    warn(message: string, context?: string, asBreadcrumb?: boolean): void;
    debug(message: string, context?: string, asBreadcrumb?: boolean): void;
    verbose(message: string, context?: string, asBreadcrumb?: boolean): void;
    onApplicationShutdown(signal?: string): Promise<void>;
}
