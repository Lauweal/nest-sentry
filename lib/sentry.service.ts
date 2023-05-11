import { Inject, Injectable, ConsoleLogger } from '@nestjs/common';
import { OnApplicationShutdown } from '@nestjs/common';
import { ClientOptions, Client } from '@sentry/types';
import * as Sentry from '@sentry/node';
import { SENTRY_MODULE_OPTIONS } from './sentry.constants';
import { SentryModuleOptions } from './sentry.interfaces';

@Injectable()
export class SentryService extends ConsoleLogger implements OnApplicationShutdown {
  private static serviceInstance: SentryService;
  private static sentry = Sentry;
  constructor(
    @Inject(SENTRY_MODULE_OPTIONS)
    readonly opts?: SentryModuleOptions,
  ) {
    super();
    if (!(opts && opts.dsn)) {
      // console.log('options not found. Did you use SentryModule.forRoot?');
      return;
    }
    const { debug, integrations = [], ...sentryOptions } = opts;
    Sentry.init({
      ...sentryOptions,
      integrations: [
        new Sentry.Integrations.OnUncaughtException({
          onFatalError: async (err) => {
            // console.error('uncaughtException, not cool!')
            // console.error(err);
            if (err.name === 'SentryError') {
              console.log(err);
            } else {
              (
                Sentry.getCurrentHub().getClient<
                  Client<ClientOptions>
                >() as Client<ClientOptions>
              ).captureException(err);
              process.exit(1);
            }
          },
        }),
        new Sentry.Integrations.OnUnhandledRejection({ mode: 'warn' }),
        ...integrations,
      ],
    });
  }

  public static SentryServiceInstance(): SentryService {
    if (!SentryService.serviceInstance) {
      SentryService.serviceInstance = new SentryService();
    }
    return SentryService.serviceInstance;
  }

  public get sdk() {
    return Sentry;
  }

  log(message: string, context?: string, asBreadcrumb?: boolean) {
    message = `[LOG] ${message}`;
    try {
      super.log(message, context);
      asBreadcrumb ?
        Sentry.addBreadcrumb({
          message,
          level: 'log',
          data: {
            context
          }
        }) :
        Sentry.captureMessage(message, 'log');
    } catch (err) { }
  }

  error(message: string, trace?: string, context?: string) {
    message = `[ERROR] ${message}`;
    try {
      super.error(message, trace, context);
      Sentry.captureMessage(message, 'error');
    } catch (err) { }
  }

  warn(message: string, context?: string, asBreadcrumb?: boolean) {
    message = `[WARN] ${message}`;
    try {
      super.warn(message, context);
      asBreadcrumb ?
        Sentry.addBreadcrumb({
          message,
          level: 'warning',
          data: {
            context
          }
        }) :
        Sentry.captureMessage(message, 'warning');
    } catch (err) { }
  }

  debug(message: string, context?: string, asBreadcrumb?: boolean) {
    message = `[DEBUG] ${message}`;
    try {
      super.debug(message, context);
      asBreadcrumb ?
        Sentry.addBreadcrumb({
          message,
          level: 'debug',
          data: {
            context
          }
        }) :
        Sentry.captureMessage(message, 'debug');
    } catch (err) { }
  }

  verbose(message: string, context?: string, asBreadcrumb?: boolean) {
    message = `[VERBOSE] ${message}`;
    try {
      super.verbose(message, context);
      asBreadcrumb ?
        Sentry.addBreadcrumb({
          message,
          level: 'info',
          data: {
            context
          }
        }) :
        Sentry.captureMessage(message, 'info');
    } catch (err) { }
  }

  async onApplicationShutdown(signal?: string) {
    if (this.opts?.close?.enabled === true) {
      await Sentry.close(this.opts?.close.timeout);
    }
  }

}